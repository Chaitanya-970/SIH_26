"""
Unit and integration tests for RFC-005 ReAct Orchestrator.
"""
from __future__ import annotations

import json
import os
import shutil
import tempfile
from typing import AsyncGenerator, Dict, List, Optional
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.agent.orchestrator import (
    AgentOrchestrator,
    DoneEvent,
    ErrorEvent,
    FileCreatedEvent,
    ModelSwitchEvent,
    OrchestratorEvent,
    SessionManager,
    StepStartEvent,
    TokenEvent,
    ToolCallEvent,
    ToolResultEvent,
)
from app.agent.router import ModelRouter
from app.agent.tools import ToolContext
from app.config import ModelConfig, ModelRegistry, Settings
from app.models.schemas import ToolCall, ToolResult
from app.services.ollama import OllamaClient, OllamaError


# =====================================================================
# Fixtures
# =====================================================================

@pytest.fixture
def temp_dir():
    d = tempfile.mkdtemp()
    yield d
    shutil.rmtree(d, ignore_errors=True)


@pytest.fixture
def session_manager(temp_dir):
    return SessionManager(sessions_dir=os.path.join(temp_dir, "sessions"))


@pytest.fixture
def dummy_settings(temp_dir):
    return Settings(
        ollama_base_url="http://localhost:11434",
        data_dir=temp_dir,
        sessions_dir=os.path.join(temp_dir, "sessions"),
        max_agent_steps=3,  # Small step limit for faster test execution
    )


@pytest.fixture
def mock_registry():
    registry = MagicMock(spec=ModelRegistry)
    text_model = ModelConfig(
        name="Document Drafter",
        ollama_tag="phi3.5:3.8b",
        capability="text",
        routing_rule="default",
        num_ctx=4096,
    )
    code_model = ModelConfig(
        name="Code Sandbox",
        ollama_tag="qwen2.5-coder:3b",
        capability="code",
        routing_rule="keyword_match",
        keywords=["code", "python"],
        num_ctx=4096,
    )
    vision_model = ModelConfig(
        name="Vision Analyst",
        ollama_tag="moondream",
        capability="vision",
        routing_rule="has_image_attachment",
        num_ctx=4096,
    )
    registry.models = {
        "document": text_model,
        "coder": code_model,
        "vision": vision_model,
    }
    registry.get_by_capability.side_effect = lambda cap: {
        "text": text_model,
        "code": code_model,
        "vision": vision_model,
    }.get(cap)
    registry.get_by_key.side_effect = lambda k: {
        "document": text_model,
        "coder": code_model,
        "vision": vision_model,
    }.get(k)
    return registry


# =====================================================================
# SessionManager Tests
# =====================================================================

def test_session_manager_create_and_load(session_manager):
    session_id = session_manager.create_session()
    assert session_id is not None
    assert os.path.exists(session_manager.get_uploads_dir(session_id))
    assert os.path.exists(session_manager.get_exports_dir(session_id))

    history = session_manager.load_history(session_id)
    assert history["session_id"] == session_id
    assert history["messages"] == []


def test_session_manager_save_history(session_manager):
    session_id = session_manager.create_session()
    state = {
        "session_id": session_id,
        "messages": [{"role": "user", "content": "Hello Citadel"}],
    }
    session_manager.save_history(session_id, state)

    reloaded = session_manager.load_history(session_id)
    assert len(reloaded["messages"]) == 1
    assert reloaded["messages"][0]["content"] == "Hello Citadel"


def test_session_manager_missing_session(session_manager):
    history = session_manager.load_history("non-existent-uuid")
    assert history["session_id"] == "non-existent-uuid"
    assert history["messages"] == []


# =====================================================================
# OrchestratorEvent Tests
# =====================================================================

def test_orchestrator_events_instantiation():
    assert TokenEvent(text="hi").type == "token"
    assert StepStartEvent(step=1, description="step 1").type == "step_start"
    assert ToolCallEvent(tool="execute_code", args={"script": "1"}).type == "tool_call"
    assert ToolResultEvent(tool="execute_code", result="1", success=True).type == "tool_result"
    assert FileCreatedEvent(filename="report.docx", path="/path").type == "file_created"
    assert ModelSwitchEvent(from_model="a", to_model="b", reason="c").type == "model_switch"
    assert ErrorEvent(message="fail", retryable=False).type == "error"
    assert DoneEvent(steps_completed=2).type == "done"


# =====================================================================
# AgentOrchestrator Integration Tests
# =====================================================================

