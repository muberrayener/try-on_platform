import os
from celery import Celery

celery_app = Celery("tryon_worker", broker=os.environ["CELERY_BROKER_URL"], backend=os.environ["CELERY_RESULT_BACKEND"], include=["worker.tasks"])
celery_app.conf.update(task_default_queue="tryon", task_serializer="json", result_serializer="json",
    accept_content=["json"], task_track_started=True, worker_prefetch_multiplier=1,
    task_acks_late=True, task_reject_on_worker_lost=True,
    broker_transport_options={"visibility_timeout": 3600})
