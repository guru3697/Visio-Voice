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
let currentCaption = '';

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
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

async function fetchWithTimeout(resource, options = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
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
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
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

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

generateBtn.addEventListener('click', async () => {
  if (!imageReady || !preview.src) {
    setStatus('Please upload or capture an image first.', true);
    return;
  }

  generateBtn.disabled = true;
  setStatus('Generating caption from your trained model...');

  try {
    const imageBlob = await dataUrlToBlob(preview.src);
    const formData = new FormData();
    formData.append('file', imageBlob, 'input.png');

    const response = await fetchWithTimeout(
      '/caption',
      {
        method: 'POST',
        body: formData,
      },
      60000
    );

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.detail || `API error (${response.status})`);
    }

    const text = (body.caption || '').trim();
    if (!text) throw new Error('Model returned an empty caption.');

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
