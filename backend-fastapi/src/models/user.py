from datetime import datetime
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field

from models.snippet import PyObjectId
from bson import ObjectId

class Profile(BaseModel):
    displayName: str
    imageUrl: str

class Search(BaseModel):
    text: str
    language: Optional[str]
    createdAt: Optional[datetime]
    lastAccessedAt: Optional[datetime]
    searchDomain: str
    count: int
    saved: bool

class UserPost(BaseModel):
    userId: str
    readLater: List[str]
    likes: List[str]
    watchedTags: List[str]
    ignoredTags: List[str]
    pinned: List[str]
    favorites: List[str]
    history: List[str]
    followers: List[str]
    profile: Profile
    
    searches: List[Search]
    recentSearches: List[Search]
    welcomeAck: bool

class UserPut(UserPost):
    id: str = Field(None, alias="_id")

class UserDB(UserPost):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    createdAt: date = Field(default_factory=datetime.now)
    updatedAt: Optional[date] = None
    
    class Config: 
        json_encoders = {ObjectId: str}
    