import { API_BASE, getCookie } from './authService';

function authHeaders() {
  const token = getCookie('authToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Token ${token}`;
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!res.ok) {
    const msg = (data && data.detail) || (data && data.error) || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

export function listProblems(params) {
  const q = new URLSearchParams(params || {}).toString();
  return request(`/problems/problems/${q ? `?${q}` : ''}`);
}

export function getProblem(id) {
  return request(`/problems/problems/${id}/`);
}

export function submitCode({ problem_id, language, code }) {
  return request('/judge/submit/', {
    method: 'POST',
    body: JSON.stringify({ problem_id, language, code })
  });
}

export function listSubmissions(params) {
  const q = new URLSearchParams(params || {}).toString();
  return request(`/judge/submissions/${q ? `?${q}` : ''}`);
}

export function getSubmission(id) {
  return request(`/judge/submissions/${id}/`);
}

export function pollSubmission(id, { maxWaitMs = 15000, intervalMs = 800 } = {}) {
  const start = Date.now();
  const tick = (resolve, reject) => {
    getSubmission(id)
      .then((r) => {
        const status = r && r.status;
        const pending = !status || ['Pending', 'Running', 'Queued'].includes(status);
        if (!pending || Date.now() - start > maxWaitMs) return resolve(r);
        setTimeout(tick, intervalMs, resolve, reject);
      })
      .catch(reject);
  };
  return new Promise(tick);
}

export default {
  listProblems,
  getProblem,
  submitCode,
  listSubmissions,
  getSubmission,
  pollSubmission
};
