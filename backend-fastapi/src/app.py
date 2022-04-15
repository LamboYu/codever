from fastapi import FastAPI, status
from routers.user import router as user_router
from routers.public import router as pubic_router

app = FastAPI()

app.include_router(user_router, prefix="/api/personal/users", tags=["user"]) 
app.include_router(pubic_router, prefix="/api/public", tags=["public"]) 
