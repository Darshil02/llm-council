"""OpenRouter API client for making LLM requests (improved version)."""

import time
import httpx
from typing import List, Dict, Any, Optional
from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL


async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float = 120.0
) -> Dict[str, Any]:
    """
    Query a single model via OpenRouter API OR Ollama (auto-detect).
    """

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "llm-council-local",
    }

    payload = {
        "model": model,
        "messages": messages,
    }

    # Ollama streams by default; we want a single JSON object instead
    if "openrouter.ai" not in OPENROUTER_API_URL:
        payload["stream"] = False

    start_time = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            )

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        response.raise_for_status()

        data = response.json()

        # OpenRouter vs Ollama formats
        if "choices" in data:
            # OpenRouter format
            message = data["choices"][0]["message"]
        else:
            # Ollama format
            message = data.get("message", {})

        content = message.get("content", "")

        return {
            "model": model,
            "content": content,
            "reasoning_details": message.get("reasoning_details"),
            "time_ms": elapsed_ms,
            "status": "success",
            "error": None,
        }

    except Exception as e:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        print(f"[LLM ERROR] {model} failed after {elapsed_ms} ms: {e}")

        return {
            "model": model,
            "content": "",
            "reasoning_details": None,
            "time_ms": elapsed_ms,
            "status": "error",
            "error": str(e),
        }



async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, str]]
) -> Dict[str, Dict[str, Any]]:
    """
    Query multiple models in parallel.
    Returns dict: { modelName: structuredResult }
    """
    import asyncio

    tasks = [query_model(model, messages) for model in models]
    responses = await asyncio.gather(*tasks)

    return {model: result for model, result in zip(models, responses)}
