#/* backend/app/main.py */
import os
import json
import shutil
import re
import io
import zipfile
import base64
from datetime import datetime
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from topology import generate_grid_graph

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HISTORY_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chat-history"))

# --- GLOBAL IN-MEMORY SNAPSHOT ENGINE --- #
SESSION_GRID_STATE = {}

def get_server_time():
    """Captures absolute date as MM/DD/YYYY along with the active time tracking layout."""
    return datetime.now().strftime("%m/%d/%Y %I:%M:%S %p")

def get_file_path(session_name: str) -> str:
    if not os.path.exists(HISTORY_DIR):
        os.makedirs(HISTORY_DIR, exist_ok=True)
    return os.path.join(HISTORY_DIR, f"{session_name}.jsonl")


# Real IEEE 33-bus (Baran & Wu) per-bus loads, kW/kVAr — from gt_reconfig/config.py.
# Bus 30's Q is 600 in that source (an outlier vs. the textbook 100) — kept as-is,
# this mirrors what the current Agent-main actually uses, not a "corrected" value.
IEEE33_P_KW = [0, 100, 90, 120, 60, 60, 200, 200, 60, 60, 45, 60, 60, 120,
               60, 60, 60, 90, 90, 90, 90, 90, 90, 420, 420, 60, 60, 60,
               120, 200, 150, 210, 0]
IEEE33_Q_KVAR = [0, 60, 40, 80, 30, 20, 100, 100, 20, 20, 30, 35, 35, 80,
                 10, 20, 20, 40, 40, 40, 40, 40, 50, 200, 200, 25, 25, 20,
                 70, 600, 70, 100, 0]

# Real R/X (ohms) for the 32 backbone branches (lines 1-32), same source.
# Tie switches (lines 33-37) are deliberately left out — 5175 and Agent-main
# place two of the five ties on different bus pairs, so there's no correct
# value to copy for those two; see conversation for the mismatch details.
IEEE33_BACKBONE_R = [0.0922, 0.4930, 0.3660, 0.3811, 0.8190, 0.1872, 1.7114,
                      1.0300, 1.0400, 0.1966, 0.3744, 1.4680, 0.5416, 0.5910,
                      0.7463, 1.2890, 0.7320, 0.1640, 1.5042, 0.4095, 0.7089,
                      0.4512, 0.8980, 0.8960, 0.2030, 0.2842, 1.0590, 0.8042,
                      0.5075, 0.9744, 0.3105, 0.3410]
IEEE33_BACKBONE_X = [0.0477, 0.2511, 0.1864, 0.1941, 0.7070, 0.6188, 1.2351,
                      0.7400, 0.7400, 0.0650, 0.1238, 1.1550, 0.7129, 0.5260,
                      0.5450, 1.7210, 0.5740, 0.1565, 1.3554, 0.4784, 0.9373,
                      0.3083, 0.7091, 0.7011, 0.1034, 0.1447, 0.9337, 0.7006,
                      0.2585, 0.9630, 0.3619, 0.5302]

def get_engineering_defaults(bus_system: str = "33"):
    """Generates standard factory baseline vectors based on the designated grid size."""
    try:
        bus_count = int(bus_system)
    except:
        bus_count = 33
    line_count = 37 if bus_count == 33 else bus_count + 4

    if bus_count == 33:
        p = list(IEEE33_P_KW)
        q = list(IEEE33_Q_KVAR)
        r = list(IEEE33_BACKBONE_R) + [0.01] * (line_count - len(IEEE33_BACKBONE_R))
        x = list(IEEE33_BACKBONE_X) + [0.02] * (line_count - len(IEEE33_BACKBONE_X))
    else:
        p = [0.1] * bus_count
        q = [0.05] * bus_count
        r = [0.01] * line_count
        x = [0.02] * line_count

    return {
        "v": [1.0] * bus_count,
        "p": p,
        "q": q,
        "r": r,
        "x": x,
        "unused_lines": []
    }

