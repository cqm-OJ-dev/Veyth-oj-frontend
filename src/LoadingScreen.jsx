import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';

import { translations, getBrowserLanguage } from './include/locales';

const LoadingScreen = ({ showFeedbackPrompt, inline=false })  => {
  const [loadingText, setLoadingText] = useState('Loading...');
  const language = getBrowserLanguage();
  const t = translations[language] || translations.en;
  useEffect(() => {
    const userLanguage = navigator.language || navigator.userLanguage;
    const languageMap = {
      'zh': '正在连接服务器...',
      'zh-CN': '正在连接服务器...',
      'zh-TW': '正在連接伺服器...',
      'ja': 'サーバーに接続中...',
      'ko': '서버에 연결 중...',
      'en': 'Connecting to server...',
      'es': 'Conectando al servidor...',
      'fr': 'Connexion au serveur...',
      'de': 'Verbindung zum Server...',
      'ru': 'Подключение к серверу...',
      'pt': 'Conectando ao servidor...',
      'it': 'Connessione al server...',
      'ar': 'جارٍ الاتصال بالخادم...',
      'hi': 'सर्वर से कनेक्ट हो रहा है...',
    };
    setLoadingText(languageMap[userLanguage.split('-')[0]] || languageMap[userLanguage] || 'Connecting to judge server...');
  }, []);

  if (inline) {
    return (
      <div className="hydro-notification">
        <div className="hydro-notification-title">{t.title}</div>
        <div className="hydro-notification-body">{loadingText}</div>
      </div>
    );
  }

  return (
    <div className="hydro-loading-screen">
      <div className="hydro-loading-content">
        <div className="hydro-logo">
          <span className="hydro-logo-text">{t.title}</span>
          <div className="hydro-logo-subtext">Online Judge</div>
        </div>
        <div className="hydro-loading-bar">
          <div className="hydro-loading-progress"></div>
        </div>
        <p className="hydro-loading-text">{loadingText}</p>
        {showFeedbackPrompt && (
          <div className="feedback-prompt">
            <p>{t.issues}
              <button type="button" className="feedback-link" onClick={() => alert('发送反馈')}>
                {t.feedback}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;