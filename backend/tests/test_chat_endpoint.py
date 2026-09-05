"""
Unit and integration tests for RFC-006 SSE Chat Endpoint.
"""
from __future__ import annotations

import json
from typing import AsyncGenerator, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.agent.orchestrator import (
    AgentOrchestrator,
    DoneEvent,
    ErrorEvent,
    SessionManager,
    StepStartEvent,
    TokenEvent,
    ToolCallEvent,
    ToolResultEvent,
)
from app.routers.chat import _event_to_dict, _format_sse


# =====================================================================
# Unit Tests: SSE Helpers
# =====================================================================

def test_format_sse_basic():
    """AC-3: Each SSE event formatted as event: <type>\\ndata: <json>\\n\\n"""
    result = _format_sse("token", {"text": "hello"})
    assert result == 'event: token\ndata: {"text": "hello"}\n\n'


def test_format_sse_done():
    result = _format_sse("done", {"steps_completed": 3})
    assert result == 'event: done\ndata: {"steps_completed": 3}\n\n'


def test_format_sse_error():
    result = _format_sse("error", {"message": "OOM", "retryable": True})
    parsed_data = json.loads(result.split("data: ")[1].strip())
    assert parsed_data["message"] == "OOM"
    assert parsed_data["retryable"] is True


def test_event_to_dict_token():
    """Verify _event_to_dict excludes the 'type' field."""
    event = TokenEvent(text="hi")
    d = _event_to_dict(event)
    assert "type" not in d
    assert d["text"] == "hi"


def test_event_to_dict_step_start():
    event = StepStartEvent(step=2, description="Thinking...")
    d = _event_to_dict(event)
    assert d == {"step": 2, "description": "Thinking..."}


def test_event_to_dict_tool_call():
    event = ToolCallEvent(tool="execute_code", args={"script": "1+1"})
    d = _event_to_dict(event)
    assert d["tool"] == "execute_code"
    assert d["args"] == {"script": "1+1"}
    assert "type" not in d


def test_event_to_dict_done():
    event = DoneEvent(steps_completed=5)
    d = _event_to_dict(event)
    assert d == {"steps_completed": 5}


# =====================================================================
# Integration Tests: /api/chat endpoint
# =====================================================================

@pytest.fixture
def mock_app():
    """Create a FastAPI test app with mocked orchestrator and session manager."""
    from app.main import app

    # Create mock session manager
    mock_session_mgr = MagicMock(spec=SessionManager)
    mock_session_mgr.create_session.return_value = "test-session-123"

    # Create mock orchestrator that yields a simple event sequence
    mock_orchestrator = MagicMock(spec=AgentOrchestrator)

    async def fake_run(**kwargs):
        yield StepStartEvent(step=1, description="Thinking...")
        yield TokenEvent(text="The answer is 4.")
        yield DoneEvent(steps_completed=1)

    mock_orchestrator.run = fake_run

    # Patch app state
    app.state.orchestrator = mock_orchestrator
    app.state.session_manager = mock_session_mgr
    app.state.settings = MagicMock()
    app.state.settings.debug = True
    app.state.settings.max_file_size_mb = 50

    return app


@pytest.fixture
def client(mock_app):
    return TestClient(mock_app)


def _parse_sse_events(response_text: str) -> list[tuple[str, dict]]:
    """Parse raw SSE text into a list of (event_type, data_dict) tuples."""
    events = []
    blocks = response_text.split("\n\n")
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        event_type = "token"
        data_str = ""
        for line in block.split("\n"):
            if line.startswith("event:"):
                event_type = line.replace("event:", "").strip()
            elif line.startswith("data:"):
                data_str += line.replace("data:", "").strip()
        if data_str:
            try:
                events.append((event_type, json.loads(data_str)))
            except json.JSONDecodeError:
                events.append((event_type, {"raw": data_str}))
    return events


def test_chat_endpoint_json_body(client):
    """AC-1/AC-2: POST /api/chat with JSON body returns SSE stream."""
    response = client.post(
        "/api/chat",
        json={"message": "What is 2 + 2?"},
        headers={"Accept": "text/event-stream"},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

    events = _parse_sse_events(response.text)
    event_types = [e[0] for e in events]

    # AC-4: First event is session
    assert event_types[0] == "session"
    assert "session_id" in events[0][1]

    # AC-5: Last event is done
    assert event_types[-1] == "done"
    assert events[-1][1]["steps_completed"] == 1

    # AC-6: Contains expected event types
    assert "step_start" in event_types
    assert "token" in event_types


def test_chat_endpoint_session_creation(client, mock_app):
    """AC-4: Session is created when session_id not provided."""
    response = client.post(
        "/api/chat",
        json={"message": "Hello"},
    )
    events = _parse_sse_events(response.text)
    session_event = events[0]
    assert session_event[0] == "session"
    assert session_event[1]["session_id"] == "test-session-123"


def test_chat_endpoint_empty_message(client):
    """Verify empty message returns error SSE event."""
    response = client.post(
        "/api/chat",
        json={"message": ""},
    )
    assert response.status_code == 200
    events = _parse_sse_events(response.text)
    event_types = [e[0] for e in events]
    assert "error" in event_types


def test_chat_endpoint_sse_headers(client):
    """AC-13: SSE response includes Cache-Control and Connection headers."""
    response = client.post(
        "/api/chat",
        json={"message": "Test"},
    )
    assert response.headers.get("cache-control") == "no-cache"


def test_chat_endpoint_orchestrator_error(client, mock_app):
    """AC-12: Unexpected orchestrator exception yields error + done events."""

    async def exploding_run(**kwargs):
        yield TokenEvent(text="Starting...")
        raise RuntimeError("Unexpected GPU failure")

    mock_app.state.orchestrator.run = exploding_run

    response = client.post(
        "/api/chat",
        json={"message": "Crash test"},
    )
    events = _parse_sse_events(response.text)
    event_types = [e[0] for e in events]

    assert "error" in event_types
    assert event_types[-1] == "done"

    error_event = [e for e in events if e[0] == "error"][0]
    assert "GPU failure" in error_event[1]["message"]


def test_format_sse_all_event_types():
    """AC-6: All 9 SSE event types produce valid SSE blocks."""
    event_types = [
        "session", "token", "step_start", "tool_call",
        "tool_result", "file_created", "model_switch", "error", "done",
    ]
    for evt in event_types:
        result = _format_sse(evt, {"test": True})
        assert result.startswith(f"event: {evt}\n")
        assert result.endswith("\n\n")
        data_line = result.split("\n")[1]
        assert data_line.startswith("data: ")
        parsed = json.loads(data_line.replace("data: ", ""))
        assert parsed["test"] is True
