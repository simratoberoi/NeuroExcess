"""
Image Captioning Service
========================
Strategy (two-tier):

1. **HuggingFace Inference API** (primary) — calls the configured
   BLIP / ViT-GPT2 model and returns its generated caption.

2. **Local heuristic** (fallback) — if the HF API is unavailable
   (e.g. model loading, rate limit, network error) we fall back to a
   fast Pillow-based analysis that describes the image by its dominant
   colour and coarse structure.  This is intentionally lightweight and
   requires *no* additional model download.

The route layer receives a `(caption: str, source: str)` tuple.
"""

import io
import logging
from typing import Tuple

import httpx
from PIL import Image

from src.core.config import settings
from src.services.ai.client import HuggingFaceClient
from src.services.ai.exceptions import HuggingFaceException, ImageProcessingException

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Heuristic helpers
# ──────────────────────────────────────────────────────────────

# Basic colour name lookup (RGB bucket → name)
_COLOUR_BUCKETS: list[Tuple[Tuple[int, int, int], str]] = [
    ((0, 0, 0), "black"),
    ((255, 255, 255), "white"),
    ((128, 128, 128), "grey"),
    ((255, 0, 0), "red"),
    ((0, 128, 0), "green"),
    ((0, 0, 255), "blue"),
    ((255, 255, 0), "yellow"),
    ((255, 165, 0), "orange"),
    ((128, 0, 128), "purple"),
    ((165, 42, 42), "brown"),
    ((0, 128, 128), "teal"),
    ((255, 192, 203), "pink"),
]


def _nearest_colour(r: int, g: int, b: int) -> str:
    """Return the closest colour name for an RGB triplet."""
    best_name = "unknown"
    best_dist = float("inf")
    for (cr, cg, cb), name in _COLOUR_BUCKETS:
        dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
        if dist < best_dist:
            best_dist = dist
            best_name = name
    return best_name


def _heuristic_caption(image_bytes: bytes) -> str:
    """
    Generate a rough description of an image using only Pillow.

    Analyses:
    - Image dimensions and aspect ratio (landscape / portrait / square)
    - Dominant colour (from a 50×50 thumbnail for speed)
    - Colour variance (colourful vs. monochrome)
    - Brightness (dark / medium / bright)

    Returns a human-readable sentence.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size

    # Aspect ratio
    ratio = w / h
    if ratio > 1.3:
        orientation = "landscape"
    elif ratio < 0.77:
        orientation = "portrait"
    else:
        orientation = "square"

    # Dominant colour from thumbnail
    thumb = img.resize((50, 50), Image.LANCZOS)
    pixels = list(thumb.getdata())
    r_avg = sum(p[0] for p in pixels) // len(pixels)
    g_avg = sum(p[1] for p in pixels) // len(pixels)
    b_avg = sum(p[2] for p in pixels) // len(pixels)
    dominant = _nearest_colour(r_avg, g_avg, b_avg)

    # Brightness
    brightness = (r_avg * 299 + g_avg * 587 + b_avg * 114) // 1000
    if brightness < 64:
        bright_desc = "dark"
    elif brightness < 180:
        bright_desc = "medium-brightness"
    else:
        bright_desc = "bright"

    # Colour variance (colourful vs. greyscale)
    variance = max(abs(r_avg - g_avg), abs(g_avg - b_avg), abs(r_avg - b_avg))
    if variance < 20:
        colour_desc = "monochromatic"
    elif variance < 60:
        colour_desc = "muted"
    else:
        colour_desc = "colourful"

    return (
        f"A {bright_desc} {colour_desc} {orientation} image "
        f"with dominant {dominant} tones ({w}×{h} px)."
    )


# ──────────────────────────────────────────────────────────────
# Service
# ──────────────────────────────────────────────────────────────


class ImageCaptionService:
    """
    Generates alt-text captions for images.

    Primary:  HuggingFace Inference API (BLIP or equivalent).
    Fallback: Local Pillow-based heuristic.
    """

    def __init__(self) -> None:
        self.client = HuggingFaceClient(settings.HF_API_KEY)
        self.url = (
            f"https://api-inference.huggingface.co/models/{settings.HF_CAPTION_MODEL}"
        )
        self.timeout = settings.HF_TIMEOUT

    async def generate_caption(
        self,
        image_bytes: bytes,
    ) -> Tuple[str, str]:
        """
        Return ``(caption, source)`` where *source* is one of
        ``"huggingface"`` or ``"heuristic"``.

        Raises:
            ImageProcessingException: if the bytes cannot be decoded at all.
        """
        # Validate bytes are a real image before we do anything
        try:
            Image.open(io.BytesIO(image_bytes)).verify()
        except Exception as exc:
            raise ImageProcessingException(
                f"Cannot decode image bytes: {exc}"
            ) from exc

        # ── Primary: HuggingFace ──────────────────────────────
        try:
            response = await self.client.post(
                self.url, image_bytes, timeout=self.timeout
            )

            if response.status_code == 200:
                result = response.json()

                if isinstance(result, list) and result:
                    caption = result[0].get("generated_text", "").strip()
                    if caption:
                        logger.info("HuggingFace caption OK: %r", caption)
                        return caption, "huggingface"

                # Unexpected JSON shape — fall through to heuristic
                logger.warning(
                    "HuggingFace returned 200 but unexpected body: %s", result
                )

            elif response.status_code == 503:
                # Model is loading — common cold-start situation
                logger.warning(
                    "HuggingFace model loading (503). Using heuristic."
                )
            else:
                logger.warning(
                    "HuggingFace API error %d: %s",
                    response.status_code,
                    response.text[:200],
                )

        except (httpx.TimeoutException, httpx.RequestError) as exc:
            logger.warning("HuggingFace request failed: %s. Using heuristic.", exc)

        # ── Fallback: Heuristic ───────────────────────────────
        try:
            caption = _heuristic_caption(image_bytes)
            logger.info("Heuristic caption: %r", caption)
            return caption, "heuristic"
        except Exception as exc:
            raise ImageProcessingException(
                f"Both HuggingFace and heuristic captioning failed: {exc}"
            ) from exc


image_caption_service = ImageCaptionService()