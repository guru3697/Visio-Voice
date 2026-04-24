import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Elements
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const preview = document.getElementById("preview");

const camera = document.getElementById("camera");
const canvas = document.getElementById("canvas");

const startCameraBtn = document.getElementById("startCamera");
const capturePhotoBtn = document.getElementById("capturePhoto");

const generateBtn = document.getElementById("generate");
const speakBtn = document.getElementById("speak");
const stopSpeakBtn = document.getElementById("stopSpeak");

const statusEl = document.getElementById("status");
const captionEl = document.getElementById("caption");

// State
let model;
let imageReady = false;
let captionText = "";
let stream = null;

// ---------------- IMAGE LOAD ----------------
function loadImage(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    imageReady = true;
    generateBtn.disabled = false;

    captionEl.textContent = "Caption will appear here";
    captionText = "";

    speakBtn.disabled = true;
    stopSpeakBtn.disabled = true;

    statusEl.textContent = "Image loaded ✅";
  };
  reader.readAsDataURL(file);
}

// File input
fileInput.addEventListener("change", (e) => {
  loadImage(e.target.files[0]);
});

// Drag & Drop
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

  loadImage(e.dataTransfer.files[0]);
});

// Paste
document.addEventListener("paste", (e) => {
  for (let item of e.clipboardData.items) {
    if (item.type.startsWith("image")) {
      loadImage(item.getAsFile());
    }
  }
});

// ---------------- CAMERA ----------------
startCameraBtn.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    camera.srcObject = stream;
    capturePhotoBtn.disabled = false;
    statusEl.textContent = "Camera started";
  } catch (err) {
    statusEl.textContent = "Camera error: " + err.message;
  }
});

capturePhotoBtn.addEventListener("click", () => {
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(camera, 0, 0);

  preview.src = canvas.toDataURL("image/png");
  imageReady = true;
  generateBtn.disabled = false;

  statusEl.textContent = "Photo captured";
});

// ---------------- MODEL ----------------
async function loadModel() {
  statusEl.textContent = "Loading AI model (30s)...";
  model = await pipeline("image-to-text", "Xenova/vit-gpt2-image-captioning");
  statusEl.textContent = "Model ready 🚀";
}
loadModel();

// ---------------- GENERATE ----------------
generateBtn.addEventListener("click", async () => {
  if (!imageReady) {
    statusEl.textContent = "❌ Upload or capture image first";
    return;
  }

  statusEl.textContent = "Generating...";

  try {
    const result = await model(preview.src);
    captionText = result[0].generated_text;

    captionEl.textContent = captionText;

    speakBtn.disabled = false;
    stopSpeakBtn.disabled = false;

    statusEl.textContent = "Done ✅";
  } catch (err) {
    statusEl.textContent = "Error: " + err.message;
  }
});

// ---------------- AUDIO ----------------
speakBtn.addEventListener("click", () => {
  if (!captionText) return;

  const speech = new SpeechSynthesisUtterance(captionText);
  speechSynthesis.speak(speech);
});

stopSpeakBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
});

// Cleanup
window.addEventListener("beforeunload", () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
});
