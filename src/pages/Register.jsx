import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AuthPages.css";
import { API_BASE } from "../services/authService";
import { useLanguage } from "../context/languageContext";
import LanguageToggle from "../components/LanguageToggle";

const Register = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const emailInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    verificationCode: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "email" ? { verificationCode: "" } : {})
    }));

    if (name === "email") {
      setCodeSent(false);
      setError("");
      setSuccess("");
    }
  };

  const sendVerificationCode = async () => {
    setError("");
    setSuccess("");

    if (!emailInputRef.current?.reportValidity()) return;

    setSendingCode(true);
    try {
      await axios.post(
        `${API_BASE}/api/auth/email-verification/send/`,
        { email: formData.email.trim() },
        { headers: { "Content-Type": "application/json" } }
      );
      setCodeSent(true);
      setSuccess(t("register.codeSent"));
    } catch (err) {
      setError(err.response?.data?.error || t("register.sendCodeFailed"));
    } finally {
      setSendingCode(false);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.mismatch'));
      return;
    }

    if (!formData.verificationCode.trim()) {
      setError(t("register.verificationRequired"));
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_BASE}/api/auth/register/`,
        {
          username: formData.username,
          email: formData.email.trim(),
          password: formData.password,
          verification_code: formData.verificationCode.trim()
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
              ref={emailInputRef}
              name="email"
              type="email"
              required
              disabled={sendingCode || loading}
              placeholder={t('register.email')}
              value={formData.email}
              onChange={handleChange}
            />

            <div className="verification-code-row">
              <input
                name="verificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder={t("register.verificationCode")}
                value={formData.verificationCode}
                onChange={handleChange}
                required
              />
              <button
                className="send-verification-code"
                type="button"
                onClick={sendVerificationCode}
                disabled={sendingCode || loading}
              >
                {sendingCode ? t("register.sendingCode") : t("register.sendCode")}
              </button>
            </div>
            {codeSent && <p className="verification-code-hint">{t("register.codeExpiry")}</p>}

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

            <button disabled={loading || sendingCode}>
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
