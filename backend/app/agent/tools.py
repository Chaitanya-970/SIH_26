"""
RFC-004 Agent Tools Interface.
This provides ToolContext and dispatch_tool stub so that RFC-005 orchestrator
can operate independently while teammate implements full tool logic in RFC-004.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.config import ModelRegistry, Settings
from app.models.schemas import ToolCall, ToolResult
from app.services.ollama import OllamaClient


@dataclass
class ToolContext:
    session_id: str
    uploads_dir: str  # Path to session uploads
    exports_dir: str  # Path to session exports
    ollama: OllamaClient
    registry: ModelRegistry
    settings: Settings


async def dispatch_tool(tool_call: ToolCall, context: ToolContext) -> ToolResult:
    """
    Dispatch a tool call to its handler.
    Stub implementation for RFC-005 testing until teammate finishes RFC-004.
    """
    return ToolResult(
        tool=tool_call.tool,
        result=f"Executed tool '{tool_call.tool}' with args: {tool_call.args}",
        success=True,
    )


__all__ = ["ToolContext", "dispatch_tool"]
