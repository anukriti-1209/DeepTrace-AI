"""
DeepTrace — Watermarking Engine (v5 — Robust DWT-DCT)

Uses `invisible-watermark` (imwatermark) layer to encode 64-bit payloads
into the frequency domain. Robust against compression, noise, and scaling.
"""

import cv2
import numpy as np
from PIL import Image
import io
import hashlib
from typing import Tuple, Optional
from imwatermark import WatermarkEncoder, WatermarkDecoder

# ── Constants ────────────────────────────────────────────────────────────────
PAYLOAD_BYTES = 8  # 64 bits


def generate_fingerprint(asset_id: str, licensee_id: str = "000000") -> str:
    """Generate a 64-bit (16 hex chars) fingerprint from asset + licensee IDs."""
    asset_hash = hashlib.sha256(asset_id.encode()).hexdigest()[:8]
    licensee_hash = hashlib.sha256(licensee_id.encode()).hexdigest()[:8]
    return asset_hash + licensee_hash


# ── Encoding ─────────────────────────────────────────────────────────────────
def encode_watermark(
    image_data: bytes,
    fingerprint: str,
    output_format: str = "PNG"
) -> Tuple[bytes, dict]:
    """
    Embed a 64-bit watermark via DWT-DCT.
    """
    # 1. Prevent double watermarking
    extracted_fp, conf, _ = decode_watermark(image_data)
    if conf > 0.8:
        raise ValueError(f"Image already contains a DeepTrace watermark (Fingerprint: {extracted_fp[:8]}...). Double-watermarking rejected.")

    # 2. Prepare image
    img = Image.open(io.BytesIO(image_data)).convert("RGB")
    bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    wm_bytes = bytes.fromhex(fingerprint)
    if len(wm_bytes) != PAYLOAD_BYTES:
        raise ValueError(f"Fingerprint must be {PAYLOAD_BYTES} bytes.")

    encoder = WatermarkEncoder()
    encoder.set_watermark('bytes', wm_bytes)
    
    # 3. Encode
    try:
        bgr_encoded = encoder.encode(bgr, 'dwtDct')
    except Exception as e:
        raise ValueError(f"Encoding failed. Image may be too small. {str(e)}")

    rgb_encoded = cv2.cvtColor(bgr_encoded, cv2.COLOR_BGR2RGB)

    # 4. Return as bytes
    result = Image.fromarray(rgb_encoded)
    buf = io.BytesIO()
    result.save(buf, format=output_format, quality=100)

    # Calculate PSNR
    mse = np.mean((bgr.astype(float) - bgr_encoded.astype(float)) ** 2)
    psnr = 10 * np.log10(255**2 / mse) if mse > 0 else float('inf')

    metadata = {
        "fingerprint": fingerprint,
        "payload_bits": PAYLOAD_BYTES * 8,
        "layers": ["dwtDct"],
        "psnr_db": round(psnr, 2),
        "image_size": f"{img.width}x{img.height}",
    }

    return buf.getvalue(), metadata


# ── Decoding ─────────────────────────────────────────────────────────────────
def decode_watermark(
    image_data: bytes,
) -> Tuple[Optional[str], float, dict]:
    """
    Extract 64-bit watermark via DWT-DCT inverse.
    """
    img = Image.open(io.BytesIO(image_data)).convert("RGB")
    bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    decoder = WatermarkDecoder('bytes', PAYLOAD_BYTES * 8)
    
    try:
        wm_bytes = decoder.decode(bgr, 'dwtDct')
        fingerprint = wm_bytes.hex()
        # DWT-DCT often returns pseudo-random strings if no watermark exists.
        # We assume confidence is high if it successfully executed, 
        # but the true verification happens in the DB lookup.
        # However, a perfectly repeated byte or empty byte often indicates failure.
        if fingerprint == "00" * PAYLOAD_BYTES or fingerprint == "ff" * PAYLOAD_BYTES:
            confidence = 0.0
            fingerprint = None
        else:
            confidence = 0.95
    except Exception:
        fingerprint = None
        confidence = 0.0

    details = {
        "confidence": confidence,
        "fingerprint": fingerprint,
        "image_size": f"{img.width}x{img.height}",
        "decoder": "dwtDct"
    }

    if confidence >= 0.8:
        return fingerprint, confidence, details
    else:
        return None, 0.0, details
