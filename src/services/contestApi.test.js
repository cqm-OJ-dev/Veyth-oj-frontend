import {
  addContestProblem,
  createContest,
  deleteContest,
  getContest,
  getContestStanding,
  getContestSubmission,
  listContestProblems,
  listContestSubmissions,
  listContests,
  registerForContest,
  removeContestProblem,
  submitContestCode,
  unregisterFromContest,
  updateContest
} from './judgeService';

jest.mock('./authService', () => ({
  API_BASE: 'https://api.example.com/',
  getCookie: () => JSON.stringify({ accessToken: 'test-token' })
}));

describe('contest API client', () => {
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

  test('loads contest list and detail from the documented routes', async () => {
    await listContests();
    expect(global.fetch).toHaveBeenLastCalledWith(
      'https://api.example.com/contest/',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Token test-token' }) })
    );

    await getContest(7);
    expect(global.fetch).toHaveBeenLastCalledWith(
      'https://api.example.com/contest/7/',
      expect.any(Object)
    );
  });

  test('uses the documented management, registration, problem, submission, and standing routes', async () => {
    const contestData = {
      title: 'Contest',
      description: 'Contest details',
      start_time: '2026-12-01T10:00:00Z',
      end_time: '2026-12-01T12:00:00Z',
      is_public: true,
      require_registration: true
    };
    await createContest(contestData);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(global.fetch.mock.calls[global.fetch.mock.calls.length - 1][1].body)).toEqual(contestData);
    await updateContest(7, { title: 'Updated' });
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/', expect.objectContaining({ method: 'PATCH' }));
    await deleteContest(7);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/', expect.objectContaining({ method: 'DELETE' }));

    await registerForContest(7);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/register/', expect.objectContaining({ method: 'POST' }));
    await unregisterFromContest(7);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/register/', expect.objectContaining({ method: 'DELETE' }));

    await listContestProblems(7);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/problems/', expect.any(Object));
    await addContestProblem(7, { problem_id: 123, label: 'A', order: 1 });
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/problems/manage/', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(global.fetch.mock.calls[global.fetch.mock.calls.length - 1][1].body)).toEqual({ problem_id: 123, label: 'A', order: 1 });
    await removeContestProblem(7, 123);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/problems/123/', expect.objectContaining({ method: 'DELETE' }));

    await submitContestCode(7, { problem_id: 123, language: 'cpp', code: 'int main(){}' });
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/submit/', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(global.fetch.mock.calls[global.fetch.mock.calls.length - 1][1].body)).toEqual({ problem_id: 123, language: 'cpp', code: 'int main(){}' });
    await listContestSubmissions(7);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/submissions/', expect.any(Object));
    await getContestSubmission(7, 99);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/submissions/99/', expect.any(Object));
    await getContestStanding(7);
    expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/contest/7/standing/', expect.any(Object));
  });
});
