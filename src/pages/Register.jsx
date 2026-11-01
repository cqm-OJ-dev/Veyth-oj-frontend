import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AuthPages.css";
import { API_BASE } from "../services/authService";
import { generateVerificationCode, sendVerificationEmail } from "../services/emailVerificationService";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
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

    const email = formData.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入有效的邮箱地址");
      return;
    }

    setSendingCode(true);
    try {
      const code = generateVerificationCode();
      await sendVerificationEmail(email, code);
      setVerificationCode(code);
      setVerificationInput("");
      setCountdown(60);
      setSuccess("验证码已发送，请查收邮箱");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("两次密码不一致");
      return;
    }

    if (!verificationCode || countdown === 0) {
      setError("请先获取有效的邮箱验证码");
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
          email: formData.email,
          password: formData.password
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      setSuccess("注册成功，正在登录页面...");

      setTimeout(() => {
        navigate("/login", {
          state: {
            registrationSuccess: true
          }
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="windows-lockscreen">
      <div className="lock-wallpaper" />

      <div className="login-container">
        {/* 左侧 LOGO */}
        <div className="login-logo-area">
          <img src="/logo.png" className="login-logo" alt="Veyth OJ" />
          <h1>Veyth OJ</h1>
          <p>Create your account</p>
        </div>

        {/* 右侧注册 */}
        <div className="windows-login register-box">
          <h2>创建账户</h2>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {success && (
            <div className="success-message">{success}</div>
          )}

          <form onSubmit={register}>
            <input
              name="username"
              placeholder="用户名"
              value={formData.username}
              onChange={handleChange}
            />

            <div className="verification-row">
              <input
                name="email"
                type="email"
                placeholder="邮箱"
                value={formData.email}
                onChange={handleChange}
                disabled={sendingCode}
                required
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={sendingCode || countdown > 0}
              >
                {sendingCode
                  ? "发送中..."
                  : countdown > 0
                    ? `${countdown}秒后重发`
                    : "获取验证码"}
              </button>
            </div>

            <input
              name="verificationCode"
              type="text"
              placeholder="邮箱验证码"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              autoComplete="one-time-code"
              inputMode="text"
              maxLength={6}
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

            <div className="password-wrapper">
              <input
                name="confirmPassword"
                type="password"
                placeholder="确认密码"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button disabled={loading || sendingCode}>
              {loading ? "注册中..." : "注册"}
            </button>
          </form>

          <p className="switch" onClick={() => navigate("/login")}>
            已有账号？立即登录
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
