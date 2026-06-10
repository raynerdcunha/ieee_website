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

SESSION_STATE = {
    "stage": 0,           
    "session_name": "",
    "bus_system": "",
    "pending_name": ""
}

def get_server_time():
    return datetime.now().strftime("%I:%M:%S %p")

def get_file_path(session_name: str) -> str:
    if not os.path.exists(HISTORY_DIR):
        os.makedirs(HISTORY_DIR, exist_ok=True)
    return os.path.join(HISTORY_DIR, f"{session_name}.jsonl")

def append_to_log(sender: str, content: str, timestamp: str, stage: int):
    file_path = get_file_path(SESSION_STATE["session_name"])
    log_entry = {
        "session_name": SESSION_STATE["session_name"],
        "stage": stage,
        "sender": sender,
        "timestamp": timestamp,
        "content": content
    }
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

@app.get("/api/init")
async def init_endpoint():
    SESSION_STATE["stage"] = 0
    SESSION_STATE["session_name"] = ""
    SESSION_STATE["bus_system"] = ""
    SESSION_STATE["pending_name"] = ""
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
    SESSION_STATE["session_name"] = clean_name
    
    if os.path.exists(target_path):
        parsed_history = []
        last_recorded_stage = 1
        last_recorded_bus = ""
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line.strip())
                        parsed_history.append({
                            "sender": entry["sender"],
                            "content": entry["content"],
                            "timestamp": entry["timestamp"]
                        })
                        last_recorded_stage = entry.get("stage", 1)
                        if last_recorded_stage >= 2 and entry["sender"] == "user" and entry["content"].isdigit():
                            last_recorded_bus = entry["content"]
        except Exception as e:
            print(f"Error parsing log: {e}")
            
        SESSION_STATE["stage"] = last_recorded_stage
        if last_recorded_bus:
            SESSION_STATE["bus_system"] = last_recorded_bus
            
        return {"status": "ACTIVE", "session_name": clean_name, "history": parsed_history}
    else:
        SESSION_STATE["stage"] = 1
        SESSION_STATE["bus_system"] = ""
        system_reply = f"Session set to '{clean_name}'. What standard bus are you using?"
        system_time = get_server_time()
        append_to_log("system", system_reply, system_time, 1)
        return {"reply": system_reply, "status": "ACTIVE", "session_name": clean_name, "timestamp": system_time}

