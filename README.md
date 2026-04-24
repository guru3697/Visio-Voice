# Visio-Voice

Visio Voice now runs as a single app: backend + frontend together.

- Upload/capture image
- Generate caption using your trained model artifacts
- Play caption audio in browser

## Required trained artifacts (already wired in code)

Place files in:

- `backend/model/encoder/`
- `backend/model/decoder/`
- `backend/model/tokenizer.pkl`

## Run (single command)

```bash
uvicorn backend.app:app --host 0.0.0.0 --port 8001
```

Open:

- `http://127.0.0.1:8001`

No separate frontend server or API URL setup is needed.

## Endpoints

- `GET /health`
- `POST /caption`


## Troubleshooting

If you see `Unexpected token '<'` or `API returned HTML`, it means the frontend is not hitting the FastAPI `/caption` endpoint.

Use:

- `http://127.0.0.1:8001`

so the page and API are served by the same FastAPI app and your trained model is used.
