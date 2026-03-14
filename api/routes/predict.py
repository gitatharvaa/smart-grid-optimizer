"""
Module: predict.py
Author: Atharva
Date: 2024
Description: FastAPI route for wind power generation prediction.
             Accepts weather inputs, runs XGBoost model,
             returns MW prediction with node distribution.
Dependencies: fastapi, numpy, sqlalchemy
Usage: POST /predict/power
"""

import numpy as np
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session

from api.schemas import (
    PowerPredictionRequest,
    PowerPredictionResponse
)
from api.database import get_db

router = APIRouter()

# Max rated capacity of wind farm in MW
MAX_CAPACITY_MW = 60.0


def compute_air_density(
    pressure: float,
    temperature: float
) -> float:
    """
    Compute air density using the ideal gas law.

    Formula: rho = (P * 101325) / (R * T_kelvin)
    where R = 287.05 J/(kg·K) for dry air.

    Args:
        pressure (float): Atmospheric pressure in atm.
        temperature (float): Air temperature in Celsius.

    Returns:
        float: Air density in kg/m³.

    Example:
        >>> compute_air_density(0.982, 15.0)
        1.189
    """
    pressure_pa = pressure * 101325  # Convert atm to Pascals
    temp_kelvin = temperature + 273.15
    R_dry_air = 287.05  # J/(kg·K)
    return pressure_pa / (R_dry_air * temp_kelvin)


@router.post("/power", response_model=PowerPredictionResponse)
async def predict_power(
    request: Request,
    data: PowerPredictionRequest,
    db: Session = Depends(get_db)
) -> PowerPredictionResponse:
    """
    Predict wind power generation from weather inputs.

    Takes wind speed, temperature and pressure, engineers
    additional features, runs the XGBoost regression model,
    calculates node power distribution (20/45/35%), and
    saves the prediction to the database.

    Args:
        request (Request): FastAPI request with app.state.
        data (PowerPredictionRequest): Weather input features.
        db (Session): Database session dependency.

    Returns:
        PowerPredictionResponse: Predicted power and node splits.

    Raises:
        HTTPException 503: If model is not loaded.
        HTTPException 500: If prediction fails unexpectedly.
    """
    if request.app.state.power_model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Power model not loaded. "
                "Run models/train_regression.py first."
            )
        )

    try:
        # Feature engineering
        now = datetime.now()
        air_density = compute_air_density(
            data.pressure, data.temperature
        )
        hour = now.hour
        month = now.month

        # Season: 1=Winter, 2=Spring, 3=Summer, 4=Autumn
        season_map = {
            12: 1, 1: 1, 2: 1,  # Winter
            3: 2, 4: 2, 5: 2,   # Spring
            6: 3, 7: 3, 8: 3,   # Summer
            9: 4, 10: 4, 11: 4  # Autumn
        }
        season = season_map.get(month, 1)

        # Build feature array in training order
        features = np.array([[
            data.wind_speed,
            data.temperature,
            data.pressure,
            air_density,
            hour,
            month,
            season
        ]])

        # Model prediction
        predicted_power = float(
            request.app.state.power_model.predict(features)[0]
        )
        # Clip to valid range [0, MAX_CAPACITY_MW]
        predicted_power = max(
            0.0, min(predicted_power, MAX_CAPACITY_MW)
        )

        # Confidence interval (±15% approximation)
        confidence_lower = max(0.0, predicted_power * 0.85)
        confidence_upper = min(
            MAX_CAPACITY_MW, predicted_power * 1.15
        )

        # Node power distribution
        power_gen_1 = round(predicted_power * 0.20, 4)
        power_gen_2 = round(predicted_power * 0.45, 4)
        power_gen_3 = round(predicted_power * 0.35, 4)

        capacity_pct = (predicted_power / MAX_CAPACITY_MW) * 100

        # Save to predictions table
        try:
            db.execute(
                """INSERT INTO predictions
                   (datetime, wind_speed, temperature,
                    pressure, predicted_power_mw,
                    power_gen_1, power_gen_2, power_gen_3,
                    created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    now.isoformat(),
                    data.wind_speed,
                    data.temperature,
                    data.pressure,
                    predicted_power,
                    power_gen_1,
                    power_gen_2,
                    power_gen_3,
                    now.isoformat()
                )
            )
            db.commit()
        except Exception:
            # Non-critical: don't fail prediction if save fails
            pass

        return PowerPredictionResponse(
            predicted_power_mw=round(predicted_power, 4),
            power_gen_1=power_gen_1,
            power_gen_2=power_gen_2,
            power_gen_3=power_gen_3,
            confidence_lower=round(confidence_lower, 4),
            confidence_upper=round(confidence_upper, 4),
            air_density=round(air_density, 4),
            capacity_utilization_pct=round(capacity_pct, 2)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )