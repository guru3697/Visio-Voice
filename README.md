# Visio-Voice

Visio Voice leverages the Inception V3 LSTM encoder-decoder model to convert visual input into descriptive text. This advanced AI system processes images, extracts features, and generates accurate, human-like descriptions, enhancing accessibility and automated image captioning capabilities.

![Architecture](https://github.com/user-attachments/assets/3840641b-cbc9-4f18-ac86-9602e4159b07)

![Inception V3](https://github.com/user-attachments/assets/3243c962-f2e3-48af-889f-04e419ae2fc7)

![LSTM Architecture](https://github.com/user-attachments/assets/89ff32e7-8e31-4081-972b-86cd76ce851e)

## Output

![image](https://github.com/user-attachments/assets/2f682449-38b6-4760-8e71-d5915f53cd22)

![image](https://github.com/user-attachments/assets/593fc5c0-689d-469f-9b8a-392a1d516a39)

![image](https://github.com/user-attachments/assets/e273b896-74e1-49b7-952e-41a0289f88ca)

## GitHub Pages hosting

This repository now includes a GitHub Pages-ready static site under `docs/` and an automated deployment workflow at `.github/workflows/deploy-pages.yml`.

### How to publish

1. Push the repository to GitHub on the `main` branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Run (or re-run) the `Deploy static site to GitHub Pages` workflow.
4. Your site will be available at:
   - `https://guru3697.github.io/Visio-Voice/` (project site)

### Live URL

- **GitHub Pages:** https://guru3697.github.io/Visio-Voice/

### Local preview

From repository root:

```bash
python3 -m http.server 8000 --directory docs
```

Then open `http://localhost:8000`.
