"""
ReAct Orchestrator Loop for CITADEL WORKSPACE (RFC-005).

Coordinates model inference, tool dispatch, context accumulation,
session state, and yields typed events for SSE streaming.
"""
from __future__ import annotations

import base64
import json
import logging
import os
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import AsyncGenerator, List, Optional
from anyio import to_thread

from app.agent.parser import extract_text_before_tool_call, parse_tool_call
from app.agent.prompts import build_system_prompt, build_vision_prompt
from app.agent.router import ModelRouter, RoutingDecision
from app.agent.tools import ToolContext, dispatch_tool
from app.config import ModelRegistry, Settings
from app.services.ollama import OllamaClient, OllamaError


logger = logging.getLogger(__name__)

# =====================================================================
# 1. Orchestrator Events
# =====================================================================

_SESSION_ID_RE = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)


@dataclass
class OrchestratorEvent:
    """Base class for events yielded by the orchestrator."""
    type: str


@dataclass
class TokenEvent(OrchestratorEvent):
    type: str = "token"
    text: str = ""


@dataclass
class StepStartEvent(OrchestratorEvent):
    type: str = "step_start"
    step: int = 0
    description: str = ""


@dataclass
class ToolCallEvent(OrchestratorEvent):
    type: str = "tool_call"
    tool: str = ""
    args: dict = field(default_factory=dict)


@dataclass
class ToolResultEvent(OrchestratorEvent):
    type: str = "tool_result"
    tool: str = ""
    result: str = ""
    success: bool = True


@dataclass
class FileCreatedEvent(OrchestratorEvent):
    type: str = "file_created"
    filename: str = ""
    path: str = ""


@dataclass
class ModelSwitchEvent(OrchestratorEvent):
    type: str = "model_switch"
    from_model: str = ""
    to_model: str = ""
    reason: str = ""


@dataclass
class ErrorEvent(OrchestratorEvent):
    type: str = "error"
    message: str = ""
    retryable: bool = True


@dataclass
class DoneEvent(OrchestratorEvent):
    type: str = "done"
    steps_completed: int = 0


# =====================================================================
# 2. Session Manager
# =====================================================================