def get_full_history(session_name: str):
    """Helper to parse logged entries and inject the initial welcome message with sequence tracking."""
    file_path = get_file_path(session_name)
    history = []
    if not os.path.exists(file_path):
        return history
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    entry = json.loads(line.strip())
                    if entry.get("sender") in ("state_snapshot", "plotly_figure"):
                        continue
                    history.append({
                        "sender": entry["sender"],
                        "content": entry["content"],
                        "timestamp": entry["timestamp"],
                        "state_seq_id": entry.get("state_seq_id", 0)   # ✅ Extracted safely for frontend mapping
                    })
    except Exception as e:
        print(f"Error reading history: {e}")
        
    initial_timestamp = history[0]["timestamp"] if history else get_server_time()
    welcome_message = {
        "sender": "system",
        "content": "Welcome to IEEE Grid ChatBot. Please enter Session Name to begin.",
        "timestamp": initial_timestamp,
        "state_seq_id": 0  # Pre-initialization base index
    }
    history.insert(0, welcome_message)
    return history

def get_session_state_from_file(session_name: str):
    """Reads logs to retrieve stages, bus system data, and tracking sequence indices."""
    file_path = get_file_path(session_name)
    if not os.path.exists(file_path):
        return {"stage": 1, "bus_system": "", "max_state_seq_id": 0}
    last_stage = 1
    last_bus = ""
    max_seq_id = 0
    latest_snapshot = None
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    entry = json.loads(line.strip())
                    if "stage" in entry:
                        last_stage = entry["stage"]
                    if entry.get("state_seq_id") is not None:
                        if entry["state_seq_id"] > max_seq_id:
                            max_seq_id = entry["state_seq_id"]
                    if entry["sender"] == "user" and entry["content"].isdigit():
                        last_bus = entry["content"]
                    if entry.get("sender") == "state_snapshot":
                        latest_snapshot = entry.get("snapshot")
    except:
        pass
    if last_bus and session_name not in SESSION_GRID_STATE:
        defaults = get_engineering_defaults(last_bus)
        SESSION_GRID_STATE[session_name] = {
            "baseline": defaults,
            "active": latest_snapshot if latest_snapshot else {k: list(v) for k, v in defaults.items()}
        }
    return {"stage": last_stage, "bus_system": last_bus, "max_state_seq_id": max_seq_id}

def append_to_log(session_name: str, sender: str, content: str, timestamp: str, stage: int, state_seq_id: int):
    """Logs communication packets bound to deterministic state indexes instead of raw clock seconds."""
    file_path = get_file_path(session_name)
    log_entry = {
        "session_name": session_name,
        "stage": stage,
        "sender": sender,
        "timestamp": timestamp,
        "content": content,
        "state_seq_id": state_seq_id  # ✅ Stamped tracking sequence ID
    }
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

def append_snapshot_to_log(session_name: str, snapshot: dict, timestamp: str, stage: int, state_seq_id: int):
    """Saves complete mathematical grid parameters directly bound to the corresponding sequence identifier."""
    file_path = get_file_path(session_name)
    log_entry = {
        "session_name": session_name,
        "stage": stage,
        "sender": "state_snapshot",
        "timestamp": timestamp,
        "snapshot": snapshot,
        "state_seq_id": state_seq_id  # ✅ Tied directly to state generation step index
    }
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

def get_serialized_figure(session_name: str, state_seq_id: int) -> dict:
    file_path = get_file_path(session_name)
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line.strip())
                        if entry.get("sender") == "plotly_figure" and entry.get("state_seq_id") == state_seq_id:
                            return entry.get("figure")
        except Exception as e:
            print(f"Error reading figure from log: {e}")
    return None

