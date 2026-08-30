import { API_BASE, getCookie } from './authService';

/**
 * 从 user cookie 中提取真实 Django auth token（accessToken）。
 * authToken cookie 存的是前端随机串（用于 sql.js session key），
 * 不能用作后端认证；真正的 Django token 在 user cookie 的 accessToken 字段。
 */
function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const userCookie = getCookie('user');
    if (userCookie) {
      const user = JSON.parse(userCookie);
      const token = user?.accessToken;
      if (token) headers['Authorization'] = `Token ${token}`;
    }
  } catch (_) {
    // ignore
  }
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
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function listProblems(params) {
  const q = new URLSearchParams(params || {}).toString();
  return request(`/problems/problems/${q ? `?${q}` : ''}`);
}

/**
 * 获取题目详情。后端可能未开启 detail 端点（返回 404），
 * 此时自动回退到列表接口按 ID 查找。
 */
export async function getProblem(id) {
  try {
    return await request(`/problems/problems/${id}/`);
  } catch (err) {
    if (err.status === 404) {
      // 回退：从列表中查找；解析顺序与 Problems.jsx L14 完全一致
      const data = await listProblems();
      const list = Array.isArray(data?.problems) ? data.problems
        : Array.isArray(data?.results) ? data.results
        : Array.isArray(data) ? data : [];
      const found = list.find((p) => String(p.id) === String(id));
      if (found) return found;
    }
    throw err;
  }
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

const judgeService = {
  listProblems,
  getProblem,
  submitCode,
  listSubmissions,
  getSubmission,
  pollSubmission
};

export default judgeService;
