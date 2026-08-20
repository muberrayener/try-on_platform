import secrets
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError
from app.core.config import settings
from app.core.database import db
from app.core.security import (create_access_token, current_user, hash_token, password_hash,
                               validate_csrf)
from app.services.email import send_email

router = APIRouter(prefix="/auth", tags=["auth"])

class Register(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_.-]+$")
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
class Login(BaseModel):
    login: str
    password: str
class EmailBody(BaseModel): email: EmailStr
class ResetBody(BaseModel): token: str; password: str = Field(min_length=10, max_length=128)

def public_user(u):
    return {"id": str(u["_id"]), "username": u["username"], "email": u["email"],
            "role": u["role"], "email_verified": u.get("email_verified", False)}

async def action_token(user_id, purpose):
    raw = secrets.token_urlsafe(32)
    await db.action_tokens.insert_one({"token_hash": hash_token(raw), "user_id": user_id, "purpose": purpose,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=30), "used_at": None})
    return raw

@router.post("/register", status_code=201)
async def register(body: Register):
    doc = {"username": body.username, "username_normalized": body.username.lower(), "email": str(body.email),
           "email_normalized": str(body.email).lower(), "password_hash": password_hash.hash(body.password),
           "role": "user", "active": True, "email_verified": False, "token_version": 0,
           "created_at": datetime.now(timezone.utc)}
    try: result = await db.users.insert_one(doc)
    except DuplicateKeyError as exc: raise HTTPException(409, "Kullanıcı adı veya e-posta kullanımda") from exc
    raw = await action_token(result.inserted_id, "verify")
    send_email(doc["email"], "E-postanı doğrula", f"{settings.base_url}/verify-email?token={raw}")
    doc["_id"] = result.inserted_id
    return public_user(doc)

@router.post("/login")
async def login(body: Login, response: Response):
    key = body.login.strip().lower()
    user = await db.users.find_one({"$or": [{"username_normalized": key}, {"email_normalized": key}], "active": True})
    if not user or not password_hash.verify(body.password, user["password_hash"]):
        raise HTTPException(401, "Giriş bilgileri hatalı")
    if not user.get("email_verified"): raise HTTPException(403, "E-posta doğrulaması gerekli")
    csrf = secrets.token_urlsafe(24)
    secure = settings.env == "production"
    response.set_cookie("access_token", create_access_token(user), httponly=True, secure=secure,
                        samesite="lax", max_age=settings.access_token_minutes * 60)
    response.set_cookie("csrf_token", csrf, httponly=False, secure=secure, samesite="lax",
                        max_age=settings.access_token_minutes * 60)
    return public_user(user)

@router.post("/logout", dependencies=[Depends(validate_csrf)])
async def logout(response: Response):
    response.delete_cookie("access_token"); response.delete_cookie("csrf_token")
    return {"message": "Çıkış yapıldı"}

@router.get("/me")
async def me(user=Depends(current_user)): return public_user(user)

@router.get("/verify-email")
async def verify_email(token: str):
    now = datetime.now(timezone.utc)
    row = await db.action_tokens.find_one_and_update(
        {"token_hash": hash_token(token), "purpose": "verify", "used_at": None, "expires_at": {"$gt": now}},
        {"$set": {"used_at": now}})
    if not row: raise HTTPException(400, "Bağlantı geçersiz veya süresi dolmuş")
    await db.users.update_one({"_id": row["user_id"]}, {"$set": {"email_verified": True}})
    return {"message": "E-posta doğrulandı"}

@router.post("/forgot-password")
async def forgot_password(body: EmailBody):
    user = await db.users.find_one({"email_normalized": str(body.email).lower(), "active": True})
    if user:
        raw = await action_token(user["_id"], "reset")
        send_email(user["email"], "Parolanı sıfırla", f"{settings.base_url}/reset-password?token={raw}")
    return {"message": "Hesap uygunsa bağlantı gönderildi"}

@router.post("/reset-password")
async def reset_password(body: ResetBody):
    now = datetime.now(timezone.utc)
    row = await db.action_tokens.find_one_and_update(
        {"token_hash": hash_token(body.token), "purpose": "reset", "used_at": None, "expires_at": {"$gt": now}},
        {"$set": {"used_at": now}})
    if not row: raise HTTPException(400, "Bağlantı geçersiz veya süresi dolmuş")
    await db.users.update_one({"_id": row["user_id"]}, {"$set": {"password_hash": password_hash.hash(body.password)}, "$inc": {"token_version": 1}})
    return {"message": "Parola değiştirildi"}
