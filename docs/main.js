import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.allowLocalModels = false;

// Elements
const fileInput = document.getElementById('fileInput');
const camera = document.getElementById('camera');
const preview = document.getElementById('preview');
const canvas = document.getElementById('canvas');
const dropZone = document.getElementById('dropZone');

const startCameraBtn = document.getElementById('startCamera');
const capturePhotoBtn = document.getElementById('capturePhoto');

const generateBtn = document.getElementById('generate');
const speakBtn = document.getElementById('speak');
const stopSpeakBtn = document.getElementById('stopSpeak');

const statusEl = document.getElementById('status');
const captionEl = document.getElementById('caption');

// State
let stream = null;
let imageReady = false;
let model = null;
let currentCaption = '';

// -------------------- STATUS --------------------
function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

// -------------------- IMAGE SETTER --------------------
function setImageFromDataUrl(dataUrl) {
  preview.src = dataUrl;

  imageReady = true;
  generateBtn.disabled = false;

  captionEl.textContent = 'Caption will appear here.';
  currentCaption = '';

  speakBtn.disabled = true;
  stopSpeakBtn.disabled = true;
}

// -------------------- FILE HANDLER --------------------
function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    setStatus('Please select a valid image.', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    setImageFromDataUrl(reader.result);
    setStatus('Image loaded successfully.');
  };
  reader.readAsDataURL(file);
}

// -------------------- FILE INPUT --------------------
fileInput.addEventListener("change", (e) => {
  handleFile(e.target.files[0]);
});

// -------------------- DRAG & DROP --------------------
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// -------------------- PASTE --------------------
document.addEventListener("paste", (e) => {
  const items = e.clipboardData.items;

  for (let item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      handleFile(file);
      break;
    }
  }
});

// -------------------- CAMERA --------------------
startCameraBtn.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });

    camera.srcObject = stream;
    capturePhotoBtn.disabled = false;

    setStatus('Camera started.');
  } catch (error) {
    setStatus(`Camera error: ${error.message}`, true);
  }
});

capturePhotoBtn.addEventListener('click', () => {
  if (!camera.videoWidth) {
    setStatus('Camera not ready.', true);
    return;
  }

  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(camera, 0, 0);

  setImageFromDataUrl(canvas.toDataURL('image/png'));
  setStatus('Photo captured.');
});

// -------------------- MODEL --------------------
async function ensureModel() {
  if (model) return model;

  setStatus('Loading AI model (30-60s first time)...');

  try {
    model = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
    setStatus('Model ready.');
    return model;
  } catch (error) {
    setStatus(`Model load failed: ${error.message}`, true);
  }
}

// -------------------- GENERATE CAPTION --------------------
generateBtn.addEventListener('click', async () => {
  if (!imageReady || !preview.src) {
    setStatus('Upload or capture an image first.', true);
    return;
  }

  generateBtn.disabled = true;
  setStatus('Generating caption...');

  try {
    const captioner = await ensureModel();
    const output = await captioner(preview.src);

    const text = output?.[0]?.generated_text?.trim();

    if (!text) throw new Error('No caption generated.');

    currentCaption = text;
    captionEl.textContent = text;

    speakBtn.disabled = false;
    stopSpeakBtn.disabled = false;

    setStatus('Caption generated.');
  } catch (error) {
    setStatus(`Error: ${error.message}`, true);
  } finally {
    generateBtn.disabled = false;
  }
});

// -------------------- TEXT TO SPEECH --------------------
speakBtn.addEventListener('click', () => {
  if (!currentCaption) {
    setStatus('Generate caption first.', true);
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(currentCaption);
  utterance.rate = 1;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
  setStatus('Playing audio...');
});

stopSpeakBtn.addEventListener('click', () => {
  window.speechSynthesis.cancel();
  setStatus('Audio stopped.');
});

// -------------------- CLEANUP --------------------
window.addEventListener('beforeunload', () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});

// Load model initially
ensureModel();
