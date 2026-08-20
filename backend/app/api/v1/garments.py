from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from app.core.database import db
from app.core.security import validate_csrf, verified_user
from app.services.storage import normalize_image, put_image, remove_object

router = APIRouter(prefix="/garments", tags=["garments"])
def out(d): return {"id": str(d["_id"]), "name": d["name"], "category": d["category"], "active": d["active"]}

@router.get("")
async def list_garments(user=Depends(verified_user)):
    return [out(x) async for x in db.garments.find({
        "$or": [
            {"user_id": user["_id"]},
            {"created_by": user["_id"]}
        ],
        "active": True
    }).sort("created_at", -1)]

@router.post("", status_code=201, dependencies=[Depends(validate_csrf)])
async def create(name: str = Form(...), category: str = Form(...), image: UploadFile = File(...), user=Depends(verified_user)):
    if category not in {"upper_body", "lower_body", "dress", "kombin"}:
        raise HTTPException(422, "Kategori geçersiz")
    content, _, _ = normalize_image(await image.read())
    doc = {
        "user_id": user["_id"],
        "name": name.strip(),
        "category": category,
        "image_key": "pending",
        "active": True,
        "created_at": datetime.now(timezone.utc),
        "created_by": user["_id"]
    }
    result = await db.garments.insert_one(doc)
    key = put_image(f"users/{user['_id']}/garments/{result.inserted_id}", content)
    await db.garments.update_one({"_id": result.inserted_id}, {"$set": {"image_key": key}})
    doc["_id"] = result.inserted_id
    return out(doc)

@router.delete("/{garment_id}", status_code=204, dependencies=[Depends(validate_csrf)])
async def delete_garment(garment_id: str, user=Depends(verified_user)):
    try:
        oid = ObjectId(garment_id)
    except Exception as exc:
        raise HTTPException(400, "Geçersiz id") from exc
    garment = await db.garments.find_one_and_update(
        {
            "_id": oid,
            "$or": [
                {"user_id": user["_id"]},
                {"created_by": user["_id"]}
            ]
        },
        {"$set": {"active": False}}
    )
    if not garment:
        raise HTTPException(404, "Kıyafet bulunamadı")
    if garment.get("image_key") and garment["image_key"] != "pending":
        try:
            remove_object(garment["image_key"])
        except Exception:
            pass


