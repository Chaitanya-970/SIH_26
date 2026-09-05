# Citadel Workspace Rules

This document defines the coding standards, testing requirements, and architectural guidelines for the Citadel Workspace backend. These rules supersede any general AI implementation guidelines.

## 1. Code Style and Typing
*   **Python version:** The project targets Python 3.14.
*   **Type hints:** Use modern Python 3.10+ union syntax (`str | None`, `list[str]`) instead of importing `Optional` or `List` from the `typing` module.
*   **Strict typing:** All code must pass `mypy` without errors. Run `mypy .` locally before considering a feature complete.
*   **Explicit invariants:** If a variable is logically guaranteed not to be `None` (e.g., after an `__init__` check), use `assert var is not None` to inform the type checker, rather than suppressing the error or using a runtime `if` check without a comment.

## 2. Defensive Programming and Error Handling
*   **Fail fast on startup:** Configuration errors (like missing defaults in `models.yaml`) must raise a `ValueError` immediately at startup (e.g., in `__init__`), rather than waiting for a request to fail.
*   **Graceful fallbacks:** Non-critical errors during request processing (e.g., an invalid model override key) should log a warning using the standard `logging` module and fall back to a safe default. Do not swallow exceptions silently.
*   **Comment unreachable code:** If a defensive check is technically unreachable under normal operation but required for type safety or extreme edge cases, comment it as such.
*   **Empty strings as "falsy":** Treat empty strings as missing values. Document this explicitly when it affects control flow (e.g., `if model_override:` meaning "if provided and not empty").

## 3. Testing Standards
*   **Framework:** Use `pytest` for all testing.
*   **Coverage:** 
    *   Test both the happy path and all error/fallback paths.
    *   Tests that assert on text matching should avoid being overly brittle (e.g., use `.startswith()` instead of `==` for log messages that might change slightly).
    *   If a function raises an error at startup, there must be a `pytest.raises` test for it.
*   **Integration tests:** FastAPI endpoints must be tested using `TestClient` within a context manager (`with TestClient(app):`) to ensure the `lifespan` events trigger correctly. Do not instantiate `TestClient(app)` at the module level.
*   **Case insensitivity:** When testing regex or keyword matching, always include a test case that verifies case insensitivity.

## 4. Documentation and Comments
*   **No AI tells:** Write plain, natural code comments. Do not use AI vocabulary ("crucial", "delve", "intricate"). Do not use stylized separators (`// ===== SECTION =====`).
*   **Explain why, not what:** Do not comment obvious code. Only comment to explain the reasoning behind a non-obvious decision or workaround.
*   **Workarounds:** If a workaround is necessary, flag it with `WORKAROUND: [explanation]` and explain the trade-offs and how to fix it later.

## 5. Security and Architecture
*   **Local-first and air-gapped:** No external API calls are permitted anywhere in the codebase. All models run locally via Ollama.
*   **No database bloat:** State should be kept minimal. Routing and tool configurations are driven by flat files (`models.yaml`) loaded at startup.
