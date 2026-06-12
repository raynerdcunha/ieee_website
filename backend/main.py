import os
import json
from datetime import datetime
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

HISTORY_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chat-history"))

def get_server_time():
    return datetime.now().strftime("%I:%M:%S %p")

def get_file_path(session_name: str) -> str:
    if not os.path.exists(HISTORY_DIR):
        os.makedirs(HISTORY_DIR, exist_ok=True)
    return os.path.join(HISTORY_DIR, f"{session_name}.jsonl")

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
                    history.append({
                        "sender": entry["sender"],
                        "content": entry["content"],
                        "timestamp": entry["timestamp"]
                    })
    except Exception as e:
        print(f"Error reading history: {e}")
        
    # --- DYNAMIC WELCOME MESSAGE INJECTION ---
    initial_timestamp = history[0]["timestamp"] if history else get_server_time()
    
    welcome_message = {
        "sender": "system",
        "content": "Welcome to IEEE Grid ChatBot. Please enter Session Name to begin.",
        "timestamp": initial_timestamp
    }
    
    history.insert(0, welcome_message)
    return history

def get_session_state_from_file(session_name: str):
    """
    Reconstructs the current stage and parameters from the log.
    Stage 0: Pending user choice (overwrite or continue)
    Stage 1: Waiting for standard bus input
    Stage 2: Processing grid topology commands
    """
    file_path = get_file_path(session_name)
    if not os.path.exists(file_path):
        return {"stage": 1, "bus_system": ""}
    
    last_stage = 1
    last_bus = ""
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    entry = json.loads(line.strip())
                    # FIXED: Safely grab the absolute latest stage written to log
                    if "stage" in entry:
                        last_stage = entry["stage"]
                    if entry["sender"] == "user" and entry["content"].isdigit():
                        last_bus = entry["content"]
    except:
        pass
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

@app.get("/api/init")
async def init_endpoint():
    return {
        "reply": "Welcome to IEEE Grid ChatBot. Please enter Session Name to begin.",
        "status": "Not Started",
        "session_name": "",
        "timestamp": get_server_time()
    }

@app.get("/api/session/{session_name}")
async def get_session_endpoint(session_name: str):
    clean_name = session_name.strip()
    if len(clean_name) >= 18:
        return {"status": "INVALID", "reply": "Session name must be under 18 characters.", "timestamp": get_server_time()}
        
    target_path = get_file_path(clean_name)
    if os.path.exists(target_path):
        parsed_history = get_full_history(clean_name)
        return {"status": "ACTIVE", "session_name": clean_name, "history": parsed_history}
    else:
        return {"status": "NOT_FOUND", "reply": f"Session '{clean_name}' does not exist.", "timestamp": get_server_time()}
    
