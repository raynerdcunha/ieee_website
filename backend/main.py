from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI()

# This tells the backend: "It's okay to accept requests from your Vite frontend"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat")
async def chat_endpoint(payload: dict = Body(...)):
    user_message = payload.get("message", "").strip().lower()
    
    # Logic based on user input
    if "isolate" in user_message:
        response = f"Isolating buses {user_message.strip('isolate')}. Network is updated."
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
        
    return {"reply": response}