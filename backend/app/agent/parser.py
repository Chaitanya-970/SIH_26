import json
import re
from app.models.schemas import ToolCall

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

def _attempt_json_repair(raw: str) -> dict | None:
    """
    Attempt basic repairs on malformed JSON from LLM output:
    - Single quotes → double quotes
    - Trailing commas
    - Unquoted keys
    """
    # Replace single quotes with double quotes
    repaired = raw.replace("'", '"')

    # Remove trailing commas before closing braces/brackets
    repaired = re.sub(r',\s*([}\]])', r'\1', repaired)

    try:
        return json.loads(repaired)
    except json.JSONDecodeError:
        return None

def parse_tool_call(text: str) -> ToolCall | None:
    """
    Scan model output for a tool call JSON pattern.
    Returns a ToolCall if found, None otherwise.
    """
    blocks = find_json_blocks(text)
    
    valid_tools = {
        "execute_code", "search_knowledge_base", "read_document",
        "write_word_document", "write_spreadsheet", "write_presentation"
    }
    
    for block in blocks:
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            data = _attempt_json_repair(block)
            
        if data and isinstance(data, dict):
            # Check if it has the shape of a tool call
            if "tool" in data and "args" in data:
                tool_name = data["tool"]
                if tool_name in valid_tools:
                    return ToolCall(tool=tool_name, args=data["args"])
                    
    return None

def extract_text_before_tool_call(text: str) -> str:
    """
    Extract the reasoning text that appears BEFORE the tool call JSON.
    This is what gets streamed to the user as the agent's thinking.
    """
    blocks = find_json_blocks(text)
    
    valid_tools = {
        "execute_code", "search_knowledge_base", "read_document",
        "write_word_document", "write_spreadsheet", "write_presentation"
    }
    
    for block in blocks:
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            data = _attempt_json_repair(block)
            
        if data and isinstance(data, dict) and "tool" in data and "args" in data:
            if data["tool"] in valid_tools:
                # Found the valid tool call block
                idx = text.find(block)
                if idx != -1:
                    return text[:idx].strip()
                    
    return text.strip()

__all__ = ["find_json_blocks", "parse_tool_call", "_attempt_json_repair", "extract_text_before_tool_call"]
