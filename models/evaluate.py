"""
Module: evaluate.py
Author: Atharva
Date: 2024
Description: Evaluation utilities for the Smart Grid Optimizer ML models.
             Provides functions for calculating regression/classification metrics,
             plotting confusion matrices, SHAP summary plots, and feature importance
             charts. Used by both train_regression.py and train_classifier.py.
Dependencies: numpy, scikit-learn, matplotlib, shap
Usage:
    from models.evaluate import calculate_regression_metrics, plot_shap_summary
    metrics = calculate_regression_metrics(y_true, y_pred)
"""

import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for saving plots
import matplotlib.pyplot as plt
from typing import Dict, List, Optional, Union

from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score,
    accuracy_score,
    f1_score,
    roc_auc_score,
    precision_score,
    recall_score,
    confusion_matrix,
    ConfusionMatrixDisplay,
)


def calculate_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> Dict[str, float]:
    """
    Calculate standard regression evaluation metrics.

    Computes Root Mean Square Error (RMSE), Mean Absolute Error (MAE),
    and R² (coefficient of determination) between true and predicted values.

    Args:
        y_true (np.ndarray): Array of true target values.
        y_pred (np.ndarray): Array of predicted values from the model.

    Returns:
        Dict[str, float]: Dictionary with keys 'rmse', 'mae', 'r2' and
            their corresponding float values.

    Raises:
        ValueError: If y_true and y_pred have different lengths.

    Example:
        >>> metrics = calculate_regression_metrics(
        ...     np.array([1.0, 2.0, 3.0]),
        ...     np.array([1.1, 2.2, 2.8])
        ... )
        >>> print(f"RMSE: {metrics['rmse']:.4f}")
        RMSE: 0.1732
    """
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))

    return {"rmse": rmse, "mae": mae, "r2": r2}


def calculate_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None,
) -> Dict[str, float]:
    """
    Calculate standard classification evaluation metrics.

    Computes accuracy, F1-score, AUC-ROC (if probabilities provided),
    precision, recall, and confusion matrix values (TP, TN, FP, FN).
    F1-score and AUC-ROC are the primary metrics for imbalanced datasets.

    Args:
        y_true (np.ndarray): Array of true binary labels (0 or 1).
        y_pred (np.ndarray): Array of predicted binary labels.
        y_prob (Optional[np.ndarray]): Array of predicted probabilities for
            the positive class. Required for AUC-ROC calculation. If None,
            AUC-ROC is set to 0.0.

    Returns:
        Dict[str, float]: Dictionary containing:
            - 'accuracy': Overall accuracy (misleading for imbalanced data)
            - 'f1': F1-score (primary metric)
            - 'auc_roc': Area Under ROC Curve (primary metric)
            - 'precision': Positive predictive value
            - 'recall': Sensitivity / true positive rate
            - 'tp': True positives count
            - 'tn': True negatives count
            - 'fp': False positives count
            - 'fn': False negatives count

    Example:
        >>> metrics = calculate_classification_metrics(
        ...     np.array([0, 1, 1, 0]),
        ...     np.array([0, 1, 0, 0]),
        ...     np.array([0.2, 0.9, 0.4, 0.1])
        ... )
        >>> print(f"F1: {metrics['f1']:.4f}, AUC: {metrics['auc_roc']:.4f}")
    """
    accuracy = float(accuracy_score(y_true, y_pred))
    f1 = float(f1_score(y_true, y_pred))
    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))

    # AUC-ROC requires probability scores
    auc_roc = 0.0
    if y_prob is not None:
        try:
            auc_roc = float(roc_auc_score(y_true, y_prob))
        except ValueError:
            auc_roc = 0.0

    # Confusion matrix values
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

    return {
        "accuracy": accuracy,
        "f1": f1,
        "auc_roc": auc_roc,
        "precision": precision,
        "recall": recall,
        "tp": float(tp),
        "tn": float(tn),
        "fp": float(fp),
        "fn": float(fn),
    }


