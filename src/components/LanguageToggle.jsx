import React from 'react';
import { useLanguage } from '../context/languageContext';
import Icon from './Icon';
import './LanguageToggle.css';

/**
 * 语言切换分段控件。
 * variant: 'glass'（深色/玻璃背景，桌面任务栏用） | 'light'（浅色卡片用）
 */
export default function LanguageToggle({ variant = 'glass', showIcon = true, className = '' }) {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div className={`lang-toggle lang-toggle--${variant} ${className}`.trim()} role="group" aria-label="Language">
      {showIcon && <Icon name="globe" size={15} className="lang-toggle-globe" />}
      {languages.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`lang-toggle-btn${language === opt.value ? ' active' : ''}`}
          onClick={() => setLanguage(opt.value)}
          aria-pressed={language === opt.value}
          title={opt.label}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}