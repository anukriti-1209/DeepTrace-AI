"""
DeepTrace — Watermark Stress Test
Takes a watermarked image through JPEG compression, cropping, resize, blur,
and verifies the fingerprint survives.

This is the DEMO MOMENT — proof of technical novelty.
"""

import io
import sys
import os
import time
import json

import numpy as np
from PIL import Image, ImageFilter

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from services.encoder.watermark import (
    encode_watermark,
    decode_watermark,
    generate_fingerprint,
)


def create_test_image(width: int = 512, height: int = 512) -> bytes:
    """Generate a synthetic sports-like test image."""
    rng = np.random.RandomState(42)

    # Create a field-like green gradient background
    img = np.zeros((height, width, 3), dtype=np.uint8)

    # Green field gradient
    for y in range(height):
        green = int(80 + 100 * (y / height))
        img[y, :, 1] = green
        img[y, :, 0] = int(20 + 40 * (y / height))

    # Some "action" patterns — circles, lines
    for _ in range(15):
        cx, cy = rng.randint(50, width - 50), rng.randint(50, height - 50)
        radius = rng.randint(10, 40)
        color = rng.randint(100, 255, size=3)
        for y in range(max(0, cy - radius), min(height, cy + radius)):
            for x in range(max(0, cx - radius), min(width, cx + radius)):
                if (x - cx) ** 2 + (y - cy) ** 2 < radius ** 2:
                    img[y, x] = color

    buf = io.BytesIO()
    Image.fromarray(img).save(buf, format="PNG")
    return buf.getvalue()


def apply_jpeg_compression(image_data: bytes, quality: int = 50) -> bytes:
    """Compress image as JPEG at given quality."""
    img = Image.open(io.BytesIO(image_data))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality)
    return buf.getvalue()


def apply_crop(image_data: bytes, crop_percent: float = 0.30) -> bytes:
    """Crop the image by removing crop_percent from edges, then resize back."""
    img = Image.open(io.BytesIO(image_data))
    w, h = img.size
    margin_x = int(w * crop_percent / 2)
    margin_y = int(h * crop_percent / 2)
    cropped = img.crop((margin_x, margin_y, w - margin_x, h - margin_y))
    # Resize back to original dimensions
    resized = cropped.resize((w, h), Image.LANCZOS)
    buf = io.BytesIO()
    resized.save(buf, format="PNG")
    return buf.getvalue()


def apply_resize(image_data: bytes, scale: float = 0.5) -> bytes:
    """Resize image down then back up."""
    img = Image.open(io.BytesIO(image_data))
    w, h = img.size
    small = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    restored = small.resize((w, h), Image.LANCZOS)
    buf = io.BytesIO()
    restored.save(buf, format="PNG")
    return buf.getvalue()


def apply_blur(image_data: bytes, radius: int = 2) -> bytes:
    """Apply Gaussian blur."""
    img = Image.open(io.BytesIO(image_data))
    blurred = img.filter(ImageFilter.GaussianBlur(radius=radius))
    buf = io.BytesIO()
    blurred.save(buf, format="PNG")
    return buf.getvalue()


def run_stress_test():
    """Run the full stress test suite and report results."""
    print("=" * 70)
    print("  🛡️  DeepTrace — Watermark Stress Test")
    print("=" * 70)

    # Generate test image
    print("\n📸 Creating test image (512x512 synthetic sports scene)...")
    original_data = create_test_image()

    # Generate fingerprint
    asset_id = "match-2024-ipl-final"
    licensee_id = "hotstar-india"
    fingerprint = generate_fingerprint(asset_id, licensee_id)
    print(f"🔑 Fingerprint: {fingerprint} (asset={asset_id}, licensee={licensee_id})")

    # Encode watermark
    print("\n⏳ Encoding watermark (dual-layer: spatial + DCT)...")
    t0 = time.time()
    watermarked_data, encode_meta = encode_watermark(original_data, fingerprint)
    encode_time = time.time() - t0
    print(f"   ✅ Encoded in {encode_time:.2f}s")
    print(f"   📊 PSNR: {encode_meta['psnr_db']} dB (>35 dB = visually identical)")

    # Verify clean extraction first
    print("\n🔍 Decoding from clean watermarked image...")
    t0 = time.time()
    fp, conf, details = decode_watermark(watermarked_data)
    decode_time = time.time() - t0
    print(f"   ✅ Fingerprint: {fp}")
    print(f"   🎯 Confidence: {conf:.1%}")
    print(f"   ⏱️  Decode time: {decode_time:.2f}s")

    results = {
        "clean": {"fingerprint": fp, "confidence": conf, "match": fp == fingerprint}
    }

    # ── Attack Gauntlet ──────────────────────────────────────────────────
    attacks = [
        ("JPEG Q50", lambda d: apply_jpeg_compression(d, quality=50)),
        ("JPEG Q30", lambda d: apply_jpeg_compression(d, quality=30)),
        ("Crop 30%", lambda d: apply_crop(d, crop_percent=0.30)),
        ("Resize 50%", lambda d: apply_resize(d, scale=0.5)),
        ("Gaussian Blur r=2", lambda d: apply_blur(d, radius=2)),
    ]

    print("\n" + "─" * 70)
    print("  🥊 ATTACK GAUNTLET")
    print("─" * 70)

    for attack_name, attack_fn in attacks:
        print(f"\n  ⚔️  {attack_name}...")
        attacked = attack_fn(watermarked_data)
        t0 = time.time()
        fp, conf, details = decode_watermark(attacked)
        dt = time.time() - t0
        match = fp == fingerprint if fp else False
        status = "✅ SURVIVED" if match else ("⚠️  PARTIAL" if fp else "❌ FAILED")
        print(f"     {status} | Conf: {conf:.1%} | FP: {fp or 'none'} | {dt:.2f}s")
        results[attack_name] = {"fingerprint": fp, "confidence": conf, "match": match}

    # Combined attack: JPEG + Crop + Resize + Blur
    print(f"\n  ⚔️  COMBINED (JPEG Q50 → Crop 30% → Resize 50% → Blur)...")
    attacked = watermarked_data
    attacked = apply_jpeg_compression(attacked, quality=50)
    attacked = apply_crop(attacked, crop_percent=0.30)
    attacked = apply_resize(attacked, scale=0.5)
    attacked = apply_blur(attacked, radius=2)
    t0 = time.time()
    fp, conf, details = decode_watermark(attacked)
    dt = time.time() - t0
    match = fp == fingerprint if fp else False
    status = "✅ SURVIVED" if match else ("⚠️  PARTIAL" if fp else "❌ FAILED")
    print(f"     {status} | Conf: {conf:.1%} | FP: {fp or 'none'} | {dt:.2f}s")
    results["COMBINED"] = {"fingerprint": fp, "confidence": conf, "match": match}

    # Summary
    print("\n" + "=" * 70)
    survived = sum(1 for v in results.values() if v["match"])
    total = len(results)
    print(f"  📊 RESULTS: {survived}/{total} tests passed")
    print(f"  🔑 Original fingerprint: {fingerprint}")
    print("=" * 70)

    return results


if __name__ == "__main__":
    run_stress_test()
