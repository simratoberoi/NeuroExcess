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

    # ── Auth / MongoDB ─────────────────────────────────────────
    MONGODB_URI: str 
    MONGODB_DB_NAME: str = "neuroexcess"

     # ── Auth / JWT ─────────────────────────────────────────────
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()