"""
Module: stability.py
Author: Atharva
Date: 2024
Description: FastAPI route for grid stability classification.
             Takes node consumption, prices, and power values,
             returns stable/unstable prediction with confidence.
Dependencies: fastapi, numpy
Usage: POST /predict/stability
"""

import numpy as np
from fastapi import APIRouter, HTTPException, Request

from api.schemas import StabilityRequest, StabilityResponse

router = APIRouter()


@router.post(
    "/stability",
    response_model=StabilityResponse
)
async def predict_stability(
    request: Request,
    data: StabilityRequest
) -> StabilityResponse:
    """
    Predict grid stability from consumption and power data.

    Args:
        request (Request): FastAPI request with app.state.
        data (StabilityRequest): Node consumption, prices,
                                  and power generation values.

    Returns:
        StabilityResponse: Stability label with probabilities.

    Raises:
        HTTPException 503: If stability model not loaded.
        HTTPException 500: If prediction fails.
    """
    if request.app.state.stability_model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Stability model not loaded. "
                "Run models/train_classifier.py first."
            )
        )

    try:
        # Build feature array in training order
        features = np.array([[
            data.c1, data.c2, data.c3,
            data.p1, data.p2, data.p3,
            data.power_gen_1,
            data.power_gen_2,
            data.power_gen_3
        ]])

        # Classification prediction
        y_pred = int(
            request.app.state.stability_model.predict(
                features
            )[0]
        )
        y_proba = (
            request.app.state.stability_model
            .predict_proba(features)[0]
        )

        # 1 = stable, 0 = unstable
        stable_prob = float(y_proba[1])
        unstable_prob = float(y_proba[0])
        stability_label = "stable" if y_pred == 1 else "unstable"
        confidence = max(stable_prob, unstable_prob)

        return StabilityResponse(
            stability=stability_label,
            confidence=round(confidence, 4),
            stable_probability=round(stable_prob, 4),
            unstable_probability=round(unstable_prob, 4)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Stability prediction failed: {str(e)}"
        )