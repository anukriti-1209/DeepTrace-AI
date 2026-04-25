# ---------------------------------------------------------
# STAGE 1: Build the Vite Frontend
# ---------------------------------------------------------
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------------
# STAGE 2: Setup Python FastAPI Backend
# ---------------------------------------------------------
FROM python:3.11-slim

WORKDIR /app

# System dependencies for OpenCV/watermarking
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies first to cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

# Copy compiled frontend from Stage 1 into the Python container
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 8000

CMD ["uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
