import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.agent.router import ModelRouter

def test_get_models_api():
    # main.py lifespan runs during TestClient requests if setup correctly, 
    # but we can use TestClient with context manager to ensure lifespan runs
    with TestClient(app) as client:
        response = client.get("/api/models")
        assert response.status_code == 200
        
        data = response.json()
        assert "models" in data
        assert "default" in data
        assert data["default"] == "auto"
        
        models = data["models"]
        assert len(models) == 3 # vision, coder, document (excludes embedding)
        
        keys = [m["key"] for m in models]
        assert "vision" in keys
        assert "coder" in keys
        assert "document" in keys
        assert "embedding" not in keys
        
        # Verify structure
        for m in models:
            assert "key" in m
            assert "name" in m
            assert "capability" in m

def test_model_router_in_app_state():
    with TestClient(app):
        assert hasattr(app.state, "model_router")
        assert isinstance(app.state.model_router, ModelRouter)
