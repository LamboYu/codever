import re
from typing import Any, Dict, List, Tuple

from fastapi import Query

from models.snippet import SnippetDB
from bson import ObjectId

from . import database

DEFAULT_PAGE_SIZE: int = 5

def split_query(query: str) -> Tuple[List[str], List[str]]:
    terms: List[str] = []
    term = ''
    tags: List[str] = []
    tag = ''

    if not query:
        return (terms, tags)

    inside_term = False
    inside_tag = False

    for char in query:
        if char == ' ':
            if not inside_tag:
                if not inside_term:
                    continue
                else:
                    terms.append(term)
                    inside_term = False
                    term = ''
            else:
                tag += ' '

        elif char == '[':
            if not inside_tag:
                inside_tag = True

        elif char == ']':
            if inside_tag:
                inside_tag = False
                tags.append(tag.strip())
                tag = ''
        else:
            if inside_tag:
                tag += char
            else:
                inside_term = True
                term += char

    if len(tag) > 0:
        tags.append(tag.strip())

    if len(term) > 0:
        terms.append(term)

    return (terms, tags)

def get_object_id(id: str) -> ObjectId:
    try:
        return ObjectId(id)
    except (errors.InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

async def pagination(
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=0),
) -> Tuple[int, int]:
    capped_limit = min(20, limit)
    return (page - 1, capped_limit)


def extract_special_search_terms(terms: List[str]):
    special_filters: Dict[str, str] = {}
    normal_terms: List[str] = []
    for term in terms:
        if term.startswith('lang:'):
            special_filters["lang"] = term[5:]
        elif term.startswith('site:'):
            special_filters["site"] = term[5:]
        elif term == 'private:only':
            special_filters["privateOnly"] = True
        elif re.match("^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", term):
            special_filters["userId"] = term[5:]
        else:
            normal_terms.append(term)
    return (special_filters, normal_terms)


async def find_snippets(q: str, include: str, user_id: str,
                        pagination: Tuple[int, int], sid = None):
    """Find user's private snippets"""
    page, limit = pagination if pagination else (0, 0)
    terms, tags = split_query(q)
    special_filters, normal_terms = extract_special_search_terms(terms)
    search_filter = {}
    if len(tags) > 0:
        search_filter["tags"] = {("$all" if include == "all" else "$in"): tags}

    if len(normal_terms) > 0:
        if include == "all":
            term_query = ''
            for term in normal_terms:
                if term.startswith("-"):
                    term_query += ' ' + term
                else:
                    term_query += ' "' + term[:] + '"'
            search_filter["$text"] = {"$search": term_query.strip()}
        else:
            search_filter["$text"] = {"$search": ' '.join(normal_terms)}

    if user_id:
        search_filter['userId'] = user_id
    else:
        search_filter['public'] = True

    if "userId" in special_filters:
        search_filter['userId'] = special_filters["userId"]
        search_filter['public'] = True
    elif "privateOnly" in special_filters:
        search_filter['public'] = False
    
    if sid:
        search_filter["_id"] = get_object_id(sid)
        query = await database["snippets"].find_one(search_filter)
        return SnippetDB(**query)
    else:
        if q:
            query = database["snippets"].find(search_filter, {"score": {"$meta": "textScore"}}).sort(
                [("score", {"$meta": "textScore"})]).skip(page * limit).limit(limit)
        else:
            query = database["snippets"].find(search_filter).sort("createdAt", -1).skip(page * limit).limit(limit)
        return [SnippetDB(**raw_post) async for raw_post in query]


async def _get_tags(condition: Dict[str, Dict]):
    """Get user tags"""
    aggrs: List[Dict[Any, Any]] = await database["snippets"].aggregate([
        # first stage - filter
        condition,
        # second stage - unwind tags
        {"$unwind": "$tags"},

        # third stage - group
        {
            "$group": {
                "_id": {
                    "tag": '$tags'
                },
                "count": {
                    "$sum": 1
                }
            }
        },

        # fourth stage - order by count desc
        {
            "$sort": {
                "count": -1
            }
        }
    ]).to_list(length=None)
    return list(map(lambda item: {"name": item["_id"]["tag"], "count": item["count"]}, aggrs))


async def get_user_public_tags(user_id: str):
    return await _get_tags({
        "$match": {
            "userId": user_id,
            "public": True
        }
    })


async def get_user_private_tags(user_id: str):
    return await _get_tags({
        "$match": {
            "userId": user_id,
            "public": False
        }
    })


async def get_user_tags(user_id: str):
    return await _get_tags({
        "$match": {
            "userId": user_id
        }
    })


async def get_all_public_tags():
    return await _get_tags({
        "$match": {
            "public": True
        }
    })
