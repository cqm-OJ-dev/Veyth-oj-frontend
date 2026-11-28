import { API_BASE, getCookie } from './authService';

const API_ROOT = API_BASE.replace(/\/+$/, '');

function notificationHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const user = JSON.parse(getCookie('user') || 'null');
    const accessToken = user?.accessToken;
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  } catch (_) {
    // Missing or malformed user cookies are treated as an unauthenticated request.
  }
  return headers;
}

async function request(path, options = {}) {
  let url;
  try {
    const parsedUrl = new URL(path, `${API_ROOT}/`);
    if (parsedUrl.origin !== new URL(API_ROOT).origin) {
      throw new Error('Invalid notification pagination URL');
    }
    url = parsedUrl.toString();
  } catch (error) {
    if (error.message === 'Invalid notification pagination URL') throw error;
    throw new Error('Invalid notification API URL');
  }
  const response = await fetch(url, {
    ...options,
    headers: {
      ...notificationHeaders(),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }

  if (!response.ok) {
    const message = (data && data.detail) || (data && data.error) || `HTTP ${response.status}`;
    const error = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

const jsonOptions = (method, body) => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) })
});

export function listNotifications({ unread, pageUrl } = {}) {
  if (pageUrl) return request(pageUrl);
  const params = new URLSearchParams();
  if (unread !== undefined) params.set('unread', String(unread));
  const query = params.toString();
  return request(`/notifications/${query ? `?${query}` : ''}`);
}

export function getUnreadNotificationCount() {
  return request('/notifications/unread-count/');
}

export function markNotificationRead(recipientId) {
  return request(`/notifications/${recipientId}/read/`, jsonOptions('POST', {}));
}

export function markAllNotificationsRead() {
  return request('/notifications/read-all/', jsonOptions('POST', {}));
}

export function deleteNotification(recipientId) {
  return request(`/notifications/${recipientId}/`, jsonOptions('DELETE'));
}

export function sendNotification(data) {
  return request('/notifications/admin/send/', jsonOptions('POST', data));
}

export function listNotificationDispatches({ pageUrl } = {}) {
  return request(pageUrl || '/notifications/admin/');
}

export function listNotificationRecipients(notificationId, { pageUrl } = {}) {
  return request(pageUrl || `/notifications/admin/${notificationId}/recipients/`);
}
