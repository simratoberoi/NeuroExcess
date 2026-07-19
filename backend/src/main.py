import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.router import router

# ──────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# App
# ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="NeuroExcess Backend",
    version="1.0.0",
    description=(
        "AI-powered image accessibility API.\n\n"
        "**Features**\n"
        "- `/image/caption` — Generate alt text using HuggingFace BLIP (+ local fallback)\n"
        "- `/image/ocr`     — Extract text from images via EasyOCR\n"
        "- `/ocr/extract`   — Dedicated OCR endpoint\n"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ──────────────────────────────────────────────────────────────
# CORS — allow the browser extension + local dev
# ──────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to your extension origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────
# Global exception handler (safety net)
# ──────────────────────────────────────────────────────────────


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception for %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal error occurred."},
    )


# ──────────────────────────────────────────────────────────────
# Routers
# ──────────────────────────────────────────────────────────────

app.include_router(router)


# ──────────────────────────────────────────────────────────────
# Root
# ──────────────────────────────────────────────────────────────


@app.get("/", tags=["Root"])
async def home():
    return {
        "message": "NeuroExcess Backend Running",
        "docs": "/docs",
        "endpoints": {
            "image_caption": "POST /image/caption",
            "image_ocr":     "POST /image/ocr",
            "ocr_extract":   "POST /ocr/extract",
            "image_upload":  "POST /image/upload",
            "health_image":  "GET  /image/health",
            "health_ocr":    "GET  /ocr/health",
        },
    }