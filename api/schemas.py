"""
Module: schemas.py
Author: Atharva
Date: 2024
Description: Pydantic request/response schemas for all
             FastAPI endpoints with field validation.
Dependencies: pydantic
Usage: from api.schemas import PowerPredictionRequest
"""

from pydantic import BaseModel, Field
from typing import Optional


class PowerPredictionRequest(BaseModel):
    """Request schema for wind power prediction endpoint."""

    wind_speed: float = Field(
        ..., ge=0.0, le=20.0,
        description="Wind speed in m/s (0-20)"
    )
    temperature: float = Field(
        ..., ge=-20.0, le=50.0,
        description="Air temperature in Celsius (-20 to 50)"
    )
    pressure: float = Field(
        ..., ge=0.95, le=1.05,
        description="Atmospheric pressure in atm (0.95-1.05)"
    )


class PowerPredictionResponse(BaseModel):
    """Response schema for wind power prediction."""

    predicted_power_mw: float
    power_gen_1: float  # 20% of total
    power_gen_2: float  # 45% of total
    power_gen_3: float  # 35% of total
    confidence_lower: float
    confidence_upper: float
    air_density: float
    capacity_utilization_pct: float


class StabilityRequest(BaseModel):
    """Request schema for grid stability prediction."""

    c1: float = Field(..., description="Node 1 consumption")
    c2: float = Field(..., description="Node 2 consumption")
    c3: float = Field(..., description="Node 3 consumption")
    p1: float = Field(..., ge=0.0, le=1.0,
                      description="Node 1 price per unit")
    p2: float = Field(..., ge=0.0, le=1.0,
                      description="Node 2 price per unit")
    p3: float = Field(..., ge=0.0, le=1.0,
                      description="Node 3 price per unit")
    power_gen_1: float = Field(
        ..., description="Power at Node 1 (MW)"
    )
    power_gen_2: float = Field(
        ..., description="Power at Node 2 (MW)"
    )
    power_gen_3: float = Field(
        ..., description="Power at Node 3 (MW)"
    )


class StabilityResponse(BaseModel):
    """Response schema for grid stability prediction."""

    stability: str  # 'stable' or 'unstable'
    confidence: float
    stable_probability: float
    unstable_probability: float


class InsightsSummaryResponse(BaseModel):
    """Response schema for dashboard insights summary."""

    total_predicted_power_mw: float
    avg_hourly_power_mw: float
    stable_percentage: float
    unstable_percentage: float
    peak_instability_hour: int
    best_performing_node: str
    worst_performing_node: str
    january_stability_pct: float
    february_stability_pct: float
    march_stability_pct: float
    avg_wind_speed: float
    capacity_factor_pct: float


class NarrativeResponse(BaseModel):
    """Response schema for AI-generated narrative report."""

    narrative: str
    generated_at: str


class ChatRequest(BaseModel):
    """Request schema for conversational SQL agent."""

    message: str = Field(
        ..., min_length=1, max_length=500,
        description="User's natural language question"
    )
    conversation_history: list = Field(
        default=[],
        description="Previous messages for context"
    )


class ChatResponse(BaseModel):
    """Response schema for SQL agent chat."""

    response: str
    sql_query: Optional[str] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Response schema for health check endpoint."""

    status: str
    power_model_loaded: bool
    stability_model_loaded: bool
    database_connected: bool
    version: str