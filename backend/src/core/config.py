from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # ── HuggingFace API (used for image captioning only) ──────
    HF_API_KEY: str

    # Image captioning model (BLIP)
    HF_CAPTION_MODEL: str = "Salesforce/blip-image-captioning-large"

    # Timeout for HuggingFace API calls (seconds)
    HF_TIMEOUT: int = 90

    # ── OCR settings ──────────────────────────────────────────
    # EasyOCR language code(s). "eng" = English.
    # Multiple: OCR_LANGUAGE=eng,fr  (comma-separated, handled in service)
    OCR_LANGUAGE: str = "eng"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()