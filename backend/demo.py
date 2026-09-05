"""Quick smoke test: POST /api/chat with a real LLM query."""
import httpx
import asyncio


async def test_chat():
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream(
            "POST",
            "http://localhost:8000/api/chat",
            json={"message": "What is 2 + 2? Answer in one short line."},
            headers={"Accept": "text/event-stream"},
        ) as resp:
            print(f"Status: {resp.status_code}")
            ct = resp.headers.get("content-type", "unknown")
            print(f"Content-Type: {ct}")
            print("--- SSE STREAM ---")
            async for line in resp.aiter_lines():
                print(line)


if __name__ == "__main__":
    asyncio.run(test_chat())
