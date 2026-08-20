import io, os, time
from datetime import datetime, timezone
from bson import ObjectId
from celery import Task
from minio import Minio
from PIL import Image, ImageDraw
from pymongo import MongoClient
from worker.celery_app import celery_app
from worker.background import (
    create_preview,
    remove_garment_background,
    remove_person_background,
)

mongo = MongoClient(os.environ["MONGODB_URL"])[os.getenv("MONGODB_DB", "tryon")]
minio = Minio(os.environ["MINIO_ENDPOINT"], access_key=os.environ["MINIO_ACCESS_KEY"],
              secret_key=os.environ["MINIO_SECRET_KEY"], secure=os.getenv("MINIO_SECURE", "false").lower() == "true")
bucket = os.getenv("MINIO_BUCKET", "tryon-private")

def download(key):
    obj = minio.get_object(bucket, key)
    try: return obj.read()
    finally: obj.close(); obj.release_conn()

@celery_app.task(bind=True, name="tryon.process", autoretry_for=(ConnectionError,), retry_backoff=True, max_retries=3)
def process_tryon(self: Task, job_id: str):
    oid = ObjectId(job_id)
    job = mongo.tryon_jobs.find_one_and_update({"_id": oid, "status": "queued"}, {"$set": {"status": "preprocessing", "progress": 10, "started_at": datetime.now(timezone.utc)}})
    if not job: return {"ignored": True}
    try:
        person = Image.open(io.BytesIO(download(job["person_key"]))).convert("RGB")
        garment = Image.open(io.BytesIO(download(job["garment_key"]))).convert("RGB")
        mongo.tryon_jobs.update_one({"_id": oid}, {"$set": {"status": "running", "progress": 40}})
        time.sleep(2)
        # Güvenli entegrasyon iskeleti: gerçek VTON pipeline'ı bu blokla değiştirilir.
        garment.thumbnail((person.width // 3, person.height // 3))
        canvas = person.copy(); canvas.paste(garment, (20, 20))
        ImageDraw.Draw(canvas).rectangle((10, 10, 360, 70), fill=(20, 20, 20))
        ImageDraw.Draw(canvas).text((24, 28), "MOCK TRY-ON - MODEL BAGLANMADI", fill=(255, 255, 255))
        out = io.BytesIO(); canvas.save(out, "WEBP", quality=90); payload = out.getvalue()
        result_key = f"users/{job['user_id']}/tryons/{oid}/result.webp"
        minio.put_object(bucket, result_key, io.BytesIO(payload), len(payload), content_type="image/webp")
        mongo.tryon_jobs.update_one({"_id": oid}, {"$set": {"status": "completed", "progress": 100, "result_key": result_key, "completed_at": datetime.now(timezone.utc)}})
        return {"job_id": job_id, "status": "completed"}
    except Exception as exc:
        mongo.tryon_jobs.update_one({"_id": oid}, {"$set": {"status": "failed", "error_code": type(exc).__name__, "completed_at": datetime.now(timezone.utc)}})
        raise




@celery_app.task(
    bind=True,
    name="person.remove_background",
    autoretry_for=(ConnectionError,),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def remove_background_task(
    self: Task,
    image_id: str,
):
    oid = ObjectId(image_id)

    image = mongo.person_images.find_one_and_update(
        {
            "_id": oid,
            "status": "uploaded",
        },
        {
            "$set": {
                "status": "background_removal",
                "background_task_id": self.request.id,
                "updated_at": datetime.now(
                    timezone.utc,
                ),
            }
        },
    )

    if not image:
        return {
            "ignored": True,
        }

    try:
        original_bytes = download(
            image["original_key"],
        )

        cutout_bytes = remove_person_background(
            original_bytes,
        )

        preview_bytes = create_preview(
            cutout_bytes,
        )

        base_key = (
            f"users/{image['user_id']}/"
            f"person-images/{image['_id']}"
        )

        cutout_key = f"{base_key}/cutout.png"
        preview_key = f"{base_key}/preview.webp"

        minio.put_object(
            bucket,
            cutout_key,
            io.BytesIO(cutout_bytes),
            len(cutout_bytes),
            content_type="image/png",
        )

        minio.put_object(
            bucket,
            preview_key,
            io.BytesIO(preview_bytes),
            len(preview_bytes),
            content_type="image/webp",
        )

        mongo.person_images.update_one(
            {
                "_id": oid,
            },
            {
                "$set": {
                    "status": "ready",
                    "cutout_key": cutout_key,
                    "preview_key": preview_key,
                    "background_removed": True,
                    "updated_at": datetime.now(
                        timezone.utc,
                    ),
                },
                "$unset": {
                    "error_code": "",
                },
            },
        )

        return {
            "image_id": image_id,
            "status": "ready",
        }

    except Exception as exc:
        mongo.person_images.update_one(
            {
                "_id": oid,
            },
            {
                "$set": {
                    "status": "failed",
                    "error_code": type(exc).__name__,
                    "updated_at": datetime.now(
                        timezone.utc,
                    ),
                }
            },
        )

        raise


@celery_app.task(
    bind=True,
    name="garment.remove_background",
    autoretry_for=(ConnectionError,),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def remove_garment_background_task(self: Task, garment_id: str):
    oid = ObjectId(garment_id)
    garment = mongo.garments.find_one_and_update(
        {"_id": oid, "status": "uploaded"},
        {"$set": {"status": "background_removal", "background_task_id": self.request.id, "updated_at": datetime.now(timezone.utc)}},
    )
    if not garment:
        return {"ignored": True}

    try:
        cutout_bytes = remove_garment_background(download(garment["image_key"]))
        cutout_key = f"users/{garment['user_id']}/garments/{oid}/cutout.png"
        minio.put_object(bucket, cutout_key, io.BytesIO(cutout_bytes), len(cutout_bytes), content_type="image/png")
        mongo.garments.update_one(
            {"_id": oid},
            {"$set": {"status": "ready", "cutout_key": cutout_key, "background_removed": True, "updated_at": datetime.now(timezone.utc)}, "$unset": {"error_code": ""}},
        )
        return {"garment_id": garment_id, "status": "ready"}
    except Exception as exc:
        mongo.garments.update_one(
            {"_id": oid},
            {"$set": {"status": "failed", "error_code": type(exc).__name__, "updated_at": datetime.now(timezone.utc)}},
        )
        raise
