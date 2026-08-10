import React from 'react';
import './online_ide.css';

export default function Admin() {
  return (
    <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
      <iframe
        title="管理平台"
        src="https://cqiming.pythonanywhere.com/admin"
        style={{border: 'none', width: '100%', height: '100%'}}
      />
    </div>
  );
}
