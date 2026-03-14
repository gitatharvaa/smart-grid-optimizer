"""
Module: database.py
Author: Atharva
Date: 2024
Description: SQLAlchemy database engine, session factory,
             and FastAPI dependency for database access.
Dependencies: sqlalchemy, python-dotenv
Usage: from api.database import get_db, engine
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "sqlite:///./smart_grid.db"
)

# Create SQLAlchemy engine
# connect_args only needed for SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
    if "sqlite" in DATABASE_URL else {}
)

# Session factory — each request gets its own session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session.

    Yields:
        Session: SQLAlchemy database session.

    Example:
        >>> @app.get("/example")
        >>> def example(db: Session = Depends(get_db)):
        >>>     return db.execute("SELECT 1")
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()