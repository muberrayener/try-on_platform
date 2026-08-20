from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from app.core.database import db
from app.core.security import validate_csrf, verified_user
from app.services.storage import normalize_image, put_image, remove_object, get_object
from app.services.tasks import publish_background_removal

router = APIRouter(prefix="/person-images", tags=["person-images"])

def out(d): return {"id": str(d["_id"]), "width": d["width"], "height": d["height"], "status": d["status"],
    "background_removed": d.get("background_removed", False),
    "has_preview": bool(d.get("preview_key")),
    "error_code": d.get("error_code"),
    "created_at": d["created_at"]}

@router.post("", status_code=201, dependencies=[Depends(validate_csrf)])
async def upload(image: UploadFile = File(...), user=Depends(verified_user)):
    raw = await image.read(); content, width, height = normalize_image(raw)
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user["_id"],
        "original_key": "pending",
        "cutout_key": None,
        "preview_key": None,
        "width": width,
        "height": height,
        "status": "uploaded",
        "background_removed": False,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.person_images.insert_one(
    doc,
    )

    original_key = put_image(
        (
            f"users/{user['_id']}/"
            f"person-images/{result.inserted_id}/"
            f"original"
        ),
        content,
    )

    await db.person_images.update_one(
        {
            "_id": result.inserted_id,
        },
        {
            "$set": {
                "original_key": original_key,
            }
        },
    )
    try:
        task_id = publish_background_removal(
            str(result.inserted_id),
        )

        await db.person_images.update_one(
            {
                "_id": result.inserted_id,
            },
            {
                "$set": {
                    "background_task_id": task_id,
                }
            },
    )

    except Exception:
        await db.person_images.update_one(
            {
                "_id": result.inserted_id,
            },
            {
                "$set": {
                    "status": "failed",
                    "error_code": (
                        "BACKGROUND_ENQUEUE_FAILED"
                    ),
                }
            },
        )

        raise HTTPException(
            503,
            "Arka plan kaldırma işlemi başlatılamadı",
        )


    doc["_id"] = result.inserted_id
    doc["original_key"] = original_key

    return out(doc)

@router.get("")
async def list_images(user=Depends(verified_user)):
    return [out(x) async for x in db.person_images.find({"user_id": user["_id"], "status": {"$ne": "deleted"}}).sort("created_at", -1)]

@router.delete("/{image_id}", status_code=204, dependencies=[Depends(validate_csrf)])
async def delete_image(image_id: str, user=Depends(verified_user)):
    try: oid = ObjectId(image_id)
    except Exception as exc: raise HTTPException(400, "Geçersiz id") from exc
    image = await db.person_images.find_one_and_update({"_id": oid, "user_id": user["_id"]}, {"$set": {"status": "deleted"}})
    if not image: raise HTTPException(404, "Görsel bulunamadı")
    remove_object(image["original_key"])


@router.get("/{image_id}/preview")
async def preview_image(
    image_id: str,
    user=Depends(verified_user),
):
    try:
        oid = ObjectId(image_id)
    except Exception as exc:
        raise HTTPException(
            400,
            "Geçersiz görsel kimliği",
        ) from exc

    image = await db.person_images.find_one({
        "_id": oid,
        "user_id": user["_id"],
        "status": "ready",
    })

    if not image or not image.get("preview_key"):
        raise HTTPException(
            404,
            "Hazırlanmış görsel bulunamadı",
        )

    obj = get_object(
        image["preview_key"],
    )

    def stream():
        try:
            while chunk := obj.read(
                64 * 1024,
            ):
                yield chunk
        finally:
            obj.close()
            obj.release_conn()

    return StreamingResponse(
        stream(),
        media_type="image/webp",
        headers={
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )
