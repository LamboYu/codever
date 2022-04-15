

from typing import Any, Dict, List, Tuple
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Response, status

from models.snippet import SnippetPost
from models.user import UserDB, UserPost, UserPut
from src.models.snippet import SnippetDB, SnippetPublic, SnippetPut
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId, errors
from .utils import *
from . import database
from bson import ObjectId


router = APIRouter()

# class SearchInclude(Enum, str):
#    ALL = "all"
#    ANY = "any"


def get_database() -> AsyncIOMotorDatabase:
    return database

async def get_post_or_404(
    id: ObjectId = Depends(get_object_id),
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> SnippetDB:
    raw_post = await database["snippets"].find_one({"_id": id})

    if raw_post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    return SnippetDB(**raw_post)


async def verify_user_id(user_id: str) -> str:
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    else:
        return user_id


@router.post("/{user_id}/snippets", status_code=status.HTTP_201_CREATED)
async def create_snippet(snippet: SnippetPost,
                         response: Response,
                         user_id: str = Depends(verify_user_id),
                         database: AsyncIOMotorDatabase = Depends(get_database)):
    """Create snippet for user"""
    post: SnippetDB = SnippetDB(
        userId=user_id, **snippet.dict(exclude={"lastAccessedAt", "userId"}))
    post.updatedAt = post.createdAt
    await database["snippets"].insert_one(post.dict(by_alias=True))
    post = await get_post_or_404(post.id, database)
    response.headers[
        "Location"] = f"http://localhost:3001/api/personal/users/{user_id}/snippets/{str(post.id)}"
    return {
        "response": f"Snippet created for userId {user_id}"
    }


@router.get("/{user_id}/snippets/suggested-tags")
async def get_suggested_tags(user_id: str):
    """Get user suggested tags"""
    pass


@router.get("/{user_id}/snippets/tags")
async def get_tags(user_id: str = Depends(verify_user_id),
                   database: AsyncIOMotorDatabase = Depends(get_database)):
    """Get user tags"""
    return await get_user_tags(user_id) if user_id else get_all_public_tags()


@router.get("/{user_id}/used-tags")
async def get_used_tags(user_id: str = Depends(verify_user_id),
                        database: AsyncIOMotorDatabase = Depends(get_database)):
    """Get user tags"""
    return {
        "public": await get_user_public_tags(user_id),
        "private": await get_user_private_tags(user_id)
    }


@router.get("/{user_id}/snippets/export")
async def export_snippets(user_id: str):
    """GET all snippets of a user, ordered by createdAt date descending"""
    return await find_snippets(None, None, user_id, None)


@router.get("/{user_id}/snippets")
async def find_user_snippets(q: str = None, include: str = "all",
                             user_id: str = Depends(verify_user_id),
                             pagination: Tuple[int, int] = Depends(pagination)):
    """Find user's private snippets"""
    return await find_snippets(q, include, user_id, pagination)


# @router.get("/")
# async def get_user_latest_snippets(limit: int):
#    """Get user's private snippets in bulk"""
#    pass

@router.get("/{user_id}/snippets/{id}")
async def get_user_snippet_by_id(
        snippet_db: SnippetDB = Depends(get_post_or_404)) -> SnippetDB:
    """Get user's private snippets by snippet id"""

    return snippet_db


@router.put("/{user_id}/snippets/{id}")
async def update_snippet(
        snippet_put: SnippetPut,
        snippet_db: SnippetDB = Depends(get_post_or_404),
        database: AsyncIOMotorDatabase = Depends(get_database)) -> SnippetDB:
    """Update user snippet by PUT method"""
    await database["snippets"].update_one(
        {"_id": snippet_db.id}, {"$set": snippet_put.dict(
            exclude_unset=True,
            exclude={"lastAccessedAt", "userId"})}
    )
    return await get_post_or_404(snippet_db.id, database)


@router.delete("/{user_id}/snippets/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_snippet(
        snippet_db: SnippetDB = Depends(get_post_or_404),
        database: AsyncIOMotorDatabase = Depends(get_database)):
    """Delete user snippet by snippet id"""

    await database["snippets"].delete_one({"_id": snippet_db.id})


@router.delete("/{user_id}/snippets", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_snippet_by_tag(tag: str,
                                     type: str,
                                     user_id: str = Depends(verify_user_id)):
    """Delete user snippet by tag"""

    query = database["snippets"].find({"userId": user_id,
                                               "public": False,
                                               "tags": tag})
    to_be_deleted = [SnippetDB(**raw_post) async for raw_post in query]
    if len(to_be_deleted) > 0:        
        deleted = await database["snippets"].delete_many({"userId": user_id,
                                                "public": False,
                                                "tags": tag})
        to_be_deleted_ids = list(map(lambda s: str(s.id), to_be_deleted))
        await database["users"].update_one(
            {"userId": user_id},
            {
                "$pull": {
                    "history": {"$in": to_be_deleted_ids},
                    "pinned": {"$in": to_be_deleted_ids},
                    "readLater": {"$in": to_be_deleted_ids}
                }
            }
        )


@router.get("/{user_id}")
async def get_user_data(user_id: str):
    """Get user information"""
    user_data: UserDB = await database["users"].find_one({"userId": user_id})
    if user_data is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    else:
        return UserDB(**user_data)


@router.post("/{user_id}", status_code=status.HTTP_201_CREATED)
async def create_user_data(user_id: str, user_data: UserPost):
    """Create user information"""

    post: UserDB = UserDB(**user_data.dict())
    post.updatedAt = post.createdAt
    await database["users"].insert_one(post.dict(by_alias=True))

    # TODO query again
    return post


@router.put("/{user_id}")
async def update_user_data(user_put: UserPut) -> UserDB:
    """Update user data by PUT method"""
    await database["users"].update_one(
        {"_id": get_object_id(user_put.id)}, {"$set": user_put.dict()}
    )
    user_data = await database["users"].find_one({"_id": get_object_id(user_put.id)})
    return UserDB(**user_data)


@router.patch("/{user_id}/welcome-acknowledge")
async def welcome_ack(user_id: str):
    """User acknowledged welcome messages"""
    await database["users"].update_one(
        {"userId": user_id}, {"$set": {"welcomeAck": True}}
    )


@router.get("/{user_id}/feed")
async def get_user_feed(user_id: str = Depends(verify_user_id),
                        pagination: Tuple[int, int] = Depends(pagination)):
    user_data: UserDB = await database["users"].find_one({"userId": user_id})
    if not user_data:
        # Falls back to getting the public bookmarks - the case happens when
        # the user register for the first time via Keycloak
        return []
    else:
        user_data = UserDB(**user_data)
        filtered = {
            "public": True,
            "$and": [
                {
                    "tags": {
                        "$elemMatch": {"$in": user_data.watchedTags}
                    }
                },
                {
                    "tags": {
                        "$not": {"$elemMatch": {"$in": user_data.ignoredTags}}
                    }
                }
            ]
        }
        page, limit = pagination
        query = database["snippets"].find(filtered).sort(
            "createdAt", -1).skip(page * DEFAULT_PAGE_SIZE).limit(limit)
        return [SnippetDB(**raw_post) async for raw_post in query]

@router.patch("/{user_id}/pinned")
async def add_to_pin(user_id: str, body: Dict = Body(...)):
    """Add to pin"""
    ids: List[str] = body.get("pinnedSnippetIds")
    await database["users"].update_one(
        {"userId": user_id}, {"$set": {"pinned": ids}}
    )
    return {"userDataPinnedUpdated":True}


@router.get("/{user_id}/pinned")
async def get_user_pinned(user_id: str = Depends(verify_user_id),
                        pagination: Tuple[int, int] = Depends(pagination)):
    user_data: UserDB = await database["users"].find_one({"userId": user_id})
    if not user_data:
        # Falls back to getting the public bookmarks - the case happens when
        # the user register for the first time via Keycloak
        return []
    else:
        page, limit = pagination
        user_data = UserDB(**user_data)
        pinned_ids: List[str] = user_data.pinned[page * limit: min(len(user_data.pinned), (page + 1) * limit)]
        pinned_ids = list(map(lambda id: get_object_id(id), pinned_ids))
        query = database["snippets"].find({"_id": {"$in": pinned_ids}})
        return [SnippetDB(**raw_post) async for raw_post in query]
        #TODO we need to order the bookmarks to correspond the one in the userData.pinned array
        #const orderedBookmarksAsInPinned = bookmarks.sort(function (a, b) {
        #return pinnedRangeIds.indexOf(a._id) - pinnedRangeIds.indexOf(b._id); });
