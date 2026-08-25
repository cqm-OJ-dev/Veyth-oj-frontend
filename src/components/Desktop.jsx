import React, { useState, useEffect, useRef } from 'react';
import Window from './Window';
import './Desktop.css';
import Problems from '../pages/Problems';
import Contests from '../pages/Contests';
import Submissions from '../pages/Submissions';
import OnlineIDE from '../pages/online_ide';
import Admin from '../pages/Admin';
import UserAvatar from '../UserAvatar';
import wallpaper from "../assets/wallpaper.jpg";

const APP_LIST = [
  { key: 'problems', title: 'Problems', component: Problems },
  { key: 'contests', title: 'Contests', component: Contests },
  { key: 'submissions', title: 'Submissions', component: Submissions },
  { key: 'ide', title: 'Online IDE', component: OnlineIDE },
  // login/register are full-screen flows and intentionally not added as desktop apps
];

export default function Desktop({ language, currentUser, onLoginSuccess, onLogout }) {
  const [windows, setWindows] = useState([]);
  const [zBase, setZBase] = useState(100);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const startMenuRef = useRef(null);

  const defaultPos = { x: 120, y: 80 };
  const defaultSize = { w: 900, h: 560 };

  const activeWindowId = windows.reduce((current, win) => {
    if (!current || win.z > current.z) return win;
    return current;
  }, null)?.id;

  const openApp = (appKey) => {
    const app = APP_LIST.find(a => a.key === appKey);
    // allow admin as a dynamic app
    if (!app && appKey !== 'admin') return;
    const id = Date.now();
    const Component = app ? app.component : Admin;
    const title = app ? app.title : '管理平台';
    setWindows(w => [...w, { id, key: appKey, title, Component, z: zBase, minimized: false, maximized: false, pos: defaultPos, size: defaultSize }]);
    setZBase(z => z + 1);
  };

  const closeWindow = (id) => setWindows(w => w.filter(win => win.id !== id));

  const focusWindow = (id) => setWindows(w => w.map(win => win.id === id ? { ...win, z: zBase + 1, minimized: false } : win));

  const toggleMinimizeWindow = (id) => setWindows(w => w.map(win => win.id === id ? { ...win, minimized: !win.minimized } : win));

  const toggleMaximizeWindow = (id) => setWindows(w => w.map(win => win.id === id ? { ...win, maximized: !win.maximized, minimized: false } : win));

  const taskbarClick = (id) => {
    const win = windows.find(x => x.id === id);
    if (!win) return;
    if (win.minimized) {
      // restore and focus
      setWindows(w => w.map(x => x.id === id ? { ...x, minimized: false, z: zBase + 1 } : x));
      setZBase(z => z + 1);
    } else {
      // minimize if it's active, otherwise focus
      const topZ = Math.max(...windows.map(x => x.z || 0), 0);
      if (win.z === topZ) {
        setWindows(w => w.map(x => x.id === id ? { ...x, minimized: true } : x));
      } else {
        focusWindow(id);
        setZBase(z => z + 1);
      }
    }
  };

  useEffect(() => {
    if (!isStartOpen) return undefined;
    const handler = (event) => {
      if (startMenuRef.current && !startMenuRef.current.contains(event.target)) {
        setIsStartOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [isStartOpen]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="desktop-root">
      <div
    className="desktop-background"
    style={{
        backgroundImage:
        `linear-gradient(
            135deg,
            rgba(0,60,130,.45),
            rgba(0,0,0,.55)
        ),
        url(${wallpaper})`
    }}
/>

      <div className="desktop-icons">
        {APP_LIST.map(app => (
          <div key={app.key} className="desktop-icon" onDoubleClick={() => openApp(app.key)}>
            <div className={`icon-visual icon-${app.key}`} />
            <div className="icon-label">{app.title}</div>
          </div>
        ))}
        {currentUser?.is_staff && (
          <div className="desktop-icon" onDoubleClick={() => openApp('admin')}>
            <div className={`icon-visual icon-admin`} />
            <div className="icon-label">管理平台</div>
          </div>
        )}
      </div>

      {windows.map(win => (
        <Window
          key={win.id}
          id={win.id}
          title={win.title}
          zIndex={win.z}
          minimized={win.minimized}
          maximized={win.maximized}
          onFocus={(id) => { focusWindow(id); setZBase(z => z + 1); }}
          onClose={closeWindow}
          onMinimize={toggleMinimizeWindow}
          onMaximize={toggleMaximizeWindow}
        >
          <win.Component language={language} onLoginSuccess={onLoginSuccess} currentUser={currentUser} />
        </Window>
      ))}

      <div className="taskbar">
        <div className="start" onClick={() => setIsStartOpen(open => !open)}>
          <span className="start-icon">⊞</span>
          <span>Start</span>
        </div>
        <div className="taskbar-windows">
          {windows.map(w => (
            <div key={w.id} className={`taskbar-item${w.id === activeWindowId ? ' active' : ''}`} onClick={() => taskbarClick(w.id)}>{w.title}</div>
          ))}
        </div>
        <div className="tray-right">
          <UserAvatar user={currentUser} onLogout={onLogout} />
          <div className="tray">{currentTime.toLocaleTimeString()}</div>
        </div>
      </div>
      {isStartOpen && (
        <div className="start-menu" ref={startMenuRef}>
          <div className="start-menu-search">
            <span className="start-menu-search-icon">🔍</span>
            <input type="text" placeholder="Search apps, settings..." disabled />
          </div>
          <div className="start-menu-section">
            <div className="start-menu-section-title">Pinned</div>
            <div className="start-menu-grid">
              {APP_LIST.map(app => (
                <button key={app.key} className="start-menu-item" onClick={() => { openApp(app.key); setIsStartOpen(false); }}>
                  <div className={`start-menu-icon icon-${app.key}`} />
                  <span>{app.title}</span>
                </button>
              ))}
              {currentUser?.is_staff && (
                <button className="start-menu-item" onClick={() => { openApp('admin'); setIsStartOpen(false); }}>
                  <div className={`start-menu-icon icon-admin`} />
                  <span>管理平台</span>
                </button>
              )}
            </div>
          </div>
          <div className="">
            <button className="" onClick={() => { onLogout?.(); setIsStartOpen(false); }}>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
