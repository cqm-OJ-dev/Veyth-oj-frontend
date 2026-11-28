import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BookOpen, Trophy, ListChecks, Code2, ShieldCheck, Search, LayoutGrid, Power, X, Bell } from 'lucide-react';
import Window from './Window';
import './Desktop.css';
import Problems from '../pages/Problems';
import Contests from '../pages/Contests';
import Submissions from '../pages/Submissions';
import OnlineIDE from '../pages/online_ide';
import Admin from '../pages/Admin';
import ProblemDetail from '../pages/ProblemDetail';
import SubmissionDetail from '../pages/SubmissionDetail';
import UserAvatar from '../UserAvatar';
import NotificationCenter from './NotificationCenter';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../context/languageContext';
import { listProblems, listSubmissions, normalizeSubmissionStatus } from '../services/judgeService';
import { getUnreadNotificationCount } from '../services/notificationService';
import wallpaper from "../assets/wallpaper.jpg";

const APP_LIST = [
  { key: 'problems', i18n: 'apps.problems', icon: BookOpen, color: 'icon-blue', component: Problems },
  { key: 'contests', i18n: 'apps.contests', icon: Trophy, color: 'icon-amber', component: Contests },
  { key: 'submissions', i18n: 'apps.submissions', icon: ListChecks, color: 'icon-green', component: Submissions },
  { key: 'ide', i18n: 'apps.ide', icon: Code2, color: 'icon-purple', component: OnlineIDE },
];

const ADMIN_APP = { key: 'admin', i18n: 'apps.admin', icon: ShieldCheck, color: 'icon-teal' };
const AdminIcon = ADMIN_APP.icon;

const DEFAULT_POS = Object.freeze({ x: 120, y: 80 });
const DEFAULT_SIZE = Object.freeze({ w: 900, h: 560 });

const normalizeList = (data, key) => (
  Array.isArray(data?.[key]) ? data[key]
    : Array.isArray(data?.results) ? data.results
    : Array.isArray(data) ? data : []
);

const APP_RESOLVERS = {
  'problem-detail': {
    title: (props) => `Problem #${props?.problemId ?? '—'}`,
    Component: (props) => {
      const Component = ProblemDetail;
      const { openSubmission, problemId, onOpenSubmission, ...rest } = props || {};
      return <Component problemId={problemId} onOpenSubmission={openSubmission || onOpenSubmission} {...rest} />;
    }
  },
  'submission-detail': {
    title: (props) => `Submission #${props?.submissionId ?? '—'}`,
    Component: (props) => {
      const Component = SubmissionDetail;
      const { openProblem, submissionId, onOpenProblem, ...rest } = props || {};
      return <Component submissionId={submissionId} onOpenProblem={openProblem || onOpenProblem} {...rest} />;
    }
  },
};