class FakeOllamaClient:
    """Mock OllamaClient yielding token streams based on a predetermined script."""

    def __init__(self, responses: List[str]):
        self.responses = list(responses)
        self.call_count = 0

    async def chat_stream(
        self, model: str, messages: List[Dict], num_ctx: int = 4096
    ) -> AsyncGenerator[str, None]:
        self.call_count += 1
        if self.responses:
            resp = self.responses.pop(0)
            # Yield in multiple chunks to simulate streaming
            words = resp.split(" ")
            for i, w in enumerate(words):
                yield w + (" " if i < len(words) - 1 else "")
        else:
            yield "Default mock response"

    async def generate_stream(
        self, model: str, prompt: str, images: Optional[List[str]] = None, num_ctx: int = 4096
    ) -> AsyncGenerator[str, None]:
        self.call_count += 1
        yield "Vision analysis: P&ID diagram verified."


@pytest.mark.asyncio
async def test_orchestrator_single_turn_final_answer(
    session_manager, dummy_settings, mock_registry
):
    """Test when model directly provides an answer without calling any tools."""
    session_id = session_manager.create_session()
    fake_ollama = FakeOllamaClient(["2 + 2 equals 4."])
    router = ModelRouter(mock_registry)

    orchestrator = AgentOrchestrator(
        ollama=fake_ollama,  # type: ignore
        router=router,
        registry=mock_registry,
        session_manager=session_manager,
        settings=dummy_settings,
    )

    events = []
    async for ev in orchestrator.run(session_id, "Calculate 2 + 2"):
        events.append(ev)

    # Event assertions
    types = [ev.type for ev in events]
    assert "step_start" in types
    assert "token" in types
    assert "tool_call" not in types
    assert types[-1] == "done"

    done_event = [e for e in events if isinstance(e, DoneEvent)][0]
    assert done_event.steps_completed == 1

    # Verify session history persisted
    history = session_manager.load_history(session_id)
    assert len(history["messages"]) == 2
    assert history["messages"][0]["role"] == "user"
    assert history["messages"][1]["role"] == "assistant"
    assert "2 + 2 equals 4." in history["messages"][1]["content"]


@pytest.mark.asyncio
async def test_orchestrator_multi_turn_tool_call(
    session_manager, dummy_settings, mock_registry, monkeypatch
):
    """Test model calling a tool in turn 1, receiving the result, and answering in turn 2."""
    session_id = session_manager.create_session()

    tool_call_json = '{"tool": "execute_code", "args": {"script": "print(42)"}}'
    fake_ollama = FakeOllamaClient([
        f"I will execute Python code:\n{tool_call_json}",
        "The script printed 42. Calculation finished.",
    ])

    # Mock dispatch_tool to return standard tool output
    mock_dispatch = AsyncMock(
        return_value=ToolResult(tool="execute_code", result="42", success=True)
    )
    monkeypatch.setattr("app.agent.orchestrator.dispatch_tool", mock_dispatch)

    router = ModelRouter(mock_registry)
    orchestrator = AgentOrchestrator(
        ollama=fake_ollama,  # type: ignore
        router=router,
        registry=mock_registry,
        session_manager=session_manager,
        settings=dummy_settings,
    )

    events = []
    async for ev in orchestrator.run(session_id, "Run print(42) in python"):
        events.append(ev)

    types = [ev.type for ev in events]
    assert "tool_call" in types
    assert "tool_result" in types
    assert types[-1] == "done"

    tool_call_ev = [e for e in events if isinstance(e, ToolCallEvent)][0]
    assert tool_call_ev.tool == "execute_code"
    assert tool_call_ev.args == {"script": "print(42)"}

    tool_res_ev = [e for e in events if isinstance(e, ToolResultEvent)][0]
    assert tool_res_ev.result == "42"

    done_event = [e for e in events if isinstance(e, DoneEvent)][0]
    assert done_event.steps_completed == 2

    # Check history contains user, assistant (call), tool (result), assistant (final)
    history = session_manager.load_history(session_id)
    roles = [m["role"] for m in history["messages"]]
    assert roles == ["user", "assistant", "tool", "assistant"]


