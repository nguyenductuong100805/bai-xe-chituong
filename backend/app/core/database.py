from contextlib import contextmanager
import os
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

_default_sqlite = (
    "sqlite:////tmp/car_rental.db"
    if os.environ.get("VERCEL")
    else "sqlite:///./car_rental.db"
)
DATABASE_URL = os.environ.get("DATABASE_URL", _default_sqlite)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)

_is_sqlite = DATABASE_URL.startswith("sqlite")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    echo=False,
)


if _is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all Code-First SQLAlchemy ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency providing a scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def transaction_scope(db: Session) -> Generator[Session, None, None]:
    """
    Explicit Transaction manager for DAL/Service operations.
    Commits on success and rolls back automatically on any exception.
    """
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
