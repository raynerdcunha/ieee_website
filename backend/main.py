from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for your Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory dictionary to manage step-by-step terminal onboarding status
SESSION_STATE = {
    "stage": 0,           # 0: Session Name, 1: Bus Standard, 2: Command Mode
    "session_name": "",
    "bus_system": ""
}

# --- ADDED THIS TO FIX THE APP.JSX CONFLICT ---
@app.get("/api/health")
async def health_check():
    """Keeps App.jsx happy so it knows the server is online without overwriting status."""
    return {"status": "online"}


@app.get("/api/init")
async def init_endpoint():
    """Triggered on component load to deliver the welcoming prompt from the backend."""
    SESSION_STATE["stage"] = 0
    SESSION_STATE["session_name"] = ""
    SESSION_STATE["bus_system"] = ""
    
    return {
        "reply": "Welcome to IEEE Grid ChatBot. Please enter Session Name to begin.",
        "status": "Not Started"
    }

@app.post("/api/chat")
async def chat_endpoint(payload: dict = Body(...)):
    user_raw = payload.get("message", "")
    user_stripped = user_raw.strip()
    user_message = user_stripped.lower()
    
    current_stage = SESSION_STATE["stage"]

    # STAGE 0: Validate Session Name (< 18 characters)
    if current_stage == 0:
        if len(user_stripped) >= 18:
            return {
                "reply": "Invalid name. Session name must be under 18 characters. Please enter Session Name again:",
                "status": "Not Started"
            }
        else:
            SESSION_STATE["session_name"] = user_stripped
            SESSION_STATE["stage"] = 1  # Move to next phase
            return {
                "reply": f"Session set to '{user_stripped}'. What standard bus are you using?",
                "status": "ACTIVE"
            }

    # STAGE 1: Validate Bus Number Designation
    elif current_stage == 1:
        if user_stripped.isdigit():
            SESSION_STATE["bus_system"] = user_stripped
            SESSION_STATE["stage"] = 2  # Move to general command mode
            return {
                "reply": f"{user_stripped} bus system is loaded and ready !!!",
                "status": "ACTIVE"
            }
        else:
            return {
                "reply": "Please enter a valid numeric bus standard designation (e.g., 33):",
                "status": "ACTIVE"
            }

    # STAGE 2: Standard Analytical Command Operations
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
            "status": "ACTIVE"
        }