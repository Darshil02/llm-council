"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()


# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members – list of OpenRouter model identifiers
COUNCIL_MODELS = [
    "llama3",
    "mistral",
    "qwen2",
]

# Chairman model – synthesizes final response
CHAIRMAN_MODEL = "llama3"

# OpenRouter API endpoint

#OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_URL = "http://127.0.0.1:11434/v1/chat/completions"
OPENROUTER_API_KEY = "local-testing"


# Data directory for conversation storage
DATA_DIR = "data/conversations"
