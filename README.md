# Visio-Voice

Visio Voice is an image-to-caption project. This repository now includes a fully static GitHub Pages web app that lets you:

- Upload an image **or** capture one from the camera.
- Generate an AI text caption in-browser.
- Play the caption as audio using browser speech synthesis.

## Live GitHub Pages URL

- **https://guru3697.github.io/Visio-Voice/**

## GitHub Pages deployment status (fix for 404)

A 404 on GitHub Pages usually means the Pages workflow has not deployed successfully yet (or Pages source is not set correctly).

This repo includes `.github/workflows/deploy-pages.yml` to deploy the `docs/` app.

### Required one-time GitHub setup

1. Open **Repository Settings → Pages**.
2. Under **Build and deployment**, choose **Source: GitHub Actions**.
3. Push changes to one of these branches: `main`, `master`, or `work`.
4. Wait for the **Deploy static site to GitHub Pages** workflow to finish.
5. Re-open: `https://guru3697.github.io/Visio-Voice/`

## Local preview

From repository root:

```bash
python3 -m http.server 8000 --directory docs
```

Then open:

- `http://localhost:8000`

## Project files

- `docs/index.html` – UI for upload/camera + caption + audio controls.
- `docs/main.js` – AI inference and interaction logic.
- `docs/styles.css` – Styling.
- `.github/workflows/deploy-pages.yml` – GitHub Pages deployment workflow.
