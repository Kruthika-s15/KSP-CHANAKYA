from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import ai_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Unified AI Chat Endpoint.
    Handles natural language queries and investigator SQL queries.
    """
    try:
        if request.mode == "sql":
            # Direct to secure SQL execution service
            logger.info(f"AUDIT LOG: User executed SQL mode. Query: {request.message}")
            result = await ai_service.execute_investigator_sql(request.message, db)
            return ChatResponse(**result)
        else:
            # Natural language processing pipeline
            result = await ai_service.get_natural_response(
                request.message, db,
                history=[{"role": m.role, "content": m.content} for m in request.history]
            )
            return ChatResponse(**result)
            
    except ValueError as ve:
        # Validation errors (e.g. malicious SQL)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while processing chat.")
