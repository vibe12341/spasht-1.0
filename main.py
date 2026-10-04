"""
Go Vision - FastAPI Offline Backend
Model: google/gemma-4-E4B-it (Open Weights)
TTS: ai4bharat/indic-parler-tts with espeak-ng fallback
Storage: SQLite (Local only, explicit consent)
"""
import os
import json
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pydantic import BaseModel

import db
import tools
import prompts

app = FastAPI(title="Go Vision", description="Offline-First Multilingual Government Notice Assistant")

# Configuration
CONFIG = {
    "model_name": "google/gemma-4-E4B-it",
    "model_loaded": True,
    "tts_engine": os.environ.get("TTS_ENGINE", "indic-parler-tts"), # or espeak-ng
    "network_required": "NO",
    "active_language": "en"
}

# Mount static folder
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/health")
def health_check():
    """Offline proof endpoint."""
    prof = db.get_profile() or {}
    return {
        "status": "healthy",
        "model": CONFIG["model_name"],
        "model_loaded": CONFIG["model_loaded"],
        "language": prof.get("language", CONFIG["active_language"]),
        "tts_engine": CONFIG["tts_engine"],
        "network_required": "NO",
        "offline_ready": True
    }

class ProfileUpdate(BaseModel):
    name: str
    language: str
    state: str
    age: int
    category: str
    aadhaar: Optional[str] = None
    pan: Optional[str] = None
    consent: bool

@app.get("/api/profile")
def get_profile_endpoint():
    return db.get_profile()

@app.post("/api/profile")
def update_profile_endpoint(payload: ProfileUpdate):
    success = db.update_profile(payload.dict())
    return {"status": "ok" if success else "consent_revoked_data_cleared"}

@app.delete("/api/data")
def delete_all_data_endpoint():
    db.delete_all_data()
    return {"status": "all_data_deleted"}

@app.get("/api/deadlines")
def list_deadlines_endpoint():
    return tools.list_deadlines()

@app.get("/api/deadlines/{deadline_id}/ics")
def download_ics_endpoint(deadline_id: str):
    deadlines = tools.list_deadlines()
    target = next((d for d in deadlines if d.get("id") == deadline_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Deadline not found")
    
    ics_text = tools.create_ics(target)
    return Response(
        content=ics_text,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename=deadline-{deadline_id}.ics"}
    )

class IDValidateRequest(BaseModel):
    id_type: str # aadhaar | pan | ifsc
    value: str

@app.post("/api/validate-id")
def validate_id_endpoint(payload: IDValidateRequest):
    return tools.validate_id_number(payload.id_type, payload.value)

class RightsCheckRequest(BaseModel):
    notice_type: str
    issuing_authority: str
    summary_in_user_language: str
    required_actions: List[str]

@app.post("/api/rights-check")
def check_rights_endpoint(payload: RightsCheckRequest):
    return tools.check_rights(payload.dict())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
