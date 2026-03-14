"""
Module: merge_grid_data.py
Author: Atharva
Date: 2024
Description: ETL pipeline that merges 12 grid CSV files (consumption, pricing, stability)
             into a single clean DataFrame. Parses string dates ('DD-MM-YYYY HH:MM'),
             encodes the stability target as binary, and saves processed train/validation CSVs.
Dependencies: pandas, pathlib
Usage: python -m etl.merge_grid_data
"""

import os
import sys
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

YEARS: List[int] = [2019, 2020, 2021, 2022, 2023]

RAW_DIR: Path = Path(__file__).resolve().parent.parent / "data" / "raw" / "Grid_data"
PROCESSED_DIR: Path = Path(__file__).resolve().parent.parent / "data" / "processed"

STABILITY_FILE: str = "grid_stability_2019_2023.csv"
VALIDATION_FILE: str = "grid_stability_3months_validation_data.csv"

DATE_FORMAT: str = "%d-%m-%Y %H:%M"


def load_consumption_files(years: List[int], raw_dir: Path) -> pd.DataFrame:
    """
    Load and concatenate yearly unit consumption CSV files.

    Reads unit_consumption_{year}.csv for each year, parses the string dates
    to proper datetime objects, renames 'date' to 'datetime', and concatenates
    all years vertically.

    Args:
        years (List[int]): List of years to load (e.g., [2019, 2020, …, 2023]).
        raw_dir (Path): Path to directory containing raw Grid CSV files.

    Returns:
        pd.DataFrame: Combined DataFrame with columns ['datetime', 'c1', 'c2', 'c3'].

    Raises:
        FileNotFoundError: If any expected CSV file is missing.

    Example:
        >>> df = load_consumption_files([2019, 2020], Path('data/raw/Grid_data'))
        >>> print(df.columns.tolist())
        ['datetime', 'c1', 'c2', 'c3']
    """
    frames: List[pd.DataFrame] = []

    for year in years:
        filename = f"unit_consumption_{year}.csv"
        filepath = raw_dir / filename

        if not filepath.exists():
            raise FileNotFoundError(
                f"Expected file not found: {filepath}. "
                f"Please place all grid CSV files in {raw_dir}"
            )

        df = pd.read_csv(filepath)
        # Parse string dates to datetime objects
        df["date"] = pd.to_datetime(df["date"], format=DATE_FORMAT)
        df = df.rename(columns={"date": "datetime"})

        frames.append(df)
        print(f"  📂 Loaded {filename}: {len(df):,} rows")

    combined = pd.concat(frames, ignore_index=True)
    print(f"  ✅ Combined consumption data: {len(combined):,} total rows")
    return combined


def load_price_files(years: List[int], raw_dir: Path) -> pd.DataFrame:
    """
    Load and concatenate yearly price-per-unit CSV files.

    Reads price_per_unit_{year}.csv for each year, parses string dates,
    renames 'date' to 'datetime', and concatenates all years vertically.

    Args:
        years (List[int]): List of years to load (e.g., [2019, 2020, …, 2023]).
        raw_dir (Path): Path to directory containing raw Grid CSV files.

    Returns:
        pd.DataFrame: Combined DataFrame with columns ['datetime', 'p1', 'p2', 'p3'].

    Raises:
        FileNotFoundError: If any expected CSV file is missing.

    Example:
        >>> df = load_price_files([2019], Path('data/raw/Grid_data'))
        >>> print(df.shape)
        (8759, 4)
    """
    frames: List[pd.DataFrame] = []

    for year in years:
        filename = f"price_per_unit_{year}.csv"
        filepath = raw_dir / filename

        if not filepath.exists():
            raise FileNotFoundError(
                f"Expected file not found: {filepath}. "
                f"Please place all grid CSV files in {raw_dir}"
            )

        df = pd.read_csv(filepath)
        df["date"] = pd.to_datetime(df["date"], format=DATE_FORMAT)
        df = df.rename(columns={"date": "datetime"})

        frames.append(df)
        print(f"  📂 Loaded {filename}: {len(df):,} rows")

    combined = pd.concat(frames, ignore_index=True)
    print(f"  ✅ Combined price data: {len(combined):,} total rows")
    return combined


def load_stability_file(raw_dir: Path) -> pd.DataFrame:
    """
    Load the grid stability labels file covering 2019–2024 Q1.

    Parses string dates to datetime objects and renames 'date' to 'datetime'.
    The stability column contains categorical labels: 'stable' and 'unstable'.

    Args:
        raw_dir (Path): Path to directory containing the stability CSV file.

    Returns:
        pd.DataFrame: DataFrame with columns ['datetime', 'stability'].

    Raises:
        FileNotFoundError: If the stability file is not found.

    Example:
        >>> df = load_stability_file(Path('data/raw/Grid_data'))
        >>> print(df['stability'].value_counts())
    """
    filepath = raw_dir / STABILITY_FILE

    if not filepath.exists():
        raise FileNotFoundError(
            f"Stability file not found: {filepath}. "
            f"Please place {STABILITY_FILE} in {raw_dir}"
        )

    df = pd.read_csv(filepath)
    df["date"] = pd.to_datetime(df["date"], format=DATE_FORMAT)
    df = df.rename(columns={"date": "datetime"})

    print(f"  📂 Loaded {STABILITY_FILE}: {len(df):,} rows")
    print(f"     Label distribution: {df['stability'].value_counts().to_dict()}")
    return df


