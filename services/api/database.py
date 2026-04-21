"""
DeepTrace — Database Models & Engine
Uses SQLAlchemy with SQLite (local) / PostgreSQL (Render).
Schema: Assets, Detections, Licenses
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Float,
    DateTime,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import declarative_base, sessionmaker

from services.api.config import settings

# ---------------------------------------------------------------------------
# Engine & Session
# ---------------------------------------------------------------------------
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=(settings.environment == "development"),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def generate_uuid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class Asset(Base):
    """
    Core asset table — every piece of protected media.
    """

    __tablename__ = "assets"

    asset_id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_id = Column(String(128), nullable=False, index=True)
    fingerprint_hash = Column(String(256), nullable=False)
    embedding_metadata = Column(JSON, nullable=True)
    license_rules = Column(JSON, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    def __repr__(self):
        return f"<Asset {self.asset_id} owner={self.owner_id}>"


class Detection(Base):
    """
    Every time a watermarked asset is detected in the wild.
    """

    __tablename__ = "detections"

    detection_id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), nullable=False, index=True)
    platform = Column(String(64), nullable=False)
    url = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False)
    detected_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    enforcement_status = Column(String(32), default="pending", nullable=False)

    __table_args__ = (
        Index("ix_detections_platform_status", "platform", "enforcement_status"),
    )

    def __repr__(self):
        return f"<Detection {self.detection_id} asset={self.asset_id} platform={self.platform}>"


class License(Base):
    """
    Licensee-specific fingerprint variants and territory restrictions.
    """

    __tablename__ = "licenses"

    license_id = Column(String(36), primary_key=True, default=generate_uuid)
    licensee_identity = Column(String(256), nullable=False)
    asset_id = Column(String(36), nullable=False, index=True)
    fingerprint_variant = Column(String(48), nullable=False, unique=True)
    territory_restrictions = Column(JSON, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    mutated_watermark_hash = Column(String(256), nullable=True)

    def __repr__(self):
        return f"<License {self.license_id} licensee={self.licensee_identity}>"


# ---------------------------------------------------------------------------
# Init
# ---------------------------------------------------------------------------


def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
