"""
Module: load_to_db.py
Author: Atharva
Date: 2024
Description: Loads all processed CSV files into a SQLite database and creates the
             predictions table schema. Uses SQLAlchemy for database operations.
             Creates tables: wind_features_train, wind_features_validation,
             grid_features_train, grid_features_validation, and predictions.
Dependencies: pandas, sqlalchemy, pathlib
Usage: python -m etl.load_to_db
"""

import os
import pandas as pd
from pathlib import Path
from sqlalchemy import (
    create_engine,
    text,
    Column,
    Integer,
    Float,
    Text,
    MetaData,
    Table,
)
from sqlalchemy.engine import Engine
from typing import Dict


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROCESSED_DIR: Path = Path(__file__).resolve().parent.parent / "data" / "processed"
DB_PATH: Path = Path(__file__).resolve().parent.parent / "smart_grid.db"
DATABASE_URL: str = f"sqlite:///{DB_PATH}"

# Mapping of CSV filenames to database table names
CSV_TABLE_MAP: Dict[str, str] = {
    "wind_train.csv": "wind_features_train",
    "wind_validation.csv": "wind_features_validation",
    "grid_train.csv": "grid_features_train",
    "grid_validation.csv": "grid_features_validation",
}


def create_db_engine(database_url: str = DATABASE_URL) -> Engine:
    """
    Create a SQLAlchemy engine connected to the SQLite database.

    Args:
        database_url (str): SQLAlchemy-compatible database URL.
            Defaults to sqlite:///./smart_grid.db.

    Returns:
        Engine: SQLAlchemy Engine instance for database operations.

    Example:
        >>> engine = create_db_engine()
        >>> print(engine.url)
        sqlite:///./smart_grid.db
    """
    engine = create_engine(database_url, echo=False)
    print(f"✅ Created database engine: {database_url}")
    return engine


def load_csv_to_table(
    engine: Engine,
    csv_path: Path,
    table_name: str,
) -> int:
    """
    Load a processed CSV file into a SQLite database table.

    Reads the CSV into a pandas DataFrame and writes it to the specified
    database table. If the table already exists, it is replaced entirely.

    Args:
        engine (Engine): SQLAlchemy Engine connected to the target database.
        csv_path (Path): Absolute path to the CSV file to load.
        table_name (str): Name of the database table to create/replace.

    Returns:
        int: Number of rows written to the database table.

    Raises:
        FileNotFoundError: If the CSV file does not exist at csv_path.

    Example:
        >>> engine = create_db_engine()
        >>> rows = load_csv_to_table(engine, Path('data/processed/wind_train.csv'),
        ...                          'wind_features_train')
        >>> print(f"Loaded {rows} rows")
    """
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    df = pd.read_csv(csv_path)
    row_count = len(df)

    df.to_sql(table_name, engine, if_exists="replace", index=False)

    print(f"  ✅ Loaded {table_name}: {row_count:,} rows × {len(df.columns)} columns")
    return row_count


def create_predictions_table(engine: Engine) -> None:
    """
    Create the predictions table schema in the SQLite database.

    Creates an empty table to store prediction results from the API.
    The table includes predicted power generation, node distribution
    (20%/45%/35% split), stability prediction, and confidence scores.
    If the table already exists, it is dropped and recreated.

    Args:
        engine (Engine): SQLAlchemy Engine connected to the target database.

    Returns:
        None

    Example:
        >>> engine = create_db_engine()
        >>> create_predictions_table(engine)
    """
    create_sql = text("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            datetime TEXT,
            wind_speed REAL,
            temperature REAL,
            pressure REAL,
            predicted_power_mw REAL,
            power_gen_1 REAL,
            power_gen_2 REAL,
            power_gen_3 REAL,
            predicted_stability TEXT,
            stability_confidence REAL,
            created_at TEXT
        )
    """)

    with engine.begin() as conn:
        # Drop existing table to ensure clean schema
        conn.execute(text("DROP TABLE IF EXISTS predictions"))
        conn.execute(create_sql)

    print("  ✅ Created predictions table (empty schema)")


def run_db_loader() -> None:
    """
    Execute the complete database loading pipeline.

    Orchestrates loading all four processed CSV files into their respective
    SQLite tables and creates the empty predictions table. Prints a summary
    with row counts for each table upon completion.

    Returns:
        None

    Raises:
        FileNotFoundError: If any processed CSV file is missing.
            Run the ETL merge scripts first.

    Example:
        >>> run_db_loader()
        ✅ All data loaded to smart_grid.db
    """
    print("=" * 60)
    print("DATABASE LOADER")
    print("=" * 60)

    # Create engine
    engine = create_db_engine()

    # -----------------------------------------------------------------------
    # Load all processed CSVs into database tables
    # -----------------------------------------------------------------------
    print("\n--- Loading CSV files to database ---")
    total_rows = 0

    for csv_name, table_name in CSV_TABLE_MAP.items():
        csv_path = PROCESSED_DIR / csv_name
        rows = load_csv_to_table(engine, csv_path, table_name)
        total_rows += rows

    # -----------------------------------------------------------------------
    # Create empty predictions table
    # -----------------------------------------------------------------------
    print("\n--- Creating predictions table ---")
    create_predictions_table(engine)

    # -----------------------------------------------------------------------
    # Verification: print row counts for all tables
    # -----------------------------------------------------------------------
    print("\n--- Database Summary ---")
    with engine.connect() as conn:
        for table_name in list(CSV_TABLE_MAP.values()) + ["predictions"]:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            count = result.scalar()
            print(f"  📊 {table_name}: {count:,} rows")

    print(f"\n✅ All data loaded to {DB_PATH}")
    print(f"   Total rows across all feature tables: {total_rows:,}")
    print("=" * 60)


if __name__ == "__main__":
    run_db_loader()
