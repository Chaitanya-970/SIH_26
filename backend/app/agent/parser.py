import json
import re
from app.models.schemas import ToolCall

VALID_TOOLS = {
    "execute_code", "search_knowledge_base", "read_document",
    "write_word_document", "write_spreadsheet", "write_presentation"
}

def find_json_blocks(text: str) -> list[str]:
    blocks = []
    stack = 0
    start = -1
    in_string = False
    escape = False
    quote_char = None
    
    for i, char in enumerate(text):
        if escape:
            escape = False
            continue
        if char == '\\':
            escape = True
            continue
            
        if char in ('"', "'"):
            if not in_string:
                in_string = True
                quote_char = char
            elif quote_char == char:
                in_string = False
            continue
            
        if not in_string:
            if char == '{':
                if stack == 0:
                    start = i
                stack += 1
            elif char == '}':
                if stack > 0:
                    stack -= 1
                    if stack == 0:
                        blocks.append(text[start:i+1])
    return blocks

import ast

def _attempt_json_repair(raw: str) -> dict | None:
    """
    Attempt repairs on malformed JSON from LLM output:
    - Escaping unescaped newlines/tabs inside strings
    - Removing trailing commas
    - Fallback to ast.literal_eval for single-quoted output
    """
    # 1. Escape control characters inside string literals
    repaired_chars = []
    in_string = False
    escape = False
    for char in raw:
        if escape:
            repaired_chars.append(char)
            escape = False
        elif char == '\\':
            repaired_chars.append(char)
            escape = True
        elif char == '"':
            in_string = not in_string
            repaired_chars.append(char)
        elif in_string and char == '\n':
            repaired_chars.extend(['\\', 'n'])
        elif in_string and char == '\r':
            repaired_chars.extend(['\\', 'r'])
        elif in_string and char == '\t':
            repaired_chars.extend(['\\', 't'])
        else:
            repaired_chars.append(char)
            
    repaired = "".join(repaired_chars)
    
    # 2. Remove trailing commas before closing braces/brackets
    repaired = re.sub(r',\s*([}\]])', r'\1', repaired)

    try:
        return json.loads(repaired)
    except json.JSONDecodeError:
        pass

    # 3. Fallback: Try ast.literal_eval for single-quoted dicts
    python_str = raw.replace('true', 'True').replace('false', 'False').replace('null', 'None')
    try:
        parsed = ast.literal_eval(python_str)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    return None

def parse_tool_call(text: str) -> ToolCall | None:
    """
    Scan model output for a tool call JSON pattern.
    Returns a ToolCall if found, None otherwise.
    """
    blocks = find_json_blocks(text)
    
    for block in blocks:
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            data = _attempt_json_repair(block)
            
        if data and isinstance(data, dict):
            # Check if it has the shape of a tool call
            if "tool" in data and "args" in data:
                tool_name = data["tool"]
                if tool_name in VALID_TOOLS:
                    return ToolCall(tool=tool_name, args=data["args"])
                    
    return None

def extract_text_before_tool_call(text: str) -> str:
    """
    Extract the reasoning text that appears BEFORE the tool call JSON.
    This is what gets streamed to the user as the agent's thinking.
    """
    blocks = find_json_blocks(text)
    
    for block in blocks:
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            data = _attempt_json_repair(block)
            
        if data and isinstance(data, dict) and "tool" in data and "args" in data:
            if data["tool"] in VALID_TOOLS:
                # Found the valid tool call block
                idx = text.find(block)
                if idx != -1:
                    return text[:idx].strip()
                    
    return text.strip()

__all__ = ["find_json_blocks", "parse_tool_call", "_attempt_json_repair", "extract_text_before_tool_call"]
