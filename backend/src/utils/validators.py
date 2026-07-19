from fastapi import HTTPException, UploadFile

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp"
}

MAX_SIZE = 10 * 1024 * 1024  # 10 MB


async def validate_image(file: UploadFile):

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed."
        )

    content = await file.read()

    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image size exceeds 10 MB."
        )

    await file.seek(0)

    return len(content)