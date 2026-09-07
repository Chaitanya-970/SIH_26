// API service layer for CITADEL WORKSPACE

const BASE_URL = ''; // Relative path leverages Vite dev server proxy or direct deployment

const INITIAL_MODELS = [
  { id: 'phi3.5:3.8b', name: 'Phi-3.5 (3.8B)', provider: 'Local / Ollama' },
  { id: 'qwen2.5:7b', name: 'Qwen 2.5 (7B)', provider: 'Local / Ollama' },
  { id: 'llama3:8b', name: 'Llama 3 (8B)', provider: 'Local / Ollama' }
];

export async function fetchModels() {
  try {
    const res = await fetch(`${BASE_URL}/api/models`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const modelsList = Array.isArray(data) ? data : (data?.models || []);
    return modelsList.length > 0 ? modelsList : INITIAL_MODELS;
  } catch (err) {
    console.warn('[API] /api/models fallback:', err.message);
    return INITIAL_MODELS;
  }
}

export async function fetchNetworkStatus() {
  const res = await fetch(`${BASE_URL}/api/network-status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchKnowledgeBase() {
  try {
    const res = await fetch(`${BASE_URL}/api/knowledge-base`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.documents || []);
  } catch {
    return [];
  }
}

export async function uploadDocument(file) {
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File size exceeds maximum 50 MB threshold');
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/upload-document`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function deleteDocument(docId) {
  const res = await fetch(`${BASE_URL}/api/knowledge-base/${docId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchSessionFiles(sessionId = 'demo-session') {
  try {
    const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/files`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchFilePreview(sessionId = 'demo-session', fileName) {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/files/${encodeURIComponent(fileName)}/preview`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

export async function downloadSessionFile(sessionId = 'demo-session', fileName) {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/files/${encodeURIComponent(fileName)}`);
  if (!res.ok) throw new Error(`Download endpoint returned ${res.status}`);
  const blob = await res.blob();
  triggerBlobDownload(blob, fileName);
}

function triggerBlobDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function fetchRecentAnalyses() {
  try {
    const res = await fetch(`${BASE_URL}/api/sessions/recent`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}

export function registerNewSessionFile(fileMeta) {
  return [];
}
