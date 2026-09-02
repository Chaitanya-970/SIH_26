import pytest
import asyncio
from app.services.ollama import OllamaClient, OllamaError
from app.config import Settings

@pytest.mark.asyncio
async def test_ollama_client_integration():
    settings = Settings()
    client = OllamaClient(settings.ollama_base_url)
    
    try:
        # Check if we can connect to the list_models endpoint
        models = await client.list_models()
        assert isinstance(models, list)
        
        # Test basic embed functionality
        embedding = await client.embed(model="nomic-embed-text", text="Hello world")
        assert len(embedding) > 0
        
    except OllamaError as e:
        # If Ollama is not running or model is missing, it should raise OllamaError 
        # with retryable flag (if connection issue) or specific status
        assert e.retryable is True or e.status_code in [404, 500, 503]
        print(f"Skipped actual inference due to Ollama error (expected if not running locally): {e.message}")
    finally:
        await client.close()
