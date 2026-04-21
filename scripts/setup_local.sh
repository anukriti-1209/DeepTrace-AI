#!/bin/bash
# DeepTrace — Local Setup Script
set -e

echo "🛡️  DeepTrace Local Setup"
echo "========================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Install it first."
    exit 1
fi

# Create venv if needed
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate
source .venv/bin/activate

# Install deps
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Check .env
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env and add your GEMINI_API_KEY"
    exit 1
fi

echo ""
echo "✅ Setup complete! Run the server with:"
echo "   source .venv/bin/activate"
echo "   python -m uvicorn services.api.main:app --reload"
echo ""
echo "Then verify:"
echo "   curl http://localhost:8000/health"
echo "   curl http://localhost:8000/api/v1/test-gemini"
