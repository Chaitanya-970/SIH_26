import pytest
import os
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

import pandas as pd
from docx import Document
from pptx import Presentation

from app.agent.tools import (
    ToolContext,
    execute_code,
    read_document,
    write_word_document,
    write_spreadsheet,
    write_presentation,
    dispatch_tool,
    search_knowledge_base,
    TOOL_REGISTRY
)
from app.models.schemas import ToolCall
from app.config import Settings, ModelRegistry

@pytest.fixture
def test_context(tmp_path):
    settings = Settings(
        sandbox_timeout_seconds=2,
        chroma_dir=str(tmp_path / "chroma")
    )
    
    registry = MagicMock(spec=ModelRegistry)
    embed_model = MagicMock()
    embed_model.ollama_tag = "nomic-embed-text"
    registry.get_by_capability.return_value = embed_model
    
    ollama = AsyncMock()
    ollama.embed.return_value = [0.1] * 768
    
    uploads = tmp_path / "uploads"
    exports = tmp_path / "exports"
    uploads.mkdir()
    exports.mkdir()
    
    return ToolContext(
        session_id="test_session",
        uploads_dir=str(uploads),
        exports_dir=str(exports),
        ollama=ollama,
        registry=registry,
        settings=settings
    )

def test_registry_keys():
    expected_keys = {
        "execute_code", 
        "search_knowledge_base", 
        "read_document", 
        "write_word_document", 
        "write_spreadsheet", 
        "write_presentation"
    }
    assert set(TOOL_REGISTRY.keys()) == expected_keys

@pytest.mark.asyncio
@patch('asyncio.create_subprocess_exec')
async def test_execute_code_success(mock_exec, test_context):
    mock_proc = AsyncMock()
    mock_proc.communicate.return_value = (b"hello world", b"")
    mock_proc.returncode = 0
    mock_exec.return_value = mock_proc
    
    args = {"script": "print('hello world')"}
    result = await execute_code(args, test_context)
    assert result.success is True
    assert "stdout:\nhello world" in result.result or "hello world" in result.result

@pytest.mark.asyncio
@patch('asyncio.create_subprocess_exec')
async def test_execute_code_docker_fallback(mock_exec, test_context):
    # First call raises FileNotFoundError (Docker not found)
    # Second call succeeds
    mock_proc = AsyncMock()
    mock_proc.communicate.return_value = (b"fallback success", b"")
    mock_proc.returncode = 0
    
    mock_exec.side_effect = [FileNotFoundError(), mock_proc]
    
    args = {"script": "print('fallback success')"}
    result = await execute_code(args, test_context)
    
    assert result.success is True
    assert "fallback success" in result.result
    assert mock_exec.call_count == 2
    # Verify second call is direct python
    assert mock_exec.call_args_list[1][0][0] == "python"

@pytest.mark.asyncio
@patch('asyncio.create_subprocess_exec')
async def test_execute_code_timeout(mock_exec, test_context):
    mock_proc = AsyncMock()
    mock_proc.kill = MagicMock()  # kill() is synchronous
    
    async def mock_communicate():
        await asyncio.sleep(0.5)
        return (b"", b"")
    mock_proc.communicate = mock_communicate
    mock_exec.return_value = mock_proc
    
    # Temporarily set timeout to a small value for the test
    test_context.settings.sandbox_timeout_seconds = 0.1
    
    args = {"script": "import time\nwhile True: time.sleep(1)"}
    result = await execute_code(args, test_context)
    assert result.success is False
    assert "timed out after" in result.result

@pytest.mark.asyncio
async def test_read_document_txt(test_context):
    file_path = os.path.join(test_context.uploads_dir, "test.txt")
    with open(file_path, "w") as f:
        f.write("test content")
        
    result = await read_document({"file_path": file_path}, test_context)
    assert result.success is True
    assert result.result == "test content"

@pytest.mark.asyncio
async def test_read_document_truncation(test_context):
    file_path = os.path.join(test_context.uploads_dir, "large.txt")
    with open(file_path, "w") as f:
        f.write("a" * 8050)
        
    result = await read_document({"file_path": file_path}, test_context)
    assert result.success is True
    assert len(result.result) < 8500
    assert "truncated" in result.result

