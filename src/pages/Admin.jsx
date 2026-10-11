import React from 'react';
import './online_ide.css';
import '../components/Window.css';
import { API_BASE } from '../services/authService';

export default function Admin() {
  return (
    <div className="window-content admin-container">
      <iframe
        title="管理平台"
        src={`${API_BASE}/admin`}
        className="admin-frame"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}