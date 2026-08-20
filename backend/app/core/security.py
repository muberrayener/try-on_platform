import hashlib, json, secrets
from datetime import datetime, timedelta, timezone
from fastapi import Cookie, Depends, Header, HTTPException, Request
from jwcrypto import jwe, jwk
from pwdlib import PasswordHash
from bson import ObjectId
from app.core.config import settings
from app.core.database import db

password_hash = PasswordHash.recommended()
jwe_key = jwk.JWK(kty="oct", k=settings.jwe_key_base64)

def hash_token(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()

def create_access_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = json.dumps({"sub": str(user["_id"]), "ver": user.get("token_version", 0),
                          "iat": int(now.timestamp()),
                          "exp": int((now + timedelta(minutes=settings.access_token_minutes)).timestamp())})
    token = jwe.JWE(payload.encode(), protected={"alg": "dir", "enc": "A256GCM", "typ": "JWT"})
    token.add_recipient(jwe_key)
    return token.serialize(compact=True)

def decode_access_token(raw: str) -> dict:
    token = jwe.JWE(); token.deserialize(raw, key=jwe_key)
    payload = json.loads(token.payload)
    if payload["exp"] < int(datetime.now(timezone.utc).timestamp()):
        raise ValueError("expired")
    return payload

async def current_user(access_token: str | None = Cookie(None)):
    if not access_token:
        raise HTTPException(401, "Oturum gerekli")
    try:
        payload = decode_access_token(access_token)
        user = await db.users.find_one({"_id": ObjectId(payload["sub"]), "active": True})
        if not user or user.get("token_version", 0) != payload.get("ver", 0): raise ValueError("revoked")
        return user
    except Exception as exc:
        raise HTTPException(401, "Oturum geçersiz veya süresi dolmuş") from exc

async def verified_user(user=Depends(current_user)):
    if not user.get("email_verified"):
        raise HTTPException(403, "E-posta doğrulaması gerekli")
    return user

async def admin_user(user=Depends(verified_user)):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin yetkisi gerekli")
    return user

async def validate_csrf(request: Request, csrf_cookie: str | None = Cookie(None, alias="csrf_token"),
                        csrf_header: str | None = Header(None, alias="X-CSRF-Token")):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
            raise HTTPException(403, "CSRF doğrulaması başarısız")
