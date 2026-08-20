from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, Form, HTTPException
from app.core.database import db
from app.core.security import validate_csrf, verified_user

router = APIRouter(prefix="/daily-plans", tags=["daily-plans"])


def out(plan):
    return {
        "id": str(plan["_id"]),
        "time": plan["time"],
        "title": plan["title"],
        "active": plan.get("active", True),
    }


@router.get("")
async def list_daily_plans(user=Depends(verified_user)):
    return [
        out(plan)
        async for plan in db.daily_plans.find({
            "user_id": user["_id"],
            "active": True,
        }).sort("time", 1)
    ]


@router.post("", status_code=201, dependencies=[Depends(validate_csrf)])
async def create_daily_plan(
    time: str = Form(...),
    title: str = Form(...),
    user=Depends(verified_user),
):
    clean_time = time.strip()
    clean_title = title.strip()
    if len(clean_time) != 5 or clean_time[2] != ":":
        raise HTTPException(422, "Saat HH:MM formatında olmalı")
    try:
        hour, minute = (int(part) for part in clean_time.split(":", 1))
    except ValueError as exc:
        raise HTTPException(422, "Saat HH:MM formatında olmalı") from exc
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise HTTPException(422, "Geçerli bir saat girin")
    if not clean_title:
        raise HTTPException(422, "Plan adı gerekli")

    plan = {
        "user_id": user["_id"],
        "time": f"{hour:02d}:{minute:02d}",
        "title": clean_title,
        "active": True,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.daily_plans.insert_one(plan)
    plan["_id"] = result.inserted_id
    return out(plan)


@router.delete("/{plan_id}", status_code=204, dependencies=[Depends(validate_csrf)])
async def delete_daily_plan(plan_id: str, user=Depends(verified_user)):
    try:
        oid = ObjectId(plan_id)
    except Exception as exc:
        raise HTTPException(400, "Geçersiz id") from exc

    plan = await db.daily_plans.find_one_and_update(
        {"_id": oid, "user_id": user["_id"], "active": True},
        {"$set": {"active": False}},
    )
    if not plan:
        raise HTTPException(404, "Plan bulunamadı")
