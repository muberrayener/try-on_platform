from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING
from app.api.v1.router import router
from app.core.config import settings
from app.core.database import db, client
from app.core.security import password_hash

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.users.create_index([("username_normalized", ASCENDING)], unique=True)
    await db.users.create_index([("email_normalized", ASCENDING)], unique=True)
    await db.action_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.tryon_jobs.create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])
    if not await db.users.find_one({"email_normalized": settings.admin_email.lower()}):
        await db.users.insert_one({"username": settings.admin_username, "username_normalized": settings.admin_username.lower(),
            "email": settings.admin_email, "email_normalized": settings.admin_email.lower(),
            "password_hash": password_hash.hash(settings.admin_password), "role": "admin", "active": True,
            "email_verified": True, "token_version": 0, "created_at": datetime.now(timezone.utc)})
    yield
    client.close()

app = FastAPI(title="Virtual Try-On API", version="1.0.0", lifespan=lifespan, docs_url="/api/docs", openapi_url="/api/openapi.json")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True,
                   allow_methods=["GET", "POST", "PATCH", "DELETE"],
                   allow_headers=["Content-Type", "X-CSRF-Token", "X-Request-ID"])

@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if not request.url.path.startswith("/api/docs"):
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response

@app.get("/api/health")
async def health():
    await db.command("ping")
    return {"status": "ok"}

app.include_router(router, prefix="/api/v1")
