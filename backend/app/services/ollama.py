import httpx
import json
from typing import AsyncGenerator, List, Dict, Optional

class OllamaError(Exception):
    def __init__(self, message: str, status_code: int = 500, retryable: bool = True):
        self.message = message
        self.status_code = status_code
        self.retryable = retryable
        super().__init__(self.message)

class OllamaClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=120.0)

    async def _handle_response_error(self, response: httpx.Response):
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            # 500 implies internal error (like OOM), usually retryable
            retryable = response.status_code >= 500
            error_msg = response.text
            try:
                err_json = response.json()
                error_msg = err_json.get("error", response.text)
            except ValueError:
                pass
            raise OllamaError(
                message=f"Ollama API Error: {error_msg}",
                status_code=response.status_code,
                retryable=retryable
            ) from e

    async def generate_stream(
        self, model: str, prompt: str, system: str = "",
        images: Optional[List[str]] = None, num_ctx: int = 4096
    ) -> AsyncGenerator[str, None]:
        """Yields raw text tokens as they arrive from Ollama."""
        payload = {
            "model": model,
            "prompt": prompt,
            "system": system,
            "stream": True,
            "options": {"num_ctx": num_ctx},
        }
        if images:
            payload["images"] = images

        try:
            async with self._client.stream(
                "POST", f"{self.base_url}/api/generate", json=payload
            ) as response:
                await self._handle_response_error(response)
                async for line in response.aiter_lines():
                    if line:
                        chunk = json.loads(line)
                        if chunk.get("response"):
                            yield chunk["response"]
                        if chunk.get("done"):
                            return
        except httpx.RequestError as e:
            raise OllamaError(
                message=f"Could not connect to Ollama: {str(e)}",
                status_code=503,
                retryable=True
            ) from e

    async def generate(
        self, model: str, prompt: str, system: str = "",
        images: Optional[List[str]] = None, num_ctx: int = 4096
    ) -> str:
        """Non-streaming: returns the complete response text."""
        payload = {
            "model": model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {"num_ctx": num_ctx},
        }
        if images:
            payload["images"] = images

        try:
            resp = await self._client.post(
                f"{self.base_url}/api/generate", json=payload
            )
            await self._handle_response_error(resp)
            data = resp.json()
            if "response" not in data:
                raise OllamaError(f"Unexpected Ollama response shape: {data}", status_code=500, retryable=False)
            return data["response"]
        except httpx.RequestError as e:
            raise OllamaError(
                message=f"Could not connect to Ollama: {str(e)}",
                status_code=503,
                retryable=True
            ) from e

    async def chat_stream(
        self, model: str, messages: List[Dict],
        num_ctx: int = 4096
    ) -> AsyncGenerator[str, None]:
        """Yields tokens using Ollama's /api/chat endpoint (conversation mode)."""
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {"num_ctx": num_ctx},
        }
        try:
            async with self._client.stream(
                "POST", f"{self.base_url}/api/chat", json=payload
            ) as response:
                await self._handle_response_error(response)
                async for line in response.aiter_lines():
                    if line:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
                        if chunk.get("done"):
                            return
        except httpx.RequestError as e:
            raise OllamaError(
                message=f"Could not connect to Ollama: {str(e)}",
                status_code=503,
                retryable=True
            ) from e

    async def chat(
        self, model: str, messages: List[Dict], num_ctx: int = 4096
    ) -> str:
        """Non-streaming chat: returns complete assistant message."""
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"num_ctx": num_ctx},
        }
        try:
            resp = await self._client.post(
                f"{self.base_url}/api/chat", json=payload
            )
            await self._handle_response_error(resp)
            data = resp.json()
            try:
                return data["message"]["content"]
            except (KeyError, TypeError):
                raise OllamaError(f"Unexpected Ollama chat response: {data}", status_code=500, retryable=False)
        except httpx.RequestError as e:
            raise OllamaError(
                message=f"Could not connect to Ollama: {str(e)}",
                status_code=503,
                retryable=True
            ) from e

    async def embed(self, model: str, text: str) -> List[float]:
        """Generate embeddings for a single text string."""
        try:
            resp = await self._client.post(
                f"{self.base_url}/api/embed",
                json={"model": model, "input": text}
            )
            await self._handle_response_error(resp)
            return resp.json()["embeddings"][0]
        except httpx.RequestError as e:
            raise OllamaError(
                message=f"Could not connect to Ollama: {str(e)}",
                status_code=503,
                retryable=True
            ) from e

    async def list_models(self) -> List[str]:
        """List models currently available in Ollama."""
        try:
            resp = await self._client.get(f"{self.base_url}/api/tags")
            await self._handle_response_error(resp)
            return [m["name"] for m in resp.json().get("models", [])]
        except httpx.RequestError as e:
            raise OllamaError(
                message=f"Could not connect to Ollama: {str(e)}",
                status_code=503,
                retryable=True
            ) from e

    async def close(self):
        await self._client.aclose()
