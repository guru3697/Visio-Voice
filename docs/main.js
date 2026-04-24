import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.allowLocalModels = false;

const fileInput = document.getElementById('fileInput');
const camera = document.getElementById('camera');
const preview = document.getElementById('preview');
const canvas = document.getElementById('canvas');
const startCameraBtn = document.getElementById('startCamera');
const capturePhotoBtn = document.getElementById('capturePhoto');
const generateBtn = document.getElementById('generate');
const speakBtn = document.getElementById('speak');
const stopSpeakBtn = document.getElementById('stopSpeak');
const statusEl = document.getElementById('status');
const captionEl = document.getElementById('caption');

let stream = null;
let imageReady = false;
let model = null;
let currentCaption = '';

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

async function ensureModel() {
  if (model) return model;
  setStatus('Loading AI caption model (first run can take ~30-60s)...');
  model = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
  setStatus('Model ready. You can generate a caption now.');
  return model;
}

function setImageFromDataUrl(dataUrl) {
  preview.src = dataUrl;
  imageReady = true;
  generateBtn.disabled = false;
  captionEl.textContent = 'Caption will appear here.';
  currentCaption = '';
  speakBtn.disabled = true;
  stopSpeakBtn.disabled = true;
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setImageFromDataUrl(reader.result);
  reader.readAsDataURL(file);
  setStatus('Image uploaded.');
});

startCameraBtn.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    camera.srcObject = stream;
    capturePhotoBtn.disabled = false;
    setStatus('Camera started. Click Capture.');
  } catch (error) {
    setStatus(`Unable to access camera: ${error.message}`, true);
  }
});

capturePhotoBtn.addEventListener('click', () => {
  if (!camera.videoWidth || !camera.videoHeight) {
    setStatus('Camera is not ready yet. Please wait a moment.', true);
    return;
  }

  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(camera, 0, 0, canvas.width, canvas.height);
  setImageFromDataUrl(canvas.toDataURL('image/png'));
  setStatus('Photo captured.');
});

generateBtn.addEventListener('click', async () => {
  if (!imageReady || !preview.src) {
    setStatus('Please upload or capture an image first.', true);
    return;
  }

  generateBtn.disabled = true;
  setStatus('Generating caption...');

  try {
    const captioner = await ensureModel();
    const output = await captioner(preview.src);
    const text = output?.[0]?.generated_text?.trim();

    if (!text) throw new Error('No caption returned by the model.');

    currentCaption = text;
    captionEl.textContent = text;
    speakBtn.disabled = false;
    stopSpeakBtn.disabled = false;
    setStatus('Caption generated successfully.');
  } catch (error) {
    setStatus(`Caption generation failed: ${error.message}`, true);
  } finally {
    generateBtn.disabled = false;
  }
});

speakBtn.addEventListener('click', () => {
  if (!currentCaption) {
    setStatus('Generate a caption before playing audio.', true);
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(currentCaption);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  setStatus('Playing audio caption...');
});

stopSpeakBtn.addEventListener('click', () => {
  window.speechSynthesis.cancel();
  setStatus('Audio stopped.');
});

window.addEventListener('beforeunload', () => {
  if (stream) stream.getTracks().forEach((track) => track.stop());
});

ensureModel().catch((error) => {
  setStatus(`Model load failed: ${error.message}`, true);
});

function loadImageFromFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById("preview");
    preview.src = e.target.result;

    document.getElementById("generate").disabled = false;
  };
  reader.readAsDataURL(file);
}

document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  loadImageFromFile(file);
});
const dropZone = document.getElementById("dropZone");

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
  loadImageFromFile(file);
});
document.addEventListener("paste", (e) => {
  const items = e.clipboardData.items;

  for (let item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      loadImageFromFile(file);
      break;
    }
  }
});
