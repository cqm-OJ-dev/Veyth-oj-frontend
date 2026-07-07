import axios from 'axios';

const API_URL = 'http://120.55.185.165:8000/api/auth/'; // 替换为你的Django后端地址

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
    const matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+\^])/g, '\\$1') + '=([^;]*)'));
  return matches ? decodeURIComponent(matches[1]) : null;
}

export function deleteCookie(name) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
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

export default {
  register,
  login,
  setCookie,
  getCookie,
  deleteCookie,
  migrateLocalStorageToCookies
};