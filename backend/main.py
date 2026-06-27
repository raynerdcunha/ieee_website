import os
import json
import shutil
import re
from datetime import datetime
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from topology import generate_grid_graph

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HISTORY_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chat-history"))

# --- GLOBAL IN-MEMORY SNAPSHOT ENGINE ---
# Tracks live active vectors and historical time-travel structures per session
SESSION_GRID_STATE = {}

def get_server_time():
    """Captures absolute date as MM/DD/YYYY along with the active time tracking layout."""
    return datetime.now().strftime("%m/%d/%Y %I:%M:%S %p")

def get_file_path(session_name: str) -> str:
    if not os.path.exists(HISTORY_DIR):
        os.makedirs(HISTORY_DIR, exist_ok=True)
    return os.path.join(HISTORY_DIR, f"{session_name}.jsonl")

def get_engineering_defaults(bus_system: str = "33"):
    """Generates standard factory baseline vectors based on the designated grid size."""
    try:
        bus_count = int(bus_system)
    except:
        bus_count = 33
    line_count = 37 if bus_count == 33 else bus_count + 4 # Adaptive baseline calculation
    return {
        "v": [1.0] * bus_count,
        "p": [0.1] * bus_count,
        "q": [0.05] * bus_count,
        "r": [0.01] * line_count,
        "x": [0.02] * line_count
    }

def get_full_history(session_name: str):
    """Helper to parse logged entries and inject the initial welcome message."""
    file_path = get_file_path(session_name)
    history = []
    if not os.path.exists(file_path):
        return history
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    entry = json.loads(line.strip())
                    # Skip background snapshots from showing up as text chat messages
                    if entry.get("sender") == "state_snapshot":
                        continue
                    history.append({
                        "sender": entry["sender"],
                        "content": entry["content"],
                        "timestamp": entry["timestamp"]
                    })
    except Exception as e:
        print(f"Error reading history: {e}")

    initial_timestamp = history[0]["timestamp"] if history else get_server_time()
    welcome_message = {
        "sender": "system",
        "content": "Welcome to IEEE Grid ChatBot. Please enter Session Name to begin.",
        "timestamp": initial_timestamp
    }
    history.insert(0, welcome_message)
    return history

def get_session_state_from_file(session_name: str):
    """Reads logs to retrieve stages, current bus system configurations, and updates state vectors."""
    file_path = get_file_path(session_name)
    if not os.path.exists(file_path):
        return {"stage": 1, "bus_system": ""}
    last_stage = 1
    last_bus = ""
    latest_snapshot = None
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    entry = json.loads(line.strip())
                    if "stage" in entry:
                        last_stage = entry["stage"]
                    if entry["sender"] == "user" and entry["content"].isdigit():
                        last_bus = entry["content"]
                    if entry.get("sender") == "state_snapshot":
                        latest_snapshot = entry.get("snapshot")
    except:
        pass

    # Seamlessly rebuild the RAM data vectors if a server reboot occurred
    if last_bus and session_name not in SESSION_GRID_STATE:
        defaults = get_engineering_defaults(last_bus)
        SESSION_GRID_STATE[session_name] = {
            "baseline": defaults,
            "active": latest_snapshot if latest_snapshot else {k: list(v) for k, v in defaults.items()}
        }
    return {"stage": last_stage, "bus_system": last_bus}

def append_to_log(session_name: str, sender: str, content: str, timestamp: str, stage: int):
    file_path = get_file_path(session_name)
    log_entry = {
        "session_name": session_name,
        "stage": stage,
        "sender": sender,
        "timestamp": timestamp,
        "content": content
    }
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

def append_snapshot_to_log(session_name: str, snapshot: dict, timestamp: str, stage: int):
    """Saves complete mathematical grid parameters directly into the persistent .jsonl timeline."""
    file_path = get_file_path(session_name)
    log_entry = {
        "session_name": session_name,
        "stage": stage,
        "sender": "state_snapshot",
        "timestamp": timestamp,
        "snapshot": snapshot
    }
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

