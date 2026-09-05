"""
SSE Chat Endpoint for CITADEL WORKSPACE (RFC-006).

POST /api/chat — accepts a user message (with optional file uploads),
invokes the AgentOrchestrator, and streams OrchestratorEvents back
as Server-Sent Events for real-time UI rendering.
"""
from __future__ import annotations

import json
import os
from typing import Optional

from fastapi import APIRouter, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


# =====================================================================
# JSON body model (matches frontend sseClient.js)
# =====================================================================

class ChatRequestBody(BaseModel):
    message: str
    session_id: Optional[str] = None
    model_override: Optional[str] = None
    attachment: Optional[dict] = None  # {name, size} from frontend


# =====================================================================
# SSE Formatting Helpers
# =====================================================================

def _format_sse(event_type: str, data: dict) -> str:
    """Format a single SSE event block."""
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


def _event_to_dict(event) -> dict:
    """Convert an OrchestratorEvent dataclass to a dict, excluding the 'type' field."""
    d = {}
    for key, val in event.__dict__.items():
        if key != "type":
            d[key] = val
    return d


async def _error_stream(message: str):
    """Yield a single error event + done for early validation failures."""
    yield _format_sse("error", {"message": message, "retryable": False})
    yield _format_sse("done", {"steps_completed": 0})


# =====================================================================
# POST /api/chat — JSON body (matches frontend sseClient.js)
# =====================================================================

@router.post("/api/chat")
async def chat(request: Request):
    """
    Accept a user message and return a Server-Sent Events stream
    of agent reasoning, tool calls, and final answer.

    Supports two content types:
    - application/json (used by frontend sseClient.js)
    - multipart/form-data (used by curl / file uploads)
    """
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        return await _handle_multipart(request)
    else:
        return await _handle_json(request)


async def _handle_json(request: Request):
    """Handle JSON body from frontend sseClient.js."""
    try:
        body = await request.json()
    except Exception:
        return StreamingResponse(
            _error_stream("Invalid JSON body"),
            media_type="text/event-stream",
        )

    message = body.get("message", "")
    session_id = body.get("session_id")
    model_override = body.get("model_override")

    if not message:
        return StreamingResponse(
            _error_stream("Message is required"),
            media_type="text/event-stream",
        )

    orchestrator = request.app.state.orchestrator
    session_manager = request.app.state.session_manager

    if not session_id:
        session_id = session_manager.create_session()

    async def event_stream():
        yield _format_sse("session", {"session_id": session_id})
        try:
            async for event in orchestrator.run(
                session_id=session_id,
                user_message=message,
                model_override=model_override,
            ):
                yield _format_sse(event.type, _event_to_dict(event))
        except Exception as e:
            yield _format_sse("error", {"message": str(e), "retryable": True})
            yield _format_sse("done", {"steps_completed": 0})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _handle_multipart(request: Request):
    """Handle multipart/form-data from curl or file upload clients."""
    form = await request.form()
    message = form.get("message", "")
    session_id = form.get("session_id")
    model_override = form.get("model_override")

    if not message:
        return StreamingResponse(
            _error_stream("Message is required"),
            media_type="text/event-stream",
        )

    orchestrator = request.app.state.orchestrator
    session_manager = request.app.state.session_manager
    settings = request.app.state.settings

    if not session_id:
        session_id = session_manager.create_session()

    # Process uploaded files
    file_extensions = []
    uploaded_filenames = []
    for key in form:
        item = form[key]
        if hasattr(item, "filename") and item.filename:
            upload: UploadFile = item
            ext = os.path.splitext(upload.filename)[1]
            file_extensions.append(ext)
            uploaded_filenames.append(upload.filename)

            # Validate file size (F-33)
            contents = await upload.read()
            max_size = settings.max_file_size_mb * 1024 * 1024
            if len(contents) > max_size:
                return StreamingResponse(
                    _error_stream(
                        f"File {upload.filename} exceeds {settings.max_file_size_mb} MB limit"
                    ),
                    media_type="text/event-stream",
                )

            # Save to session uploads directory
            dest = os.path.join(
                session_manager.get_uploads_dir(session_id), upload.filename
            )
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "wb") as f:
                f.write(contents)

    async def event_stream():
        yield _format_sse("session", {"session_id": session_id})
        try:
            async for event in orchestrator.run(
                session_id=session_id,
                user_message=message,
                file_extensions=file_extensions if file_extensions else None,
                uploaded_files=uploaded_filenames if uploaded_filenames else None,
                model_override=model_override,
            ):
                yield _format_sse(event.type, _event_to_dict(event))
        except Exception as e:
            yield _format_sse("error", {"message": str(e), "retryable": True})
            yield _format_sse("done", {"steps_completed": 0})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


__all__ = ["router", "_format_sse", "_event_to_dict"]
