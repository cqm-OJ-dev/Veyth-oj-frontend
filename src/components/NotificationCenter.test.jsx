import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NotificationCenter from './NotificationCenter';
import { LanguageProvider } from '../context/languageContext';
import {
  getUnreadNotificationCount,
  listNotificationDispatches,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendNotification
} from '../services/notificationService';

jest.mock('../services/notificationService', () => ({
  deleteNotification: jest.fn(),
  getUnreadNotificationCount: jest.fn(),
  listNotificationDispatches: jest.fn(),
  listNotificationRecipients: jest.fn(),
  listNotifications: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  markNotificationRead: jest.fn(),
  sendNotification: jest.fn()
}));

describe('NotificationCenter', () => {
  beforeEach(() => {
    window.localStorage.setItem('veyth-language', 'zh');
    getUnreadNotificationCount.mockResolvedValue({ unread_count: 2 });
    listNotifications.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{
        id: 42,
        title: '系统维护通知',
        body: '今晚维护。',
        sender: 'admin',
        created_at: '2026-11-28T10:00:00Z',
        is_read: false
      }]
    });
    listNotificationDispatches.mockResolvedValue({ count: 0, results: [] });
    markNotificationRead.mockResolvedValue({ id: 42, is_read: true, read_at: '2026-11-28T10:01:00Z' });
    markAllNotificationsRead.mockResolvedValue({ marked_read: 1 });
    sendNotification.mockResolvedValue({ id: 9, title: '更新', recipient_count: 2 });
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.removeItem('veyth-language');
  });

  const renderCenter = (currentUser = { username: 'student' }) => {
    const onUnreadCountChange = jest.fn();
    render(
      <LanguageProvider>
        <NotificationCenter currentUser={currentUser} onClose={jest.fn()} onUnreadCountChange={onUnreadCountChange} />
      </LanguageProvider>
    );
    return onUnreadCountChange;
  };

  test('loads the inbox and allows marking a notification as read', async () => {
    const onUnreadCountChange = renderCenter();
    expect(await screen.findByText('系统维护通知')).toBeInTheDocument();
    expect(listNotifications).toHaveBeenCalledWith({ unread: undefined, pageUrl: undefined });
    fireEvent.click(screen.getByRole('button', { name: '标为已读' }));
    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith(42));
    await waitFor(() => expect(listNotifications).toHaveBeenCalledTimes(2));
    expect(onUnreadCountChange).toHaveBeenCalledWith(2);
  });

  test('allows administrators to send a notification to deduplicated IDs', async () => {
    renderCenter({ username: 'admin', is_staff: true });
    fireEvent.click(screen.getByRole('button', { name: '发送通知' }));
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '更新' } });
    fireEvent.change(screen.getByLabelText('通知内容'), { target: { value: '系统升级' } });
    fireEvent.change(screen.getByLabelText('链接（可选）'), { target: { value: 'https://example.com/status' } });
    fireEvent.change(screen.getByLabelText('接收用户 ID'), { target: { value: '7, 8, 7' } });
    fireEvent.click(screen.getAllByRole('button', { name: '发送通知' })[1]);

    await waitFor(() => expect(sendNotification).toHaveBeenCalledWith({
      title: '更新',
      body: '系统升级',
      link: 'https://example.com/status',
      user_ids: [7, 8]
    }));
    expect(await screen.findByText('通知已发送给 2 位用户。')).toBeInTheDocument();
  });
});
