# Multi-stage Dockerfile for PIXELRESCUE Full-Stack Application

# Stage 1: Build React Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend & Static Server
FROM python:3.10-slim AS runner
WORKDIR /app

# Install system dependencies for OpenCV & headless graphics
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Application
COPY backend/ ./backend/
COPY pytest.ini ./

# Copy Built Frontend Assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose API and App Port
EXPOSE 8000

ENV PYTHONPATH=/app/backend
WORKDIR /app/backend

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