def plot_confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    save_path: str,
    labels: Optional[List[str]] = None,
) -> str:
    """
    Generate and save a confusion matrix visualization.

    Creates a color-coded confusion matrix plot using sklearn's
    ConfusionMatrixDisplay and saves it as a PNG image file.

    Args:
        y_true (np.ndarray): Array of true labels.
        y_pred (np.ndarray): Array of predicted labels.
        save_path (str): File path where the plot image will be saved.
        labels (Optional[List[str]]): Display labels for the classes.
            Defaults to ['Unstable (0)', 'Stable (1)'].

    Returns:
        str: The file path where the plot was saved.

    Example:
        >>> path = plot_confusion_matrix(y_true, y_pred, 'confusion_matrix.png')
        >>> print(f"Saved to: {path}")
    """
    if labels is None:
        labels = ["Unstable (0)", "Stable (1)"]

    fig, ax = plt.subplots(figsize=(8, 6))
    cm = confusion_matrix(y_true, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=labels)
    disp.plot(ax=ax, cmap="Blues", values_format="d")

    ax.set_title("Confusion Matrix — Grid Stability Classifier", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close(fig)

    print(f"✅ Saved confusion matrix: {save_path}")
    return save_path


def plot_shap_summary(
    shap_values: np.ndarray,
    X: Union[np.ndarray, "pd.DataFrame"],
    save_path: str,
    title: str = "SHAP Feature Importance",
) -> str:
    """
    Generate and save a SHAP summary (beeswarm) plot.

    Creates a SHAP summary plot showing the distribution and impact of each
    feature on model predictions. Features are ordered by importance.

    Args:
        shap_values (np.ndarray): SHAP values array from a SHAP explainer.
        X (Union[np.ndarray, pd.DataFrame]): Feature matrix used for SHAP
            computation. Column names are used as feature labels.
        save_path (str): File path where the plot image will be saved.
        title (str): Title for the plot. Defaults to "SHAP Feature Importance".

    Returns:
        str: The file path where the plot was saved.

    Example:
        >>> path = plot_shap_summary(shap_vals, X_train, 'shap_summary.png')
    """
    import shap

    fig, ax = plt.subplots(figsize=(10, 6))
    shap.summary_plot(shap_values, X, show=False)
    plt.title(title, fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close("all")

    print(f"✅ Saved SHAP summary plot: {save_path}")
    return save_path


def plot_feature_importance(
    model: object,
    feature_names: List[str],
    save_path: str,
    title: str = "Feature Importance",
    top_n: int = 10,
) -> str:
    """
    Generate and save a horizontal bar chart of feature importances.

    Extracts feature importances from a tree-based model (e.g., XGBoost)
    and creates a sorted horizontal bar chart showing the top features.

    Args:
        model (object): A fitted model with a `feature_importances_` attribute.
        feature_names (List[str]): List of feature names corresponding to
            the model's input features.
        save_path (str): File path where the plot image will be saved.
        title (str): Title for the plot. Defaults to "Feature Importance".
        top_n (int): Number of top features to display. Defaults to 10.

    Returns:
        str: The file path where the plot was saved.

    Example:
        >>> path = plot_feature_importance(xgb_model, ['wind_speed', 'temp'],
        ...                                'feature_importance.png')
    """
    importances = model.feature_importances_
    indices = np.argsort(importances)[-top_n:]

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(
        range(len(indices)),
        importances[indices],
        color="#C9A227",
        edgecolor="#1C2E1C",
    )
    ax.set_yticks(range(len(indices)))
    ax.set_yticklabels([feature_names[i] for i in indices])
    ax.set_xlabel("Importance Score")
    ax.set_title(title, fontsize=14, fontweight="bold")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close(fig)

    print(f"✅ Saved feature importance plot: {save_path}")
    return save_path
