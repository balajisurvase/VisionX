import os
import json
import logging
from typing import Optional, Dict, Any
from backend.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

_genai_client = None

def get_gemini_client():
    """Returns an initialized Google GenAI client if GEMINI_API_KEY is available."""
    global _genai_client
    if _genai_client is not None:
        return _genai_client
    
    api_key = GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if api_key:
        try:
            from google import genai
            _genai_client = genai.Client(api_key=api_key)
            return _genai_client
        except Exception as e:
            logger.error(f"Failed to initialize Google GenAI client: {e}")
            return None
    return None

def is_gemini_available() -> bool:
    """Checks if Gemini API client can be initialized with a key."""
    return get_gemini_client() is not None
