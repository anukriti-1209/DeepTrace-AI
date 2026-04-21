# 🛡️ DeepTrace

**Autonomous sports content protection platform** — watermarking, detection, and enforcement powered by AI.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DeepTrace Platform                       │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Frontend │ API      │ Encoder  │ Decoder  │ Detection Agents│
│ (React)  │ (FastAPI)│ (HiDDeN) │ (TF)     │ (ADK)           │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│                    Database (PostgreSQL)                      │
│                    Message Queue (Redis)                      │
│                    Gemini AI (Enforcement)                    │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start (Local)

```bash
# 1. Clone & enter
git clone <repo-url> && cd DeepTrace

# 2. Create environment
python -m venv .venv && source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# 5. Run
python -m uvicorn services.api.main:app --reload

# 6. Verify
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/test-gemini
```

## Project Structure

```
DeepTrace/
├── services/
│   ├── api/          # FastAPI backend (Phase 0)
│   ├── encoder/      # Watermark encoder (Phase 1)
│   └── decoder/      # Watermark decoder (Phase 1)
├── agents/           # Detection agent fleet (Phase 2)
├── frontend/         # React dashboard (Phase 4)
├── infra/            # Schema, deploy configs
├── scripts/          # Deploy & setup scripts
├── demo/             # Demo recordings & evidence
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

## Security

- ✅ Zero credentials in codebase
- ✅ API keys loaded from environment variables
- ✅ `.env` is gitignored
- ✅ All secrets managed via Render environment variables in production

## Phases

| Phase | Component | Status |
|-------|-----------|--------|
| 0 | Foundation & Schema | ✅ Built |
| 1 | Watermarking Engine | 🔲 Planned |
| 2 | Detection Agents | 🔲 Planned |
| 3 | Enforcement Pipeline | 🔲 Planned |
| 4 | Dashboard | 🔲 Planned |
| 5 | Predictive Layer | 🔲 Planned |
| 6 | Polish | 🔲 Planned |
