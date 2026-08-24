import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AuthPages.css";
import "../App.css";
import { setCookie, API_BASE } from "../services/authService";
import { useAuthContext } from "../context/authContext";

const Login = ({ onLoginSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuthContext();

  const [fadeOut, setFadeOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  useEffect(() => {
    if (currentUser) {
      navigate("/", { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (location.state?.registrationSuccess) {
      setRegistrationSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/auth/login/`,
        formData,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (onLoginSuccess) {
        const serverUser = response.data.user || {};
        onLoginSuccess({
          username: serverUser.username || formData.username,
          accessToken: response.data.access,
          refreshToken: response.data.refresh,
          ...serverUser,
          is_staff: serverUser.is_staff ?? response.data.is_staff ?? false
        });
      }

      if (response.data.refresh) {
        setCookie("refreshToken", response.data.refresh, 30);
      }

      setFadeOut(true);
    } catch (err) {
      setError("用户名或密码错误");
    } finally {
      setLoading(false);
    }
  };

  const githubLogin = () => {
    const githubClientId = process.env.REACT_APP_GITHUB_CLIENT_ID || '';

    if (!githubClientId) {
      alert("请先在 .env 文件中设置 REACT_APP_GITHUB_CLIENT_ID");
      return;
    }

    const redirectUri = `${window.location.origin}/oauth/callback`;
    const scope = "read:user user:email";
    const state = Math.random().toString(36).substring(2);

    sessionStorage.setItem("github_oauth_state", state);

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(githubClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;

    window.location.href = authUrl;
  };

  return (
    <div className={"windows-lockscreen " + (fadeOut ? "windows-fade-out" : "")}>
      <div className="lock-wallpaper" />

      <div className="login-container">
        {/* 左侧 LOGO */}
        <div className="login-logo-area">
          <img src="/logo.png" className="login-logo" alt="Veyth OJ" />
          <h1>Veyth OJ</h1>
          <p>Online Judge System</p>
        </div>

        {/* 右侧登录 */}
        <div className="windows-login">
          <h2>{formData.username || "用户登录"}</h2>

          {registrationSuccess && (
            <div className="success-message">注册成功，请登录</div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          <form onSubmit={login}>
            <input
              name="username"
              placeholder="用户名"
              value={formData.username}
              onChange={handleChange}
            />

            <div className="password-wrapper">
              <input
                name="password"
                type="password"
                placeholder="密码"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </button>

            <button type="button" className="github-login-button" onClick={githubLogin}>
              <svg className="github-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 016 0c2.3-1.6 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.3.8 1 .8 2v3c0 .3.2.7.8.6A12 12 0 0012 .3"
                />
              </svg>
              <span>使用 GitHub 登录</span>
            </button>
          </form>

          <div className="oauth-divider">
            <span>或者</span>
          </div>

          <p className="switch" onClick={() => navigate("/register")}>
            没有账号？立即注册
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
