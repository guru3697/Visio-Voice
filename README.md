# Visio-Voice

Visio Voice now uses your **actual trained model artifacts** (encoder + decoder + tokenizer) through a FastAPI backend, while `docs/` remains a GitHub Pages frontend.

## Live frontend (GitHub Pages)

- https://guru3697.github.io/Visio-Voice/

> Important: GitHub Pages is static-only. Your trained TensorFlow model must run on a backend service.

## Backend setup (required for trained model inference)

Place your trained artifacts here:

- `backend/model/encoder/`
- `backend/model/decoder/`
- `backend/model/tokenizer.pkl`

Then run:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --host 0.0.0.0 --port 8001
```

API endpoint used by frontend:

- `POST http://127.0.0.1:8001/caption`

## Frontend local preview

```bash
python3 -m http.server 8000 --directory docs
```

Open `http://localhost:8000`.

## Deploying without errors

1. Deploy backend (Render/Railway/EC2/etc.) with your model files in `backend/model/`.
2. Update `API_BASE_URL` in `docs/main.js` to your deployed backend URL.
3. Push to `main`/`master`/`work` and let GitHub Actions deploy Pages.
4. In GitHub Settings → Pages, ensure Source is **GitHub Actions**.
