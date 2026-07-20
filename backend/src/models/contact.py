from datetime import datetime, timezone


def build_contact_document(name: str, email: str, topic: str, message: str) -> dict:
    """Return a dict ready to be inserted into the `contacts` collection."""
    return {
        "name": name,
        "email": email.lower(),
        "topic": topic,
        "message": message,
        "created_at": datetime.now(timezone.utc),
    }
