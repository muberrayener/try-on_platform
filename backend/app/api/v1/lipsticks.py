from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, Form, HTTPException

from app.core.database import db
from app.core.security import validate_csrf, verified_user

router = APIRouter(prefix="/lipsticks", tags=["lipsticks"])


def out(d):
    return {
        "id": str(d["_id"]),
        "name": d["name"],
        "color": d["color"],
        "active": d.get("active", True),
        "is_selected": d.get("is_selected", False),
    }


@router.get("")
async def list_lipsticks(user=Depends(verified_user)):
    return [
        out(x)
        async for x in db.lipsticks.find(
            {
                "user_id": user["_id"],
                "active": True,
            }
        ).sort("created_at", -1)
    ]


@router.post(
    "",
    status_code=201,
    dependencies=[Depends(validate_csrf)]
)
async def create_lipstick(
    name: str = Form(...),
    color: str = Form(...),
    user=Depends(verified_user),
):
    lipstick = {
        "user_id": user["_id"],
        "name": name.strip(),
        "color": color,
        "active": True,
        "is_selected": False,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.lipsticks.insert_one(
        lipstick
    )

    lipstick["_id"] = result.inserted_id

    return out(lipstick)


@router.patch(
    "/{lipstick_id}/select",
    dependencies=[Depends(validate_csrf)]
)
async def select_lipstick(
    lipstick_id: str,
    user=Depends(verified_user),
):
    try:
        oid = ObjectId(lipstick_id)
    except Exception as exc:
        raise HTTPException(
            400,
            "Geçersiz id"
        ) from exc

    await db.lipsticks.update_many(
        {
            "user_id": user["_id"]
        },
        {
            "$set": {
                "is_selected": False
            }
        }
    )

    update = await db.lipsticks.update_one(
        {
            "_id": oid,
            "user_id": user["_id"],
            "active": True,
        },
        {
            "$set": {
                "is_selected": True
            }
        }
    )

    if update.modified_count == 0:
        raise HTTPException(
            404,
            "Ruj bulunamadı"
        )

    return {"ok": True}


@router.delete(
    "/{lipstick_id}",
    status_code=204,
    dependencies=[Depends(validate_csrf)]
)
async def delete_lipstick(
    lipstick_id: str,
    user=Depends(verified_user),
):
    try:
        oid = ObjectId(lipstick_id)
    except Exception as exc:
        raise HTTPException(
            400,
            "Geçersiz id"
        ) from exc

    lipstick = await db.lipsticks.find_one_and_update(
        {
            "_id": oid,
            "user_id": user["_id"],
        },
        {
            "$set": {
                "active": False
            }
        }
    )

    if not lipstick:
        raise HTTPException(
            404,
            "Ruj bulunamadı"
        )