import initSqlJs from 'sql.js';
 
export const API_BASE = process.env.REACT_APP_API_BASE || 'https://cqiming.pythonanywhere.com';
 
let sqlReadyPromise = null;
let sqlDatabase = null;
 
async function getSqlDatabase() {
  if (typeof window === 'undefined') return null;
  if (sqlDatabase) return sqlDatabase;
 
  if (!sqlReadyPromise) {
    sqlReadyPromise = initSqlJs({
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.14.0/${file}`
    });
  }
 
  const SQL = await sqlReadyPromise;
  const stored = window.localStorage.getItem('veyth-auth-db');
 
  if (stored) {
    try {
      const bytes = new Uint8Array(JSON.parse(stored));
      sqlDatabase = new SQL.Database(bytes);
    } catch (e) {
      sqlDatabase = new SQL.Database();
    }
  } else {
    sqlDatabase = new SQL.Database();
  }
 
  sqlDatabase.run('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_data TEXT, created_at INTEGER)');
  return sqlDatabase;
}
 
async function persistSqlDatabase(database) {
  if (typeof window === 'undefined' || !database) return;
  const bytes = database.export();
  window.localStorage.setItem('veyth-auth-db', JSON.stringify(Array.from(bytes)));
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
  const database = await getSqlDatabase();
  if (!database) return null;
 
  const payload = {
    token,
    userData,
    savedAt: Date.now()
  };
 
  const statement = database.prepare('INSERT OR REPLACE INTO sessions (token, user_data, created_at) VALUES (?, ?, ?)');
  statement.run([token, JSON.stringify(payload), Date.now()]);
  statement.free();
  await persistSqlDatabase(database);
  return payload;
}
 
export async function getUserSession(token) {
  if (typeof window === 'undefined' || !token) return null;
  const database = await getSqlDatabase();
  if (!database) return null;
 
  const statement = database.prepare('SELECT user_data FROM sessions WHERE token = ?');
  statement.bind([token]);
 
  let payload = null;
  if (statement.step()) {
    const row = statement.getAsObject();
    payload = row.user_data ? JSON.parse(row.user_data) : null;
  }
  statement.free();
  return payload;
}
 
export async function deleteUserSession(token) {
  if (typeof window === 'undefined' || !token) return null;
  const database = await getSqlDatabase();
  if (!database) return null;
 
  const statement = database.prepare('DELETE FROM sessions WHERE token = ?');
  statement.run([token]);
  statement.free();
  await persistSqlDatabase(database);
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
  setCookie,
  getCookie,
  deleteCookie,
  getSqlDatabase,
  persistSqlDatabase,
  generateToken,
  saveUserSession,
  getUserSession,
  deleteUserSession,
  migrateLocalStorageToCookies
};
 
export default authService;
