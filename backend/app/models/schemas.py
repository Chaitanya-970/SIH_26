from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime

class ToolCall(BaseModel):
    tool: str
    args: dict

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "tool"]
    content: str
    model_used: Optional[str] = None
    tool_calls: Optional[List[dict]] = None
    tool_result: Optional[str] = None
    timestamp: Optional[datetime] = None

class SessionState(BaseModel):
    session_id: str
    created_at: datetime
    messages: List[ChatMessage] = []

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    model_override: Optional[str] = None  # key from models.yaml, or None for auto

class ToolResult(BaseModel):
    tool: str
    result: str
    success: bool
