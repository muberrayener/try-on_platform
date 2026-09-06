from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.database import db
from app.core.security import validate_csrf, verified_user
from app.services.storage import get_object
from app.services.tasks import publish_tryon

router = APIRouter(prefix="/tryons", tags=["tryons"])
class CreateTryOn(BaseModel): person_image_id: str; garment_id: str

def out(job):
    return {
        "id": str(job["_id"]),
        "status": job["status"],
        "progress": job.get("progress", 0),
        "has_result": bool(job.get("result_key")),
        "garment_id": str(job.get("garment_id", "")),
        "error_code": job.get("error_code"),
        "created_at": job["created_at"],
    }

@router.post("", status_code=202, dependencies=[Depends(validate_csrf)])
async def create(body: CreateTryOn, user=Depends(verified_user)):
    try: person_id, garment_id = ObjectId(body.person_image_id), ObjectId(body.garment_id)
    except Exception as exc: raise HTTPException(400, "Geçersiz id") from exc
    if await db.tryon_jobs.count_documents({"user_id": user["_id"], "status": {"$in": ["queued", "running", "preprocessing"]}}) >= 2:
        raise HTTPException(429, "En fazla iki aktif işlem olabilir")
    person = await db.person_images.find_one({"_id": person_id, "user_id": user["_id"], "status": "ready"})
    garment = await db.garments.find_one({
        "_id": garment_id,
        "$or": [
            {"user_id": user["_id"]},
            {"created_by": user["_id"]}
        ],
        "active": True
    })
    if not person or not garment: raise HTTPException(404, "Fotoğraf veya kıyafet bulunamadı")
    if not garment.get("cutout_key") or garment.get("status") != "ready":
        raise HTTPException(409, "Kıyafetin arka planı henüz kaldırılmadı")
    doc = {"user_id": user["_id"], "person_image_id": person_id, "garment_id": garment_id,
           "person_key": person["cutout_key"], "garment_key": garment["cutout_key"], "category": garment["category"],
           "status": "queued", "progress": 0, "created_at": datetime.now(timezone.utc)}
    result = await db.tryon_jobs.insert_one(doc)
    try: task_id = publish_tryon(str(result.inserted_id))
    except Exception:
        await db.tryon_jobs.update_one({"_id": result.inserted_id}, {"$set": {"status": "failed", "error_code": "ENQUEUE_FAILED"}})
        raise HTTPException(503, "İşlem kuyruğa gönderilemedi")
    await db.tryon_jobs.update_one({"_id": result.inserted_id}, {"$set": {"celery_task_id": task_id}})
    doc["_id"] = result.inserted_id; return out(doc)

@router.get("")
async def list_jobs(user=Depends(verified_user)):
    cursor = db.tryon_jobs.find({
        "user_id": user["_id"],
    }).sort(
        "created_at",
        -1,
    )

    return [
        out(job)
        async for job in cursor
    ]

@router.get("/{job_id}")
async def get_job(job_id: str, user=Depends(verified_user)):
    try: oid = ObjectId(job_id)
    except Exception as exc: raise HTTPException(400, "Geçersiz id") from exc
    job = await db.tryon_jobs.find_one({"_id": oid, "user_id": user["_id"]})
    if not job: raise HTTPException(404, "İş bulunamadı")
    return out(job)

@router.get("/{job_id}/result")
async def result(job_id: str, user=Depends(verified_user)):
    try: oid = ObjectId(job_id)
    except Exception as exc: raise HTTPException(400, "Geçersiz id") from exc
    job = await db.tryon_jobs.find_one({"_id": oid, "user_id": user["_id"], "status": "completed"})
    if not job or not job.get("result_key"): raise HTTPException(404, "Sonuç bulunamadı")
    obj = get_object(job["result_key"])
    def stream():
        try:
            while chunk := obj.read(64 * 1024): yield chunk
        finally: obj.close(); obj.release_conn()
    return StreamingResponse(stream(), media_type="image/png", headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})
