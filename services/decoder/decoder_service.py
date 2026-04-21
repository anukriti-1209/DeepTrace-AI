"""
DeepTrace — Decoder Service
Extracts watermarks and looks up asset provenance in the database.
Target: <200ms per frame.
"""

import time
from typing import Optional, Tuple

from services.encoder.watermark import decode_watermark
from services.api.database import SessionLocal, Asset, License


def decode_and_lookup(image_data: bytes) -> dict:
    """
    Full decode pipeline:
    1. Extract fingerprint from image
    2. Look up asset in database
    3. Look up licensee if fingerprint variant matches
    4. Return full provenance

    Returns dict with fingerprint, confidence, asset info, timing.
    """
    t_start = time.time()

    # Step 1: Extract watermark
    fingerprint, confidence, decode_details = decode_watermark(image_data)

    t_decode = time.time() - t_start

    result = {
        "decode_time_ms": round(t_decode * 1000, 1),
        "confidence": confidence,
        "fingerprint": fingerprint,
        "decode_details": decode_details,
        "asset": None,
        "licensee": None,
        "provenance_verified": False,
    }

    if fingerprint is None:
        result["status"] = "no_watermark_detected"
        return result

    # Step 2: Database lookup
    db = SessionLocal()
    try:
        # Look up by fingerprint hash
        asset = db.query(Asset).filter(
            Asset.fingerprint_hash == fingerprint
        ).first()

        if asset:
            result["asset"] = {
                "asset_id": asset.asset_id,
                "owner_id": asset.owner_id,
                "created_at": str(asset.created_at),
                "license_rules": asset.license_rules,
            }
            result["provenance_verified"] = True
            result["status"] = "asset_identified"

        # Look up licensee variant
        license_rec = db.query(License).filter(
            License.fingerprint_variant == fingerprint
        ).first()

        if license_rec:
            result["licensee"] = {
                "license_id": license_rec.license_id,
                "licensee_identity": license_rec.licensee_identity,
                "territory_restrictions": license_rec.territory_restrictions,
                "expiry_date": str(license_rec.expiry_date) if license_rec.expiry_date else None,
            }
            result["status"] = "licensee_identified"

        if not asset and not license_rec:
            result["status"] = "fingerprint_not_in_database"

    finally:
        db.close()

    result["total_time_ms"] = round((time.time() - t_start) * 1000, 1)
    return result
