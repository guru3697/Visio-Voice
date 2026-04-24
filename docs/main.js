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
const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const saveApiUrlBtn = document.getElementById('saveApiUrl');
const testApiBtn = document.getElementById('testApi');

const API_STORAGE_KEY = 'visio_voice_api_base_url';
const DEFAULT_LOCAL_API = 'http://127.0.0.1:8001';

let stream = null;
let imageReady = false;
let currentCaption = '';

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function normalizeBaseUrl(raw) {
  return (raw || '').trim().replace(/\/+$/, '');
}

function getApiBaseUrl() {
  const fromInput = normalizeBaseUrl(apiBaseUrlInput.value);
  if (fromInput) return fromInput;

  const saved = normalizeBaseUrl(localStorage.getItem(API_STORAGE_KEY));
  if (saved) return saved;

  return DEFAULT_LOCAL_API;
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

function saveApiBaseUrl() {
  const url = normalizeBaseUrl(apiBaseUrlInput.value);
  if (!url) {
    setStatus('Please enter a backend URL before saving.', true);
    return;
  }

  try {
    new URL(url);
  } catch {
    setStatus('Invalid backend URL. Include http:// or https://', true);
    return;
  }

  localStorage.setItem(API_STORAGE_KEY, url);
  setStatus(`Backend URL saved: ${url}`);
}

function loadApiBaseUrlIntoInput() {
  const saved = normalizeBaseUrl(localStorage.getItem(API_STORAGE_KEY));
  apiBaseUrlInput.value = saved || DEFAULT_LOCAL_API;
}

function checkMixedContentRisk(url) {
  if (window.location.protocol === 'https:' && url.startsWith('http://')) {
    throw new Error(
      'Mixed content blocked: your page is HTTPS but backend URL is HTTP. Use an HTTPS backend URL.'
    );
  }
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

async function testApiConnection() {
  const baseUrl = getApiBaseUrl();

  try {
    checkMixedContentRisk(baseUrl);
    setStatus(`Testing API: ${baseUrl}/health ...`);

    const response = await fetchWithTimeout(`${baseUrl}/health`, { method: 'GET' }, 10000);
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.detail || `Health check failed (${response.status})`);
    }

    if (body.status === 'ok') {
      setStatus('API reachable and model loaded.');
    } else {
      setStatus(`API reachable but model not ready: ${body.model}`, true);
    }
  } catch (error) {
    setStatus(`API test failed: ${error.message}`, true);
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

  const baseUrl = getApiBaseUrl();
  generateBtn.disabled = true;
  setStatus('Generating caption from your trained model...');

  try {
    checkMixedContentRisk(baseUrl);

    const imageBlob = await dataUrlToBlob(preview.src);
    const formData = new FormData();
    formData.append('file', imageBlob, 'input.png');

    const response = await fetchWithTimeout(
      `${baseUrl}/caption`,
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
    setStatus('Caption generated successfully with your trained model.');
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

saveApiUrlBtn.addEventListener('click', saveApiBaseUrl);
testApiBtn.addEventListener('click', testApiConnection);

loadApiBaseUrlIntoInput();
setStatus('Ready. Save your backend URL and click Test API before generating captions.');
