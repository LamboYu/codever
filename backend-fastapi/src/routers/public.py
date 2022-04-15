from typing import Any, Dict, List, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from .utils import find_snippets, get_all_public_tags, pagination, split_query
from models.snippet import SnippetDB, SnippetPublic, SnippetPut, SnippetPost
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId, errors
from enum import Enum
from . import database, motor_client

router = APIRouter()

@router.get("/snippets")
async def find_public_snippets(q: str = None, include: str = "all", sort: str = None,
                             pagination: Tuple[int, int] = Depends(pagination)):
    """Find public snippets"""    
    return await find_snippets(q, include, None, pagination)

@router.get("/snippets/{sid}")
async def find_public_snippet_with_id(sid: str, q: str = None, include: str = "all", sort: str = None,
                                      pagination: Tuple[int, int] = Depends(pagination)):
    """Find public snippets"""    
    return await find_snippets(q, include, None, pagination, sid)

@router.get("/snippets/tagged/{tag}")
async def find_tagged_public_snippets(tag: str, orderBy: str,
                             pagination: Tuple[int, int] = Depends(pagination)):
    """Find public tagged snippets"""    
    page, limit = pagination
    search_filter = {"public": True, 
                     "tags": tag}

    #addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);
    query = database["snippets"].find(search_filter).sort(
        "likeCount" if orderBy == "LIKE_COUNT" else "createdAt", -1).skip(page * limit).limit(limit)
    return [SnippetDB(**raw_post) async for raw_post in query] 

@router.get("/snippets/tags")
async def get_tags(limit: int):
    """Get pubic tags"""
    #TODO limit needs to be handled
    return await get_all_public_tags()