def encode_stability(df: pd.DataFrame) -> pd.DataFrame:
    """
    Encode the stability target column as binary integer.

    Maps 'stable' → 1 and 'unstable' → 0. Keeps the original 'stability'
    column and adds a new 'stability_encoded' column for model training.

    Args:
        df (pd.DataFrame): DataFrame with a 'stability' column containing
            string labels ('stable', 'unstable').

    Returns:
        pd.DataFrame: DataFrame with an additional 'stability_encoded' column.

    Example:
        >>> df = encode_stability(grid_df)
        >>> print(df['stability_encoded'].value_counts())
        0    29357
        1    16650
    """
    stability_mapping = {"stable": 1, "unstable": 0}
    df["stability_encoded"] = df["stability"].map(stability_mapping)

    stable_count = (df["stability_encoded"] == 1).sum()
    unstable_count = (df["stability_encoded"] == 0).sum()
    print(f"✅ Encoded stability: stable={stable_count:,}, unstable={unstable_count:,}")
    return df


def process_validation_file(raw_dir: Path) -> pd.DataFrame:
    """
    Load and process the 3-month grid validation dataset (Jan–Mar 2024).

    The validation file already has all features merged (c1–c3, p1–p3, stability).
    Applies the same date parsing and stability encoding as the training data.

    Args:
        raw_dir (Path): Path to directory containing the validation CSV file.

    Returns:
        pd.DataFrame: Processed validation DataFrame with encoded stability.

    Raises:
        FileNotFoundError: If the validation file is not found.

    Example:
        >>> val_df = process_validation_file(Path('data/raw/Grid_data'))
        >>> print(val_df.shape)
        (2184, 9)
    """
    filepath = raw_dir / VALIDATION_FILE

    if not filepath.exists():
        raise FileNotFoundError(
            f"Validation file not found: {filepath}. "
            f"Please place {VALIDATION_FILE} in {raw_dir}"
        )

    df = pd.read_csv(filepath)
    print(f"\n📂 Loaded validation file: {len(df):,} rows")

    # Parse dates
    df["date"] = pd.to_datetime(df["date"], format=DATE_FORMAT)
    df = df.rename(columns={"date": "datetime"})

    # Encode stability target
    df = encode_stability(df)

    print(f"✅ Processed grid validation data: {df.shape[0]:,} rows × {df.shape[1]} columns")
    return df


def run_grid_etl() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Execute the complete grid data ETL pipeline.

    Orchestrates the full workflow: loading consumption, pricing, and stability
    CSV files, merging on datetime via inner joins, encoding the stability
    target as binary, processing the validation set, and saving both datasets.

    Returns:
        Tuple[pd.DataFrame, pd.DataFrame]: A tuple of (train_df, validation_df).

    Raises:
        FileNotFoundError: If any required raw data file is missing.

    Example:
        >>> train_df, val_df = run_grid_etl()
        >>> print(f"Train: {train_df.shape}, Validation: {val_df.shape}")
    """
    print("=" * 60)
    print("GRID DATA ETL PIPELINE")
    print("=" * 60)

    # Ensure output directory exists
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    # -----------------------------------------------------------------------
    # Step 1: Load consumption files
    # -----------------------------------------------------------------------
    print("\n--- Loading consumption files ---")
    consumption_df = load_consumption_files(YEARS, RAW_DIR)

    # -----------------------------------------------------------------------
    # Step 2: Load price files
    # -----------------------------------------------------------------------
    print("\n--- Loading price files ---")
    price_df = load_price_files(YEARS, RAW_DIR)

    # -----------------------------------------------------------------------
    # Step 3: Load stability file
    # -----------------------------------------------------------------------
    print("\n--- Loading stability file ---")
    stability_df = load_stability_file(RAW_DIR)

    # -----------------------------------------------------------------------
    # Step 4: Merge consumption + prices + stability on datetime (inner join)
    # -----------------------------------------------------------------------
    print("\n--- Merging all grid data ---")
    merged_df = consumption_df.merge(price_df, on="datetime", how="inner")
    merged_df = merged_df.merge(stability_df, on="datetime", how="inner")
    print(f"✅ Merged grid data: {merged_df.shape[0]:,} rows × {merged_df.shape[1]} columns")

    # -----------------------------------------------------------------------
    # Step 5: Encode stability target as binary
    # -----------------------------------------------------------------------
    print("\n--- Encoding stability target ---")
    merged_df = encode_stability(merged_df)

    # -----------------------------------------------------------------------
    # Step 6: Process validation file
    # -----------------------------------------------------------------------
    print("\n--- Processing validation data ---")
    val_df = process_validation_file(RAW_DIR)

    # -----------------------------------------------------------------------
    # Step 7: Save to processed directory
    # -----------------------------------------------------------------------
    train_path = PROCESSED_DIR / "grid_train.csv"
    val_path = PROCESSED_DIR / "grid_validation.csv"

    merged_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)

    print(f"\n✅ Saved grid_train.csv: {merged_df.shape[0]:,} rows × {merged_df.shape[1]} columns")
    print(f"✅ Saved grid_validation.csv: {val_df.shape[0]:,} rows × {val_df.shape[1]} columns")
    print(f"📁 Output directory: {PROCESSED_DIR}")
    print("=" * 60)

    return merged_df, val_df


if __name__ == "__main__":
    train_df, val_df = run_grid_etl()