def parse_and_modify_grid(command_str: str, current_state: dict) -> tuple[dict, str]:
    """
    Validates, parses, and executes custom syntax formulas (e.g., v=2.5 [22])
    while safely adjusting human to 0-based computer system index ranges.
    """
    pattern = r"^([vpqrx])([\+=\-\*/])([\d\.]+)\s*\[(.*?)\]$"
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
            comp_index = human_num - 1 # Automatic mapping translation layer
            
            if comp_index < 0 or comp_index >= max_limit:
                layer_type = "Line/Branch" if param in ['r', 'x'] else "Bus Node"
                raise ValueError(f"⚠️ Grid Boundary Error: {layer_type} {human_num} falls outside the maximum design limit ({max_limit}).")
            indices_to_modify.append(comp_index)

    # Core Execution Math Pipeline
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
        "timestamp": get_server_time()
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
        append_to_log(session_name, "user", session_name, server_time, 1)
        append_to_log(session_name, "system", system_reply, server_time, 1)
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
            return {"reply": system_reply, "status": "Not Started", "stage": 1, "session_name": "", "user_time": user_log_time, "system_time": get_server_time()}
        if not user_stripped:
            system_reply = "Session name cannot be empty. Please enter a valid name:"
            return {"reply": system_reply, "status": "Not Started", "stage": 1, "session_name": "", "user_time": user_log_time, "system_time": get_server_time()}
        
        target_path = get_file_path(user_stripped)
        if os.path.exists(target_path):
            system_reply = f"Session '{user_stripped}' already exists. Would you like to OVERWRITE or CONTINUE?"
            system_time = get_server_time()
            append_to_log(user_stripped, "user", user_stripped, user_log_time, 0)
            append_to_log(user_stripped, "system", system_reply, system_time, 0)
            return {"reply": system_reply, "status": "Not Started", "stage": 0, "session_name": user_stripped, "user_time": user_log_time, "system_time": system_time}
        else:
            system_reply = f"Session set to '{user_stripped}'. What standard bus are you using?"
            system_time = get_server_time()
            append_to_log(user_stripped, "user", user_stripped, user_log_time, 1)
            append_to_log(user_stripped, "system", system_reply, system_time, 1)
            return {"reply": system_reply, "status": user_stripped, "stage": 1, "session_name": user_stripped, "user_time": user_log_time, "system_time": system_time}

    state = get_session_state_from_file(session_name)
    current_stage = state["stage"]

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
            append_to_log(session_name, "system", system_reply, system_time, 1)
            return {"reply": system_reply, "status": session_name, "stage": 1, "session_name": session_name, "user_time": user_log_time, "system_time": system_time}
        elif user_message == "continue":
            system_time = get_server_time()
            state_correction = get_session_state_from_file(session_name)
            active_stage = state_correction["stage"] if state_correction["stage"] != 0 else 1
            append_to_log(session_name, "user", user_stripped, user_log_time, active_stage)
            append_to_log(session_name, "system", "Resuming session pipeline...", system_time, active_stage)
            refreshed_history = get_full_history(session_name)
            return {"history": refreshed_history, "status": session_name, "stage": active_stage, "bus_system": state_correction["bus_system"], "session_name": session_name}
        else:
            system_reply = "Invalid option. Please specify 'overwrite' or 'continue':"
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 0)
            append_to_log(session_name, "system", system_reply, system_time, 0)
            return {"reply": system_reply, "status": "Not Started", "stage": 0, "session_name": session_name, "user_time": user_log_time, "system_time": system_time}

    elif current_stage == 1:
        if user_stripped.isdigit():
            system_reply = f"{user_stripped} bus system is loaded and ready !!!"
            system_time = get_server_time()
            
            # Formulate state storage mapping arrays dynamically on matrix designation initialization
            defaults = get_engineering_defaults(user_stripped)
            SESSION_GRID_STATE[session_name] = {
                "baseline": defaults,
                "active": {k: list(v) for k, v in defaults.items()}
            }
            
            append_to_log(session_name, "user", user_stripped, user_log_time, 1)
            append_to_log(session_name, "system", system_reply, system_time, 2)
            append_snapshot_to_log(session_name, SESSION_GRID_STATE[session_name]["active"], system_time, 2)
            
            return {"reply": system_reply, "status": session_name, "stage": 2, "bus_system": user_stripped, "session_name": session_name, "user_time": user_log_time, "system_time": system_time}
        else:
            system_reply = "Please enter a valid numeric bus standard designation (e.g., 33):"
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 1)
            append_to_log(session_name, "system", system_reply, system_time, 1)
            return {"reply": system_reply, "status": session_name, "stage": 1, "session_name": session_name, "user_time": user_log_time, "system_time": system_time}

    else:
        # Ensure working state availability before entering execution routines
        if session_name not in SESSION_GRID_STATE:
            defaults = get_engineering_defaults(state.get("bus_system", "33"))
            SESSION_GRID_STATE[session_name] = {
                "baseline": defaults,
                "active": {k: list(v) for k, v in defaults.items()}
            }

        # --- DYNAMIC SYNTAX MODIFICATION PARSER CHANNELS ---
        is_syntax_command = re.match(r"^([vpqrx])([\+=\-\*/])([\d\.]+)\s*\[(.*?)\]$", user_stripped.lower())
        
        if is_syntax_command:
            try:
                updated_vectors, success_report = parse_and_modify_grid(
                    user_stripped, 
                    SESSION_GRID_STATE[session_name]["active"]
                )
                SESSION_GRID_STATE[session_name]["active"] = updated_vectors
                response = success_report
                system_time = get_server_time()
                append_to_log(session_name, "user", user_stripped, user_log_time, 2)
                append_to_log(session_name, "system", response, system_time, 2)
                append_snapshot_to_log(session_name, updated_vectors, system_time, 2)
                
                return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time}
            except ValueError as val_err:
                response = str(val_err)
                system_time = get_server_time()
                append_to_log(session_name, "user", user_stripped, user_log_time, 2)
                append_to_log(session_name, "system", response, system_time, 2)
                return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time}

        elif "isolate" in user_message:
            response = f"Isolating buses {user_message.replace('isolate', '').strip()}. Network updated."
        elif "reset network" in user_message:
            response = "Network reset execution sequence initiated. Configuration standard restored."
        elif "power factor" in user_message:
            response = "Calculating active power vectors. Power factor optimization matrices logged."
            
        elif "reset parameters" in user_message:
            # Memory swap assignment returning mutable variables to the read-only baselines
            base_reference = SESSION_GRID_STATE[session_name]["baseline"]
            SESSION_GRID_STATE[session_name]["active"] = {k: list(v) for k, v in base_reference.items()}
            response = "Bus variables and matrix boundary parameters reset to factory initialization values."
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 2)
            append_to_log(session_name, "system", response, system_time, 2)
            append_snapshot_to_log(session_name, SESSION_GRID_STATE[session_name]["active"], system_time, 2)
            
            return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time}
            
        elif "display smiley face" in user_message:
            response = "Grid visualization mode activated: 🤖 Matrix operations complete! 🌟"
        else:
            response = f"Command '{user_stripped}' not recognized. Try using the quick action macros below."

        system_time = get_server_time()
        append_to_log(session_name, "user", user_stripped, user_log_time, 2)
        append_to_log(session_name, "system", response, system_time, 2)
        return {"reply": response, "status": session_name, "stage": 2, "bus_system": state.get("bus_system", ""), "session_name": session_name, "user_time": user_log_time, "system_time": system_time}

