import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../services/authService';

export default function OAuthCallback({ onLoginSuccess }) {
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const savedState = sessionStorage.getItem('github_oauth_state');

    if (!code) {
      setError('OAuth 回调缺少 code。');
      return;
    }

    if (savedState && state && savedState !== state) {
      setError('OAuth state 校验失败，请重试。');
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await axios.post(`${API_BASE}/api/auth/github/callback/`, {
          code,
          state,
        });

        const payload = response?.data ?? {};
        const access = payload.access || payload.accessToken || payload.token;
        const refresh = payload.refresh || payload.refreshToken;
        const user = payload.user || payload.profile || {};

        if (access) {
          await onLoginSuccess({
            username: user.username || payload.username || 'github-user',
            accessToken: access,
            refreshToken: refresh,
            ...user,
            is_staff: user.is_staff ?? payload.is_staff ?? false,
          });
          sessionStorage.removeItem('github_oauth_state');
          navigate('/', { replace: true });
        } else {
          setError('后端未返回有效登录凭据。');
        }
      } catch (err) {
        console.error('GitHub OAuth callback error:', err);
        const serverMessage = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
        setError(serverMessage ? `GitHub 登录失败：${serverMessage}` : 'GitHub OAuth 登录失败。');
      }
    };

    exchangeCode();
  }, [searchParams, onLoginSuccess, navigate]);

  return (
    <div className="oauth-callback-page">
      {error ? <div className="error-message">{error}</div> : <div>正在处理 GitHub 登录...</div>}
    </div>
  );
}
