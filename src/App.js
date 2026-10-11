import React, { useState, useEffect } from 'react';
import Desktop from './components/Desktop';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { AuthProvider, useAuthContext } from './context/authContext';
import { LanguageProvider, useLanguage } from './context/languageContext';
import axios from 'axios';
import { API_BASE } from './services/authService';
import './App.css';
import './pages/window-page.css';

function AppContent() {
  const { currentUser, login, logout } = useAuthContext();
  const { language, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);

  useEffect(() => {
    document.title = `${t('app.name')} · ${t('app.subtitle')}`;
  }, [t]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await axios.post(`${API_BASE}/tests/test_conntect/`, {
          'message': 'ok'
        });
        if (response.status === 200) {
          // 连接正常，无需额外操作
        }
      } catch (error) {
        console.warn('Connection check failed:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    // 初始检查
    checkConnection();

    // 每30秒检查一次连接状态（降低频率，避免频繁请求和刷屏）
    const intervalId = setInterval(checkConnection, 30000);

    // 设置一个5秒的定时器来显示反馈提示
    const feedbackTimer = setTimeout(() => {
      setShowFeedbackPrompt(true);
    }, 5000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(feedbackTimer);
    };
  }, []);

  // 将加载状态改为右下角通知，始终渲染 Desktop
  return (
    <Router>
      <div style={{ width: '100vw', height: '100vh' }}>
        {currentUser ? (
          <Routes>
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<NotFound />} />
            <Route path="/" element={<Desktop language={language} currentUser={currentUser} onLoginSuccess={login} onLogout={logout} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/login" element={<Login language={language} onLoginSuccess={login} />} />
            <Route path="/register" element={<Register language={language} />} />
            <Route path="/oauth/callback" element={<OAuthCallback onLoginSuccess={login} />} />
            <Route path="/" element={<Login language={language} onLoginSuccess={login} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
        {isLoading && (
          <LoadingScreen inline={true} showFeedbackPrompt={showFeedbackPrompt} />
        )}
      </div>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;