@app.post("/api/chat")
async def chat_endpoint(payload: dict = Body(...)):
    user_raw = payload.get("message", "")
    user_stripped = user_raw.strip()
    user_message = user_stripped.lower()
    
    current_stage = SESSION_STATE["stage"]
    user_log_time = get_server_time()
    
    # ----------------------------------------------------------------------
    # STAGE 0: INITIAL NAME ENTRY & CONFLICT DELEGATION
    # ----------------------------------------------------------------------
    if current_stage == 0:
        if len(user_stripped) >= 18:
            return {
                "reply": "Invalid name. Session name must be under 18 characters. Please enter Session Name again:",
                "status": "Not Started",
                "session_name": "",
                "user_time": user_log_time,
                "system_time": get_server_time()
            }
        
        target_path = get_file_path(user_stripped)
        
        if os.path.exists(target_path):
            SESSION_STATE["stage"] = -1
            SESSION_STATE["pending_name"] = user_stripped
            return {
                "reply": f"Warning: A session named '{user_stripped}' already exists. Do you want to 'Overwrite' or 'Continue'?",
                "status": "Not Started",
                "session_name": "",  # Keep empty so App.jsx doesn't move URL yet
                "user_time": user_log_time,
                "system_time": get_server_time()
            }
        
        SESSION_STATE["session_name"] = user_stripped
        SESSION_STATE["stage"] = 1  
        system_reply = f"Session set to '{user_stripped}'. What standard bus are you using?"
        system_time = get_server_time()
        
        append_to_log("user", user_stripped, user_log_time, 0)
        append_to_log("system", system_reply, system_time, 1)
        
        return {
            "reply": system_reply,
            "status": "ACTIVE",
            "session_name": user_stripped,
            "user_time": user_log_time,
            "system_time": system_time
        }

    # ----------------------------------------------------------------------
    # STAGE -1: CONFLICT CHOICE RESOLUTION
    # ----------------------------------------------------------------------
    elif current_stage == -1:
        chosen_name = SESSION_STATE["pending_name"]
        
        if "overwrite" in user_message:
            SESSION_STATE["session_name"] = chosen_name
            SESSION_STATE["pending_name"] = ""
            SESSION_STATE["stage"] = 1
            
            target_path = get_file_path(chosen_name)
            if os.path.exists(target_path):
                os.remove(target_path)
                
            system_reply = f"Previous session logs wiped. Fresh session set to '{chosen_name}'. What standard bus are you using?"
            system_time = get_server_time()
            
            append_to_log("user", chosen_name, user_log_time, 0)
            append_to_log("system", system_reply, system_time, 1)
            
            return {
                "reply": system_reply,
                "status": "ACTIVE",
                "session_name": chosen_name, # Locks it in! URL shifts now
                "user_time": user_log_time,
                "system_time": system_time
            }
            
        elif "continue" in user_message:
            SESSION_STATE["session_name"] = chosen_name
            SESSION_STATE["pending_name"] = ""
            
            target_path = get_file_path(chosen_name)
            parsed_history = []
            last_recorded_stage = 1
            last_recorded_bus = ""
            
            try:
                with open(target_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip():
                            entry = json.loads(line.strip())
                            parsed_history.append({
                                "sender": entry["sender"],
                                "content": entry["content"],
                                "timestamp": entry["timestamp"]
                            })
                            last_recorded_stage = entry.get("stage", 1)
                            if last_recorded_stage >= 2 and entry["sender"] == "user" and entry["content"].isdigit():
                                last_recorded_bus = entry["content"]
            except Exception as e:
                print(f"Error reading history file: {e}")
            
            SESSION_STATE["stage"] = last_recorded_stage
            if last_recorded_bus:
                SESSION_STATE["bus_system"] = last_recorded_bus
                
            return {
                "reply": "Restoring state...",
                "status": "ACTIVE",
                "session_name": chosen_name, # Locks it in! URL shifts now
                "history": parsed_history,
                "user_time": user_log_time,
                "system_time": get_server_time()
            }
        
        else:
            return {
                "reply": "Command unrecognized. Please respond explicitly with 'Overwrite' or 'Continue':",
                "status": "Not Started",
                "session_name": "",
                "user_time": user_log_time,
                "system_time": get_server_time()
            }

    # ----------------------------------------------------------------------
    # STAGE 1: BUS LOADING
    # ----------------------------------------------------------------------
    elif current_stage == 1:
        if user_stripped.isdigit():
            SESSION_STATE["bus_system"] = user_stripped
            SESSION_STATE["stage"] = 2  
            system_reply = f"{user_stripped} bus system is loaded and ready !!!"
            system_time = get_server_time()
            
            append_to_log("user", user_stripped, user_log_time, 1)
            append_to_log("system", system_reply, system_time, 2)
            
            return {"reply": system_reply, "status": "ACTIVE", "session_name": SESSION_STATE["session_name"], "user_time": user_log_time, "system_time": system_time}
        else:
            system_reply = "Please enter a valid numeric bus standard designation (e.g., 33):"
            system_time = get_server_time()
            append_to_log("user", user_stripped, user_log_time, 1)
            append_to_log("system", system_reply, system_time, 1)
            return {"reply": system_reply, "status": "ACTIVE", "session_name": SESSION_STATE["session_name"], "user_time": user_log_time, "system_time": system_time}

    # ----------------------------------------------------------------------
    # STAGE 2: STEADY STATE ACTIVE COMMANDS
    # ----------------------------------------------------------------------
    else:
        if "isolate" in user_message:
            clean_cmd = user_message.replace("isolate", "").strip()
            response = f"Isolating buses {clean_cmd}. Network is updated."
        elif "reset network" in user_message:
            response = "Network is resetted to original state."
        elif "power factor" in user_message:
            response = "Displaying Power Factor graph ..."
        elif "reset parameters" in user_message:
            response = "Parameters are resetted to default values."
        elif "smiley" in user_message:
            response = "Smiley Face diagram is getting displayed ..."
        else:
            response = "Command not recognized. Try 'Isolate', 'Reset', or 'Power Factor'."
            
        system_time = get_server_time()
        append_to_log("user", user_stripped, user_log_time, 2)
        append_to_log("system", response, system_time, 2)
            
        return {"reply": response, "status": "ACTIVE", "session_name": SESSION_STATE["session_name"], "user_time": user_log_time, "system_time": system_time}