class SessionManager:
    """Manages session directories, uploaded files, and conversation history."""

    def __init__(self, sessions_dir: str):
        self.sessions_dir = sessions_dir
        os.makedirs(self.sessions_dir, exist_ok=True)

    def create_session(self) -> str:
        """Create a new session with isolated uploads, exports, and history.json."""
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(self.sessions_dir, session_id)
        os.makedirs(os.path.join(session_dir, "uploads"), exist_ok=True)
        os.makedirs(os.path.join(session_dir, "exports"), exist_ok=True)

        state = {
            "session_id": session_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "messages": [],
        }
        with open(os.path.join(session_dir, "history.json"), "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)

        return session_id

    def load_history(self, session_id: str) -> dict:
        """Load session state from history.json. Returns empty state if missing."""
        if not _SESSION_ID_RE.match(session_id):
            return {"session_id": session_id, "messages": []}
            
        path = os.path.join(self.sessions_dir, session_id, "history.json")
        if not os.path.exists(path):
            return {"session_id": session_id, "messages": []}
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"session_id": session_id, "messages": []}

    def save_history(self, session_id: str, state: dict) -> None:
        """Persist session state to history.json."""
        session_dir = os.path.join(self.sessions_dir, session_id)
        os.makedirs(session_dir, exist_ok=True)
        path = os.path.join(session_dir, "history.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, default=str)

    def get_uploads_dir(self, session_id: str) -> str:
        path = os.path.join(self.sessions_dir, session_id, "uploads")
        os.makedirs(path, exist_ok=True)
        return path

    def get_exports_dir(self, session_id: str) -> str:
        path = os.path.join(self.sessions_dir, session_id, "exports")
        os.makedirs(path, exist_ok=True)
        return path


# =====================================================================
# 3. Agent Orchestrator
# =====================================================================

class AgentOrchestrator:
    """
    Core ReAct orchestrator driving autonomous multi-step reasoning,
    tool execution, and streaming telemetry events.
    """

    def __init__(
        self,
        ollama: OllamaClient,
        router: ModelRouter,
        registry: ModelRegistry,
        session_manager: SessionManager,
        settings: Settings,
    ):
        self.ollama = ollama
        self.router = router
        self.registry = registry
        self.session_manager = session_manager
        self.settings = settings

    async def run(
        self,
        session_id: str,
        user_message: str,
        file_extensions: Optional[List[str]] = None,
        uploaded_files: Optional[List[str]] = None,
        model_override: Optional[str] = None,
    ) -> AsyncGenerator[OrchestratorEvent, None]:
        """
        Main entrypoint. Yields OrchestratorEvents as the agent works.

        Flow:
        1. Route to the appropriate model
        2. Build conversation context (system prompt + history + user message)
        3. Call LLM
        4. If tool call detected: execute tool, append result, loop
        5. If no tool call: yield final response text, done
        6. Repeat until done or MAX_STEPS
        """
        max_steps = self.settings.max_agent_steps

        # Load session state
        state = await to_thread.run_sync(self.session_manager.load_history, session_id)
        messages: list = state.get("messages", [])

        # Route query
        routing: RoutingDecision = self.router.route(user_message, file_extensions, model_override)
        yield StepStartEvent(
            step=0,
            description=f"Routed to {routing.model_config.name} — {routing.reason}",
        )

        # Build tool context
        tool_context = ToolContext(
            session_id=session_id,
            uploads_dir=self.session_manager.get_uploads_dir(session_id),
            exports_dir=self.session_manager.get_exports_dir(session_id),
            ollama=self.ollama,
            registry=self.registry,
            settings=self.settings,
        )

        # Add user message to history
        messages.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Handle vision model separately (single-step, no tool-calling loop)
        if routing.model_config.capability == "vision":
            async for ev in self._handle_vision(
                routing, user_message, uploaded_files, messages, state, session_id
            ):
                yield ev
            return

        # Prepare Ollama messages with system prompt
        system_prompt = build_system_prompt()
        ollama_messages = [{"role": "system", "content": system_prompt}]

        # Add sliding window of conversation history (last 20 messages)
        for msg in messages[-20:]:
            ollama_messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

        current_model = routing.model_config.ollama_tag
        num_ctx = routing.model_config.num_ctx
        step = 0

        while step < max_steps:
            step += 1
            yield StepStartEvent(step=step, description=f"Thinking (step {step}/{max_steps})...")

            full_response = ""
            try:
                async for token in self.ollama.chat_stream(current_model, ollama_messages, num_ctx):
                    full_response += token
                    yield TokenEvent(text=token)
            except OllamaError as e:
                yield ErrorEvent(message=e.message, retryable=e.retryable)
                break
            except Exception as e:
                yield ErrorEvent(message=f"Inference error: {str(e)}", retryable=True)
                break

            # Scan response for tool call
            tool_call = parse_tool_call(full_response)

            if tool_call is None:
                # No tool call — final plain text answer reached
                messages.append({
                    "role": "assistant",
                    "content": full_response,
                    "model_used": current_model,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                break

            # Tool call detected
            yield ToolCallEvent(tool=tool_call.tool, args=tool_call.args)

            # Record assistant message with tool call
            messages.append({
                "role": "assistant",
                "content": full_response,
                "model_used": current_model,
                "tool_calls": [{"tool": tool_call.tool, "args": tool_call.args}],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            # Execute tool through dispatcher
            result = await dispatch_tool(tool_call, tool_context)
            yield ToolResultEvent(tool=result.tool, result=result.result, success=result.success)

            # Check if an export file was generated
            if result.success and tool_call.tool in (
                "write_word_document",
                "write_spreadsheet",
                "write_presentation",
            ):
                filename = getattr(result, "filename", None)
                if filename:
                    path = f"/api/sessions/{session_id}/files/{filename}"
                    yield FileCreatedEvent(filename=filename, path=path)

            # Append tool result to conversation history
            messages.append({
                "role": "tool",
                "content": f"[Tool: {tool_call.tool}] Result:\n{result.result}",
                "tool_result": result.result,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            # Update context for next iteration
            ollama_messages.append({"role": "assistant", "content": full_response})
            ollama_messages.append({
                "role": "user",
                "content": f"[Tool: {tool_call.tool}] Result:\n{result.result}",
            })

        else:
            # Reached MAX_STEPS without terminating
            limit_msg = (
                f"I've reached the step limit ({max_steps} steps). "
                "Here's what I've done so far — you can continue from here."
            )
            messages.append({
                "role": "assistant",
                "content": limit_msg,
                "model_used": current_model,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            yield TokenEvent(text=f"\n\n{limit_msg}")

        # Persist full conversation history
        state["messages"] = messages
        await to_thread.run_sync(self.session_manager.save_history, session_id, state)
        yield DoneEvent(steps_completed=step)

    async def _handle_vision(
        self,
        routing: RoutingDecision,
        user_message: str,
        uploaded_files: Optional[List[str]],
        messages: list,
        state: dict,
        session_id: str,
    ) -> AsyncGenerator[OrchestratorEvent, None]:
        """Handle vision requests: single-turn generation with base64 encoded images."""
        vision_prompt = build_vision_prompt(user_message)

        def _read_image(path: str) -> str:
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")

        images = []
        if uploaded_files:
            for fpath in uploaded_files:
                full_path = (
                    fpath
                    if os.path.isabs(fpath)
                    else os.path.join(self.session_manager.get_uploads_dir(session_id), fpath)
                )
                if os.path.exists(full_path):
                    b64_img = await to_thread.run_sync(_read_image, full_path)
                    images.append(b64_img)
                else:
                    logger.warning(f"Vision image not found: {full_path}")

        try:
            full_response = ""
            async for token in self.ollama.generate_stream(
                model=routing.model_config.ollama_tag,
                prompt=vision_prompt,
                images=images if images else None,
                num_ctx=routing.model_config.num_ctx,
            ):
                full_response += token
                yield TokenEvent(text=token)

            messages.append({
                "role": "assistant",
                "content": full_response,
                "model_used": routing.model_config.ollama_tag,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

        except Exception as e:
            yield ErrorEvent(message=f"Vision model error: {str(e)}", retryable=True)

        state["messages"] = messages
        await to_thread.run_sync(self.session_manager.save_history, session_id, state)
        yield DoneEvent(steps_completed=1)


__all__ = [
    "OrchestratorEvent",
    "TokenEvent",
    "StepStartEvent",
    "ToolCallEvent",
    "ToolResultEvent",
    "FileCreatedEvent",
    "ModelSwitchEvent",
    "ErrorEvent",
    "DoneEvent",
    "SessionManager",
    "AgentOrchestrator",
]
