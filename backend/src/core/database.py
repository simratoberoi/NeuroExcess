

from pymongo import MongoClient
from pymongo.database import Database

from src.core.config import settings

_client = MongoClient(settings.MONGODB_URI)
_db = _client[settings.MONGODB_DB_NAME]


def get_db() -> Database:
    """FastAPI dependency returning the shared Mongo database handle."""
    return _db


def ensure_indexes() -> None:
    """
    Create required indexes. Call this once at app startup (see
    INTEGRATION_NOTES.md) — safe to call repeatedly, Mongo no-ops if the
    index already exists with the same spec.
    """
    _db.users.create_index("email", unique=True)
    _db.users.create_index("username", unique=True)