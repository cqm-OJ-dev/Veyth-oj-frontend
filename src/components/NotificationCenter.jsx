import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, ChevronLeft, ChevronRight, ExternalLink, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/languageContext';
import {
  deleteNotification,
  getUnreadNotificationCount,
  listNotificationDispatches,
  listNotificationRecipients,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendNotification
} from '../services/notificationService';
import './NotificationCenter.css';

const listItems = (response) => (Array.isArray(response?.results) ? response.results : []);
const notificationId = (notification) => notification?.id ?? notification?.notification_id;
const safeLink = (value) => /^(https?:\/\/|\/)/i.test(String(value || ''));
const formatDate = (value, language) => (
  value ? new Date(value).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US') : '—'
);

export default function NotificationCenter({ currentUser, onClose, onUnreadCountChange }) {
  const { t, language } = useLanguage();
  const rootRef = useRef(null);
  const [view, setView] = useState('inbox');
  const [unreadFilter, setUnreadFilter] = useState(undefined);
  const [inbox, setInbox] = useState(null);
  const [dispatches, setDispatches] = useState(null);
  const [recipients, setRecipients] = useState(null);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const updateUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadNotificationCount();
      onUnreadCountChange?.(Number(response?.unread_count) || 0);
    } catch (requestError) {
      setError((current) => current || requestError.message || t('notifications.loadFailed'));
    }
  }, [onUnreadCountChange, t]);

  const loadInbox = useCallback(async (pageUrl) => {
    setLoading(true);
    setError('');
    try {
      setInbox(await listNotifications({ unread: unreadFilter, pageUrl }));
    } catch (requestError) {
      setError(requestError.message || t('notifications.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [unreadFilter, t]);

  const loadDispatches = useCallback(async (pageUrl) => {
    setLoading(true);
    setError('');
    try {
      setDispatches(await listNotificationDispatches({ pageUrl }));
    } catch (requestError) {
      setError(requestError.message || t('notifications.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadRecipients = useCallback(async (notificationId, pageUrl) => {
    setLoading(true);
    setError('');
    try {
      setRecipients(await listNotificationRecipients(notificationId, { pageUrl }));
    } catch (requestError) {
      setError(requestError.message || t('notifications.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const handler = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    if (view === 'inbox') loadInbox();
    if (view === 'admin') loadDispatches();
  }, [view, unreadFilter, loadInbox, loadDispatches]);

  const changeView = (nextView) => {
    setView(nextView);
    setError('');
    setSendSuccess('');
    setSelectedDispatch(null);
    setRecipients(null);
    if (nextView === 'inbox') setInbox(null);
    if (nextView === 'admin') setDispatches(null);
  };

  const readOne = async (item) => {
    if (item.is_read) return;
    setBusyId(item.id);
    setError('');
    try {
      await markNotificationRead(item.id);
      await loadInbox();
      await updateUnreadCount();
    } catch (requestError) {
      setError(requestError.message || t('notifications.actionFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const readAll = async () => {
    setBusyId('all');
    setError('');
    try {
      await markAllNotificationsRead();
      await loadInbox();
      await updateUnreadCount();
    } catch (requestError) {
      setError(requestError.message || t('notifications.actionFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const removeOne = async (item) => {
    setBusyId(item.id);
    setError('');
    try {
      await deleteNotification(item.id);
      setInbox((current) => current && ({
        ...current,
        count: Math.max(0, (current.count || 0) - 1),
        results: current.results.filter((entry) => entry.id !== item.id)
      }));
      await updateUnreadCount();
    } catch (requestError) {
      setError(requestError.message || t('notifications.actionFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const submitNotification = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setFormError('');
    setSendSuccess('');
    const formData = new FormData(event.currentTarget);
    const userIds = [...new Set(String(formData.get('user_ids') || '')
      .split(/[\s,，;；]+/)
      .filter(Boolean)
      .map(Number))];
    if (!userIds.length || userIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
      setFormError(t('notifications.invalidUserIds'));
      return;
    }
    if (userIds.length > 10000) {
      setFormError(t('notifications.tooManyUserIds'));
      return;
    }

    setSending(true);
    try {
      const response = await sendNotification({
        title: String(formData.get('title') || '').trim(),
        body: String(formData.get('body') || ''),
        link: String(formData.get('link') || '').trim(),
        user_ids: userIds
      });
      formElement.reset();
      setSendSuccess(t('notifications.sentCount', { count: response?.recipient_count ?? userIds.length }));
      setDispatches(null);
    } catch (requestError) {
      setFormError(requestError.message || t('notifications.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const openRecipients = (dispatch) => {
    setSelectedDispatch(dispatch);
    setRecipients(null);
    loadRecipients(notificationId(dispatch));
  };

  const pageControls = (data, onPage) => (
    <div className="notification-pagination">
      <button type="button" onClick={() => onPage(data.previous)} disabled={!data?.previous || loading} aria-label={t('common.previous')}>
        <ChevronLeft size={16} />
      </button>
      <span>{data?.count ?? 0}</span>
      <button type="button" onClick={() => onPage(data.next)} disabled={!data?.next || loading} aria-label={t('common.next')}>
        <ChevronRight size={16} />
      </button>
    </div>
  );

  return (
    <section className="notification-panel" ref={rootRef} aria-label={t('notifications.title')}>
      <header className="notification-panel-header">
        <div className="notification-heading">
          {selectedDispatch ? (
            <button type="button" className="notification-back" onClick={() => { setSelectedDispatch(null); setRecipients(null); setError(''); }}>
              <ChevronLeft size={17} /> {t('notifications.history')}
            </button>
          ) : <><h2>{t('notifications.title')}</h2><Bell size={18} /></>}
        </div>
        <button type="button" className="notification-close" onClick={onClose} aria-label={t('notifications.close')}>×</button>
      </header>

      {!selectedDispatch && (
        <nav className="notification-tabs">
          <button type="button" className={view === 'inbox' ? 'active' : ''} onClick={() => changeView('inbox')}>{t('notifications.inbox')}</button>
          {currentUser?.is_staff && <button type="button" className={view === 'send' ? 'active' : ''} onClick={() => changeView('send')}>{t('notifications.send')}</button>}
          {currentUser?.is_staff && <button type="button" className={view === 'admin' ? 'active' : ''} onClick={() => changeView('admin')}>{t('notifications.history')}</button>}
        </nav>
      )}

      {error && <div className="notification-error" role="alert">{error}</div>}

      {selectedDispatch ? (
        <div className="notification-panel-body">
          {loading && <div className="notification-state">{t('common.loading')}</div>}
          {!loading && recipients && (
            <>
              <div className="notification-dispatch-summary">
                <strong>{selectedDispatch.title}</strong>
                <span>{t('notifications.recipientCount', { count: selectedDispatch.recipient_count ?? recipients.count ?? 0 })}</span>
              </div>
              {!listItems(recipients).length ? <div className="notification-state">{t('notifications.noRecipients')}</div>
                : listItems(recipients).map((recipient) => (
                  <article className="notification-recipient" key={recipient.id ?? recipient.user_id}>
                    <span className={`notification-read-mark${recipient.is_read ? ' read' : ''}`}>{recipient.is_read ? <Check size={14} /> : null}</span>
                    <div className="notification-item-copy">
                      <strong>{recipient.username || recipient.user?.username || `#${recipient.user_id ?? '—'}`}</strong>
                      <p>{recipient.is_read ? t('notifications.read') : t('notifications.unread')}</p>
                      <time>{formatDate(recipient.read_at || recipient.sent_at || recipient.created_at, language)}</time>
                    </div>
                  </article>
                ))}
              {pageControls(recipients, (pageUrl) => loadRecipients(notificationId(selectedDispatch), pageUrl))}
            </>
          )}
        </div>
      ) : view === 'send' && currentUser?.is_staff ? (
        <div className="notification-panel-body">
          {sendSuccess && <div className="notification-success" role="status">{sendSuccess}</div>}
          {formError && <div className="notification-error" role="alert">{formError}</div>}
          <form className="notification-send-form" onSubmit={submitNotification}>
            <label>{t('notifications.formTitle')}<input name="title" required /></label>
            <label>{t('notifications.formBody')}<textarea name="body" rows={5} required /></label>
            <label>{t('notifications.formLink')}<input name="link" type="url" placeholder="https://" /></label>
            <label>{t('notifications.formUserIds')}<textarea name="user_ids" rows={3} placeholder="7, 8, 9" required /></label>
            <p className="notification-form-hint">{t('notifications.userIdsHint')}</p>
            <button type="submit" className="notification-primary" disabled={sending}>
              {sending ? t('notifications.sending') : t('notifications.sendAction')}
            </button>
          </form>
        </div>
      ) : view === 'admin' && currentUser?.is_staff ? (
        <div className="notification-panel-body">
          {loading && <div className="notification-state">{t('common.loading')}</div>}
          {!loading && dispatches && !listItems(dispatches).length && <div className="notification-state">{t('notifications.noHistory')}</div>}
          {!loading && listItems(dispatches).map((dispatch) => (
            <article className="notification-dispatch" key={notificationId(dispatch)}>
              <button type="button" className="notification-dispatch-open" onClick={() => openRecipients(dispatch)}>
                <strong>{dispatch.title}</strong>
                <span>{dispatch.body}</span>
                <small>{t('notifications.dispatchMeta', {
                  sender: dispatch.sender || dispatch.sender_username || '—',
                  recipients: dispatch.recipient_count ?? 0,
                  unread: dispatch.unread_count ?? 0
                })}</small>
                <time>{formatDate(dispatch.created_at, language)}</time>
              </button>
              <button type="button" className="notification-icon-action" onClick={() => openRecipients(dispatch)} aria-label={t('notifications.viewRecipients')}>
                <ChevronRight size={17} />
              </button>
            </article>
          ))}
          {dispatches && pageControls(dispatches, (pageUrl) => loadDispatches(pageUrl))}
        </div>
      ) : (
        <div className="notification-panel-body">
          <div className="notification-list-toolbar">
            <select
              value={unreadFilter === undefined ? 'all' : String(unreadFilter)}
              onChange={(event) => setUnreadFilter(event.target.value === 'all' ? undefined : event.target.value === 'true')}
              aria-label={t('notifications.filter')}
            >
              <option value="all">{t('notifications.all')}</option>
              <option value="true">{t('notifications.unread')}</option>
              <option value="false">{t('notifications.read')}</option>
            </select>
            <button type="button" onClick={readAll} disabled={busyId === 'all' || !listItems(inbox).some((item) => !item.is_read)}>
              <CheckCheck size={15} /> {t('notifications.readAll')}
            </button>
          </div>
          {loading && <div className="notification-state">{t('common.loading')}</div>}
          {!loading && inbox && !listItems(inbox).length && <div className="notification-state">{t('notifications.empty')}</div>}
          {!loading && listItems(inbox).map((item) => (
            <article className={`notification-item${item.is_read ? ' is-read' : ''}`} key={item.id}>
              <button type="button" className="notification-read-mark" onClick={() => readOne(item)} disabled={item.is_read || busyId === item.id} aria-label={item.is_read ? t('notifications.read') : t('notifications.markRead')}>
                {item.is_read ? <Check size={14} /> : null}
              </button>
              <div className="notification-item-copy">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <small>{t('notifications.sentBy', { sender: item.sender || '—' })}</small>
                <time>{formatDate(item.sent_at || item.created_at, language)}</time>
                {item.link && safeLink(item.link) && <a href={item.link} target="_blank" rel="noreferrer">{t('notifications.openLink')} <ExternalLink size={13} /></a>}
              </div>
              <button type="button" className="notification-icon-action delete" onClick={() => removeOne(item)} disabled={busyId === item.id} aria-label={t('notifications.remove')}>
                <Trash2 size={15} />
              </button>
            </article>
          ))}
          {inbox && pageControls(inbox, (pageUrl) => loadInbox(pageUrl))}
        </div>
      )}
    </section>
  );
}
