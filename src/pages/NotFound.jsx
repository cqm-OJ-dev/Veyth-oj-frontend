// NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import './AuthPages.css';
import { useLanguage } from '../context/languageContext';

function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="not-found">
      <div className="not-found-card">
        <h1>{t('notFound.title')}</h1>
        <p>{t('notFound.desc')}</p>
        <Link to="/">{t('notFound.back')}</Link>
      </div>
    </div>
  );
}

export default NotFound;