def append_figure_to_log(session_name: str, figure: dict, state_seq_id: int):
    if get_serialized_figure(session_name, state_seq_id) is not None:
        return
    file_path = get_file_path(session_name)
    log_entry = {
        "session_name": session_name,
        "sender": "plotly_figure",
        "timestamp": get_server_time(),
        "state_seq_id": state_seq_id,
        "figure": figure
    }
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")


def parse_and_modify_grid(command_str: str, current_state: dict) -> tuple[dict, str]:
    pattern = r"^\s*([vpqrx])\s*([\+=\-\*/])\s*([\d\.]+)\s*\[\s*(.*?)\s*\]\s*$"
    match = re.match(pattern, command_str.strip().lower())
    if not match:
        raise ValueError("⚠️ Syntax Error: Command format unrecognized. Use parameter[operator][value] [bus_numbers]. Example: v=1.05 [22]")
    param, op, val_raw, target_raw = match.groups()
    val = float(val_raw)
    target_raw = target_raw.strip()
    updated_state = {k: list(v) for k, v in current_state.items()}
    target_array = updated_state[param]
    max_limit = len(target_array)
    indices_to_modify = []
    if target_raw == "all":
        indices_to_modify = list(range(max_limit))
    else:
        raw_tokens = [t.strip() for t in target_raw.split(",") if t.strip()]
        for token in raw_tokens:
            if not token.isdigit():
                raise ValueError(f"⚠️ Input Error: Target element standard index reference '{token}' must be numeric.")
            human_num = int(token)
            comp_index = human_num - 1
            if comp_index < 0 or comp_index >= max_limit:
                layer_type = "Line/Branch" if param in ['r', 'x'] else "Bus Node"
                raise ValueError(f"⚠️ Grid Boundary Error: {layer_type} {human_num} falls outside the maximum design limit ({max_limit}).")
            indices_to_modify.append(comp_index)
            
    for idx in indices_to_modify:
        current_val = target_array[idx]
        if op == "=":
            target_array[idx] = val
        elif op == "+":
            target_array[idx] = current_val + val
        elif op == "-":
            target_array[idx] = current_val - val
        elif op == "*":
            target_array[idx] = current_val * val
        elif op == "/":
            if val == 0:
                raise ValueError("⚠️ Operational Fault: Division by zero parameters cannot be processed on electrical elements.")
            if current_val == 0:
                raise ValueError(f"⚠️ Numerical Instability: Element at index {idx+1} is currently 0.0. Division operation cannot evaluate.")
            target_array[idx] = current_val / val
            
    scope_desc = "all system coordinates" if target_raw == "all" else f"target components ({target_raw})"
    success_msg = f"⚡ Grid telemetry alteration successful: Parameter allocation '{param.upper()}' updated via operator '{op}' with structural value {val} across {scope_desc}."
    return updated_state, success_msg

@app.get("/api/init")
async def init_endpoint():
    return {
        "reply": "Welcome to IEEE Grid ChatBot. Please enter Session Name to begin.",
        "status": "Not Started",
        "stage": 1,
        "session_name": "",
        "timestamp": get_server_time(),
        "state_seq_id": 0
    }

@app.post("/api/session/create")
async def create_session_endpoint(payload: dict = Body(...)):
    session_name = payload.get("session_name", "").strip()
    server_time = get_server_time()
    if not session_name:
        return {"status": "INVALID", "message": "Session name cannot be empty.", "stage": 1}
    if len(session_name) >= 18:
        return {"status": "INVALID", "message": "Session name must be under 18 characters.", "stage": 1}
    target_path = get_file_path(session_name)
    if os.path.exists(target_path):
        return {"status": "EXISTS", "message": f"Session '{session_name}' already exists.", "stage": 0}
    try:
        system_reply = f"Session set to '{session_name}'. What standard bus are you using?"
        append_to_log(session_name, "user", session_name, server_time, 1, 0)
        append_to_log(session_name, "system", system_reply, server_time, 1, 0)
        return {"status": "SUCCESS", "session_name": session_name, "stage": 1}
    except Exception as e:
        return {"status": "ERROR", "message": f"Failed to initialize trace: {str(e)}", "stage": 1}

