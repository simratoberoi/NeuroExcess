from fastapi import APIRouter

from src.api.routes.auth_route import router as auth_router
from src.api.routes.image_route import router as image_router
from src.api.routes.ocr_route import router as ocr_router

router = APIRouter()

router.include_router(
    image_router,
    prefix="/image",
    tags=["Image AI"],
)

router.include_router(
    ocr_router,
    prefix="/ocr",
    tags=["OCR"],
)

router.include_router(
    auth_router,
    prefix="/auth",
    tags=["auth"],
)