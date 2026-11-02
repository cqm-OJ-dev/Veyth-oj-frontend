import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AuthPages.css";
import { API_BASE } from "../services/authService";
import { useLanguage } from "../context/languageContext";
import LanguageToggle from "../components/LanguageToggle";
import { generateVerificationCode, sendVerificationEmail } from "../services/emailVerificationService";

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
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationInput, setVerificationInput] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((remaining) => remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (verificationCode && countdown === 0) {
      setVerificationCode("");
      setVerificationInput("");
    }
  }, [countdown, verificationCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));

    if (name === "email") {
      setVerificationCode("");
      setVerificationInput("");
      setCountdown(0);
      setError("");
      setSuccess("");
    }
  };

  const sendCode = async () => {
    setError("");
    setSuccess("");

    if (!emailInputRef.current?.reportValidity()) return;

    setSendingCode(true);
    try {
      const code = generateVerificationCode();
      await sendVerificationEmail(formData.email.trim(), code);
      setVerificationCode(code);
      setVerificationInput("");
      setCountdown(60);
      setSuccess(t("register.codeSent"));
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("register.sendCodeFailed"));
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

    if (!verificationCode || countdown === 0) {
      setError(t("register.verificationRequired"));
      return;
    }

    if (verificationInput.trim() !== verificationCode) {
      setError("邮箱验证码不正确");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_BASE}/api/auth/register/`,
        {
          username: formData.username,
          email: formData.email.trim(),
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
                inputMode="text"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[A-Za-z0-9]{6}"
                placeholder={t("register.verificationCode")}
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                required
              />
              <button
                className="send-verification-code"
                type="button"
                onClick={sendCode}
                disabled={sendingCode || loading || countdown > 0}
              >
                {sendingCode
                  ? t("register.sendingCode")
                  : countdown > 0
                    ? `${countdown}秒后重发`
                    : t("register.sendCode")}
              </button>
            </div>
            {verificationCode && <p className="verification-code-hint">{t("register.codeExpiry")}</p>}

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