@app.get("/api/session/{session_name}")
async def get_session_endpoint(session_name: str):
    clean_name = session_name.strip()
    if len(clean_name) >= 18:
        return {"status": "INVALID", "reply": "Session name must be under 18 characters.", "stage": 1, "timestamp": get_server_time()}
    target_path = get_file_path(clean_name)
    if os.path.exists(target_path):
        state = get_session_state_from_file(clean_name)
        parsed_history = get_full_history(clean_name)
        return {
            "status": "ACTIVE",
            "session_name": clean_name,
            "stage": state["stage"],
            "bus_system": state["bus_system"],
            "history": parsed_history
        }
    else:
        return {"status": "NOT_FOUND", "reply": f"Session '{clean_name}' does not exist.", "stage": 1, "timestamp": get_server_time()}

# --- ATOMIC ANALYTICS MULTI-GRAPH ZIP EXPORT ENGINE --- #
@app.post("/api/analytics/zip-export")
async def zip_export_analytics_endpoint(payload: dict = Body(...)):
    """
    Accepts client-side raw canvas image data strings from Plotly snapshot promises,
    decodes base64 buffers directly into file streams, and yields a clean output compressed archive.
    """
    images = payload.get("images", {})
    if not images:
        raise HTTPException(status_code=400, detail="No active graph stream canvas discovered in current payload packet.")
    
    zip_buffer = io.BytesIO()
    try:
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for filename, data_uri in images.items():
                if "," in data_uri:
                    header, base64_data = data_uri.split(",", 1)
                else:
                    base64_data = data_uri
                
                file_bytes = base64.b64decode(base64_data)
                zip_file.writestr(f"{filename}.png", file_bytes)
        
        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=grid_analytics_export.zip"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Atomic file system compression failed: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(payload: dict = Body(...)):
    user_raw = payload.get("message", "")
    session_name = payload.get("session_name", "").strip()
    user_stripped = user_raw.strip()
    user_message = user_stripped.lower()
    user_log_time = get_server_time()
    
    if not session_name:
        if len(user_stripped) >= 18:
            system_reply = "Session name must be under 18 characters. Try again:"
            return {"reply": system_reply, "status": "Not Started", "stage": 1, "session_name": "", "user_time": user_log_time, "system_time": get_server_time(), "state_seq_id": 0}
        if not user_stripped:
            system_reply = "Session name cannot be empty. Please enter a valid name:"
            return {"reply": system_reply, "status": "Not Started", "stage": 1, "session_name": "", "user_time": user_log_time, "system_time": get_server_time(), "state_seq_id": 0}
        target_path = get_file_path(user_stripped)
        if os.path.exists(target_path):
            system_reply = f"Session '{user_stripped}' already exists. Would you like to OVERWRITE or CONTINUE?"
            system_time = get_server_time()
            append_to_log(user_stripped, "user", user_stripped, user_log_time, 0, 0)
            append_to_log(user_stripped, "system", system_reply, system_time, 0, 0)
            return {"reply": system_reply, "status": "Not Started", "stage": 0, "session_name": user_stripped, "user_time": user_log_time, "system_time": system_time, "state_seq_id": 0}
        else:
            system_reply = f"Session set to '{user_stripped}'. What standard bus are you using?"
            system_time = get_server_time()
            append_to_log(user_stripped, "user", user_stripped, user_log_time, 1, 0)
            append_to_log(user_stripped, "system", system_reply, system_time, 1, 0)
            return {"reply": system_reply, "status": user_stripped, "stage": 1, "session_name": user_stripped, "user_time": user_log_time, "system_time": system_time, "state_seq_id": 0}
            
    state = get_session_state_from_file(session_name)
    current_stage = state["stage"]
    current_seq_id = state["max_state_seq_id"]
    
    if current_stage == 0:
        if user_message == "overwrite":
            try:
                os.remove(get_file_path(session_name))
                if session_name in SESSION_GRID_STATE:
                    del SESSION_GRID_STATE[session_name]
            except:
                pass
            system_reply = "Previous session cleared. What standard bus are you using?"
            system_time = get_server_time()
            append_to_log(session_name, "system", system_reply, system_time, 1, 0)
            return {"reply": system_reply, "status": session_name, "stage": 1, "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": 0}
        elif user_message == "continue":
            system_time = get_server_time()
            state_correction = get_session_state_from_file(session_name)
            active_stage = state_correction["stage"] if state_correction["stage"] != 0 else 1
            append_to_log(session_name, "user", user_stripped, user_log_time, active_stage, state_correction["max_state_seq_id"])
            append_to_log(session_name, "system", "Resuming session pipeline...", system_time, active_stage, state_correction["max_state_seq_id"])
            refreshed_history = get_full_history(session_name)
            return {"history": refreshed_history, "status": session_name, "stage": active_stage, "bus_system": state_correction["bus_system"], "session_name": session_name, "state_seq_id": state_correction["max_state_seq_id"]}
        else:
            system_reply = "Invalid option. Please specify 'overwrite' or 'continue':"
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 0, 0)
            append_to_log(session_name, "system", system_reply, system_time, 0, 0)
            return {"reply": system_reply, "status": "Not Started", "stage": 0, "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": 0}
            
    elif current_stage == 1:
        if user_stripped.isdigit():
            next_seq_id = current_seq_id + 1
            system_reply = f"{user_stripped} bus system is loaded and ready !!!"
            system_time = get_server_time()
            defaults = get_engineering_defaults(user_stripped)
            SESSION_GRID_STATE[session_name] = {
                "baseline": defaults,
                "active": {k: list(v) for k, v in defaults.items()}
            }
            append_to_log(session_name, "user", user_stripped, user_log_time, 1, next_seq_id)
            append_to_log(session_name, "system", system_reply, system_time, 2, next_seq_id)
            append_snapshot_to_log(session_name, SESSION_GRID_STATE[session_name]["active"], system_time, 2, next_seq_id)
            return {"reply": system_reply, "status": session_name, "stage": 2, "bus_system": user_stripped, "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": next_seq_id}
        else:
            system_reply = "Please enter a valid numeric bus standard designation (e.g., 33):"
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 1, current_seq_id)
            append_to_log(session_name, "system", system_reply, system_time, 1, current_seq_id)
            return {"reply": system_reply, "status": session_name, "stage": 1, "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": current_seq_id}
            
    else:
        if session_name not in SESSION_GRID_STATE:
            defaults = get_engineering_defaults(state.get("bus_system", "33"))
            SESSION_GRID_STATE[session_name] = {
                "baseline": defaults,
                "active": {k: list(v) for k, v in defaults.items()}
            }
            
        # --- CONDITIONAL INTERCEPTIONS FOR POWER FACTOR VIEWS --- #
        if "remove power factor" in user_message:
            response = "📉 Power factor performance metric plots decoupled from active viewport tracker."
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 2, current_seq_id)
            append_to_log(session_name, "system", response, system_time, 2, current_seq_id)
            return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": current_seq_id, "hide_pf": True}
            
        elif "power factor" in user_message:
            response = "📊 Calculating system vector arrays. Power factor optimization matrices attached to active viewport."
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 2, current_seq_id)
            append_to_log(session_name, "system", response, system_time, 2, current_seq_id)
            return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": current_seq_id, "show_pf": True}

        is_syntax_command = re.match(r"^\s*([vpqrx])\s*([\+=\-\*/])\s*([\d\.]+)\s*\[\s*(.*?)\s*\]\s*$", user_stripped.lower())
        if is_syntax_command:
            try:
                updated_vectors, success_report = parse_and_modify_grid(user_stripped, SESSION_GRID_STATE[session_name]["active"])
                next_seq_id = current_seq_id + 1
                SESSION_GRID_STATE[session_name]["active"] = updated_vectors
                response = success_report
                system_time = get_server_time()
                append_to_log(session_name, "user", user_stripped, user_log_time, 2, next_seq_id)
                append_to_log(session_name, "system", response, system_time, 2, next_seq_id)
                append_snapshot_to_log(session_name, updated_vectors, system_time, 2, next_seq_id)
                return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": next_seq_id}
            except ValueError as val_err:
                response = str(val_err)
                system_time = get_server_time()
                append_to_log(session_name, "user", user_stripped, user_log_time, 2, current_seq_id)
                append_to_log(session_name, "system", response, system_time, 2, current_seq_id)
                return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": current_seq_id}
                
        elif "isolate" in user_message:
            raw_lines = user_message.replace("isolate", "").strip()
            line_tokens = [t.strip() for t in raw_lines.split(",") if t.strip()]
            if not line_tokens:
                response = "⚠️ Input Error: Please provide branch line designations to isolate. Example: isolate 33,34"
                system_time = get_server_time()
                append_to_log(session_name, "user", user_stripped, user_log_time, 2, current_seq_id)
                append_to_log(session_name, "system", response, system_time, 2, current_seq_id)
                return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": current_seq_id}
            else:
                active_state = SESSION_GRID_STATE[session_name]["active"]
                max_line_limit = len(active_state["r"])
                valid_isolations = []
                invalid_tokens = []
                for t in line_tokens:
                    if t.isdigit() and 1 <= int(t) <= max_line_limit:
                        if t not in active_state["unused_lines"]:
                            active_state["unused_lines"].append(t)
                        valid_isolations.append(t)
                    else:
                        invalid_tokens.append(t)
                if valid_isolations:
                    next_seq_id = current_seq_id + 1
                    response = f"✂️ Isolated branch segment line circuit breakers: {', '.join(valid_isolations)} have been opened."
                    if invalid_tokens:
                        response += f" (Ignored invalid boundary line sequences: {', '.join(invalid_tokens)})"
                    system_time = get_server_time()
                    append_to_log(session_name, "user", user_stripped, user_log_time, 2, next_seq_id)
                    append_to_log(session_name, "system", response, system_time, 2, next_seq_id)
                    append_snapshot_to_log(session_name, SESSION_GRID_STATE[session_name]["active"], system_time, 2, next_seq_id)
                    return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": next_seq_id}
                else:
                    response = f"⚠️ Boundary Error: No valid branch lines found matching targeted parameters: {', '.join(invalid_tokens)}"
                    system_time = get_server_time()
                    append_to_log(session_name, "user", user_stripped, user_log_time, 2, current_seq_id)
                    append_to_log(session_name, "system", response, system_time, 2, current_seq_id)
                    return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": current_seq_id}
                    
        elif "reset network" in user_message:
            next_seq_id = current_seq_id + 1
            base_reference = SESSION_GRID_STATE[session_name]["baseline"]
            SESSION_GRID_STATE[session_name]["active"] = {k: list(v) for k, v in base_reference.items()}
            response = "🔄 Network reset complete. Core system parameters, matrix limits, and default configurations restored."
            system_time = get_server_time()
            append_to_log(session_name, "user", "Reset Network", user_log_time, 2, next_seq_id)
            append_to_log(session_name, "system", response, system_time, 2, next_seq_id)
            append_snapshot_to_log(session_name, SESSION_GRID_STATE[session_name]["active"], system_time, 2, next_seq_id)
            return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": next_seq_id}
            
        elif "display smiley face" in user_message:
            response = "Grid visualization mode activated: 🤖 Matrix operations complete! 🌟"
        else:
            response = f"Command '{user_stripped}' not recognized. Try using the quick action macros below."
            
        system_time = get_server_time()
        append_to_log(session_name, "user", user_stripped, user_log_time, 2, current_seq_id)
        append_to_log(session_name, "system", response, system_time, 2, current_seq_id)
        return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time, "state_seq_id": current_seq_id}

