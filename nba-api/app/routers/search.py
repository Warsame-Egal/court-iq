import logging

from fastapi import APIRouter, HTTPException

from app.schemas.search import SearchResults
from app.services.search import search_entities

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/search", response_model=SearchResults, tags=["search"])
async def search(q: str):
    try:
        return await search_entities(q)
    except HTTPException as e:
        raise e