@pytest.mark.asyncio
async def test_orchestrator_file_created_event(
    session_manager, dummy_settings, mock_registry, monkeypatch
):
    """Test write_word_document yielding a FileCreatedEvent."""
    session_id = session_manager.create_session()

    tool_json = '{"tool": "write_word_document", "args": {"content": {"title": "Test"}}}'
    fake_ollama = FakeOllamaClient([
        f"Generating document:\n{tool_json}",
        "Document has been created successfully.",
    ])

    mock_dispatch = AsyncMock(
        return_value=ToolResult(
            tool="write_word_document",
            result="Document created successfully at: report.docx",
            success=True,
        )
    )
    monkeypatch.setattr("app.agent.orchestrator.dispatch_tool", mock_dispatch)

    router = ModelRouter(mock_registry)
    orchestrator = AgentOrchestrator(
        ollama=fake_ollama,  # type: ignore
        router=router,
        registry=mock_registry,
        session_manager=session_manager,
        settings=dummy_settings,
    )

    events = []
    async for ev in orchestrator.run(session_id, "Generate report"):
        events.append(ev)

    file_events = [e for e in events if isinstance(e, FileCreatedEvent)]
    assert len(file_events) == 1
    assert file_events[0].filename == "report.docx"
    assert f"/api/sessions/{session_id}/files/report.docx" in file_events[0].path


@pytest.mark.asyncio
async def test_orchestrator_max_steps_cap(
    session_manager, dummy_settings, mock_registry, monkeypatch
):
    """Test orchestrator stopping cleanly when model exceeds max_agent_steps."""
    session_id = session_manager.create_session()

    # Model infinitely requests tools
    infinite_tool = '{"tool": "execute_code", "args": {"script": "pass"}}'
    fake_ollama = FakeOllamaClient([infinite_tool] * 10)

    mock_dispatch = AsyncMock(
        return_value=ToolResult(tool="execute_code", result="ok", success=True)
    )
    monkeypatch.setattr("app.agent.orchestrator.dispatch_tool", mock_dispatch)

    router = ModelRouter(mock_registry)
    orchestrator = AgentOrchestrator(
        ollama=fake_ollama,  # type: ignore
        router=router,
        registry=mock_registry,
        session_manager=session_manager,
        settings=dummy_settings,  # max_agent_steps = 3
    )

    events = []
    async for ev in orchestrator.run(session_id, "Loop forever"):
        events.append(ev)

    done_event = [e for e in events if isinstance(e, DoneEvent)][0]
    assert done_event.steps_completed == 3  # Capped at dummy_settings.max_agent_steps

    history = session_manager.load_history(session_id)
    last_msg = history["messages"][-1]
    assert "step limit" in last_msg["content"].lower()


@pytest.mark.asyncio
async def test_orchestrator_ollama_error_handling(
    session_manager, dummy_settings, mock_registry
):
    """Test OllamaError is caught and yields ErrorEvent without crashing."""
    session_id = session_manager.create_session()

    class ErrorOllamaClient:
        async def chat_stream(self, *args, **kwargs):
            raise OllamaError(message="CUDA OOM", status_code=500, retryable=True)
            yield ""  # Generator syntax

    router = ModelRouter(mock_registry)
    orchestrator = AgentOrchestrator(
        ollama=ErrorOllamaClient(),  # type: ignore
        router=router,
        registry=mock_registry,
        session_manager=session_manager,
        settings=dummy_settings,
    )

    events = []
    async for ev in orchestrator.run(session_id, "Hello"):
        events.append(ev)

    error_events = [e for e in events if isinstance(e, ErrorEvent)]
    assert len(error_events) == 1
    assert error_events[0].message == "CUDA OOM"
    assert error_events[0].retryable is True

    # State still persisted
    history = session_manager.load_history(session_id)
    assert len(history["messages"]) >= 1


@pytest.mark.asyncio
async def test_orchestrator_vision_handling(
    session_manager, dummy_settings, mock_registry
):
    """Test vision capability routing directly to _handle_vision single-turn generation."""
    session_id = session_manager.create_session()
    fake_ollama = FakeOllamaClient([])
    router = ModelRouter(mock_registry)

    orchestrator = AgentOrchestrator(
        ollama=fake_ollama,  # type: ignore
        router=router,
        registry=mock_registry,
        session_manager=session_manager,
        settings=dummy_settings,
    )

    events = []
    # file_extensions=['.png'] routes to Vision Analyst (dot-prefixed per IMAGE_EXTENSIONS)
    async for ev in orchestrator.run(
        session_id, "Analyze this schematic", file_extensions=[".png"]
    ):
        events.append(ev)

    types = [ev.type for ev in events]
    assert "token" in types
    assert types[-1] == "done"

    done_event = [e for e in events if isinstance(e, DoneEvent)][0]
    assert done_event.steps_completed == 1

    history = session_manager.load_history(session_id)
    assert len(history["messages"]) == 2
    assert "P&ID diagram verified" in history["messages"][1]["content"]