@pytest.mark.asyncio
async def test_read_document_path_traversal(test_context):
    result = await read_document({"file_path": "../../../etc/passwd"}, test_context)
    assert result.success is False
    assert "Error: invalid file path" in result.result or "Error: file not found" in result.result

@pytest.mark.asyncio
@patch('app.agent.tools.to_thread.run_sync')
async def test_read_document_formats(mock_run_sync, test_context):
    file_path = os.path.join(test_context.uploads_dir, "test.pdf")
    with open(file_path, "w") as f:
        f.write("dummy pdf")
        
    mock_run_sync.return_value = "parsed pdf content"
    
    result = await read_document({"file_path": file_path}, test_context)
    assert result.success is True
    assert result.result == "parsed pdf content"
    mock_run_sync.assert_called_once()

@pytest.mark.asyncio
async def test_write_word_document(test_context):
    args = {
        "content": {
            "title": "Test Title",
            "body": "Test body paragraph",
            "signature_block": "Test Sign"
        }
    }
    result = await write_word_document(args, test_context)
    assert result.success is True
    
    doc_path = os.path.join(test_context.exports_dir, "test_title.docx")
    assert os.path.exists(doc_path)
    
    doc = Document(doc_path)
    assert doc.paragraphs[0].text == "Test Title"

@pytest.mark.asyncio
async def test_write_spreadsheet(test_context):
    args = {
        "data": [
            {"name": "Alice", "age": 30},
            {"name": "Bob", "age": 25}
        ]
    }
    result = await write_spreadsheet(args, test_context)
    assert result.success is True
    
    # get the filename from the result
    filename = result.result.split(" saved: ")[1].split(" ")[0]
    xls_path = os.path.join(test_context.exports_dir, filename)
    assert os.path.exists(xls_path)
    
    df = pd.read_excel(xls_path)
    assert len(df) == 2
    assert "Alice" in df.values

@pytest.mark.asyncio
async def test_write_presentation(test_context):
    args = {
        "content": {
            "title": "Test Presentation",
            "slides": [
                {"heading": "Slide 1", "bullets": ["A", "B"]}
            ]
        }
    }
    result = await write_presentation(args, test_context)
    assert result.success is True
    
    ppt_path = os.path.join(test_context.exports_dir, "test_presentation.pptx")
    assert os.path.exists(ppt_path)
    
    prs = Presentation(ppt_path)
    assert len(prs.slides) == 2 # Title + 1 content slide

@pytest.mark.asyncio
async def test_search_knowledge_base_empty(test_context):
    result = await search_knowledge_base({"query": "test"}, test_context)
    assert result.success is True
    assert "Knowledge base is empty" in result.result

@pytest.mark.asyncio
@patch('chromadb.PersistentClient')
async def test_search_knowledge_base_non_empty(mock_client, test_context):
    mock_collection = MagicMock()
    mock_collection.count.return_value = 1
    mock_collection.query.return_value = {
        "documents": [["Test doc content"]],
        "metadatas": [[{"source": "test.txt"}]],
        "distances": [[0.1]]
    }
    mock_client.return_value.get_or_create_collection.return_value = mock_collection
    
    result = await search_knowledge_base({"query": "test"}, test_context)
    assert result.success is True
    assert "Test doc content" in result.result
    assert "Source: test.txt" in result.result

@pytest.mark.asyncio
@patch('asyncio.create_subprocess_exec')
async def test_dispatch_tool_valid(mock_exec, test_context):
    mock_proc = AsyncMock()
    mock_proc.communicate.return_value = (b"1", b"")
    mock_proc.returncode = 0
    mock_exec.return_value = mock_proc
    
    call = ToolCall(tool="execute_code", args={"script": "print(1)"})
    result = await dispatch_tool(call, test_context)
    assert result.success is True
    assert "1" in result.result

@pytest.mark.asyncio
async def test_dispatch_tool_invalid(test_context):
    call = ToolCall(tool="make_coffee", args={})
    result = await dispatch_tool(call, test_context)
    assert result.success is False
    assert "Unknown tool" in result.result

@pytest.mark.asyncio
async def test_dispatch_tool_exception(test_context):
    # create a broken args dict that fails validation (e.g., list instead of dict for write_word_document content)
    call = ToolCall(tool="write_word_document", args={"content": "not a dict"})
    result = await dispatch_tool(call, test_context)
    assert result.success is False
    assert "Error:" in result.result
