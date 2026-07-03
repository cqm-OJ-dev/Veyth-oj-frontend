import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthPages.css';

import { useAuth } from '../hooks/useAuth';

import { translations, getBrowserLanguage } from '../include/locales';

const Register = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading: authLoading, login, logout } = useAuth();
  if (currentUser){
      navigate('/');
  }
  document.title = "注册";
  const [language, setLanguage] = useState(getBrowserLanguage);
  
  const t = translations[language] || translations.en;
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };
  const UserAvatar = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="user-avatar-container">
        <button 
          className="avatar-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          {user.username.charAt(0).toUpperCase()}
        </button>
        
        {isOpen && (
          <div className="user-dropdown">
            <div className="user-info">
              <span className="username">{user.username}</span>
            </div>
            <button className="dropdown-item" onClick={() => setIsOpen(false)}>
              {t.nav.profile || 'Profile'}
            </button>
            <button 
              className="dropdown-item logout" 
              onClick={() => logout()}
            >
              {t.nav.logout || 'Logout'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderNav = () => (
    <nav className="hydro-nav">
      
      {currentUser ? (
        <>
        <a href="/problems">{t.nav.problems}</a>
        <a href="/contests">{t.nav.contests}</a>
        <a href="/submissions">{t.nav.submissions}</a>
        <UserAvatar user={currentUser} />
        </>
      ) : (
        <>
          <a href="/login">{t.nav.login}</a>
          <a href="/register">{t.nav.register}</a>
        </>
      )}
      
      <div className="language-switcher">
        <select 
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="language-select"
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>
    </nav>
  );
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 验证密码是否匹配
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不匹配');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://cqiming.pythonanywhere.com/api/auth/register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      }, {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: false  // 如果需要跨域携带凭证
      });

      if (response.status === 201) {
        // 注册成功，跳转到登录页面
        navigate('/login', { state: { registrationSuccess: true } });
      }
    } catch (err) {
      if (err.response) {
        // Django返回的错误
        if (err.response.status === 400) {
          setError(err.response.data.error || '注册失败，请检查输入');
        } else {
          setError('服务器错误，请稍后再试');
        }
      } else {
        setError('网络错误，请检查连接');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      
      <header className="hydro-header">
        <h1 className="hydro-title">{t.title}</h1>
        {renderNav()}
      </header>
    <div className="auth-container">
      <div className="auth-card">
        <h2>注册账号</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength="3"
              maxLength="30"
            />
          </div>
          
          <div className="form-group">
            <label>电子邮箱</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label>确认密码</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                注册中...
              </>
            ) : '立即注册'}
          </button>
        </form>
        
        <p className="auth-switch">
          已有账号？ <span onClick={() => navigate('/login')}>立即登录</span>
          <p>{t.footer.replace('{year}', new Date().getFullYear())}</p>
        </p>
      </div>
    </div>
    </>
  );
};

export default Register;
