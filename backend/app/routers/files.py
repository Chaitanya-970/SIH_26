from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse
from pathlib import Path
from typing import List, Dict, Any
import os

from app.config import Settings

router = APIRouter(prefix="/api/sessions", tags=["files"])
_settings = Settings()

def _get_exports_dir(session_id: str) -> Path:
    """Helper to get the safe exports path for a session"""
    # Sanitize session_id to prevent path traversal
    safe_session_id = os.path.basename(session_id)
    return Path(_settings.sessions_dir) / safe_session_id / "exports"

@router.get("/{session_id}/files", response_model=List[Dict[str, Any]])
async def list_session_files(session_id: str):
    """List all generated files for a given session."""
    exports_dir = _get_exports_dir(session_id)
    if not exports_dir.exists():
        return []
    
    files = []
    for file_path in exports_dir.iterdir():
        if file_path.is_file():
            # Estimate mimetype
            ext = file_path.suffix.lower()
            mime_type = "application/octet-stream"
            if ext == ".docx":
                mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            elif ext == ".xlsx":
                mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            elif ext == ".pptx":
                mime_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            elif ext == ".py":
                mime_type = "text/x-python"
            elif ext == ".csv":
                mime_type = "text/csv"
                
            files.append({
                "name": file_path.name,
                "type": mime_type,
                "size": file_path.stat().st_size,
                "path": f"/api/sessions/{session_id}/files/{file_path.name}"
            })
    return files

@router.get("/{session_id}/files/{filename}")
async def download_session_file(session_id: str, filename: str):
    """Download a specific generated file."""
    safe_filename = os.path.basename(filename)
    exports_dir = _get_exports_dir(session_id)
    file_path = exports_dir / safe_filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(path=file_path, filename=safe_filename)

@router.get("/{session_id}/files/{filename}/preview")
async def preview_session_file(session_id: str, filename: str):
    """Generate an HTML preview of a generated file."""
    safe_filename = os.path.basename(filename)
    exports_dir = _get_exports_dir(session_id)
    file_path = exports_dir / safe_filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    ext = file_path.suffix.lower()
    
    if ext in [".py", ".csv", ".txt", ".md", ".json"]:
        try:
            content = file_path.read_text(encoding="utf-8")
            html_content = f"<pre style='padding: 20px; font-family: monospace;'>{content}</pre>"
            return HTMLResponse(content=html_content)
        except Exception as e:
            return HTMLResponse(content=f"<div style='color: red;'>Error reading text file: {e}</div>")
    
    # For binary documents like Word, Excel, PPT, return a placeholder preview 
    # (since full document rendering in-browser requires heavy libraries like PDF.js or Office Web Apps)
    html_content = f"""
    <div style='padding: 20px; font-family: sans-serif; color: #475569; text-align: center; margin-top: 40px;'>
        <div style='font-size: 48px; margin-bottom: 16px;'>📄</div>
        <h3 style='margin: 0 0 8px 0; color: #f8fafc;'>{safe_filename}</h3>
        <p style='margin: 0 0 16px 0; font-size: 14px;'>Document generated successfully by Citadel Agent.</p>
        <p style='font-size: 12px; color: #94a3b8;'>Rich preview is not supported for this file format. Please download the file to view its contents.</p>
    </div>
    """
    return HTMLResponse(content=html_content)
