import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { translations, getBrowserLanguage } from '../include/locales';
import './AuthPages.css';

import '../App.css';

import { useAuth } from '../hooks/useAuth';

const Login = ({ onLoginSuccess }) => {
    
  const navigate = useNavigate();
  const { currentUser, isLoading: authLoading, login, logout } = useAuth();
  if (currentUser){
      navigate('/');
  }
  // 设置页面标题
  document.title = "登录";
  
  const [language, setLanguage] = useState(getBrowserLanguage);
  
  const t = translations[language] || translations.en;
  // 状态管理
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // 路由相关
  const location = useLocation();

  // 检查注册成功的状态
  useEffect(() => {
    if (location.state?.registrationSuccess) {
      setRegistrationSuccess(true);
      // 清除state，防止刷新后仍然显示
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // 处理表单变化
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
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

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://cqiming.pythonanywhere.com/api/auth/login/', {
        username: formData.username,
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // 调用父组件传递的成功回调
        if (onLoginSuccess) {
          onLoginSuccess({
            username: formData.username,
            token: response.data.access,
            refreshToken: response.data.refresh
          });
        }
        
        // 存储token（如果是JWT认证）
        if (response.data.access) {
          localStorage.setItem('authToken', response.data.access);
          localStorage.setItem('refreshToken', response.data.refresh);
        }
        
        // 登录成功，跳转到首页
        navigate('/');
      }
    } catch (err) {
      handleLoginError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理登录错误
  const handleLoginError = (error) => {
    console.error('登录错误:', error);
    
    if (error.response) {
      // 请求已发出，服务器返回非2xx状态码
      if (error.response.status === 401) {
        setError('用户名或密码错误');
      } else if (error.response.status === 400) {
        setError('请求参数错误');
      } else if (error.response.status >= 500) {
        setError('服务器错误，请稍后再试');
      } else {
        setError('登录失败，请重试');
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      setError('无法连接到服务器，请检查网络');
    } else {
      // 请求配置错误
      setError('请求配置错误: ' + error.message);
    }
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

  return (
    <>
      
      <header className="hydro-header">
        <h1 className="hydro-title">{t.title}</h1>
        {renderNav()}
      </header>
    <div className="auth-container">
      <div className="auth-card">
        <h2>用户登录</h2>
        
        {/* 注册成功提示 */}
        {registrationSuccess && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            注册成功！请登录您的账号
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {error}
          </div>
        )}
        
        {/* 登录表单 */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              disabled={isLoading}
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
                登录中...
              </>
            ) : '立即登录'}
          </button>
        </form>
        <p className="auth-switch">
          没有账号？{' '}
          <span 
            onClick={() => !isLoading && navigate('/register')}
            className={isLoading ? 'disabled-link' : ''}
          >
            立即注册
          </span>
          <p>{t.footer.replace('{year}', new Date().getFullYear())}</p>
        </p>
      </div>
    
    </div>
    </>
  );
};

export default Login;
