
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

#DEFAULT_USER_ID: str = "a8aca40a-eac1-4382-8c0a-122102fd14d5"

motor_client = AsyncIOMotorClient("mongodb://mongoadmin:secret@localhost:27017")

database = motor_client["codever"]  # Single database instance