@app.get("/api/topology")
async def get_topology(session_name: str):
    state = get_session_state_from_file(session_name)
    current_seq_id = state.get("max_state_seq_id", 0)
    
    cached_fig = get_serialized_figure(session_name, current_seq_id)
    if cached_fig is not None:
        return cached_fig

    bus_type = state.get("bus_system", "33") or "33"
    if session_name in SESSION_GRID_STATE:
        active_data = SESSION_GRID_STATE[session_name]["active"]
        v_arr = active_data.get("v")
        p_arr = active_data.get("p")
        q_arr = active_data.get("q")
        r_arr = active_data.get("r")
        x_arr = active_data.get("x")
        unused_lines_arr = active_data.get("unused_lines")
    else:
        defaults = get_engineering_defaults(bus_type)
        v_arr, p_arr, q_arr = defaults["v"], defaults["p"], defaults["q"]
        r_arr, x_arr = defaults["r"], defaults["x"]
        unused_lines_arr = defaults["unused_lines"]
    try:
        grid_payload = generate_grid_graph(
            bus_system=bus_type,
            ratio=0.55,
            v_array=v_arr,
            p_array=p_arr,
            q_array=q_arr,
            r_array=r_arr,
            x_array=x_arr,
            unused_lines=unused_lines_arr
        )
        append_figure_to_log(session_name, grid_payload, current_seq_id)
        return grid_payload
    except Exception as e:
        return {
            "data": [],
            "layout": {
                "title": {"text": f"Error loading grid mapping matrix: {str(e)}"},
                "paper_bgcolor": "rgba(0,0,0,0)",
                "plot_bgcolor": "rgba(0,0,0,0)"
            }
        }

