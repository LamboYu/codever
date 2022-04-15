from datetime import datetime
from typing import List, Optional
from datetime import date
from pydantic import BaseModel, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class CodeSnippetPost(BaseModel):
    code: str
    comment: str
    commentAfter: str
    #language: Optional[str] = None

class CodeSnippetPublic(CodeSnippetPost):
    pass

class SnippetBase(BaseModel):
    title: str
    codeSnippets: List[CodeSnippetPost]
    tags: List[str]
    userId: str
    public: Optional[bool] = False
    sourceUrl: str
    copiedFromId: Optional[str] = None

class SnippetPost(SnippetBase):
    lastAccessedAt: Optional[datetime] = None
    
class SnippetPut(SnippetPost):
    updatedAt: datetime

class SnippetDB(SnippetBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    createdAt: date = Field(default_factory=datetime.now)
    updatedAt: Optional[date] = None
#    userDisplayName: str
#    language: str
#    likeCount: int
    
#    ownerVisitCount: str
    class Config: 
        json_encoders = {ObjectId: str}

class SnippetPublic(SnippetDB):
    pass