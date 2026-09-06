import yaml
from pathlib import Path
from typing import List, Dict, Optional, Literal
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    data_dir: str = "./data"
    sessions_dir: str = "./data/sessions"
    kb_dir: str = "./data/kb"
    chroma_dir: str = "./data/chroma"
    max_file_size_mb: int = 50
    max_agent_steps: int = 8
    sandbox_timeout_seconds: int = 15
    debug: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

class ModelConfig(BaseModel):
    name: str
    ollama_tag: str
    capability: Literal["vision", "code", "text", "embedding"]
    routing_rule: Optional[str] = None  # "has_image_attachment" | "keyword_match" | "default"
    keywords: List[str] = []
    num_ctx: int = 4096
    native_tools: bool = False  # future flag per PRD Section 8.2

class ModelRegistry:
    def __init__(self, yaml_path: str | None = None):
        if yaml_path is None:
            # Support both local runs from backend/ and the /app Docker mount.
            candidates = (Path("../models.yaml"), Path("/app/models.yaml"))
            path = next((candidate for candidate in candidates if candidate.exists()), candidates[0])
        else:
            path = Path(yaml_path)
        if not path.exists():
            raise FileNotFoundError(f"models.yaml not found at {path.resolve()}")
        
        try:
            raw = yaml.safe_load(path.read_text())
        except yaml.YAMLError as e:
            raise ValueError(f"Failed to parse models.yaml: {e}")

        if "models" not in raw:
            raise ValueError("models.yaml must contain a 'models' key")

        self.models: Dict[str, ModelConfig] = {}
        seen: Dict[str, str] = {}
        for key, val in raw["models"].items():
            model = ModelConfig(**val)
            if model.capability in seen and model.capability != "embedding":
                raise ValueError(
                    f"Duplicate capability '{model.capability}' on keys "
                    f"'{seen[model.capability]}' and '{key}'"
                )
            seen[model.capability] = key
            self.models[key] = model

    def get_by_capability(self, capability: str) -> Optional[ModelConfig]:
        for model in self.models.values():
            if model.capability == capability:
                return model
        return None

    def get_by_key(self, key: str) -> Optional[ModelConfig]:
        return self.models.get(key)

    def list_for_ui(self) -> List[dict]:
        """Returns model info for the /api/models endpoint."""
        return [
            {"key": k, "name": v.name, "capability": v.capability}
            for k, v in self.models.items()
            if v.capability != "embedding"
        ]
