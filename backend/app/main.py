import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import CORS_ORIGINS
from backend.app.api import health, chat, knowledge, evaluation
from backend.app.services.knowledge_base import kb_service
from backend.app.services.retrieval import retrieval_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("campusiq")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing VIT CampusIQ Knowledge Base & Retrieval Index...")
    kb_service.load()
    retrieval_engine._build_index()
    logger.info(f"CampusIQ Engine Ready. Loaded {kb_service.count} entries.")
    yield

app = FastAPI(
    title="VIT CampusIQ Helpdesk API",
    description="Evidence-grounded campus AI helpdesk retrieval and assistant engine.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(knowledge.router)
app.include_router(evaluation.router)

@app.get("/")
def root():
    return {
        "service": "VIT CampusIQ Helpdesk API",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }
