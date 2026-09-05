import pytest
from app.agent.parser import (
    parse_tool_call,
    _attempt_json_repair,
    extract_text_before_tool_call,
    ToolCall
)

def test_parse_tool_call_clean_json():
    text = 'Thinking process...\n{"tool": "execute_code", "args": {"script": "print(1)"}}'
    tool_call = parse_tool_call(text)
    assert tool_call is not None
    assert tool_call.tool == "execute_code"
    assert tool_call.args == {"script": "print(1)"}

def test_parse_tool_call_markdown_fences():
    text = '''I will use a tool:
```json
{"tool": "read_document", "args": {"file_path": "test.txt"}}
```
'''
    tool_call = parse_tool_call(text)
    assert tool_call is not None
    assert tool_call.tool == "read_document"
    assert tool_call.args == {"file_path": "test.txt"}

def test_parse_tool_call_single_quotes():
    # Invalid JSON standard, but LLMs do this often
    text = "{'tool': 'search_knowledge_base', 'args': {'query': 'pumps'}}"
    tool_call = parse_tool_call(text)
    assert tool_call is not None
    assert tool_call.tool == "search_knowledge_base"
    assert tool_call.args == {"query": "pumps"}

def test_parse_tool_call_trailing_comma():
    text = '{"tool": "execute_code", "args": {"script": "ls",},}'
    tool_call = parse_tool_call(text)
    assert tool_call is not None
    assert tool_call.tool == "execute_code"
    assert tool_call.args == {"script": "ls"}

def test_parse_tool_call_hallucinated_tool():
    text = '{"tool": "make_coffee", "args": {"sugars": 2}}'
    tool_call = parse_tool_call(text)
    assert tool_call is None

def test_parse_tool_call_no_json():
    text = "Here is the final answer to your question."
    tool_call = parse_tool_call(text)
    assert tool_call is None

def test_parse_tool_call_multiple_calls():
    # Should only return the first one
    text = '''
    {"tool": "read_document", "args": {"file_path": "1.txt"}}
    {"tool": "read_document", "args": {"file_path": "2.txt"}}
    '''
    tool_call = parse_tool_call(text)
    assert tool_call is not None
    assert tool_call.args["file_path"] == "1.txt"

def test_extract_text_before_tool_call():
    text = "I need to read the file first.\n{\"tool\": \"read_document\", \"args\": {\"file_path\": \"foo.txt\"}}"
    extracted = extract_text_before_tool_call(text)
    assert extracted == "I need to read the file first."

def test_extract_text_before_tool_call_no_json():
    text = "Just some normal text."
    extracted = extract_text_before_tool_call(text)
    assert extracted == text

def test_extract_text_before_tool_call_only_json():
    text = '{"tool": "execute_code", "args": {"script": "pass"}}'
    extracted = extract_text_before_tool_call(text)
    assert extracted == ""
