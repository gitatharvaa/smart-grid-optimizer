"""
Module: train_regression.py
Author: Atharva
Date: 2024
Description: Trains XGBoost regression model for wind power forecasting.
             Runs 3 MLflow experiments: persistence baseline, linear regression,
             and final XGBoost model with SHAP explainability.
Dependencies: xgboost, scikit-learn, mlflow, shap, pandas, joblib
Usage: python models/train_regression.py
"""

import os
import warnings
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import mlflow
import mlflow.xgboost
import mlflow.sklearn
import shap
from pathlib import Path
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from xgboost import XGBRegressor
from dotenv import load_dotenv

from models.evaluate import (
    calculate_regression_metrics,
    plot_shap_summary,
    plot_feature_importance
)

warnings.filterwarnings("ignore")
load_dotenv()

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "processed"
SAVE_DIR = BASE_DIR / "models" / "saved"
SAVE_DIR.mkdir(parents=True, exist_ok=True)

MLFLOW_URI = os.getenv("MLFLOW_TRACKING_URI", "./mlruns")
mlflow.set_tracking_uri(MLFLOW_URI)

FEATURES = [
    "wind_speed", "temperature", "pressure",
    "air_density", "hour", "month", "season"
]
TARGET = "power_mw"


def load_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load wind training and validation data from processed CSVs.

    Returns:
        tuple: (train_df, val_df) as pandas DataFrames.

    Raises:
        FileNotFoundError: If processed CSV files don't exist.

    Example:
        >>> train_df, val_df = load_data()
        >>> print(train_df.shape)
    """
    train_path = DATA_DIR / "wind_train.csv"
    val_path = DATA_DIR / "wind_validation.csv"

    if not train_path.exists():
        raise FileNotFoundError(
            f"Training data not found at {train_path}. "
            "Run etl/merge_wind_data.py first."
        )

    train_df = pd.read_csv(train_path, parse_dates=["datetime"])
    val_df = pd.read_csv(val_path, parse_dates=["datetime"])

    print(f"✅ Training data loaded: {train_df.shape}")
    print(f"✅ Validation data loaded: {val_df.shape}")
    return train_df, val_df


def run_persistence_baseline(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame
) -> dict:
    """
    Run persistence baseline: predict next hour = current hour.

    Args:
        train_df (pd.DataFrame): Training dataset.
        val_df (pd.DataFrame): Validation dataset.

    Returns:
        dict: Regression metrics (RMSE, MAE, R²).
    """
    print("\n📊 Running: Persistence Baseline...")

    # Shift validation target by 1 hour
    y_true = val_df[TARGET].values[1:]
    y_pred = val_df[TARGET].values[:-1]

    metrics = calculate_regression_metrics(y_true, y_pred)

    with mlflow.start_run(run_name="persistence_baseline"):
        mlflow.set_tag("model_type", "baseline")
        mlflow.log_metric("rmse", metrics["rmse"])
        mlflow.log_metric("mae", metrics["mae"])
        mlflow.log_metric("r2", metrics["r2"])

    print(f"   RMSE: {metrics['rmse']:.3f} MW")
    print(f"   MAE:  {metrics['mae']:.3f} MW")
    print(f"   R²:   {metrics['r2']:.3f}")
    return metrics


def run_linear_regression(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame
) -> dict:
    """
    Train and evaluate a Linear Regression baseline model.

    Args:
        train_df (pd.DataFrame): Training dataset.
        val_df (pd.DataFrame): Validation dataset.

    Returns:
        dict: Regression metrics on validation set.
    """
    print("\n📊 Running: Linear Regression Baseline...")

    X_train = train_df[FEATURES].values
    y_train = train_df[TARGET].values
    X_val = val_df[FEATURES].values
    y_val = val_df[TARGET].values

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", LinearRegression())
    ])

    # TimeSeriesSplit cross-validation
    tscv = TimeSeriesSplit(n_splits=5)
    cv_scores = cross_val_score(
        pipeline, X_train, y_train,
        cv=tscv, scoring="neg_root_mean_squared_error"
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_val)
    metrics = calculate_regression_metrics(y_val, y_pred)

    with mlflow.start_run(run_name="linear_regression_baseline"):
        mlflow.set_tag("model_type", "linear_regression")
        mlflow.log_param("n_features", len(FEATURES))
        mlflow.log_metric("rmse", metrics["rmse"])
        mlflow.log_metric("mae", metrics["mae"])
        mlflow.log_metric("r2", metrics["r2"])
        mlflow.log_metric(
            "cv_rmse_mean", float(-cv_scores.mean())
        )
        mlflow.sklearn.log_model(pipeline, "linear_model")

    print(f"   RMSE: {metrics['rmse']:.3f} MW")
    print(f"   MAE:  {metrics['mae']:.3f} MW")
    print(f"   R²:   {metrics['r2']:.3f}")
    return metrics


def run_xgboost_final(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame
) -> tuple[XGBRegressor, dict]:
    """
    Train final XGBoost model with full MLflow tracking and SHAP.

    Args:
        train_df (pd.DataFrame): Training dataset.
        val_df (pd.DataFrame): Validation dataset.

    Returns:
        tuple: (trained_model, metrics_dict)
    """
    print("\n📊 Running: XGBoost Final Model...")

    X_train = train_df[FEATURES].values
    y_train = train_df[TARGET].values
    X_val = val_df[FEATURES].values
    y_val = val_df[TARGET].values

    params = {
        "n_estimators": 400,
        "learning_rate": 0.05,
        "max_depth": 5,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "random_state": 42,
        "early_stopping_rounds": 50,
        "eval_metric": "rmse",
        "tree_method": "hist"
    }

    tscv = TimeSeriesSplit(n_splits=5)
    cv_rmse_scores = []

    # Cross-validation loop
    for fold, (train_idx, val_idx) in enumerate(
        tscv.split(X_train), 1
    ):
        X_fold_train = X_train[train_idx]
        y_fold_train = y_train[train_idx]
        X_fold_val = X_train[val_idx]
        y_fold_val = y_train[val_idx]

        fold_model = XGBRegressor(**params)
        fold_model.fit(
            X_fold_train, y_fold_train,
            eval_set=[(X_fold_val, y_fold_val)],
            verbose=False
        )
        fold_pred = fold_model.predict(X_fold_val)
        fold_metrics = calculate_regression_metrics(
            y_fold_val, fold_pred
        )
        cv_rmse_scores.append(fold_metrics["rmse"])
        print(f"   Fold {fold} RMSE: {fold_metrics['rmse']:.3f}")

    # Train final model on all training data
    final_model = XGBRegressor(**params)
    final_model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    y_pred = final_model.predict(X_val)
    metrics = calculate_regression_metrics(y_val, y_pred)

    with mlflow.start_run(run_name="xgboost_final"):
        # Log all parameters
        for key, val in params.items():
            mlflow.log_param(key, val)
        mlflow.log_param("features", FEATURES)
        mlflow.set_tag("model_type", "xgboost")
        mlflow.set_tag("feature_engineering", "air_density")

        # Log metrics
        mlflow.log_metric("rmse", metrics["rmse"])
        mlflow.log_metric("mae", metrics["mae"])
        mlflow.log_metric("r2", metrics["r2"])
        mlflow.log_metric(
            "cv_rmse_mean", float(np.mean(cv_rmse_scores))
        )
        mlflow.log_metric(
            "cv_rmse_std", float(np.std(cv_rmse_scores))
        )

        # Generate SHAP values
        print("   Generating SHAP values...")
        explainer = shap.TreeExplainer(final_model)
        shap_values = explainer.shap_values(X_val[:500])

        # Save SHAP plot
        shap_plot_path = SAVE_DIR / "shap_regression.png"
        plot_shap_summary(
            shap_values, pd.DataFrame(X_val[:500], columns=FEATURES),
            str(shap_plot_path)
        )
        mlflow.log_artifact(str(shap_plot_path))

        # Save feature importance plot
        fi_plot_path = SAVE_DIR / "feature_importance_regression.png"
        plot_feature_importance(
            final_model, FEATURES, str(fi_plot_path)
        )
        mlflow.log_artifact(str(fi_plot_path))

        # Log model
        mlflow.xgboost.log_model(final_model, "xgboost_model")

    # Save model file for API use
    model_path = SAVE_DIR / "power_model.joblib"
    joblib.dump(final_model, model_path)
    print(f"   ✅ Model saved: {model_path}")
    print(f"   RMSE: {metrics['rmse']:.3f} MW")
    print(f"   MAE:  {metrics['mae']:.3f} MW")
    print(f"   R²:   {metrics['r2']:.3f}")

    return final_model, metrics


def print_comparison_table(
    baseline: dict,
    linear: dict,
    xgboost: dict
) -> None:
    """
    Print formatted comparison table of all model results.

    Args:
        baseline (dict): Persistence baseline metrics.
        linear (dict): Linear regression metrics.
        xgboost (dict): XGBoost final model metrics.
    """
    print("\n" + "═" * 60)
    print("  MODEL COMPARISON — WIND POWER FORECASTING")
    print("═" * 60)
    print(
        f"  {'Model':<30} {'RMSE':>8} {'MAE':>8} {'R²':>8}"
    )
    print("─" * 60)
    print(
        f"  {'Persistence Baseline':<30} "
        f"{baseline['rmse']:>7.3f} "
        f"{baseline['mae']:>7.3f} "
        f"{baseline['r2']:>7.3f}"
    )
    print(
        f"  {'Linear Regression':<30} "
        f"{linear['rmse']:>7.3f} "
        f"{linear['mae']:>7.3f} "
        f"{linear['r2']:>7.3f}"
    )
    print(
        f"  {'XGBoost Final ← BEST':<30} "
        f"{xgboost['rmse']:>7.3f} "
        f"{xgboost['mae']:>7.3f} "
        f"{xgboost['r2']:>7.3f}"
    )
    print("═" * 60)
    improvement = (
        (baseline["rmse"] - xgboost["rmse"])
        / baseline["rmse"] * 100
    )
    print(
        f"  XGBoost is {improvement:.1f}% better than "
        f"persistence baseline on RMSE"
    )
    print("═" * 60 + "\n")


def main() -> None:
    """
    Main training pipeline. Runs all 3 experiments sequentially.
    """
    print("\n🚀 Starting Wind Power Forecasting Training Pipeline")
    print("=" * 60)

    mlflow.set_experiment("wind-power-forecasting")

    # Load data
    train_df, val_df = load_data()

    # Run experiments
    baseline_metrics = run_persistence_baseline(train_df, val_df)
    linear_metrics = run_linear_regression(train_df, val_df)
    _, xgb_metrics = run_xgboost_final(train_df, val_df)

    # Print comparison
    print_comparison_table(
        baseline_metrics, linear_metrics, xgb_metrics
    )

    print("✅ Training complete!")
    print("   Run 'mlflow ui' to view experiment results")
    print(
        f"   Model saved at: models/saved/power_model.joblib"
    )


if __name__ == "__main__":
    main()