export default function Desktop({ currentUser, onLoginSuccess, onLogout }) {
  const { t, language } = useLanguage();
  const [windows, setWindows] = useState([]);
  const [zBase, setZBase] = useState(100);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [startSearch, setStartSearch] = useState('');
  const [searchResults, setSearchResults] = useState({ apps: [], problems: [], submissions: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationCountError, setNotificationCountError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const startMenuRef = useRef(null);
  const startButtonRef = useRef(null);
  const startSearchRef = useRef(null);

  const activeWindowId = windows.reduce((current, win) => {
    if (!current || win.z > current.z) return win;
    return current;
  }, null)?.id;

  const createWindow = useCallback(({ key, title, Component, props = {}, size = DEFAULT_SIZE }) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setWindows(w => [...w, {
      id, key, title, Component, z: zBase, minimized: false, maximized: false,
      pos: { x: DEFAULT_POS.x + ((w.length * 24) % 180), y: DEFAULT_POS.y + ((w.length * 18) % 120) },
      size,
      props
    }]);
    setZBase(z => z + 1);
    return id;
    // DEFAULT_POS / DEFAULT_SIZE 为模块顶层 Object.freeze 常量，无需也不可放入依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zBase]);

  const openProblem = (problemId) => {
    const resolver = APP_RESOLVERS['problem-detail'];
    createWindow({
      key: 'problem-detail',
      title: resolver.title({ problemId }),
      Component: resolver.Component,
      props: { problemId, onOpenSubmission: openSubmission }
    });
  };

  const openSubmission = (submissionId) => {
    const resolver = APP_RESOLVERS['submission-detail'];
    createWindow({
      key: 'submission-detail',
      title: resolver.title({ submissionId }),
      Component: resolver.Component,
      props: { submissionId, onOpenProblem: openProblem }
    });
  };

  const openApp = (appKey) => {
    const app = APP_LIST.find(a => a.key === appKey);
    if (!app && appKey !== 'admin') return;
    const Component = app ? app.component : Admin;
    const title = app ? t(app.i18n) : t('apps.admin');
    let wrappedComponent = Component;
    if (appKey === 'problems') {
      wrappedComponent = (props) => <Component {...props} onOpenProblem={openProblem} />;
    } else if (appKey === 'submissions') {
      wrappedComponent = (props) => <Component {...props} onOpenSubmission={openSubmission} onOpenProblem={openProblem} />;
    }
    createWindow({ key: appKey, title, Component: wrappedComponent });
  };

  const closeStartMenu = () => {
    setIsStartOpen(false);
    setStartSearch('');
  };

  const openSearchResult = (kind, item) => {
    closeStartMenu();
    if (kind === 'app') openApp(item.key);
    if (kind === 'problem') openProblem(item.id ?? item.problem_id);
    if (kind === 'submission') openSubmission(item.id ?? item.submission_id);
  };

  const focusWindow = useCallback((id) => setWindows(w => w.map(win => win.id === id ? { ...win, z: zBase + 1, minimized: false } : win)), [zBase]);
  const closeWindow = (id) => setWindows(w => w.filter(win => win.id !== id));
  const toggleMinimizeWindow = (id) => setWindows(w => w.map(win => win.id === id ? { ...win, minimized: !win.minimized } : win));
  const toggleMaximizeWindow = (id) => setWindows(w => w.map(win => win.id === id ? { ...win, maximized: !win.maximized, minimized: false } : win));

  const taskbarClick = (id) => {
    const win = windows.find(x => x.id === id);
    if (!win) return;
    if (win.minimized) {
      setWindows(w => w.map(x => x.id === id ? { ...x, minimized: false, z: zBase + 1 } : x));
      setZBase(z => z + 1);
    } else {
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
      if (startMenuRef.current && !startMenuRef.current.contains(event.target)
        && !startButtonRef.current?.contains(event.target)) {
        setIsStartOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [isStartOpen]);

  useEffect(() => {
    if (!isStartOpen) {
      setStartSearch('');
      setSearchResults({ apps: [], problems: [], submissions: [] });
      setSearchLoading(false);
      setSearchError(false);
      return undefined;
    }

    const focusTimer = window.setTimeout(() => startSearchRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [isStartOpen]);

  useEffect(() => {
    const query = startSearch.trim().toLocaleLowerCase();
    if (!isStartOpen || !query) {
      setSearchResults({ apps: [], problems: [], submissions: [] });
      setSearchLoading(false);
      setSearchError(false);
      return undefined;
    }

    let active = true;
    setSearchLoading(true);
    setSearchError(false);
    const apps = [...APP_LIST, ...(currentUser?.is_staff ? [ADMIN_APP] : [])]
      .filter((app) => `${t(app.i18n)} ${app.key}`.toLocaleLowerCase().includes(query));
    setSearchResults({ apps, problems: [], submissions: [] });
    const timer = window.setTimeout(async () => {
      const [problemResponse, submissionResponse] = await Promise.allSettled([
        listProblems(),
        currentUser ? listSubmissions() : Promise.resolve([])
      ]);
      if (!active) return;

      const problems = problemResponse.status === 'fulfilled'
        ? normalizeList(problemResponse.value, 'problems').filter((problem) => (
          `${problem.title || ''} ${problem.difficulty || ''} ${problem.id ?? problem.problem_id ?? ''}`
            .toLocaleLowerCase().includes(query)
        ))
        : [];
      const submissions = submissionResponse.status === 'fulfilled'
        ? normalizeList(submissionResponse.value, 'submissions').filter((submission) => {
          const problemId = submission.problem_id ?? submission.problem?.id ?? '';
          const status = normalizeSubmissionStatus(submission.status) || '';
          const translatedStatus = t(`status.${status}`);
          return String(problemId).toLocaleLowerCase().includes(query)
            || String(status).toLocaleLowerCase().includes(query)
            || (translatedStatus !== `status.${status}` && translatedStatus.toLocaleLowerCase().includes(query));
        })
        : [];

      setSearchResults({ apps, problems, submissions });
      setSearchError(problemResponse.status === 'rejected'
        || (currentUser && submissionResponse.status === 'rejected'));
      setSearchLoading(false);
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [currentUser, isStartOpen, startSearch, t]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const refreshUnreadNotifications = useCallback(async () => {
    if (!currentUser) {
      setUnreadNotifications(0);
      setNotificationCountError('');
      return;
    }
    try {
      const response = await getUnreadNotificationCount();
      setUnreadNotifications(Number(response?.unread_count) || 0);
      setNotificationCountError('');
    } catch (error) {
      setNotificationCountError(error.message || t('notifications.loadFailed'));
    }
  }, [currentUser, t]);

  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const updateNotificationBadge = useCallback((count) => {
    setUnreadNotifications(count);
    setNotificationCountError('');
  }, []);

  useEffect(() => {
    refreshUnreadNotifications();
    if (!currentUser) return undefined;
    const timer = window.setInterval(refreshUnreadNotifications, 5000);
    return () => window.clearInterval(timer);
  }, [currentUser, refreshUnreadNotifications]);

  const rendered = useMemo(() => windows.map(win => {
    const C = win.Component;
    return (
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
        <C
          language={language}
          onLoginSuccess={onLoginSuccess}
          currentUser={currentUser}
          {...(win.props || {})}
        />
      </Window>
    );
  }), [windows, language, onLoginSuccess, currentUser, focusWindow]);

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
        {APP_LIST.map(app => {
          const AppIcon = app.icon;
          return (
            <div key={app.key} className="desktop-icon" onDoubleClick={() => openApp(app.key)}>
              <div className={`icon-visual ${app.color}`}>
                <AppIcon size={30} strokeWidth={2} />
              </div>
              <div className="icon-label">{t(app.i18n)}</div>
            </div>
          );
        })}
        {currentUser?.is_staff && (
          <div className="desktop-icon" onDoubleClick={() => openApp('admin')}>
            <div className={`icon-visual ${ADMIN_APP.color}`}>
              <AdminIcon size={30} strokeWidth={2} />
            </div>
            <div className="icon-label">{t(ADMIN_APP.i18n)}</div>
          </div>
        )}
      </div>

      {rendered}

      <div className="taskbar">
        <button ref={startButtonRef} type="button" className="start" aria-label={t('desktop.start')} aria-expanded={isStartOpen} onClick={() => setIsStartOpen(open => !open)}>
          <LayoutGrid className="start-icon" size={22} />
          <span className="start-label">{t('desktop.start')}</span>
        </button>
        <div className="taskbar-windows">
          {windows.map(w => (
            <div key={w.id} className={`taskbar-item${w.id === activeWindowId ? ' active' : ''}`} onClick={() => taskbarClick(w.id)}>{w.title}</div>
          ))}
        </div>
        <div className="tray-right">
          <LanguageToggle variant="glass" />
          <UserAvatar user={currentUser} onLogout={onLogout} />
          <div className="tray">{currentTime.toLocaleTimeString()}</div>
          {currentUser && (
            <div className="notification-center-anchor">
              <button
                type="button"
                className="notification-bell-button"
                aria-label={t('notifications.title')}
                aria-expanded={notificationsOpen}
                title={notificationCountError || t('notifications.title')}
                onClick={() => {
                  setIsStartOpen(false);
                  setNotificationsOpen((open) => !open);
                  if (notificationsOpen) refreshUnreadNotifications();
                }}
              >
                <Bell size={19} />
                {unreadNotifications > 0 && (
                  <span className="notification-unread-dot" aria-hidden="true" />
                )}
                {unreadNotifications > 0 && (
                  <span className="notification-unread-badge">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>
                )}
              </button>
              {notificationsOpen && (
                <NotificationCenter
                  currentUser={currentUser}
                  onClose={closeNotifications}
                  onUnreadCountChange={updateNotificationBadge}
                />
              )}
            </div>
          )}
        </div>
      </div>
      {isStartOpen && (
        <div className="start-menu" ref={startMenuRef}>
          <div className="start-menu-search">
            <Search className="start-menu-search-icon" size={18} />
            <input
              ref={startSearchRef}
              type="search"
              placeholder={t('desktop.search')}
              value={startSearch}
              onChange={(event) => setStartSearch(event.target.value)}
              aria-label={t('desktop.search')}
            />
            {startSearch && (
              <button type="button" className="start-menu-clear" onClick={() => setStartSearch('')} aria-label={t('desktop.clearSearch')}>
                <X size={16} />
              </button>
            )}
          </div>
          <div className="start-menu-content">
            {!startSearch.trim() ? (
              <div className="start-menu-section">
                <div className="start-menu-section-title">{t('desktop.pinned')}</div>
                <div className="start-menu-grid">
                  {[...APP_LIST, ...(currentUser?.is_staff ? [ADMIN_APP] : [])].map((app) => {
                    const AppIcon = app.icon;
                    return (
                      <button key={app.key} className="start-menu-item" onClick={() => openSearchResult('app', app)}>
                        <div className={`start-menu-icon ${app.color}`}>
                          <AppIcon size={22} strokeWidth={2} />
                        </div>
                        <span>{t(app.i18n)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="start-menu-results">
                {searchLoading && <div className="start-menu-hint">{t('desktop.searching')}</div>}
                {searchError && <div className="start-menu-hint">{t('desktop.searchPartialError')}</div>}
                {!!searchResults.apps.length && (
                  <section className="start-menu-result-section">
                    <h3>{t('desktop.appsResults')}</h3>
                    {searchResults.apps.map((app) => {
                      const AppIcon = app.icon;
                      return (
                        <button key={app.key} className="start-menu-result" onClick={() => openSearchResult('app', app)}>
                          <span className={`start-menu-result-icon ${app.color}`}><AppIcon size={19} /></span>
                          <span className="start-menu-result-copy"><strong>{t(app.i18n)}</strong><small>{t('desktop.appResultType')}</small></span>
                        </button>
                      );
                    })}
                  </section>
                )}
                {!!searchResults.problems.length && (
                  <section className="start-menu-result-section">
                    <h3>{t('desktop.problemsResults')}</h3>
                    {searchResults.problems.slice(0, 5).map((problem) => (
                      <button key={problem.id ?? problem.problem_id} className="start-menu-result" onClick={() => openSearchResult('problem', problem)}>
                        <span className="start-menu-result-icon icon-blue"><BookOpen size={19} /></span>
                        <span className="start-menu-result-copy">
                          <strong>{problem.title || `#${problem.id ?? problem.problem_id}`}</strong>
                          <small>#{problem.id ?? problem.problem_id} · {problem.difficulty || t('common.unknown')}</small>
                        </span>
                      </button>
                    ))}
                  </section>
                )}
                {!!searchResults.submissions.length && (
                  <section className="start-menu-result-section">
                    <h3>{t('desktop.submissionsResults')}</h3>
                    {searchResults.submissions.slice(0, 5).map((submission) => {
                      const status = normalizeSubmissionStatus(submission.status) || '';
                      const translatedStatus = t(`status.${status}`);
                      const problemId = submission.problem_id ?? submission.problem?.id ?? '—';
                      return (
                        <button key={submission.id ?? submission.submission_id} className="start-menu-result" onClick={() => openSearchResult('submission', submission)}>
                          <span className="start-menu-result-icon icon-green"><ListChecks size={19} /></span>
                          <span className="start-menu-result-copy">
                            <strong>{submission.problem_title ?? submission.problem?.title ?? `#${problemId}`}</strong>
                            <small>{t('desktop.submissionResultMeta', { id: submission.id ?? submission.submission_id ?? '—', problemId, status: translatedStatus === `status.${status}` ? status : translatedStatus })}</small>
                          </span>
                        </button>
                      );
                    })}
                  </section>
                )}
                {!searchLoading && !searchResults.apps.length && !searchResults.problems.length && !searchResults.submissions.length && (
                  <div className="start-menu-hint">{t('desktop.noSearchResults')}</div>
                )}
              </div>
            )}
          </div>
          <div className="start-menu-footer">
            <LanguageToggle variant="light" />
            <button className="start-signout" onClick={() => { onLogout?.(); closeStartMenu(); }}>
              <Power size={16} />
              <span>{t('desktop.signOut')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}