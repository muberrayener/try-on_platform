from fastapi import APIRouter
from app.api.v1 import accessories, auth, daily_plans, garments, person_images, tryons, lipsticks
router = APIRouter()
router.include_router(auth.router)
router.include_router(person_images.router)
router.include_router(garments.router)
router.include_router(accessories.router)
router.include_router(lipsticks.router)
router.include_router(daily_plans.router)
router.include_router(tryons.router)

