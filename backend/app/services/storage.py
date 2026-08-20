from io import BytesIO
from uuid import uuid4
from PIL import Image, ImageOps, UnidentifiedImageError
from minio import Minio
from fastapi import HTTPException
from app.core.config import settings

client = Minio(settings.minio_endpoint, access_key=settings.minio_access_key,
               secret_key=settings.minio_secret_key, secure=settings.minio_secure)

def normalize_image(raw: bytes) -> tuple[bytes, int, int]:
    if not raw or len(raw) > settings.max_image_mb * 1024 * 1024:
        raise HTTPException(413, "Görsel boyutu sınırı aşıldı")
    try:
        probe = Image.open(BytesIO(raw)); probe.verify()
        image = Image.open(BytesIO(raw)); image = ImageOps.exif_transpose(image).convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(415, "Geçerli JPEG, PNG veya WebP görseli gerekli") from exc
    if image.width * image.height > settings.max_image_pixels:
        raise HTTPException(413, "Görsel piksel sınırı aşıldı")
    output = BytesIO(); image.save(output, "WEBP", quality=92, method=6)
    return output.getvalue(), image.width, image.height

def put_image(prefix: str, content: bytes) -> str:
    key = f"{prefix}/{uuid4()}.webp"
    client.put_object(settings.minio_bucket, key, BytesIO(content), len(content), content_type="image/webp")
    return key

def remove_object(key: str):
    client.remove_object(settings.minio_bucket, key)

def get_object(key: str):
    return client.get_object(settings.minio_bucket, key)
