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

    if (!code) {
      setError('OAuth code not found.');
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await axios.post(`${API_BASE}/api/auth/github/callback/`, {
          code,
          state,
        });

        if (response.data) {
          await onLoginSuccess({
            username: response.data.user?.username,
            accessToken: response.data.access,
            refreshToken: response.data.refresh,
            ...response.data.user,
            is_staff: response.data.user?.is_staff ?? false,
          });
          navigate('/', { replace: true });
        } else {
          setError('OAuth login failed.');
        }
      } catch (err) {
        console.error('GitHub OAuth callback error:', err);
        setError('GitHub OAuth login error.');
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
