import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
KB_FILE_PATH = DATA_DIR / "knowledge_base.json"
EVAL_TESTS_FILE_PATH = DATA_DIR / "evaluation_tests.json"

# Retrieval Engine Configuration
MIN_EVIDENCE_THRESHOLD = 0.28       # Below this, abstain (insufficient_evidence)
MODERATE_EVIDENCE_THRESHOLD = 0.40  # 0.28 to 0.40 = weak, 0.40 to 0.65 = moderate
STRONG_EVIDENCE_THRESHOLD = 0.65    # >= 0.65 = strong
MAX_SOURCES_RETURNED = 3

# Query Constraints
MIN_QUERY_LENGTH = 2
MAX_QUERY_LENGTH = 500

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

# University Identity Guardrails
DISCLAIMER_TEXT = (
    "Responses are grounded in the synthetic demonstration knowledge base. "
    "Always verify official details with the respective university department."
)
