from celery import Celery
from app.core.config import settings
celery_client = Celery("tryon_api", broker=settings.celery_broker_url, backend=settings.celery_result_backend)

def publish_tryon(job_id: str) -> str:
    task = celery_client.send_task("tryon.process", kwargs={"job_id": job_id}, queue="tryon")
    return task.id

def publish_background_removal(
    image_id: str,
) -> str:
    task = celery_client.send_task(
        "person.remove_background",
        kwargs={
            "image_id": image_id,
        },
        queue="preprocessing",
    )

    return task.id