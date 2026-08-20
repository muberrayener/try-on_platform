FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 NUMBA_CACHE_DIR=/tmp/numba_cache U2NET_HOME=/models/rembg
RUN useradd -r -u 10002 worker && mkdir -p /models/rembg /tmp/numba_cache && chown -R worker:worker /models/rembg /tmp/numba_cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY worker ./worker
USER worker
CMD ["celery", "-A", "worker.celery_app:celery_app", "worker", "--loglevel=INFO", "--queues=tryon", "--concurrency=1"]
