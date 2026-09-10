# NaviiGo Local Development & Deployment Guide

This document supplies setup instructions for local development and describes the recommended deployment path for the NaviiGo backend.

## Local Development Setup

### 1. Requirements

- Python 3.13+
- Git
- (Optional but recommended) PostgreSQL 15+ for DB testing (the app defaults to in-memory SQLite if left unconfigured, making it extremely easy to run).

### 2. Environment Setup

Clone the repository and move to the backend directory:
```bash
git clone https://github.com/NaviiGo-ai/NaviiGo-Website.git
cd NaviiGo-Website/backend
```

Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
source venv/Scripts/activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in the `backend/` directory.

```bash
cp ../.env.example .env  # Or simply create a new one based on PRODUCTION_ENV_VARS.md
```
Configure your `.env` to suit local testing. `APP_ENV=development` is recommended.

### 4. Running the Development Server

Start the application with Uvicorn utilizing hot-reloading:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`. Fastapi provides automatic interactive API documentation at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 5. Running Tests

Tests execute against an isolated, in-memory SQLite async engine (hermetic).

```bash
export PYTHONPATH=$(pwd) # (Mac/Linux)
# Or in Windows PowerShell: $env:PYTHONPATH = (Get-Location).Path

pytest tests/
```

To run with coverage:
```bash
pytest --cov=app tests/
```

---

## Production Deployment Runbook

The NaviiGo backend is a stateless 12-factor application. It can be easily deployed to container environments (Docker, Kubernetes, AWS ECS, Google Cloud Run) or a standard VPS.

### 1. Docker Build

For production, building a container is the recommended first step. Below is a sample `Dockerfile` for the application:

```dockerfile
FROM python:3.13-slim

WORKDIR /app

# System dependencies for psycopg/asyncpg and cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Avoid running as root
RUN useradd -m naviigo
USER naviigo

EXPOSE 8000

# Start server via Uvicorn with ASGI Workers
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

Build the container:
```bash
docker build -t naviigo-backend:latest .
```

### 2. Environment Variable Injection

When deploying the container, do not pack the `.env` file into the image. Inject environment variables via your orchestrator (e.g., Kubernetes Secrets/ConfigMaps or AWS Parameter Store). Reference `PRODUCTION_ENV_VARS.md` for the entire list.

### 3. Pre-flight Checks (Database Migrations)

Before accepting incoming traffic, pending Alembic migrations string must be executed to prepare the database schema. This should be run synchronously avoiding parallel instances running migrations at exactly the same time.

- In k8s: Use an `initContainer` or a pre-install Helm hook.
- In Docker Compose or ECS: Use an initialization script or a distinct task execution right before launching the service.

Command:
```bash
alembic upgrade head
```

### 4. Health Checks

The backend provides a root endpoint `/health` or identical system that responds immediately.

Use `http://<IP>:8000/` as your Container's Health Check or Liveness Probe target to assure zero-downtime rolling updates.

### 5. Concurrency & Workers

Since FastAPI uses `asyncio` built over ASGI, `uvicorn` must be run behind multiple process workers (e.g., `--workers 4`) in production to leverage multiple CPU cores, OR deployed with Gunicorn wrapped round Uvicorn. However, Uvicorn worker process management (`--workers`) is normally sufficient provided memory footprint is accommodated.

### 6. Security Reminders

1. The app verifies JWT provided by Firebase Auth. Ensure timezone synching on the deployment servers to alleviate sudden unauthorized errors.
2. SSRF guard resolves hostnames instantly via the container's DNS. Fast and trusted DNS resolution (e.g. AWS Route53 or Cloudflare standard resolvers) protects application performance.
3. Configure inbound rate limiting limits externally via an Ingress Controller, AWS WAF, or Nginx besides application-level logic if traffic anomalies are detected.
