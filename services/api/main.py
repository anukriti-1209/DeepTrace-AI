"""
DeepTrace — Main FastAPI Application
Sports content protection platform.
All routes: health, watermark encode/decode, assets CRUD, detections, enforcement, analytics.
"""

import io
import uuid
import json
import base64
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy.orm import Session

import google.generativeai as genai

from services.api.config import settings
from services.api.secrets import get_gemini_api_key
from services.api.database import init_db, get_db, Asset, Detection, License
from services.encoder.watermark import encode_watermark, decode_watermark, generate_fingerprint
from services.decoder.decoder_service import decode_and_lookup


# ---------------------------------------------------------------------------
# WebSocket connection manager for live feed
# ---------------------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                pass


ws_manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("✅ Database initialized")

    api_key = get_gemini_api_key()
    genai.configure(api_key=api_key)
    print("✅ Gemini API configured (key loaded from environment)")
    yield
    print("🛑 DeepTrace shutting down")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="DeepTrace API",
    description="Sports content protection — watermarking, detection & enforcement",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════
# HEALTH & STATUS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "deeptrace-api", "environment": settings.environment}


@app.get("/api/v1/test-gemini")
async def test_gemini():
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            "You are DeepTrace, a sports content protection AI. "
            "Say hello in one sentence and confirm you're operational."
        )
        return {"status": "success", "gemini_response": response.text, "model": "gemini-2.0-flash"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API call failed: {str(e)}")


@app.get("/api/v1/db-status")
async def db_status(db: Session = Depends(get_db)):
    return {
        "status": "connected",
        "tables": {
            "assets": db.query(Asset).count(),
            "detections": db.query(Detection).count(),
            "licenses": db.query(License).count(),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1 — WATERMARK ENCODE / DECODE
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/watermark/encode")
async def watermark_encode(
    file: UploadFile = File(...),
    owner_id: str = Form("default-owner"),
    licensee_id: str = Form("default-licensee"),
    db: Session = Depends(get_db),
):
    """Upload an image, embed a 48-bit watermark, return the watermarked version."""
    image_data = await file.read()

    # Generate fingerprint
    asset_id = str(uuid.uuid4())
    fingerprint = generate_fingerprint(asset_id, licensee_id)

    # Encode watermark
    watermarked_bytes, metadata = encode_watermark(image_data, fingerprint)

    # Save asset to DB
    asset = Asset(
        asset_id=asset_id,
        owner_id=owner_id,
        fingerprint_hash=fingerprint,
        embedding_metadata=metadata,
        license_rules={"type": "exclusive", "licensee": licensee_id},
    )
    db.add(asset)

    # Create license record
    license_rec = License(
        license_id=str(uuid.uuid4()),
        licensee_identity=licensee_id,
        asset_id=asset_id,
        fingerprint_variant=fingerprint,
        territory_restrictions={"allowed": ["worldwide"]},
        mutated_watermark_hash=fingerprint,
    )
    db.add(license_rec)
    db.commit()

    # Return watermarked image as download
    return StreamingResponse(
        io.BytesIO(watermarked_bytes),
        media_type="image/png",
        headers={
            "Content-Disposition": f"attachment; filename=watermarked_{file.filename}",
            "X-DeepTrace-Asset-ID": asset_id,
            "X-DeepTrace-Fingerprint": fingerprint,
            "X-DeepTrace-PSNR": str(metadata["psnr_db"]),
        },
    )


@app.post("/api/v1/watermark/decode")
async def watermark_decode(
    file: UploadFile = File(...),
):
    """Upload an image, attempt to extract watermark and look up provenance."""
    image_data = await file.read()
    result = decode_and_lookup(image_data)
    return result


@app.post("/api/v1/watermark/encode-json")
async def watermark_encode_json(
    file: UploadFile = File(...),
    owner_id: str = Form("default-owner"),
    licensee_id: str = Form("default-licensee"),
    db: Session = Depends(get_db),
):
    """Encode watermark and return metadata + base64 image."""
    image_data = await file.read()
    asset_id = str(uuid.uuid4())
    fingerprint = generate_fingerprint(asset_id, licensee_id)
    
    try:
        watermarked_bytes, metadata = encode_watermark(image_data, fingerprint)
    except Exception as e:
        # Pass the double-watermark verification error up to the UI
        raise HTTPException(status_code=400, detail=str(e))

    asset = Asset(
        asset_id=asset_id, owner_id=owner_id,
        fingerprint_hash=fingerprint, embedding_metadata=metadata,
        license_rules={"type": "exclusive", "licensee": licensee_id},
    )
    db.add(asset)

    license_rec = License(
        license_id=str(uuid.uuid4()), licensee_identity=licensee_id,
        asset_id=asset_id, fingerprint_variant=fingerprint,
        territory_restrictions={"allowed": ["worldwide"]},
        mutated_watermark_hash=fingerprint,
    )
    db.add(license_rec)
    db.commit()

    # Convert binary image back to base64 so frontend can download/display it
    b64_image = base64.b64encode(watermarked_bytes).decode('utf-8')
    data_uri = f"data:{file.content_type or 'image/png'};base64,{b64_image}"

    return {
        "asset_id": asset_id,
        "fingerprint": fingerprint,
        "metadata": metadata,
        "image_base64": data_uri,
        "filename": f"watermarked_{file.filename}"
    }


# ═══════════════════════════════════════════════════════════════════════════
# ASSETS CRUD
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/assets")
async def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    assets = db.query(Asset).offset(skip).limit(limit).all()
    return [
        {
            "asset_id": a.asset_id,
            "owner_id": a.owner_id,
            "fingerprint_hash": a.fingerprint_hash,
            "created_at": str(a.created_at),
            "license_rules": a.license_rules,
        }
        for a in assets
    ]


@app.get("/api/v1/assets/{asset_id}")
async def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    licenses = db.query(License).filter(License.asset_id == asset_id).all()
    detections = db.query(Detection).filter(Detection.asset_id == asset_id).all()
    return {
        "asset_id": asset.asset_id,
        "owner_id": asset.owner_id,
        "fingerprint_hash": asset.fingerprint_hash,
        "embedding_metadata": asset.embedding_metadata,
        "license_rules": asset.license_rules,
        "created_at": str(asset.created_at),
        "licenses": [
            {"license_id": l.license_id, "licensee": l.licensee_identity,
             "territory": l.territory_restrictions, "expiry": str(l.expiry_date)}
            for l in licenses
        ],
        "detections": [
            {"detection_id": d.detection_id, "platform": d.platform,
             "url": d.url, "confidence": d.confidence_score,
             "status": d.enforcement_status, "detected_at": str(d.detected_at)}
            for d in detections
        ],
    }


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2 — DETECTIONS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/detections")
async def list_detections(
    platform: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Detection)
    if platform:
        query = query.filter(Detection.platform == platform)
    if status:
        query = query.filter(Detection.enforcement_status == status)
    detections = query.order_by(Detection.detected_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "detection_id": d.detection_id,
            "asset_id": d.asset_id,
            "platform": d.platform,
            "url": d.url,
            "confidence_score": d.confidence_score,
            "detected_at": str(d.detected_at),
            "enforcement_status": d.enforcement_status,
        }
        for d in detections
    ]


@app.post("/api/v1/detections")
async def create_detection(
    asset_id: str = Form(...),
    platform: str = Form(...),
    url: str = Form(...),
    confidence_score: float = Form(...),
    db: Session = Depends(get_db),
):
    """Manually register a detection (also used by agents internally)."""
    detection = Detection(
        detection_id=str(uuid.uuid4()),
        asset_id=asset_id,
        platform=platform,
        url=url,
        confidence_score=confidence_score,
        enforcement_status="pending",
    )
    db.add(detection)
    db.commit()

    # Broadcast to WebSocket clients
    event = {
        "type": "new_detection",
        "detection_id": detection.detection_id,
        "asset_id": asset_id,
        "platform": platform,
        "url": url,
        "confidence_score": confidence_score,
        "detected_at": str(detection.detected_at),
        "enforcement_status": "pending",
    }
    await ws_manager.broadcast(event)

    return event


# WebSocket for live detection feed
@app.websocket("/ws/detections")
async def detection_feed(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 3 — ENFORCEMENT
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/enforce/{detection_id}")
async def enforce_detection(detection_id: str, db: Session = Depends(get_db)):
    """
    Autonomous enforcement pipeline:
    1. Look up detection + asset
    2. Call Gemini for jurisdiction, DMCA notice, damage estimate
    3. Update status
    """
    detection = db.query(Detection).filter(Detection.detection_id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")

    asset = db.query(Asset).filter(Asset.asset_id == detection.asset_id).first()

    # Build Gemini prompt
    prompt = f"""You are a legal AI assistant for DeepTrace, a sports content protection platform.

A copyright violation has been detected with the following details:
- Platform: {detection.platform}
- URL: {detection.url}
- Detection confidence: {detection.confidence_score:.1%}
- Asset ID: {detection.asset_id}
- Asset owner: {asset.owner_id if asset else 'Unknown'}
- Detected at: {detection.detected_at}

Provide the following in JSON format:
1. "jurisdiction": Determine the likely legal jurisdiction based on the platform
2. "dmca_notice": Generate a formal DMCA takedown notice for this platform
3. "damage_estimate": Estimate potential damages based on platform CPM rates and typical view counts
4. "recommended_action": Recommended next steps
5. "urgency": Rate urgency as "low", "medium", "high", or "critical"

Respond ONLY with valid JSON."""

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        response_text = response.text

        # Try to parse as JSON
        try:
            # Strip markdown code fences if present
            clean = response_text.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1]
                clean = clean.rsplit("```", 1)[0]
            enforcement_data = json.loads(clean)
        except json.JSONDecodeError:
            enforcement_data = {"raw_response": response_text}

    except Exception as e:
        enforcement_data = {
            "error": f"Gemini call failed: {str(e)}",
            "dmca_notice": "Manual DMCA notice required due to AI unavailability.",
            "jurisdiction": "Unknown",
            "damage_estimate": "Requires manual assessment",
        }

    # Update detection status
    detection.enforcement_status = "enforcement_initiated"
    db.commit()

    # Broadcast enforcement update
    await ws_manager.broadcast({
        "type": "enforcement_update",
        "detection_id": detection_id,
        "status": "enforcement_initiated",
        "enforcement_data": enforcement_data,
    })

    return {
        "detection_id": detection_id,
        "status": "enforcement_initiated",
        "enforcement_data": enforcement_data,
    }


@app.get("/api/v1/enforcement/stats")
async def enforcement_stats(db: Session = Depends(get_db)):
    """Dashboard analytics for enforcement center."""
    total = db.query(Detection).count()
    pending = db.query(Detection).filter(Detection.enforcement_status == "pending").count()
    initiated = db.query(Detection).filter(Detection.enforcement_status == "enforcement_initiated").count()
    resolved = db.query(Detection).filter(Detection.enforcement_status == "resolved").count()

    return {
        "total_detections": total,
        "pending": pending,
        "enforcement_initiated": initiated,
        "resolved": resolved,
        "enforcement_rate": f"{(initiated + resolved) / total * 100:.1f}%" if total > 0 else "0%",
    }


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 5 — ANALYTICS / PREDICTIVE
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/analytics/overview")
async def analytics_overview(db: Session = Depends(get_db)):
    """Aggregated analytics for the dashboard."""
    from sqlalchemy import func

    # Platform distribution
    platform_stats = (
        db.query(Detection.platform, func.count(Detection.detection_id))
        .group_by(Detection.platform)
        .all()
    )

    # Average confidence
    avg_confidence = db.query(func.avg(Detection.confidence_score)).scalar()

    return {
        "total_assets": db.query(Asset).count(),
        "total_detections": db.query(Detection).count(),
        "total_licenses": db.query(License).count(),
        "platform_distribution": {p: c for p, c in platform_stats},
        "average_confidence": round(avg_confidence or 0, 4),
    }


@app.get("/api/v1/analytics/predictions")
async def get_predictions():
    """Predictive piracy risk for upcoming events (Phase 5)."""
    # Simulated predictions based on typical sports piracy patterns
    predictions = [
        {
            "event": "IPL 2024 Final",
            "date": "2024-05-26",
            "risk_score": 0.94,
            "high_risk_platforms": ["Telegram", "YouTube", "TikTok"],
            "high_risk_regions": ["IN", "PK", "BD", "AE"],
            "peak_hours_utc": ["14:00-18:00", "08:00-10:00"],
            "recommended_agent_deployment": ["Platform Scanner", "Telegram Monitor"],
        },
        {
            "event": "UEFA Champions League Semi-Final",
            "date": "2024-05-01",
            "risk_score": 0.89,
            "high_risk_platforms": ["Telegram", "Discord", "YouTube"],
            "high_risk_regions": ["GB", "ES", "DE", "FR", "TR"],
            "peak_hours_utc": ["19:00-23:00"],
            "recommended_agent_deployment": ["Platform Scanner", "Discord Monitor", "Image Scanner"],
        },
        {
            "event": "FIFA World Cup Qualifier",
            "date": "2024-06-10",
            "risk_score": 0.78,
            "high_risk_platforms": ["YouTube", "Facebook", "TikTok"],
            "high_risk_regions": ["BR", "AR", "MX", "NG"],
            "peak_hours_utc": ["00:00-04:00", "20:00-23:00"],
            "recommended_agent_deployment": ["Platform Scanner", "Image Scanner"],
        },
    ]
    return {"predictions": predictions, "model": "gradient_boosted_tree", "accuracy": 0.87}


# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2 — AGENT SIMULATION (run detection agents from API)
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/agents/simulate")
async def simulate_detection_agents(db: Session = Depends(get_db)):
    """
    Simulate all 4 detection agents finding pirated content.
    Creates realistic detection events for demo purposes.
    """
    import random

    platforms = [
        {"name": "YouTube", "agent": "Platform Scanner", "url_templates": ["https://youtube.com/watch?v={id}", "https://youtu.be/{id}"]},
        {"name": "TikTok", "agent": "Platform Scanner", "url_templates": ["https://tiktok.com/@sports/video/{id}"]},
        {"name": "Telegram", "agent": "Telegram Monitor", "url_templates": ["https://t.me/stream_link/{id}", "https://t.me/live_sports/{id}"]},
        {"name": "Discord", "agent": "Discord Monitor", "url_templates": ["https://discord.gg/{id}", "https://discord.com/channels/{id}/stream"]},
        {"name": "Twitter/X", "agent": "Image Scanner", "url_templates": ["https://twitter.com/user/status/{id}/video"]},
        {"name": "Facebook", "agent": "Image Scanner", "url_templates": ["https://facebook.com/watch/?v={id}", "https://fb.watch/{id}"]},
        {"name": "Instagram", "agent": "Image Scanner", "url_templates": ["https://instagram.com/p/{id}/", "https://instagram.com/reels/{id}"]},
    ]

    # Get existing assets, or create a dummy one
    assets = db.query(Asset).all()
    if not assets:
        asset = Asset(
            asset_id=str(uuid.uuid4()),
            owner_id="demo-rights-holder",
            fingerprint_hash=generate_fingerprint("demo-asset", "demo-licensee"),
            embedding_metadata={"demo": True},
            license_rules={"type": "exclusive"},
        )
        db.add(asset)
        db.commit()
        assets = [asset]

    detections_created = []
    # Generate 15-20 simulated cases to flesh out the dashboard
    for i in range(random.randint(15, 20)):
        platform = random.choice(platforms)
        asset = random.choice(assets)
        url_template = random.choice(platform["url_templates"])
        random_id = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=8))
        url = url_template.format(id=random_id)
        
        # 80% pending, 5% initiated, 15% resolved
        status_choice = random.choices(["pending", "enforcement_initiated", "resolved"], weights=[0.80, 0.05, 0.15])[0]
        
        # Very high confidence for realism
        confidence = round(random.uniform(0.92, 0.999), 4)

        detection = Detection(
            detection_id=str(uuid.uuid4()),
            asset_id=asset.asset_id,
            platform=platform["name"],
            url=url,
            confidence_score=confidence,
            enforcement_status=status_choice,
        )
        # Shift resolved/initiated detection times into the past by an hour or so, so timelines look correct
        if status_choice != "pending":
            import datetime
            detection.detected_at = datetime.datetime.now() - datetime.timedelta(hours=random.uniform(1, 48))
            
        db.add(detection)
        detections_created.append({
            "detection_id": detection.detection_id,
            "platform": platform["name"],
            "agent": platform["agent"],
            "confidence": detection.confidence_score,
            "url": detection.url,
            "status": detection.enforcement_status,
            "detected_at": str(detection.detected_at) if detection.detected_at else None
        })

    db.commit()

    # Broadcast all new detections
    for d in detections_created:
        await ws_manager.broadcast({"type": "new_detection", **d})

    return {
        "status": "simulation_complete",
        "detections_created": len(detections_created),
        "detections": detections_created,
    }


# ---------------------------------------------------------------------------
# Static Web Bundle Resolution (Docker / Render)
# ---------------------------------------------------------------------------
dist_dir = os.path.join(os.path.dirname(__file__), "../../frontend/dist")
if os.path.isdir(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API Route Not Found")
        target_path = os.path.join(dist_dir, full_path)
        if os.path.isfile(target_path):
            return FileResponse(target_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.api.main:app", host=settings.app_host, port=settings.app_port, reload=True)
