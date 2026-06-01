"""
Crypto Intelligence Platform (CIP) - FastAPI Backend
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from api.routes import assets, alerts, risk_scores, research, compare, health
from core.config import settings
from core.database import create_tables
from etl.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("Starting Crypto Intelligence Platform...")
    await create_tables()
    start_scheduler()
    yield
    logger.info("Shutting down...")
    shutdown_scheduler()


app = FastAPI(
    title="Crypto Intelligence Platform API",
    description="AI-assisted market intelligence and risk monitoring for digital assets.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(assets.router, prefix="/assets", tags=["Assets"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
app.include_router(risk_scores.router, prefix="/risk-scores", tags=["Risk Scores"])
app.include_router(research.router, prefix="/research", tags=["Research"])
app.include_router(compare.router, prefix="/compare", tags=["Compare"])


@app.get("/")
async def root():
    return {
        "name": "Crypto Intelligence Platform",
        "version": "1.0.0",
        "docs": "/docs",
    }
