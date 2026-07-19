"""
OCR standalone route — mounted at /ocr/extract.
Uses EasyOCR running locally.
"""

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from src.schemas.image_schema import OCRResponse
from src.services.ai.exceptions import OCRException
from src.services.ocr.ocr_service import ocr_service
from src.utils.validators import validate_image

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/extract",
    response_model=OCRResponse,
    summary="Extract text from an image (OCR)",
    description=(
        "Extracts text using **EasyOCR** running locally.\n\n"
        "No system installation or external API keys required. "
        "The first request might take a moment to download the language model."
    ),
)
async def extract_text(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WEBP)"),
) -> OCRResponse:
    size = await validate_image(file)
    image_bytes = await file.read()

    try:
        text, word_count, has_text, source = await ocr_service.extract_text(image_bytes)
    except OCRException as exc:
        err = str(exc)
        logger.error("OCR error: %s", err)
        status = 503 if "loading" in err.lower() or "warming" in err.lower() else 422
        raise HTTPException(status_code=status, detail=err)
    except Exception as exc:
        logger.exception("Unexpected OCR error.")
        raise HTTPException(status_code=500, detail=f"Internal OCR error: {exc}")

    return OCRResponse(
        filename=file.filename or "unknown",
        content_type=file.content_type or "application/octet-stream",
        size=size,
        extracted_text=text,
        word_count=word_count,
        has_text=has_text,
        language=ocr_service.language,
        source=source,
    )


@router.get("/health", summary="OCR health check")
async def health():
    return {
        "status": "ok",
        "engine": "easyocr",
        "available": ocr_service.is_available(),
        "language": ocr_service.language,
    }
