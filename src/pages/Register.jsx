import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AuthPages.css";
import { API_BASE } from "../services/authService";
import { useLanguage } from "../context/languageContext";
import LanguageToggle from "../components/LanguageToggle";

const Register = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const register = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.mismatch'));
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_BASE}/api/auth/register/`,
        {
          username: formData.username,
          email: formData.email,
          password: formData.password
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      setSuccess(t('register.success'));

      setTimeout(() => {
        navigate("/login", {
          state: {
            registrationSuccess: true
          }
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || t('register.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="windows-lockscreen">
      <div className="lock-wallpaper" />

      <div className="lock-lang">
        <LanguageToggle variant="glass" />
      </div>

      <div className="login-container">
        {/* 左侧 LOGO */}
        <div className="login-logo-area">
          <img src="/logo.png" className="login-logo" alt={t('register.brand')} />
          <h1>{t('register.brand')}</h1>
          <p>{t('register.tagline')}</p>
        </div>

        {/* 右侧注册 */}
        <div className="windows-login register-box">
          <h2>{t('register.heading')}</h2>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {success && (
            <div className="success-message">{success}</div>
          )}

          <form onSubmit={register}>
            <input
              name="username"
              placeholder={t('register.username')}
              value={formData.username}
              onChange={handleChange}
            />

            <input
              name="email"
              type="email"
              placeholder={t('register.email')}
              value={formData.email}
              onChange={handleChange}
            />

            <div className="password-wrapper">
              <input
                name="password"
                type="password"
                placeholder={t('register.password')}
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="password-wrapper">
              <input
                name="confirmPassword"
                type="password"
                placeholder={t('register.confirm')}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button disabled={loading}>
              {loading ? t('register.submitting') : t('register.submit')}
            </button>
          </form>

          <p className="switch" onClick={() => navigate("/login")}>
            {t('register.hasAccount')} {t('register.login')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
