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

# ... Keep your top imports and middleware setup identical ...

SESSION_STATE = {
    "stage": 0,           
    "session_name": "",
    "bus_system": ""
}

def get_server_time():
    return datetime.now().strftime("%I:%M:%S %p")

@app.get("/api/init")
async def init_endpoint():
    SESSION_STATE["stage"] = 0
    SESSION_STATE["session_name"] = ""
    SESSION_STATE["bus_system"] = ""
    return {
        "reply": "Welcome to IEEE Grid ChatBot. Please enter Session Name to begin.",
        "status": "Not Started",
        "session_name": "",  # Empty on startup
        "timestamp": get_server_time()
    }

@app.post("/api/chat")
async def chat_endpoint(payload: dict = Body(...)):
    user_raw = payload.get("message", "")
    user_stripped = user_raw.strip()
    user_message = user_stripped.lower()
    
    current_stage = SESSION_STATE["stage"]
    user_log_time = get_server_time()
    
    if current_stage == 0:
        if len(user_stripped) >= 18:
            return {
                "reply": "Invalid name. Session name must be under 18 characters. Please enter Session Name again:",
                "status": "Not Started",
                "session_name": "",
                "user_time": user_log_time,
                "system_time": get_server_time()
            }
        else:
            SESSION_STATE["session_name"] = user_stripped
            SESSION_STATE["stage"] = 1  
            return {
                "reply": f"Session set to '{user_stripped}'. What standard bus are you using?",
                "status": "ACTIVE",
                "session_name": SESSION_STATE["session_name"], # Send back the new name
                "user_time": user_log_time,
                "system_time": get_server_time()
            }

    # --- Keep Stage 1 & Stage 2 endpoints identical, just make sure they include: ---
    # "session_name": SESSION_STATE["session_name"] inside their return dictionaries.

    elif current_stage == 1:
        if user_stripped.isdigit():
            SESSION_STATE["bus_system"] = user_stripped
            SESSION_STATE["stage"] = 2  
            return {
                "reply": f"{user_stripped} bus system is loaded and ready !!!",
                "status": "ACTIVE",
                "user_time": user_log_time,
                "system_time": get_server_time()
            }
        else:
            return {
                "reply": "Please enter a valid numeric bus standard designation (e.g., 33):",
                "status": "ACTIVE",
                "user_time": user_log_time,
                "system_time": get_server_time()
            }

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
            
        return {
            "reply": response,
            "status": "ACTIVE",
            "user_time": user_log_time,
            "system_time": get_server_time()
        }