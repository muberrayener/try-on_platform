from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from app.core.database import db
from app.core.security import validate_csrf, verified_user
from app.services.storage import get_object, normalize_image, put_image, remove_object
from app.services.tasks import publish_accessory_background_removal

router = APIRouter(prefix="/accessories", tags=["accessories"])
ACCESSORY_CATEGORIES = {
    "earrings": "Küpe",
    "necklace": "Kolye",
    "bracelet": "Bileklik",
    "watch": "Saat",
    "ring": "Yüzük",
    "other": "Diğer",
}


def out(d):
    accessory_id = str(d["_id"])
    return {
        "id": accessory_id,
        "name": d["name"],
        "category": d.get("category", "other"),
        "status": d.get("status", "ready"),
        "background_removed": d.get("background_removed", False),
        "active": d["active"],
        "image_url": f"/api/v1/accessories/{accessory_id}/image?v={d.get('status', 'ready')}" if d.get("image_key") and d.get("image_key") != "pending" else None,
    }


@router.get("")
async def list_accessories(user=Depends(verified_user)):
    return [out(x) async for x in db.accessories.find({
        "$or": [
            {"user_id": user["_id"]},
            {"created_by": user["_id"]}
        ],
        "active": True,
        "image_key": {"$exists": True, "$ne": "pending", "$ne": None}
    }).sort("created_at", -1)]


@router.post("", status_code=201, dependencies=[Depends(validate_csrf)])
async def create(name: str = Form(...), category: str = Form("other"), image: UploadFile = File(...), user=Depends(verified_user)):
    if category not in ACCESSORY_CATEGORIES:
        raise HTTPException(422, "Aksesuar kategorisi geçersiz")
    if not image or not getattr(image, "filename", None):
        raise HTTPException(422, "Aksesuar görseli gerekli")

    content, _, _ = normalize_image(await image.read())
    doc = {
        "user_id": user["_id"],
        "name": name.strip(),
        "category": category,
        "image_key": "pending",
        "cutout_key": None,
        "status": "uploaded",
        "background_removed": False,
        "active": True,
        "created_at": datetime.now(timezone.utc),
        "created_by": user["_id"],
    }
    result = await db.accessories.insert_one(doc)
    key = put_image(f"users/{user['_id']}/accessories/{result.inserted_id}", content)
    await db.accessories.update_one({"_id": result.inserted_id}, {"$set": {"image_key": key}})
    try:
        task_id = publish_accessory_background_removal(str(result.inserted_id))
        await db.accessories.update_one(
            {"_id": result.inserted_id},
            {"$set": {"background_task_id": task_id}},
        )
    except Exception:
        await db.accessories.update_one(
            {"_id": result.inserted_id},
            {"$set": {"status": "failed", "error_code": "BACKGROUND_ENQUEUE_FAILED"}},
        )
        raise HTTPException(503, "Aksesuar arka plan işlemi başlatılamadı")
    doc["_id"] = result.inserted_id
    return out(doc)


@router.get("/{accessory_id}/image")
async def get_accessory_image(accessory_id: str, user=Depends(verified_user)):
    try:
        oid = ObjectId(accessory_id)
    except Exception as exc:
        raise HTTPException(400, "Geçersiz id") from exc

    accessory = await db.accessories.find_one({
        "_id": oid,
        "$or": [
            {"user_id": user["_id"]},
            {"created_by": user["_id"]}
        ],
        "active": True,
    })

    if not accessory or not accessory.get("image_key") or accessory["image_key"] == "pending":
        raise HTTPException(404, "Görsel bulunamadı")

    try:
        image_key = accessory.get("cutout_key") or accessory["image_key"]
        response = get_object(image_key)
        return StreamingResponse(
            response.stream(32 * 1024),
            media_type="image/png" if accessory.get("cutout_key") else "image/webp",
        )
    except Exception as exc:
        raise HTTPException(404, "Görsel nesnesi bulunamadı") from exc


@router.delete("/{accessory_id}", status_code=204, dependencies=[Depends(validate_csrf)])
async def delete_accessory(accessory_id: str, user=Depends(verified_user)):
    try:
        oid = ObjectId(accessory_id)
    except Exception as exc:
        raise HTTPException(400, "Geçersiz id") from exc

    accessory = await db.accessories.find_one_and_update(
        {
            "_id": oid,
            "$or": [
                {"user_id": user["_id"]},
                {"created_by": user["_id"]}
            ],
        },
        {"$set": {"active": False}}
    )

    if not accessory:
        raise HTTPException(404, "Aksesuar bulunamadı")

    if accessory.get("image_key") and accessory["image_key"] != "pending":
        try:
            remove_object(accessory["image_key"])
        except Exception:
            pass
