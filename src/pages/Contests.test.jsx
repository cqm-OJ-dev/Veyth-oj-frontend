import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Contests from './Contests';
import { LanguageProvider } from '../context/languageContext';
import {
  addContestProblem,
  createContest,
  deleteContest,
  getContest,
  getContestStanding,
  getContestSubmission,
  getProblem,
  listContestProblems,
  listContestSubmissions,
  listContests,
  registerForContest,
  removeContestProblem,
  submitContestCode,
  unregisterFromContest,
  updateContest
} from '../services/judgeService';

jest.mock('@monaco-editor/react', () => (props) => (
  require('react').createElement('textarea', {
    'aria-label': 'Code editor',
    value: props.value,
    onChange: (event) => props.onChange(event.target.value)
  })
));
jest.mock('./ProblemDetail', () => ({
  renderMarkdown: (value) => ({ __html: value })
}));
jest.mock('../services/judgeService', () => ({
  addContestProblem: jest.fn(),
  createContest: jest.fn(),
  deleteContest: jest.fn(),
  getContest: jest.fn(),
  getContestStanding: jest.fn(),
  getContestSubmission: jest.fn(),
  getProblem: jest.fn(),
  listContestProblems: jest.fn(),
  listContestSubmissions: jest.fn(),
  listContests: jest.fn(),
  registerForContest: jest.fn(),
  removeContestProblem: jest.fn(),
  submitContestCode: jest.fn(),
  unregisterFromContest: jest.fn(),
  updateContest: jest.fn(),
  isSubmissionPending: (status) => ['Pending', 'Running', 'Queued', 'Judging'].includes(status),
  normalizeSubmissionStatus: (status) => status
}));

describe('Contests', () => {
  beforeEach(() => {
    window.localStorage.setItem('veyth-language', 'zh');
    listContests.mockResolvedValue({ contests: [{ id: 8, title: '周赛', status: 'Running', start_time: '2026-01-01T00:00:00Z' }] });
    getContest.mockResolvedValue({ contest: { id: 8, title: '周赛', status: 'Running', description: '比赛说明', require_registration: true, is_registered: false } });
    listContestProblems.mockResolvedValue({ problems: [{ problem_id: 123, label: 'A', problem: { id: 123, title: 'A + B' } }] });
    registerForContest.mockResolvedValue({ message: '报名成功', registered: true });
    getProblem.mockResolvedValue({ problem: { id: 123, title: 'A + B', description: '输入两个数', examples: [{ input_data: '1 2', output_data: '3' }] } });
    submitContestCode.mockResolvedValue({ submission: { id: 35, status: 'Accepted', case_results: [{ status: 'Accepted' }] } });
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.removeItem('veyth-language');
  });

  test('registers, opens a contest problem, and submits code to the contest endpoint', async () => {
    render(
      <LanguageProvider>
        <Contests currentUser={{ username: 'student' }} />
      </LanguageProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: /周赛/ }));
    fireEvent.click(await screen.findByRole('button', { name: '报名比赛' }));
    await waitFor(() => expect(registerForContest).toHaveBeenCalledWith(8));
    fireEvent.click(await screen.findByRole('button', { name: '比赛题目' }));
    fireEvent.click(await screen.findByRole('button', { name: /A \+ B/ }));
    expect(await screen.findByText('输入两个数')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Code editor'), { target: { value: 'int main() {}' } });
    fireEvent.click(screen.getByRole('button', { name: '提交代码' }));

    await waitFor(() => expect(submitContestCode).toHaveBeenCalledWith(8, {
      problem_id: 123,
      language: 'cpp',
      code: 'int main() {}'
    }));
    expect(await screen.findByText(/评测结果: Accepted/)).toBeInTheDocument();
  });

  test('lets administrators create contests using the documented fields', async () => {
    render(
      <LanguageProvider>
        <Contests currentUser={{ username: 'admin', is_staff: true }} />
      </LanguageProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: '创建比赛' }));
    fireEvent.change(screen.getByLabelText('比赛名称'), { target: { value: '周末赛' } });
    fireEvent.change(screen.getByLabelText('比赛说明'), { target: { value: '新比赛' } });
    fireEvent.change(screen.getByLabelText('开始'), { target: { value: '2026-12-01T10:00' } });
    fireEvent.change(screen.getByLabelText('结束'), { target: { value: '2026-12-01T12:00' } });
    fireEvent.submit(screen.getByLabelText('比赛名称').closest('form'));

    await waitFor(() => expect(createContest).toHaveBeenCalledWith(expect.objectContaining({
      title: '周末赛',
      description: '新比赛',
      is_public: true,
      require_registration: true
    })));
    const sentContest = createContest.mock.calls[0][0];
    expect(new Date(sentContest.start_time).toISOString()).toBe(sentContest.start_time);
    expect(new Date(sentContest.end_time).toISOString()).toBe(sentContest.end_time);
  });
});
