"""
Image AI Routes
===============
Endpoints:

  POST /image/upload   — Validate an image and return basic metadata.
  POST /image/caption  — Generate alt text via HuggingFace (BLIP) + heuristic fallback.
  POST /image/ocr      — Extract text from an image.
                         Uses Tesseract if installed, otherwise HuggingFace TrOCR.
  GET  /image/health   — Health check.
"""

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from src.schemas.image_schema import CaptionResponse, ImageResponse, OCRResponse
from src.services.ai.exceptions import ImageProcessingException, OCRException
from src.services.ai.image_caption_service import image_caption_service
from src.services.ocr.ocr_service import ocr_service
from src.utils.validators import validate_image


logger = logging.getLogger(__name__)

router = APIRouter()


# ──────────────────────────────────────────────────────────────
# POST /image/upload
# ──────────────────────────────────────────────────────────────


@router.post(
    "/upload",
    response_model=ImageResponse,
    summary="Upload and validate an image",
    description="Accepts JPEG, PNG, or WEBP images up to 10 MB. Returns basic metadata.",
)
async def upload_image(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WEBP)"),
) -> ImageResponse:
    size = await validate_image(file)
    return ImageResponse(
        filename=file.filename or "unknown",
        content_type=file.content_type or "application/octet-stream",
        size=size,
    )


# ──────────────────────────────────────────────────────────────
# POST /image/caption
# ──────────────────────────────────────────────────────────────


@router.post(
    "/caption",
    response_model=CaptionResponse,
    summary="Generate alt text for an image",
    description=(
        "Captions the image using HuggingFace BLIP (primary). "
        "Falls back to a local Pillow heuristic if the API is unavailable."
    ),
)
async def caption_image(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WEBP)"),
) -> CaptionResponse:
    size = await validate_image(file)
    image_bytes = await file.read()

    try:
        alt_text, source = await image_caption_service.generate_caption(image_bytes)
    except ImageProcessingException as exc:
        logger.error("Image processing error: %s", exc)
        raise HTTPException(status_code=422, detail=f"Could not process image: {exc}")
    except Exception as exc:
        logger.exception("Unexpected captioning error.")
        raise HTTPException(status_code=500, detail=f"Internal captioning error: {exc}")

    return CaptionResponse(
        filename=file.filename or "unknown",
        content_type=file.content_type or "application/octet-stream",
        size=size,
        alt_text=alt_text,
        source=source,
    )


# ──────────────────────────────────────────────────────────────
# POST /image/ocr
# ──────────────────────────────────────────────────────────────


@router.post(
    "/ocr",
    response_model=OCRResponse,
    summary="Extract text from an image (OCR)",
    description=(
        "Extracts text from an image using EasyOCR (runs locally, no external API calls required).\n"
        "The first execution might take a moment to download the language model if not already present.\n\n"
        "The `source` field in the response will be 'easyocr'."
    ),
)
async def ocr_image(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WEBP)"),
) -> OCRResponse:
    size = await validate_image(file)
    image_bytes = await file.read()

    try:
        text, word_count, has_text, source = await ocr_service.extract_text(image_bytes)
    except OCRException as exc:
        err = str(exc)
        logger.error("OCR error: %s", err)
        # 503 when the model is still loading
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


# ──────────────────────────────────────────────────────────────
# GET /image/health
# ──────────────────────────────────────────────────────────────


@router.get(
    "/health",
    summary="Image service health check",
)
async def health():
    return {
        "status": "ok",
        "ocr_engine": "easyocr",
        "ocr_available": ocr_service.is_available(),
        "ocr_language": ocr_service.language,
        "captioning_model": image_caption_service.url,
    }