@app.get("/api/topology/historical")
async def get_historical_topology(session_name: str, state_seq_id: int):
    """Scans the log up to a specific state_seq_id to rebuild the power grid topology instantly."""
    cached_fig = get_serialized_figure(session_name, state_seq_id)
    if cached_fig is not None:
        return cached_fig

    state = get_session_state_from_file(session_name)
    bus_type = state.get("bus_system", "33") or "33"
    file_path = get_file_path(session_name)
    historical_vectors = get_engineering_defaults(bus_type)
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line.strip())
                        if entry.get("sender") == "state_snapshot":
                            if entry.get("state_seq_id") <= state_seq_id:
                                historical_vectors = entry.get("snapshot")
                            if entry.get("state_seq_id") == state_seq_id:
                                break
        except Exception as file_err:
            print(f"Failed to scan structural history log: {file_err}")
    try:
        grid_payload = generate_grid_graph(
            bus_system=bus_type,
            ratio=0.55,
            v_array=historical_vectors.get("v"),
            p_array=historical_vectors.get("p"),
            q_array=historical_vectors.get("q"),
            r_array=historical_vectors.get("r"),
            x_array=historical_vectors.get("x"),
            unused_lines=historical_vectors.get("unused_lines")
        )
        append_figure_to_log(session_name, grid_payload, state_seq_id)
        return grid_payload
    except Exception as e:
        return {
            "data": [],
            "layout": {
                "title": {"text": f"Error loading historical topology frame: {str(e)}"},
                "paper_bgcolor": "rgba(0,0,0,0)",
                "plot_bgcolor": "rgba(0,0,0,0)"
            }
        }


