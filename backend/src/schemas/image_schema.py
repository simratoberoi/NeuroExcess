from pydantic import BaseModel
from typing import Optional


class ImageResponse(BaseModel):
    filename: str
    content_type: str
    size: int


class CaptionResponse(BaseModel):
    filename: str
    content_type: str
    size: int
    alt_text: str
    source: str  # "huggingface" | "heuristic"
    confidence: Optional[float] = None


class OCRResponse(BaseModel):
    filename: str
    content_type: str
    size: int
    extracted_text: str
    word_count: int
    has_text: bool
    language: str
    source: str  # "easyocr"