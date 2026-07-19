"""
OCR Service — EasyOCR (Pure Python, No System Dependencies)
===========================================================
Uses EasyOCR for text extraction. EasyOCR is a pure-Python OCR library
powered by PyTorch. No system binary installation required — just pip.

First run behaviour:
  • EasyOCR downloads the English model (~100 MB) to ~/.EasyOCR/ once.
  • All subsequent runs load from disk cache — fully offline.

Supported image types: JPEG, PNG, WEBP (validator enforces this upstream).

Pre-processing:
  • Upscale if either dimension < 384px (improves accuracy on small images)
  • RGB conversion (EasyOCR handles the rest internally)

Returns: (text, word_count, has_text, source="easyocr")
"""

import io
import logging
from functools import lru_cache
from typing import Tuple

import numpy as np
from PIL import Image

from src.core.config import settings
from src.services.ai.exceptions import OCRException

logger = logging.getLogger(__name__)

_MIN_DIM = 384


# ──────────────────────────────────────────────────────────────
# Lazy-load EasyOCR reader (heavy initialisation, do it once)
# ──────────────────────────────────────────────────────────────

_reader = None
_reader_error: str | None = None


# Map Tesseract 3-letter language codes to EasyOCR 2-letter codes
_LANG_MAP = {
    "eng": "en",
    "fra": "fr",
    "deu": "de",
    "spa": "es",
    "ita": "it",
    "por": "pt",
    "chi_sim": "ch_sim",
    "chi_tra": "ch_tra",
    "jpn": "ja",
    "kor": "ko",
    "rus": "ru",
    "hin": "hi",
    "ara": "ar",
}


def _get_reader():
    """
    Return a cached EasyOCR Reader instance.
    Initialised on first call; raises OCRException on failure.
    """
    global _reader, _reader_error

    if _reader is not None:
        return _reader

    if _reader_error is not None:
        raise OCRException(_reader_error)

    try:
        import easyocr  # noqa: PLC0415
        logger.info("Initialising EasyOCR reader (may download models on first run)…")
        
        # Parse and convert language codes (e.g. "eng,fra" -> ["en", "fr"])
        langs = []
        for lang in settings.OCR_LANGUAGE.split(","):
            lang = lang.strip().lower()
            langs.append(_LANG_MAP.get(lang, lang))

        _reader = easyocr.Reader(
            langs,
            gpu=False,          # CPU-only — no CUDA required
            verbose=False,
        )
        logger.info("EasyOCR reader ready.")
        return _reader
    except ImportError:
        _reader_error = (
            "easyocr is not installed. "
            "Run: uv pip install easyocr"
        )
        raise OCRException(_reader_error)
    except Exception as exc:
        _reader_error = f"EasyOCR initialisation failed: {exc}"
        raise OCRException(_reader_error)


# ──────────────────────────────────────────────────────────────
# Image pre-processing
# ──────────────────────────────────────────────────────────────


def _preprocess(image_bytes: bytes) -> np.ndarray:
    """
    Load image, upscale if tiny, return as NumPy RGB array
    (the format EasyOCR expects).
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size

    if w < _MIN_DIM or h < _MIN_DIM:
        scale = max(_MIN_DIM / w, _MIN_DIM / h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        logger.debug("Upscaled image from %dx%d to %dx%d", w, h, *img.size)

    return np.array(img)


# ──────────────────────────────────────────────────────────────
# OCR Service
# ──────────────────────────────────────────────────────────────


class OCRService:
    """
    Extracts text from images using EasyOCR.

    • No system installation required (pure Python + pip).
    • No network needed for inference after first-run model download.
    • GPU optional — runs well on CPU.

    Return tuple: ``(text, word_count, has_text, source)``
    source is always ``"easyocr"``.
    """

    _TROCR_MODEL = "easyocr"   # kept for health endpoint compatibility

    def __init__(self) -> None:
        self.language = settings.OCR_LANGUAGE

    def tesseract_available(self) -> bool:
        return False

    def is_available(self) -> bool:
        try:
            import easyocr  # noqa: F401
            return True
        except ImportError:
            return False

    async def extract_text(
        self,
        image_bytes: bytes,
    ) -> Tuple[str, int, bool, str]:
        """
        Run EasyOCR on *image_bytes*.

        EasyOCR is synchronous, but we wrap it in an async method so the
        route signature stays consistent. For a production app with many
        concurrent requests, run this in a ThreadPoolExecutor.

        Returns:
            text:       All detected text joined with newlines.
            word_count: Number of words.
            has_text:   True if any text was found.
            source:     Always ``"easyocr"``.

        Raises:
            OCRException: If EasyOCR is not installed or fails.
        """
        try:
            image_array = _preprocess(image_bytes)
        except Exception as exc:
            raise OCRException(f"Image pre-processing failed: {exc}") from exc

        try:
            reader = _get_reader()
        except OCRException:
            raise

        try:
            # EasyOCR returns list of (bbox, text, confidence)
            results = reader.readtext(
                image_array,
                detail=1,
                paragraph=False,    # keep individual detections
            )
        except Exception as exc:
            raise OCRException(f"EasyOCR inference failed: {exc}") from exc

        # Join detected text blocks, filter low-confidence noise
        lines = [text for (_, text, conf) in results if conf > 0.2]
        full_text = "\n".join(lines).strip()
        words = full_text.split() if full_text else []

        logger.info(
            "EasyOCR: %d detections → %d words (conf threshold 0.2)",
            len(results),
            len(words),
        )
        return full_text, len(words), len(words) > 0, "easyocr"


ocr_service = OCRService()
