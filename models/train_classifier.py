"""
Module: train_classifier.py
Author: Atharva
Date: 2024
Description: Trains XGBoost classifier for grid stability prediction.
             Runs 3 MLflow experiments handling class imbalance.
             Uses predicted power from regression model as features.
Dependencies: xgboost, scikit-learn, mlflow, shap, pandas, joblib
Usage: python models/train_classifier.py
"""

import os
import warnings
import joblib
import numpy as np
import pandas as pd
import mlflow
import mlflow.xgboost
import mlflow.sklearn
import shap
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import TimeSeriesSplit
from xgboost import XGBClassifier
from dotenv import load_dotenv

from models.evaluate import (
    calculate_classification_metrics,
    plot_confusion_matrix,
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

# Class imbalance ratio: unstable(29357) / stable(16650)
CLASS_WEIGHT_RATIO = 29357 / 16650

FEATURES = [
    "c1", "c2", "c3",
    "p1", "p2", "p3",
    "power_gen_1", "power_gen_2", "power_gen_3"
]
TARGET = "stability_encoded"


def load_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load grid training and validation data, add predicted power features.

    Returns:
        tuple: (train_df, val_df) with power_gen columns added.

    Raises:
        FileNotFoundError: If processed files or power model missing.
    """
    train_path = DATA_DIR / "grid_train.csv"
    val_path = DATA_DIR / "grid_validation.csv"
    wind_val_path = DATA_DIR / "wind_validation.csv"
    model_path = SAVE_DIR / "power_model.joblib"

    if not train_path.exists():
        raise FileNotFoundError(
            "Grid training data not found. "
            "Run etl/merge_grid_data.py first."
        )
    if not model_path.exists():
        raise FileNotFoundError(
            "Power model not found. "
            "Run models/train_regression.py first."
        )

    train_df = pd.read_csv(train_path, parse_dates=["datetime"])
    val_df = pd.read_csv(val_path, parse_dates=["datetime"])
    wind_val_df = pd.read_csv(
        wind_val_path, parse_dates=["datetime"]
    )

    print(f"✅ Grid training data: {train_df.shape}")
    print(f"✅ Grid validation data: {val_df.shape}")

    # Load power model and predict for validation
    power_model = joblib.load(model_path)
    print("✅ Power model loaded")

    wind_features = [
        "wind_speed", "temperature", "pressure",
        "air_density", "hour", "month", "season"
    ]
    X_wind = wind_val_df[wind_features].values
    predicted_power = power_model.predict(X_wind)

    # Add power node distributions to validation set
    # Match on datetime — inner merge
    wind_val_df["predicted_power"] = predicted_power
    wind_val_df["power_gen_1"] = predicted_power * 0.20
    wind_val_df["power_gen_2"] = predicted_power * 0.45
    wind_val_df["power_gen_3"] = predicted_power * 0.35

    val_df = val_df.merge(
        wind_val_df[["datetime", "power_gen_1",
                     "power_gen_2", "power_gen_3"]],
        on="datetime", how="inner"
    )

    # For training data: approximate using average power
    # distribution from training wind data
    wind_train_path = DATA_DIR / "wind_train.csv"
    wind_train_df = pd.read_csv(
        wind_train_path, parse_dates=["datetime"]
    )
    X_wind_train = wind_train_df[wind_features].values
    predicted_power_train = power_model.predict(X_wind_train)

    wind_train_df["power_gen_1"] = predicted_power_train * 0.20
    wind_train_df["power_gen_2"] = predicted_power_train * 0.45
    wind_train_df["power_gen_3"] = predicted_power_train * 0.35

    train_df = train_df.merge(
        wind_train_df[["datetime", "power_gen_1",
                       "power_gen_2", "power_gen_3"]],
        on="datetime", how="inner"
    )

    print(f"✅ Features added — train: {train_df.shape}, "
          f"val: {val_df.shape}")
    return train_df, val_df


def run_majority_class_baseline(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame
) -> dict:
    """
    Baseline: always predict majority class (unstable=0).

    Args:
        train_df (pd.DataFrame): Training data (unused).
        val_df (pd.DataFrame): Validation data for evaluation.

    Returns:
        dict: Classification metrics showing accuracy paradox.
    """
    print("\n📊 Running: Majority Class Baseline...")

    y_true = val_df[TARGET].values
    # Always predict 0 (unstable = majority class)
    y_pred = np.zeros(len(y_true), dtype=int)
    y_prob = np.zeros(len(y_true), dtype=float)

    metrics = calculate_classification_metrics(
        y_true, y_pred, y_prob
    )

    with mlflow.start_run(run_name="majority_class_baseline"):
        mlflow.set_tag("model_type", "baseline")
        mlflow.set_tag(
            "note",
            "accuracy_paradox_demo_64pct_without_learning"
        )
        mlflow.log_metric("accuracy", metrics["accuracy"])
        mlflow.log_metric("f1_score", metrics["f1"])
        mlflow.log_metric("auc_roc", metrics["auc_roc"])
        mlflow.log_metric("precision", metrics["precision"])
        mlflow.log_metric("recall", metrics["recall"])

    print(f"   Accuracy: {metrics['accuracy']:.3f} "
          f"← misleading! (always predicts unstable)")
    print(f"   F1 Score: {metrics['f1']:.3f}")
    print(f"   AUC-ROC:  {metrics['auc_roc']:.3f}")
    return metrics


def run_xgboost_unbalanced(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame
) -> dict:
    """
    XGBoost without class imbalance handling — shows bias.

    Args:
        train_df (pd.DataFrame): Training data.
        val_df (pd.DataFrame): Validation data.

    Returns:
        dict: Classification metrics.
    """
    print("\n📊 Running: XGBoost Without Balancing...")

    X_train = train_df[FEATURES].values
    y_train = train_df[TARGET].values
    X_val = val_df[FEATURES].values
    y_val = val_df[TARGET].values

    model = XGBClassifier(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=4,
        random_state=42,
        eval_metric="logloss",
        tree_method="hist"
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    y_pred = model.predict(X_val)
    y_prob = model.predict_proba(X_val)[:, 1]
    metrics = calculate_classification_metrics(
        y_val, y_pred, y_prob
    )

    with mlflow.start_run(run_name="xgboost_no_balancing"):
        mlflow.set_tag("model_type", "xgboost")
        mlflow.set_tag(
            "note", "biased_toward_majority_class"
        )
        mlflow.log_metric("accuracy", metrics["accuracy"])
        mlflow.log_metric("f1_score", metrics["f1"])
        mlflow.log_metric("auc_roc", metrics["auc_roc"])
        mlflow.log_metric("precision", metrics["precision"])
        mlflow.log_metric("recall", metrics["recall"])

    print(f"   F1 Score: {metrics['f1']:.3f} "
          f"← biased without balancing")
    print(f"   AUC-ROC:  {metrics['auc_roc']:.3f}")
    return metrics


def run_xgboost_balanced(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame
) -> tuple[XGBClassifier, dict]:
    """
    Final XGBoost with class weight balancing and full tracking.

    Args:
        train_df (pd.DataFrame): Training data.
        val_df (pd.DataFrame): Validation data.

    Returns:
        tuple: (trained_model, metrics_dict)
    """
    print("\n📊 Running: XGBoost Balanced Final Model...")

    X_train = train_df[FEATURES].values
    y_train = train_df[TARGET].values
    X_val = val_df[FEATURES].values
    y_val = val_df[TARGET].values

    params = {
        "n_estimators": 300,
        "learning_rate": 0.05,
        "max_depth": 4,
        "subsample": 0.8,
        "scale_pos_weight": CLASS_WEIGHT_RATIO,
        "random_state": 42,
        "eval_metric": "logloss",
        "tree_method": "hist",
        "early_stopping_rounds": 50
    }

    tscv = TimeSeriesSplit(n_splits=5)
    cv_f1_scores = []

    for fold, (train_idx, val_idx) in enumerate(
        tscv.split(X_train), 1
    ):
        fold_model = XGBClassifier(**params)
        fold_model.fit(
            X_train[train_idx], y_train[train_idx],
            eval_set=[(
                X_train[val_idx], y_train[val_idx]
            )],
            verbose=False
        )
        fold_pred = fold_model.predict(X_train[val_idx])
        fold_metrics = calculate_classification_metrics(
            y_train[val_idx], fold_pred,
            fold_model.predict_proba(X_train[val_idx])[:, 1]
        )
        cv_f1_scores.append(fold_metrics["f1"])
        print(f"   Fold {fold} F1: {fold_metrics['f1']:.3f}")

    # Train final model
    final_model = XGBClassifier(**params)
    final_model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    y_pred = final_model.predict(X_val)
    y_prob = final_model.predict_proba(X_val)[:, 1]
    metrics = calculate_classification_metrics(
        y_val, y_pred, y_prob
    )

    with mlflow.start_run(run_name="xgboost_balanced_final"):
        for key, val in params.items():
            mlflow.log_param(key, val)
        mlflow.log_param("features", FEATURES)
        mlflow.set_tag("model_type", "xgboost_balanced")
        mlflow.set_tag(
            "imbalance_handling", "scale_pos_weight"
        )

        mlflow.log_metric("accuracy", metrics["accuracy"])
        mlflow.log_metric("f1_score", metrics["f1"])
        mlflow.log_metric("auc_roc", metrics["auc_roc"])
        mlflow.log_metric("precision", metrics["precision"])
        mlflow.log_metric("recall", metrics["recall"])
        mlflow.log_metric("tp", metrics["tp"])
        mlflow.log_metric("tn", metrics["tn"])
        mlflow.log_metric("fp", metrics["fp"])
        mlflow.log_metric("fn", metrics["fn"])
        mlflow.log_metric(
            "cv_f1_mean", float(np.mean(cv_f1_scores))
        )

        # Save confusion matrix
        cm_path = SAVE_DIR / "confusion_matrix.png"
        plot_confusion_matrix(y_val, y_pred, str(cm_path))
        mlflow.log_artifact(str(cm_path))

        # SHAP values
        print("   Generating SHAP values...")
        explainer = shap.TreeExplainer(final_model)
        shap_values = explainer.shap_values(X_val[:500])

        shap_path = SAVE_DIR / "shap_classifier.png"
        plot_shap_summary(
            shap_values, pd.DataFrame(X_val[:500], columns=FEATURES),
            str(shap_path)
        )
        mlflow.log_artifact(str(shap_path))

        fi_path = SAVE_DIR / "feature_importance_classifier.png"
        plot_feature_importance(
            final_model, FEATURES, str(fi_path)
        )
        mlflow.log_artifact(str(fi_path))

        mlflow.xgboost.log_model(
            final_model, "xgboost_classifier"
        )

    # Save model
    model_path = SAVE_DIR / "stability_model.joblib"
    joblib.dump(final_model, model_path)
    print(f"   ✅ Model saved: {model_path}")
    print(f"   F1 Score: {metrics['f1']:.3f}")
    print(f"   AUC-ROC:  {metrics['auc_roc']:.3f}")
    print(f"   Precision: {metrics['precision']:.3f}")
    print(f"   Recall:    {metrics['recall']:.3f}")

    return final_model, metrics


def print_comparison_table(
    baseline: dict,
    unbalanced: dict,
    balanced: dict
) -> None:
    """
    Print formatted comparison of all 3 classification runs.

    Args:
        baseline (dict): Majority class baseline metrics.
        unbalanced (dict): XGBoost without balancing.
        balanced (dict): Final balanced XGBoost metrics.
    """
    print("\n" + "═" * 65)
    print("  MODEL COMPARISON — GRID STABILITY CLASSIFICATION")
    print("═" * 65)
    print(
        f"  {'Model':<32} {'Accuracy':>8} "
        f"{'F1':>8} {'AUC':>8}"
    )
    print("─" * 65)
    print(
        f"  {'Majority Class Baseline':<32} "
        f"{baseline['accuracy']:>7.3f} "
        f"{baseline['f1']:>7.3f} "
        f"{baseline['auc_roc']:>7.3f}"
    )
    print(
        f"  {'XGBoost (no balancing)':<32} "
        f"{unbalanced['accuracy']:>7.3f} "
        f"{unbalanced['f1']:>7.3f} "
        f"{unbalanced['auc_roc']:>7.3f}"
    )
    print(
        f"  {'XGBoost Balanced ← BEST':<32} "
        f"{balanced['accuracy']:>7.3f} "
        f"{balanced['f1']:>7.3f} "
        f"{balanced['auc_roc']:>7.3f}"
    )
    print("═" * 65)
    print(
        "  NOTE: Accuracy is misleading due to 64/36 "
        "class imbalance."
    )
    print("  F1-Score and AUC-ROC are the primary metrics.")
    print("═" * 65 + "\n")


def main() -> None:
    """Main training pipeline for grid stability classification."""
    print("\n🚀 Starting Grid Stability Classification Pipeline")
    print("=" * 60)

    mlflow.set_experiment("grid-stability-classification")

    train_df, val_df = load_data()

    baseline_metrics = run_majority_class_baseline(
        train_df, val_df
    )
    unbalanced_metrics = run_xgboost_unbalanced(
        train_df, val_df
    )
    _, balanced_metrics = run_xgboost_balanced(
        train_df, val_df
    )

    print_comparison_table(
        baseline_metrics, unbalanced_metrics, balanced_metrics
    )

    print("✅ Classification training complete!")
    print("   Run 'mlflow ui' to view experiment results")
    print(
        "   Model saved at: models/saved/stability_model.joblib"
    )


if __name__ == "__main__":
    main()