@app.get("/api/topology")
async def get_topology(session_name: str):
    """Fetches computed mathematical vector positions with dynamic global state integration."""
    state = get_session_state_from_file(session_name)
    bus_type = state.get("bus_system", "33") or "33"
    
    # Extract live dynamic matrix arrays straight out of session state memory
    if session_name in SESSION_GRID_STATE:
        active_data = SESSION_GRID_STATE[session_name]["active"]
        v_arr = active_data.get("v")
        p_arr = active_data.get("p")
        q_arr = active_data.get("q")
        r_arr = active_data.get("r")
        x_arr = active_data.get("x")
    else:
        defaults = get_engineering_defaults(bus_type)
        v_arr, p_arr, q_arr = defaults["v"], defaults["p"], defaults["q"]
        r_arr, x_arr = defaults["r"], defaults["x"]

    try:
        # Pass dynamic data parameters down into your topology rendering grid engine
        grid_payload = generate_grid_graph(bus_type, ratio=0.55, v=v_arr, p_load=p_arr, q_load=q_arr, r=r_arr, x=x_arr)
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

# --- ADDED: TIME TRAVEL HISTORICAL TOPOLOGY VIEWER ---
@app.get("/api/topology/historical")
async def get_historical_topology(session_name: str, timestamp: str):
    """
    Scans the timeline of the session log up until the specific clicked timestamp 
    to rebuild a pre-calculated vector visualization frame instantly.
    """
    state = get_session_state_from_file(session_name)
    bus_type = state.get("bus_system", "33") or "33"
    file_path = get_file_path(session_name)
    
    # Initialize baseline vectors to build the timeline forward from
    historical_vectors = get_engineering_defaults(bus_type)
    
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line.strip())
                        
                        # Apply snapshot updates sequentially as long as they occur on or before the clicked target
                        if entry.get("sender") == "state_snapshot":
                            historical_vectors = entry.get("snapshot")
                            
                        # Break execution immediately if we cross or hit our timeline constraint target anchor
                        if entry.get("timestamp") == timestamp:
                            break
        except Exception as file_err:
            print(f"Failed to scan structural history log: {file_err}")

    try:
        grid_payload = generate_grid_graph(
            bus_type, 
            ratio=0.55, 
            v=historical_vectors.get("v"), 
            p_load=historical_vectors.get("p"), 
            q_load=historical_vectors.get("q"), 
            r=historical_vectors.get("r"), 
            x=historical_vectors.get("x")
        )
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
    timestamp_limit = payload.get("timestamp", None) # Track branching anchor boundaries if specified

    if not new_name or len(new_name) >= 18:
        return {"status": "INVALID", "message": "Branch name must be between 1 and 17 characters."}
        
    source_path = get_file_path(clean_source)
    target_path = get_file_path(new_name)
    
    if not os.path.exists(source_path):
        return {"status": "NOT_FOUND", "message": f"Source tracking log '{clean_source}' could not be located."}
    if os.path.exists(target_path):
        return {"status": "EXISTS", "message": f"A data stream named '{new_name}' already exists."}

    try:
        # If branching directly from an old historical event, partial-slice copy history logs
        if timestamp_limit:
            with open(source_path, "r", encoding="utf-8") as src, open(target_path, "w", encoding="utf-8") as dst:
                for line in src:
                    if line.strip():
                        dst.write(line)
                        entry = json.loads(line.strip())
                        if entry.get("timestamp") == timestamp_limit:
                            break
        else:
            shutil.copyfile(source_path, target_path)
            
        # Synchronize RAM operational cache variables to mirror the duplicate process instantly
        get_session_state_from_file(new_name)
        
        return {"status": "SUCCESS", "new_session": new_name}
    except Exception as e:
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