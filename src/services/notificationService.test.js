import {
  deleteNotification,
  getUnreadNotificationCount,
  listNotificationDispatches,
  listNotificationRecipients,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendNotification
} from './notificationService';

jest.mock('./authService', () => ({
  API_BASE: 'https://api.example.com/',
  getCookie: () => JSON.stringify({ accessToken: 'jwt-access-token' })
}));

describe('notification API client', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('requests the current inbox with JWT auth and unread filters', async () => {
    await listNotifications();
    expect(global.fetch).toHaveBeenLastCalledWith(
      'https://api.example.com/notifications/',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer jwt-access-token' }) })
    );

    await listNotifications({ unread: true });
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/notifications/?unread=true', expect.any(Object));
    await listNotifications({ unread: false });
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/notifications/?unread=false', expect.any(Object));
  });

  test('uses the documented recipient and admin notification routes', async () => {
    await getUnreadNotificationCount();
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/notifications/unread-count/', expect.any(Object));
    await markNotificationRead(42);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/notifications/42/read/', expect.objectContaining({ method: 'POST' }));
    await markAllNotificationsRead();
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/notifications/read-all/', expect.objectContaining({ method: 'POST' }));
    await deleteNotification(42);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/notifications/42/', expect.objectContaining({ method: 'DELETE' }));

    const payload = { title: 'Maintenance', body: 'Tonight', link: '', user_ids: [7, 8] };
    await sendNotification(payload);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/notifications/admin/send/', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(global.fetch.mock.calls[global.fetch.mock.calls.length - 1][1].body)).toEqual(payload);
    await listNotificationDispatches();
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/notifications/admin/', expect.any(Object));
    await listNotificationRecipients(5);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/notifications/admin/5/recipients/', expect.any(Object));
  });

  test('follows server pagination links', async () => {
    const pageUrl = 'https://api.example.com/notifications/?page=2';
    await listNotifications({ pageUrl });
    expect(global.fetch).toHaveBeenLastCalledWith(pageUrl, expect.any(Object));
    await expect(listNotifications({ pageUrl: 'https://attacker.example/steal' }))
      .rejects.toThrow('Invalid notification pagination URL');
  });
});