@app.post("/api/chat")
async def chat_endpoint(payload: dict = Body(...)):
    user_raw = payload.get("message", "")
    session_name = payload.get("session_name", "").strip()
    user_stripped = user_raw.strip()
    user_message = user_stripped.lower()
    user_log_time = get_server_time()

    # --- PHASE 1: STAGE 0 - RECEIVING & VALIDATING SESSION NAME ---
    if not session_name:
        if len(user_stripped) >= 18:
            system_reply = "Session name must be under 18 characters. Try again:"
            return {"reply": system_reply, "status": "Not Started", "session_name": "", "user_time": user_log_time, "system_time": get_server_time()}
        
        if not user_stripped:
            system_reply = "Session name cannot be empty. Please enter a valid name:"
            return {"reply": system_reply, "status": "Not Started", "session_name": "", "user_time": user_log_time, "system_time": get_server_time()}

        target_path = get_file_path(user_stripped)
        
        if os.path.exists(target_path):
            system_reply = f"Session '{user_stripped}' already exists. Would you like to OVERWRITE or CONTINUE?"
            system_time = get_server_time()
            append_to_log(user_stripped, "user", user_stripped, user_log_time, 0)
            append_to_log(user_stripped, "system", system_reply, system_time, 0)
            return {"reply": system_reply, "status": "Not Started", "session_name": user_stripped, "user_time": user_log_time, "system_time": system_time}
        else:
            system_reply = f"Session set to '{user_stripped}'. What standard bus are you using?"
            system_time = get_server_time()
            append_to_log(user_stripped, "user", user_stripped, user_log_time, 1)
            append_to_log(user_stripped, "system", system_reply, system_time, 1)
            return {"reply": system_reply, "status": user_stripped, "session_name": user_stripped, "user_time": user_log_time, "system_time": system_time}

    state = get_session_state_from_file(session_name)
    current_stage = state["stage"]

    # --- PHASE 2: CONFLICT RESOLUTION (OVERWRITE OR CONTINUE) ---
    if current_stage == 0:
        if user_message == "overwrite":
            try:
                os.remove(get_file_path(session_name))
            except:
                pass
            
            system_reply = "Previous session cleared. What standard bus are you using?"
            system_time = get_server_time()
            append_to_log(session_name, "system", system_reply, system_time, 1)
            return {"reply": system_reply, "status": session_name, "session_name": session_name, "user_time": user_log_time, "system_time": system_time}
            
        elif user_message == "continue":
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 1) 
            
            state_correction = get_session_state_from_file(session_name)
            active_stage = state_correction["stage"] if state_correction["stage"] != 0 else 1
            append_to_log(session_name, "system", "Resuming session pipeline...", system_time, active_stage)
            
            refreshed_history = get_full_history(session_name)
            return {"history": refreshed_history, "status": session_name, "session_name": session_name}
        else:
            system_reply = "Invalid option. Please specify 'overwrite' or 'continue':"
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 0)
            append_to_log(session_name, "system", system_reply, system_time, 0)
            return {"reply": system_reply, "status": "Not Started", "session_name": session_name, "user_time": user_log_time, "system_time": system_time}

    # --- PHASE 3: STAGE 1 (BUS SYSTEM LOADING) ---
    elif current_stage == 1:
        if user_stripped.isdigit():
            system_reply = f"{user_stripped} bus system is loaded and ready !!!"
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 1)
            append_to_log(session_name, "system", system_reply, system_time, 2)
            return {"reply": system_reply, "status": session_name, "session_name": session_name, "user_time": user_log_time, "system_time": system_time}
        else:
            system_reply = "Please enter a valid numeric bus standard designation (e.g., 33):"
            system_time = get_server_time()
            append_to_log(session_name, "user", user_stripped, user_log_time, 1)
            append_to_log(session_name, "system", system_reply, system_time, 1)
            return {"reply": system_reply, "status": session_name, "session_name": session_name, "user_time": user_log_time, "system_time": system_time}

    # --- PHASE 4: STAGE 2 (ACTIVE COMMAND ARCHITECTURE) ---
    else:
        # FIXED: Added support for all backend commands mapping to frontend pill actions
        if "isolate" in user_message:
            response = f"Isolating buses {user_message.replace('isolate', '').strip()}. Network updated."
        elif "reset network" in user_message:
            response = "Network reset execution sequence initiated. Configuration standard restored."
        elif "power factor" in user_message:
            response = "Calculating active power vectors. Power factor optimization matrices logged."
        elif "reset parameters" in user_message:
            response = "Bus variables and matrix boundary parameters reset to factory initialization values."
        elif "display smiley face" in user_message:
            response = "Grid visualization mode activated: 🤖 Matrix operations complete! 🌟"
        else:
            response = f"Command '{user_stripped}' not recognized. Try using the quick action macros below."
            
        system_time = get_server_time()
        append_to_log(session_name, "user", user_stripped, user_log_time, 2)
        append_to_log(session_name, "system", response, system_time, 2)
        return {"reply": response, "status": session_name, "session_name": session_name, "user_time": user_log_time, "system_time": system_time}
    
@app.get("/api/list-sessions")
async def list_sessions():
    sessions = []
    for filename in os.listdir(HISTORY_DIR):
        if filename.endswith(".jsonl"):
            path = os.path.join(HISTORY_DIR, filename)
            mtime = os.path.getmtime(path)
            sessions.append({
                "name": filename.replace(".jsonl", ""),
                "mtime": datetime.fromtimestamp(mtime).strftime("%m/%d/%Y, %I:%M:%S %p")
            })
    # Sort by mtime descending (newest first)
    sessions.sort(key=lambda x: x["mtime"], reverse=True)
    return sessions