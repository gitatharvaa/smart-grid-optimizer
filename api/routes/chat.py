"""
Module: chat.py
Author: Atharva
Date: 2024
Description: FastAPI route for LangChain SQL Agent chat.
             Enables natural language queries against SQLite
             database with conversation memory.
Dependencies: fastapi, langchain, langchain-groq
Usage: POST /chat
"""

import os
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

from api.schemas import ChatRequest, ChatResponse

load_dotenv()
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    data: ChatRequest
) -> ChatResponse:
    """
    Process natural language query using LangChain SQL Agent.

    Converts user's natural language question to SQL, runs it
    against the smart_grid database, and returns a formatted
    answer with the SQL query used for transparency.

    Args:
        data (ChatRequest): User message and conversation history.

    Returns:
        ChatResponse: Natural language answer + SQL query used.

    Raises:
        HTTPException 503: If Groq API key not configured.
        HTTPException 500: If agent execution fails.
    """
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY not configured in .env"
        )

    db_url = os.getenv(
        "DATABASE_URL", "sqlite:///./smart_grid.db"
    )

    try:
        from langchain_groq import ChatGroq
        from langchain_community.utilities import SQLDatabase
        from langchain_community.agent_toolkits import (
            create_sql_agent
        )

        # Initialize LLM
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            api_key=groq_key
        )

        # Connect to SQLite database
        db = SQLDatabase.from_uri(
            db_url,
            include_tables=[
                "wind_features_train",
                "wind_features_validation",
                "grid_features_train",
                "grid_features_validation",
                "predictions"
            ]
        )

        # Create SQL agent
        agent = create_sql_agent(
            llm=llm,
            db=db,
            verbose=False,
            agent_type="openai-tools",
            system_message=(
                "You are an AI assistant for a smart grid "
                "analytics platform analyzing wind energy "
                "and grid stability data. "
                "Answer questions concisely with specific "
                "numbers and units (MW, %, hours). "
                "Always mention the time period when relevant."
            )
        )

        # Run agent
        result = agent.invoke({"input": data.message})
        response_text = result.get("output", str(result))

        # Try to extract SQL query from intermediate steps
        sql_query = None
        if "intermediate_steps" in result:
            for step in result["intermediate_steps"]:
                if isinstance(step, tuple) and len(step) >= 1:
                    action = step[0]
                    if hasattr(action, "tool_input"):
                        sql_query = str(action.tool_input)
                        break

        return ChatResponse(
            response=response_text,
            sql_query=sql_query
        )

    except Exception as e:
        # Return graceful error response
        return ChatResponse(
            response=(
                "I encountered an issue querying the database. "
                f"Error: {str(e)[:100]}. "
                "Please ensure the database has been populated "
                "by running the ETL scripts first."
            ),
            sql_query=None,
            error=str(e)
        )