import logging
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from src.core.database import get_db
from src.models.contact import build_contact_document
from src.schemas.contact_schema import ContactCreate, ContactData, ContactResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    response_model=ContactResponse,
    status_code=201,
    summary="Submit contact form",
)
async def submit_contact(
    payload: ContactCreate,
    db: Database = Depends(get_db),
) -> ContactResponse:
    """
    Accept a contact form submission and persist it to MongoDB.

    Returns HTTP 201 with the saved document's id and metadata on success.
    """
    doc = build_contact_document(
        name=payload.name,
        email=payload.email,
        topic=payload.topic.value,
        message=payload.message,
    )

    try:
        result = db.contacts.insert_one(doc)
    except Exception as exc:
        logger.exception("Failed to save contact submission from %s", payload.email)
        raise HTTPException(
            status_code=500,
            detail="Could not save your message. Please try again later.",
        ) from exc

    logger.info(
        "New contact submission from %s — topic: %s", payload.email, payload.topic
    )

    created_at = doc["created_at"]
    # pymongo returns naive UTC datetimes; make it timezone-aware for response
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    return ContactResponse(
        success=True,
        message="Your message has been successfully saved.",
        data=ContactData(
            id=str(result.inserted_id),
            name=doc["name"],
            email=doc["email"],
            topic=doc["topic"],
            created_at=created_at,
        ),
    )


@router.get(
    "/health",
    summary="Contact service health check",
    tags=["Contact"],
)
async def contact_health():
    """Simple liveness probe for the contact service."""
    return {"status": "OK", "service": "contact"}
