import axios from 'axios';

const API_URL = 'http://120.55.185.165:8000/api/auth/'; // 替换为你的Django后端地址

function getFallbackSessionStore() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('veyth-auth-fallback');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function setFallbackSessionStore(store) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('veyth-auth-fallback', JSON.stringify(store));
}

function openSessionDb() {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null;

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('veyth-auth-db', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'token' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function generateToken(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => chars[value % chars.length]).join('');
  }

  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

const register = (username, email, password) => {
  return axios.post(API_URL + 'register/', {
    username,
    email,
    password
  });
};

const login = (username, password) => {
  return axios.post(API_URL + 'login/', {
    username,
    password
  });
};

// Cookie helpers - 设置带安全属性的 cookie
function _cookieExpires(days) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  return d.toUTCString();
}

export function setCookie(name, value, days = 7) {
  const encoded = encodeURIComponent(value);
  const expires = _cookieExpires(days);
  const sameSite = 'SameSite=Lax';
  const secure = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'Secure' : '';
  document.cookie = `${name}=${encoded}; Path=/; Expires=${expires}; ${sameSite}; ${secure}`;
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = document.cookie.match(new RegExp('(?:^|; )' + escapedName + '=([^;]*)'));
  return matches ? decodeURIComponent(matches[1]) : null;
}

export function deleteCookie(name) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export async function saveUserSession(token, userData) {
  if (typeof window === 'undefined') return null;

  const payload = {
    token,
    userData,
    savedAt: Date.now()
  };

  const database = await openSessionDb();
  if (database) {
    try {
      const transaction = database.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      await new Promise((resolve, reject) => {
        const request = store.put(payload);
        request.onsuccess = () => resolve(payload);
        request.onerror = () => reject(request.error);
      });
      database.close();
    } catch (e) {
      // fall back below
    }
  }

  const store = getFallbackSessionStore();
  store[token] = payload;
  setFallbackSessionStore(store);
  return payload;
}

export async function getUserSession(token) {
  if (typeof window === 'undefined' || !token) return null;

  const database = await openSessionDb();
  if (database) {
    try {
      const transaction = database.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const payload = await new Promise((resolve, reject) => {
        const request = store.get(token);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      database.close();
      if (payload?.userData) return payload;
    } catch (e) {
      // fall back below
    }
  }

  const store = getFallbackSessionStore();
  return store[token] || null;
}

export async function deleteUserSession(token) {
  if (typeof window === 'undefined' || !token) return null;

  const database = await openSessionDb();
  if (database) {
    try {
      const transaction = database.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      await new Promise((resolve, reject) => {
        const request = store.delete(token);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
      database.close();
    } catch (e) {
      // ignore
    }
  }

  const store = getFallbackSessionStore();
  delete store[token];
  setFallbackSessionStore(store);
  return true;
}

// 如果存在 localStorage 中的老数据，迁移到 cookie 并清理 localStorage
export function migrateLocalStorageToCookies() {
  if (typeof window === 'undefined') return;
  try {
    const user = localStorage.getItem('user');
    if (user) {
      setCookie('user', user, 30);
      localStorage.removeItem('user');
    }
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      setCookie('authToken', authToken, 30);
      localStorage.removeItem('authToken');
    }
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      setCookie('refreshToken', refreshToken, 30);
      localStorage.removeItem('refreshToken');
    }
  } catch (e) {
    // ignore
  }
}

const authService = {
  register,
  login,
  setCookie,
  getCookie,
  deleteCookie,
  generateToken,
  saveUserSession,
  getUserSession,
  deleteUserSession,
  migrateLocalStorageToCookies
};

export default authService;