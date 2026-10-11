import React from 'react';
import './LoadingScreen.css';

import { useLanguage } from './context/languageContext';

const LoadingScreen = ({ showFeedbackPrompt, inline = false }) => {
  const { t } = useLanguage();

  if (inline) {
    return (
      <div className="hydro-notification">
        <div className="hydro-notification-title">{t('app.name')}</div>
        <div className="hydro-notification-body">{t('loading.connecting')}</div>
      </div>
    );
  }

  return (
    <div className="hydro-loading-screen">
      <div className="hydro-loading-content">
        <div className="hydro-logo">
          <span className="hydro-logo-text">{t('app.name')}</span>
          <div className="hydro-logo-subtext">Online Judge</div>
        </div>
        <div className="hydro-loading-bar">
          <div className="hydro-loading-progress"></div>
        </div>
        <p className="hydro-loading-text">{t('loading.connecting')}</p>
        {showFeedbackPrompt && (
          <div className="feedback-prompt">
            <p>{t('loading.issues')}
              <button type="button" className="feedback-link" onClick={() => alert(t('loading.feedback'))}>
                {t('loading.feedback')}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;