@app.get("/api/list-sessions")
async def list_sessions():
    sessions = []
    if not os.path.exists(HISTORY_DIR):
        return sessions
    for filename in os.listdir(HISTORY_DIR):
        if filename.endswith(".jsonl"):
            path = os.path.join(HISTORY_DIR, filename)
            mtime = os.path.getmtime(path)
            sessions.append({
                "name": filename.replace(".jsonl", ""),
                "mtime_raw": mtime,
                "mtime_display": datetime.fromtimestamp(mtime).strftime("%m/%d/%Y %I:%M:%S %p")
            })
    sessions.sort(key=lambda x: x["mtime_raw"], reverse=True)
    return sessions

@app.delete("/api/session/{session_name}")
async def delete_session_endpoint(session_name: str):
    clean_name = session_name.strip()
    target_path = get_file_path(clean_name)
    if os.path.exists(target_path):
        try:
            os.remove(target_path)
            if clean_name in SESSION_GRID_STATE:
                del SESSION_GRID_STATE[clean_name]
            return {"status": "SUCCESS", "message": f"Session '{clean_name}' successfully deleted."}
        except Exception as e:
            return {"status": "ERROR", "message": f"Failed to delete file: {str(e)}"}
    else:
        return {"status": "NOT_FOUND", "message": "Session target does not exist."}

