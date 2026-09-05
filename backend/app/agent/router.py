import re
import logging
from dataclasses import dataclass

from app.config import ModelConfig, ModelRegistry

logger = logging.getLogger(__name__)

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}

@dataclass
class RoutingDecision:
    model_key: str       # e.g., "vision", "coder", "document"
    model_config: ModelConfig
    reason: str          # human-readable routing reason for F-12

class ModelRouter:
    def __init__(self, registry: ModelRegistry):
        self.registry = registry
        self._keyword_model: ModelConfig | None = None
        self._keyword_model_key: str | None = None
        self._keyword_pattern: re.Pattern | None = None
        self._vision_key: str | None = None
        self._default_key: str | None = None

        # Pre-compile routing structures at init time
        for key, model in registry.models.items():
            if model.routing_rule == "keyword_match" and model.keywords:
                self._keyword_model = model
                self._keyword_model_key = key
                escaped = [re.escape(kw) for kw in model.keywords]
                self._keyword_pattern = re.compile(
                    r'\b(' + '|'.join(escaped) + r')\b', re.IGNORECASE
                )
            elif model.routing_rule == "has_image_attachment":
                self._vision_key = key
            elif model.routing_rule == "default":
                self._default_key = key

        if not self._default_key:
            raise ValueError("No model with routing_rule 'default' found in models.yaml")

    def route(
        self,
        message: str,
        file_extensions: list[str] | None = None,
        model_override: str | None = None,
    ) -> RoutingDecision:
        # 1. User override
        # Note: empty string is intentionally treated as "no override"
        if model_override:
            config = self.registry.get_by_key(model_override)
            if config:
                return RoutingDecision(
                    model_key=model_override,
                    model_config=config,
                    reason=f"Manual override: {config.name}"
                )
            else:
                logger.warning(f"Override key '{model_override}' not found in registry, falling through to auto-detect")

        # 2. Image attachment
        if file_extensions:
            has_image = any(
                ext.lower() in IMAGE_EXTENSIONS for ext in file_extensions
            )
            if has_image and self._vision_key:
                config = self.registry.get_by_key(self._vision_key)
                if config:
                    return RoutingDecision(
                        model_key=self._vision_key,
                        model_config=config,
                        reason="Image attachment detected"
                    )

        # 3. Keyword match
        if self._keyword_pattern and self._keyword_model and self._keyword_model_key:
            match = self._keyword_pattern.search(message)
            if match:
                return RoutingDecision(
                    model_key=self._keyword_model_key,
                    model_config=self._keyword_model,
                    reason=f"Code keyword detected: '{match.group()}'"
                )

        # 4. Default
        # We checked in __init__ that _default_key is present.
        assert self._default_key is not None
        config = self.registry.get_by_key(self._default_key)
        # Unreachable under normal operation since default model was verified in __init__
        if config is None:
            raise ValueError("Default model config missing from registry")
            
        return RoutingDecision(
            model_key=self._default_key,
            model_config=config,
            reason="General text task"
        )
