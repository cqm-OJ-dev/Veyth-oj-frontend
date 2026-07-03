import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Problems from './pages/Problems';
import Contests from './pages/Contests';
import Submissions from './pages/Submissions';
import OnlineIDE from './pages/online_ide';
import { translations, getBrowserLanguage } from './include/locales';
import { useAuth } from './hooks/useAuth';
import axios from 'axios';
import './App.css';
import NotFound from './pages/NotFound';

function App() {
  const { currentUser, isLoading: authLoading, login, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [isConnected, setIsConnected] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [ok, setok] = useState(false);
  
  const t = translations[language] || translations.en;
  document.title = t.title;

  useEffect(() => {
    const browserLanguage = getBrowserLanguage();
    if (translations[browserLanguage]) {
      setLanguage(browserLanguage);
    }

    const checkConnection = async () => {
      try {
        const response = await axios.post('https://cqiming.pythonanywhere.com/tests/test_conntect/', {
          'message': 'ok'
        });
        if (response.status === 200) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Connection check failed:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
        setok(true);
      }
    };

    // 初始检查
    checkConnection();

    // 设置一个定时器，每隔5秒检查一次连接状态
    const intervalId = setInterval(checkConnection, 100);

    // 设置一个3秒的定时器来显示反馈提示
    const feedbackTimer = setTimeout(() => {
      setShowFeedbackPrompt(true);
    }, 5000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(feedbackTimer);
    };
  }, []);

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

  const renderHome = () => (
    <div className="hydro-container">
      <header className="hydro-header">
        <h1 className="hydro-title">{t.title}</h1>
        {renderNav()}
      </header>
      
      <main className="hydro-main">
        <section className="hydro-welcome">
          <h2>{t.welcome.title}</h2>
          <p>{t.welcome.subtitle}</p>
        </section>
        
        <section className="hydro-problems">
          <h3>{t.problems.recent}</h3>
          <div className="problem-list">
            {/* 问题列表内容 */}
          </div>
        </section>
      </main>
      
      <footer className="hydro-footer">
        <p>{t.footer.replace('{year}', new Date().getFullYear())}</p>
      </footer>
    </div>
  );

  // 如果正在加载或者未连接，显示加载界面
  if (isLoading || !isConnected) {
    return (
      <div className="hydro-loading-screen">
        <LoadingScreen showFeedbackPrompt={showFeedbackPrompt} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {currentUser ? (
        <>
            <Route path="/problems" element={<Problems language={language} />} />
            <Route path="/ide" element={<OnlineIDE language={language} />} />
            <Route path="/contests" element={<Contests language={language} />} />
            <Route path="/submissions" element={<Submissions language={language} />} />
        </>
        ) : (
        <>
            <Route 
                path="/login" 
                element={<Login language={language} onLoginSuccess={login} />} 
            />
            <Route path="/register" element={<Register language={language} />} />
        </>
        )}
        <Route path="/" element={renderHome()} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
