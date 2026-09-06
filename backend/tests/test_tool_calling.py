import pytest
import asyncio
from app.config import Settings
from app.services.ollama import OllamaClient, OllamaError
from app.agent.prompts import build_system_prompt
from app.agent.parser import parse_tool_call

"""
Week 1 blocker validation: Can Phi-3.5-mini reliably output JSON tool calls?

Run this with Ollama running locally:
    python -m pytest backend/tests/test_tool_calling.py -v

Decision criteria:
- If >= 8/10 test prompts produce valid, parseable tool calls → GO
- If < 8/10 → switch to Llama 3.2 3B or Qwen3 4B with native tool calling
"""

TEST_PROMPTS = [
    "Read the file report.pdf and summarize it",
    "Search the knowledge base for pump maintenance procedures",
    "Write a Python script to calculate flow rate",
    "Create a Word document with an approval note for pump replacement",
    "Generate a spreadsheet comparing vendor quotes",
    "Create a presentation about Q3 safety audit results",
    "What does the maintenance manual say about bearing temperatures?",
    "Analyze this inspection report and draft a response",
    "Calculate the efficiency of pump P-101 given these parameters",
    "Write a summary of all open work orders",
]

@pytest.mark.asyncio
async def test_phi3_tool_calling():
    settings = Settings()
    client = OllamaClient(settings.ollama_base_url)
    model = "phi3.5:latest"  # Standard Ollama tag for Phi-3.5-mini
    
    try:
        models = await client.list_models()
        if not any(m.get('name') == model for m in models):
            pytest.skip(f"Model {model} not found in local Ollama.")
            
        system_prompt = build_system_prompt()
        
        success_count = 0
        
        for user_prompt in TEST_PROMPTS:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            response = await client.generate(model=model, messages=messages, temperature=0.0)
            text = response.get("message", {}).get("content", "")
            
            tool_call = parse_tool_call(text)
            if tool_call is not None:
                success_count += 1
                
        # We assert the criteria laid out in the RFC
        assert success_count >= 8, f"Phi-3.5-mini failed the Week 1 blocker. Only {success_count}/10 calls were parseable."
        
    except OllamaError as e:
        pytest.skip(f"Ollama is not running or unreachable: {e.message}")
    finally:
        await client.close()
