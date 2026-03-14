"""
Module: main.py
Author: Atharva
Date: 2024
Description: FastAPI application entry point. Handles app
             initialization, CORS, model loading at startup,
             and router registration.
Dependencies: fastapi, uvicorn, joblib, python-dotenv
Usage: uvicorn api.main:app --reload --port 8000
"""

import os
import joblib
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.routes import predict, stability, insights, chat
from api.schemas import HealthResponse

load_dotenv()

# ── Model paths ────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models" / "saved"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Loads ML models into app.state at startup.
    Cleans up on shutdown.

    Args:
        app (FastAPI): The FastAPI application instance.
    """
    # ── Startup ────────────────────────────────────────────
    print("🚀 Starting Smart Grid Optimizer API...")

    # Load power regression model
    power_model_path = MODEL_DIR / "power_model.joblib"
    if power_model_path.exists():
        app.state.power_model = joblib.load(power_model_path)
        print("✅ Power forecasting model loaded")
    else:
        app.state.power_model = None
        print(
            "⚠️  Power model not found. "
            "Run models/train_regression.py first."
        )

    # Load stability classification model
    stability_model_path = MODEL_DIR / "stability_model.joblib"
    if stability_model_path.exists():
        app.state.stability_model = joblib.load(
            stability_model_path
        )
        print("✅ Grid stability model loaded")
    else:
        app.state.stability_model = None
        print(
            "⚠️  Stability model not found. "
            "Run models/train_classifier.py first."
        )

    print("✅ API ready at http://localhost:8000")
    print("📖 Docs available at http://localhost:8000/docs")

    yield  # Application runs here

    # ── Shutdown ───────────────────────────────────────────
    print("🛑 Shutting down Smart Grid Optimizer API...")


# ── App initialization ─────────────────────────────────────
app = FastAPI(
    title="Smart Grid Optimizer API",
    description=(
        "AI-powered wind energy forecasting and grid "
        "stability prediction platform. "
        "Built with XGBoost, LangChain, and Groq LLaMA 3.3."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# ── CORS ───────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────
app.include_router(
    predict.router,
    prefix="/predict",
    tags=["predictions"]
)
app.include_router(
    stability.router,
    prefix="/predict",
    tags=["predictions"]
)
app.include_router(
    insights.router,
    prefix="/insights",
    tags=["insights"]
)
app.include_router(
    chat.router,
    tags=["chat"]
)


# ── Root endpoints ─────────────────────────────────────────
@app.get("/", tags=["root"])
async def root() -> dict:
    """
    Root endpoint returning project information.

    Returns:
        dict: Project name, version, and documentation link.
    """
    return {
        "project": "Smart Grid Optimizer",
        "version": "1.0.0",
        "author": "Atharva",
        "description": (
            "AI-powered wind energy forecasting "
            "& grid stability platform"
        ),
        "docs": "/docs",
        "github": "https://github.com/yourusername/"
                  "smart-grid-optimizer"
    }


@app.get("/health", response_model=HealthResponse,
         tags=["root"])
async def health_check() -> HealthResponse:
    """
    Health check endpoint for Docker and monitoring.

    Returns:
        HealthResponse: Status of API, models, and database.
    """
    from api.database import engine
    try:
        with engine.connect() as conn:
            db_ok = True
    except Exception:
        db_ok = False

    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        power_model_loaded=app.state.power_model is not None,
        stability_model_loaded=(
            app.state.stability_model is not None
        ),
        database_connected=db_ok,
        version="1.0.0"
    )