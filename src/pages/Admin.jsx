import React from 'react';
import './online_ide.css';
import '../components/Window.css';

export default function Admin() {
  return (
    <div className="window-content admin-container">
      <iframe
        title="管理平台"
        src="https://cqiming.pythonanywhere.com/admin"
        className="admin-frame"
      />
    </div>
  );
}