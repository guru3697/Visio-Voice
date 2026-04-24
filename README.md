# Visio-Voice

Visio Voice uses your trained image-caption model through a FastAPI backend, and a GitHub Pages frontend (`docs/`) for upload/camera + caption + audio playback.

## Live frontend (GitHub Pages)

- https://guru3697.github.io/Visio-Voice/

## 1) Put trained artifacts in these exact paths

- `backend/model/encoder/`
- `backend/model/decoder/`
- `backend/model/tokenizer.pkl`

## 2) Run backend locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --host 0.0.0.0 --port 8001
```

Check health:

```bash
curl http://127.0.0.1:8001/health
```

## 3) Run frontend locally

```bash
python3 -m http.server 8000 --directory docs
```

Open `http://localhost:8000`, set backend URL to `http://127.0.0.1:8001`, click **Save URL**, then **Test API**.

## 4) For GitHub Pages usage (avoid "Failed to fetch")

If frontend is opened on `https://guru3697.github.io/Visio-Voice/`, backend URL must be **HTTPS**.

- ✅ Good: `https://your-backend-domain.com`
- ❌ Blocked by browser (mixed content): `http://127.0.0.1:8001`

Deploy backend on a cloud host with HTTPS (Render, Railway, etc.), then in the UI set that HTTPS URL and click **Test API**.

## 5) GitHub Pages deploy

1. Push branch (`main`/`master`/`work`).
2. In repository **Settings → Pages**, set **Source = GitHub Actions**.
3. Wait for the `Deploy static site to GitHub Pages` workflow.
