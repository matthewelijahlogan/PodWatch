# PodWatch Deploy (Render)

This repo already includes a Render Blueprint config at `render.yaml`.

## 1. Push this folder to GitHub

Use this repo root:

- `PodWatchProject/PodWatch`

## 2. Create service on Render

1. In Render, click **New +** -> **Blueprint**.
2. Connect your GitHub repo.
3. Select the branch to deploy.
4. Render will detect `render.yaml` and create `podwatch-backend`.

## Predeploy check (recommended)

From repo root:

- `./scripts/check_render_ready.ps1`

This validates required files, start command, health check path, and Python compile sanity.

## 3. Environment variables

Set these in Render (Dashboard -> Service -> Environment):

- `YOUTUBE_API_KEY` (optional but recommended for better YouTube results)
- `FLASK_ENV=production` (already in `render.yaml`)
- `PYTHON_VERSION=3.11.10` (already in `render.yaml`)

## 4. Deploy details

Configured in `render.yaml`:

- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`
- Health check: `/api/health`
- Root directory: `backend`

## 5. Verify

After deploy:

- Open `https://<your-service>.onrender.com/api/health`
- Expect: `{"status":"ok"}`
