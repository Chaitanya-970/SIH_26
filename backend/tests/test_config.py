import pytest
from app.config import ModelRegistry, Settings
from pathlib import Path

def test_settings_loaded():
    settings = Settings()
    assert settings.ollama_base_url is not None
    assert settings.max_agent_steps == 8

def test_model_registry_loads_real_yaml():
    # Resolves to ../models.yaml from backend/
    registry = ModelRegistry(yaml_path="../models.yaml")
    assert len(registry.models) > 0
    
    vision_model = registry.get_by_capability("vision")
    assert vision_model is not None
    assert vision_model.capability == "vision"
    
    embed_model = registry.get_by_capability("embedding")
    assert embed_model is not None
    assert embed_model.ollama_tag == "nomic-embed-text"
    
    ui_list = registry.list_for_ui()
    assert len(ui_list) > 0
    # Embedding model should not be in UI list
    assert not any(m["capability"] == "embedding" for m in ui_list)
