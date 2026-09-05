import pytest
from app.config import ModelRegistry
from app.agent.router import ModelRouter, RoutingDecision

@pytest.fixture
def registry():
    return ModelRegistry(yaml_path="../models.yaml")

@pytest.fixture
def router(registry):
    return ModelRouter(registry)

def test_router_initialization(router):
    assert router._vision_key == "vision"
    assert router._default_key == "document"
    assert router._keyword_model_key == "coder"
    assert router._keyword_pattern is not None

def test_router_image_attachment(router):
    decision = router.route(message="What is this?", file_extensions=[".png", ".txt"])
    assert decision.model_key == "vision"
    assert decision.reason == "Image attachment detected"
    assert decision.model_config.capability == "vision"

def test_router_keyword_match(router):
    decision = router.route(message="Can you write a python script for this?", file_extensions=[".txt"])
    assert decision.model_key == "coder"
    assert decision.reason.startswith("Code keyword detected:")
    assert decision.model_config.capability == "code"
    
    # Case insensitivity test
    decision_case = router.route(message="Write a PYTHON script")
    assert decision_case.model_key == "coder"
    assert decision_case.reason.startswith("Code keyword detected:")

def test_router_default_fallback(router):
    decision = router.route(message="Draft an approval note.")
    assert decision.model_key == "document"
    assert decision.reason == "General text task"
    assert decision.model_config.capability == "text"

def test_router_priority_image_over_keyword(router):
    # Image + code keyword -> should route to vision
    decision = router.route(message="Can you write a python script based on this diagram?", file_extensions=[".jpg"])
    assert decision.model_key == "vision"
    assert decision.reason == "Image attachment detected"

def test_router_override_priority(router):
    # Override + image + keyword -> should route to override
    decision = router.route(
        message="Can you write a python script based on this diagram?", 
        file_extensions=[".jpg"],
        model_override="document"
    )
    assert decision.model_key == "document"
    assert decision.reason == "Manual override: Document Drafter"

def test_router_invalid_override(router):
    # Invalid override falls back to normal priority
    decision = router.route(
        message="Can you write a python script?", 
        model_override="nonexistent"
    )
    assert decision.model_key == "coder"

def test_router_empty_message(router):
    decision = router.route(message="")
    assert decision.model_key == "document"
    assert decision.reason == "General text task"

def test_router_missing_default_raises_error(tmp_path):
    # Create a registry with no default routing rule
    yaml_content = """
models:
  coder:
    name: "Code Sandbox"
    ollama_tag: "qwen2.5-coder:7b"
    capability: "code"
    routing_rule: "keyword_match"
    keywords: ["python"]
"""
    yaml_file = tmp_path / "models.yaml"
    yaml_file.write_text(yaml_content)
    
    registry = ModelRegistry(yaml_path=str(yaml_file))
    with pytest.raises(ValueError, match="No model with routing_rule 'default' found in models.yaml"):
        ModelRouter(registry)