@app.post("/api/session/{source_name}/branch")
async def branch_session_endpoint(source_name: str, payload: dict = Body(...)):
    clean_source = source_name.strip()
    new_name = payload.get("name", "").strip()
    state_seq_id_limit = payload.get("state_seq_id", None)
    if not new_name or len(new_name) >= 18:
        return {"status": "INVALID", "message": "Branch name must be between 1 and 17 characters."}
    source_path = get_file_path(clean_source)
    target_path = get_file_path(new_name)
    if not os.path.exists(source_path):
        return {"status": "NOT_FOUND", "message": f"Source tracking log '{clean_source}' could not be located."}
    if os.path.exists(target_path):
        return {"status": "EXISTS", "message": f"A data stream named '{new_name}' already exists."}
    try:
        historical_snapshot = None
        if state_seq_id_limit is not None:
            with open(source_path, "r", encoding="utf-8") as src, open(target_path, "w", encoding="utf-8") as dst:
                for line in src:
                    if line.strip():
                        entry = json.loads(line.strip())
                        if entry.get("state_seq_id") is not None and entry["state_seq_id"] > state_seq_id_limit:
                            continue
                        if entry.get("sender") == "state_snapshot":
                            historical_snapshot = entry.get("snapshot")
                        dst.write(line)
        else:
            shutil.copyfile(source_path, target_path)
            if clean_source in SESSION_GRID_STATE:
                historical_snapshot = SESSION_GRID_STATE[clean_source]["active"]
                
        state_info = get_session_state_from_file(new_name)
        bus_type = state_info.get("bus_system", "33") or "33"
        defaults = get_engineering_defaults(bus_type)
        SESSION_GRID_STATE[new_name] = {
            "baseline": defaults,
            "active": historical_snapshot if historical_snapshot else {k: list(v) for k, v in defaults.items()}
        }
        return {"status": "SUCCESS", "new_session": new_name}
    except Exception as e:
        if os.path.exists(target_path):
            try:
                os.remove(target_path)
            except:
                pass
        return {"status": "ERROR", "message": f"File system collision replicating trace: {str(e)}"}

@app.get("/api/compare")
async def compare_sessions(s1: str, s2: str, s3: str):
    try:
        return {
            "s1": {"history": get_full_history(s1), "stage": get_session_state_from_file(s1)["stage"]},
            "s2": {"history": get_full_history(s2), "stage": get_session_state_from_file(s2)["stage"]},
            "s3": {"history": get_full_history(s3), "stage": get_session_state_from_file(s3)["stage"]}
        }
    except Exception as e:
        print(f"Error fetching compare data: {e}")
        return {
            "s1": {"history": [], "stage": 1},
            "s2": {"history": [], "stage": 1},
            "s3": {"history": [], "stage": 1}
        }