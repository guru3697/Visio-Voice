from __future__ import annotations

import io
import os
import pickle
from pathlib import Path

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
DOCS_DIR = ROOT_DIR / "docs"
MODEL_DIR = BASE_DIR / "model"
ENCODER_PATH = MODEL_DIR / "encoder"
DECODER_PATH = MODEL_DIR / "decoder"
TOKENIZER_PATH = MODEL_DIR / "tokenizer.pkl"
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "34"))
START_TOKEN = os.getenv("START_TOKEN", "startseq")
END_TOKEN = os.getenv("END_TOKEN", "endseq")

app = FastAPI(title="Visio-Voice API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CaptionResponse(BaseModel):
    caption: str


class ModelService:
    def __init__(self) -> None:
        self.encoder = None
        self.decoder = None
        self.tokenizer = None
        self.loaded = False

    def load(self) -> None:
        if self.loaded:
            return

        if not ENCODER_PATH.exists() or not DECODER_PATH.exists() or not TOKENIZER_PATH.exists():
            raise FileNotFoundError(
                "Missing trained artifacts. Expected files: "
                f"{ENCODER_PATH}, {DECODER_PATH}, {TOKENIZER_PATH}"
            )

        self.encoder = tf.keras.models.load_model(ENCODER_PATH)
        self.decoder = tf.keras.models.load_model(DECODER_PATH)

        with open(TOKENIZER_PATH, "rb") as fp:
            self.tokenizer = pickle.load(fp)

        self.loaded = True

    def preprocess(self, raw: bytes) -> tf.Tensor:
        image = Image.open(io.BytesIO(raw)).convert("RGB").resize((299, 299))
        arr = np.asarray(image, dtype=np.float32)
        arr = tf.keras.applications.inception_v3.preprocess_input(arr)
        arr = np.expand_dims(arr, axis=0)
        return tf.convert_to_tensor(arr)

    def _word_for_index(self, index: int) -> str | None:
        return self.tokenizer.index_word.get(index)

    def predict_caption(self, raw: bytes) -> str:
        self.load()
        img = self.preprocess(raw)

        visual_features = self.encoder(img)
        sequence = [self.tokenizer.word_index.get(START_TOKEN, 1)]
        caption_words: list[str] = []

        for _ in range(MAX_LENGTH):
            seq = tf.keras.preprocessing.sequence.pad_sequences([sequence], maxlen=MAX_LENGTH)
            yhat = self.decoder([visual_features, seq], training=False)

            if isinstance(yhat, (tuple, list)):
                yhat = yhat[0]

            if len(yhat.shape) == 3:
                yhat = yhat[:, -1, :]

            predicted_idx = int(np.argmax(np.array(yhat), axis=-1)[0])
            word = self._word_for_index(predicted_idx)

            if not word:
                break
            if word == END_TOKEN:
                break

            caption_words.append(word)
            sequence.append(predicted_idx)

        caption = " ".join(caption_words).strip()
        if not caption:
            raise RuntimeError("Model returned an empty caption.")
        return caption


service = ModelService()


@app.get("/health")
def health() -> dict[str, str]:
    try:
        service.load()
        return {"status": "ok", "model": "loaded"}
    except Exception as exc:  # noqa: BLE001
        return {"status": "degraded", "model": str(exc)}


@app.post("/caption", response_model=CaptionResponse)
async def caption(file: UploadFile = File(...)) -> CaptionResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        text = service.predict_caption(raw)
        return CaptionResponse(caption=text)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Caption generation failed: {exc}") from exc


app.mount("/assets", StaticFiles(directory=DOCS_DIR), name="assets")


@app.get("/")
def root() -> FileResponse:
    return FileResponse(DOCS_DIR / "index.html")


@app.get("/main.js")
def frontend_js() -> FileResponse:
    return FileResponse(DOCS_DIR / "main.js", media_type="application/javascript")


@app.get("/styles.css")
def frontend_css() -> FileResponse:
    return FileResponse(DOCS_DIR / "styles.css", media_type="text/css")
