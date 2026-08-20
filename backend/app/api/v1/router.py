from fastapi import APIRouter
from app.api.v1 import auth, garments, person_images, tryons
router = APIRouter()
router.include_router(auth.router)
router.include_router(person_images.router)
router.include_router(garments.router)
router.include_router(tryons.router)
