import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import Icon from '../components/Icon';
import { useLanguage } from '../context/languageContext';
import { renderMarkdown } from './ProblemDetail';
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
  updateContest,
  isSubmissionPending,
  normalizeSubmissionStatus
} from '../services/judgeService';
import './Contests.css';

const LANGUAGES = ['cpp', 'c', 'python', 'java', 'javascript', 'go', 'rust'];

const asList = (data, keys) => {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const unwrap = (data, key) => data?.[key] || data;

const contestStatus = (contest) => {
  const status = String(contest.status || '').toLowerCase();
  if (['upcoming', 'running', 'ended'].includes(status)) return status;
  const now = Date.now();
  if (now < new Date(contest.start_time || contest.startTime).getTime()) return 'upcoming';
  if (now < new Date(contest.end_time || contest.endTime).getTime()) return 'running';
  return 'ended';
};

const formatDate = (date, language) => (
  date ? new Date(date).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US') : '—'
);

const localDateTime = (date) => {
  if (!date) return '';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
};

const normalizeStatus = (status) => {
  const normalized = normalizeSubmissionStatus(status);
  return normalized || '—';
};

export default function Contests({ currentUser }) {
  const { t, language } = useLanguage();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [contest, setContest] = useState(null);
  const [contestProblems, setContestProblems] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [tabData, setTabData] = useState({ standing: null, submissions: null });
  const [tabErrors, setTabErrors] = useState({});
  const [loadingTab, setLoadingTab] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [registrationBusy, setRegistrationBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [formMode, setFormMode] = useState('');
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [problemForm, setProblemForm] = useState({ problem_id: '', label: '', order: '' });
  const [problemBusy, setProblemBusy] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problemDetail, setProblemDetail] = useState(null);
  const [problemLoading, setProblemLoading] = useState(false);
  const [problemError, setProblemError] = useState('');
  const [code, setCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('cpp');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionError, setSubmissionError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionDetail, setSubmissionDetail] = useState(null);
  const [submissionDetailError, setSubmissionDetailError] = useState('');

  const isAdmin = Boolean(currentUser?.is_staff || currentUser?.is_superuser);
  const status = contest ? contestStatus(contest) : '';
  const isRegistered = Boolean(
    contest?.is_registered
    ?? contest?.registered
    ?? contest?.registration?.registered
  );
  const requiresRegistration = Boolean(contest?.require_registration);
  const canSubmit = Boolean(currentUser && status === 'running' && (!requiresRegistration || isRegistered));

  const loadContests = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const response = await listContests();
      setContests(asList(response, ['contests']));
    } catch (error) {
      setListError(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadContests();
  }, [loadContests]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let active = true;
    setDetailLoading(true);
    setDetailError('');
    setActionError('');
    setContest(null);
    setContestProblems([]);
    setTabData({ standing: null, submissions: null });
    setTabErrors({});
    setActiveTab('overview');
    setSelectedProblem(null);
    setSelectedSubmission(null);
    setSubmissionDetail(null);

    Promise.allSettled([getContest(selectedId), listContestProblems(selectedId)])
      .then(([contestResponse, problemsResponse]) => {
        if (!active) return;
        if (contestResponse.status === 'fulfilled') {
          setContest(unwrap(contestResponse.value, 'contest'));
        } else {
          setDetailError(contestResponse.reason?.message || t('common.error'));
        }
        if (problemsResponse.status === 'fulfilled') {
          setContestProblems(asList(problemsResponse.value, ['problems', 'contest_problems']));
        } else {
          setTabErrors((current) => ({ ...current, problems: problemsResponse.reason?.message || t('common.error') }));
        }
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => { active = false; };
  }, [selectedId, t]);

  useEffect(() => {
    if (!selectedId || !['standing', 'submissions'].includes(activeTab) || tabData[activeTab]) return;
    let active = true;
    setLoadingTab(activeTab);
    const fetchTab = activeTab === 'standing'
      ? getContestStanding(selectedId)
      : listContestSubmissions(selectedId);
    fetchTab.then((data) => {
      if (!active) return;
      setTabData((current) => ({ ...current, [activeTab]: data }));
      setTabErrors((current) => ({ ...current, [activeTab]: '' }));
    }).catch((error) => {
      if (active) setTabErrors((current) => ({ ...current, [activeTab]: error.message || t('common.error') }));
    }).finally(() => {
      if (active) setLoadingTab('');
    });
    return () => { active = false; };
  }, [activeTab, selectedId, t, tabData]);

  useEffect(() => {
    if (!selectedProblem) return undefined;
    let active = true;
    setProblemLoading(true);
    setProblemError('');
    setProblemDetail(null);
    setSubmissionResult(null);
    setSubmissionError('');
    const id = selectedProblem.problem_id ?? selectedProblem.problem?.id ?? selectedProblem.id;
    getProblem(id).then((data) => {
      if (active) setProblemDetail(unwrap(data, 'problem'));
    }).catch((error) => {
      if (active) setProblemError(error.message || t('common.error'));
    }).finally(() => {
      if (active) setProblemLoading(false);
    });
    return () => { active = false; };
  }, [selectedProblem, t]);

  useEffect(() => {
    if (!selectedSubmission) return undefined;
    let active = true;
    setSubmissionDetail(null);
    setSubmissionDetailError('');
    const fetchDetail = async () => {
      try {
        const data = await getContestSubmission(selectedId, selectedSubmission);
        if (active) setSubmissionDetail(unwrap(data, 'submission'));
      } catch (error) {
        if (active) setSubmissionDetailError(error.message || t('common.error'));
      }
    };
    fetchDetail();
    return () => { active = false; };
  }, [selectedId, selectedSubmission, t]);

  const sortedContests = useMemo(() => (
    [...contests].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  ), [contests]);

  const refreshTab = async (tab) => {
    if (!selectedId) return;
    setLoadingTab(tab);
    setTabErrors((current) => ({ ...current, [tab]: '' }));
    try {
      const data = tab === 'standing'
        ? await getContestStanding(selectedId)
        : await listContestSubmissions(selectedId);
      setTabData((current) => ({ ...current, [tab]: data }));
    } catch (error) {
      setTabErrors((current) => ({ ...current, [tab]: error.message || t('common.error') }));
    } finally {
      setLoadingTab('');
    }
  };

  const changeRegistration = async () => {
    if (!currentUser) {
      setActionError(t('contests.loginRequired'));
      return;
    }
    setRegistrationBusy(true);
    setActionError('');
    try {
      const response = isRegistered
        ? await unregisterFromContest(selectedId)
        : await registerForContest(selectedId);
      const registered = response?.registered ?? !isRegistered;
      setContest((current) => ({ ...current, is_registered: registered, registered }));
    } catch (error) {
      setActionError(error.message || t('common.error'));
    } finally {
      setRegistrationBusy(false);
    }
  };

  const openForm = (mode, value = null) => {
    setFormError('');
    setFormMode(mode);
    setContest(value);
  };

  const closeDetails = () => {
    setSelectedId(null);
    setContest(null);
    setSelectedProblem(null);
    setSelectedSubmission(null);
    setSubmissionDetail(null);
  };

  const saveContest = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get('title') || '').trim(),
      description: String(form.get('description') || ''),
      start_time: new Date(String(form.get('start_time'))).toISOString(),
      end_time: new Date(String(form.get('end_time'))).toISOString(),
      is_public: form.get('is_public') === 'on',
      require_registration: form.get('require_registration') === 'on'
    };
    setFormBusy(true);
    setFormError('');
    try {
      if (formMode === 'edit' && contest?.id) {
        await updateContest(contest.id, payload);
      } else {
        await createContest(payload);
      }
      setFormMode('');
      setContest(null);
      setSelectedId(null);
      await loadContests();
    } catch (error) {
      setFormError(error.message || t('common.error'));
    } finally {
      setFormBusy(false);
    }
  };

  const removeContest = async (contestId) => {
    if (!window.confirm(t('contests.confirmDeleteContest'))) return;
    try {
      await deleteContest(contestId);
      if (String(selectedId) === String(contestId)) closeDetails();
      await loadContests();
    } catch (error) {
      setActionError(error.message || t('common.error'));
    }
  };

  const manageProblem = async (event) => {
    event.preventDefault();
    setProblemBusy(true);
    setActionError('');
    try {
      await addContestProblem(selectedId, {
        problem_id: Number(problemForm.problem_id),
        label: problemForm.label.trim(),
        order: Number(problemForm.order)
      });
      setContestProblems(asList(await listContestProblems(selectedId), ['problems', 'contest_problems']));
      setProblemForm({ problem_id: '', label: '', order: '' });
    } catch (error) {
      setActionError(error.message || t('common.error'));
    } finally {
      setProblemBusy(false);
    }
  };

  const removeProblem = async (problemId) => {
    if (!window.confirm(t('contests.confirmDeleteProblem'))) return;
    setActionError('');
    try {
      await removeContestProblem(selectedId, problemId);
      setContestProblems(asList(await listContestProblems(selectedId), ['problems', 'contest_problems']));
    } catch (error) {
      setActionError(error.message || t('common.error'));
    }
  };

  const submitContestProblem = async (event) => {
    event.preventDefault();
    if (!canSubmit || !selectedProblem) return;
    setSubmitting(true);
    setSubmissionResult(null);
    setSubmissionError('');
    try {
      const response = await submitContestCode(selectedId, {
        problem_id: Number(selectedProblem.problem_id ?? selectedProblem.problem?.id ?? selectedProblem.id),
        language: codeLanguage,
        code
      });
      let result = unwrap(response, 'submission');
      const id = result?.id ?? response?.id;
      if (id && isSubmissionPending(result?.status ?? response?.status)) {
        for (let attempt = 0; attempt < 30; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1000));
          result = unwrap(await getContestSubmission(selectedId, id), 'submission');
          if (!isSubmissionPending(result?.status)) break;
        }
      }
      setSubmissionResult(result);
      setTabData((current) => ({ ...current, submissions: null, standing: null }));
    } catch (error) {
      setSubmissionError(error.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const resultRows = (value) => asList(value, ['case_results', 'results']);
  const problemIdOf = (item) => item.problem_id ?? item.problem?.id ?? item.id;
  const problemLabelOf = (item) => item.label ?? item.problem?.label ?? '';
  const problemTitleOf = (item) => item.title ?? item.problem_title ?? item.problem?.title ?? `#${problemIdOf(item)}`;
  const standings = asList(tabData.standing, ['standings', 'standing', 'results', 'ranking', 'rows']);
  const submissions = asList(tabData.submissions, ['submissions']);

  if (formMode) {
    const editing = formMode === 'edit' ? contest : null;
    return (
      <div className="window-page-shell">
        <div className="window-page-header">
          <div><p className="window-page-kicker">{t('contests.admin')}</p><h2>{t(editing ? 'contests.editContest' : 'contests.createContest')}</h2></div>
          <button type="button" className="contest-button secondary" onClick={() => { setFormMode(''); closeDetails(); }}>{t('contests.back')}</button>
        </div>
        {formError && <div className="window-page-state error">{formError}</div>}
        <form className="contest-form" onSubmit={saveContest}>
          <label>{t('contests.contestTitle')}<input name="title" defaultValue={editing?.title || ''} required /></label>
          <label>{t('contests.description')}<textarea name="description" rows={4} defaultValue={editing?.description || ''} /></label>
          <div className="contest-form-grid">
            <label>{t('contests.starts')}<input name="start_time" type="datetime-local" defaultValue={localDateTime(editing?.start_time)} required /></label>
            <label>{t('contests.ends')}<input name="end_time" type="datetime-local" defaultValue={localDateTime(editing?.end_time)} required /></label>
          </div>
          <label className="contest-checkbox"><input type="checkbox" name="is_public" defaultChecked={editing?.is_public ?? true} />{t('contests.public')}</label>
          <label className="contest-checkbox"><input type="checkbox" name="require_registration" defaultChecked={editing?.require_registration ?? true} />{t('contests.requireRegistration')}</label>
          <button className="contest-button primary" type="submit" disabled={formBusy}>{formBusy ? t('contests.saving') : t('contests.save')}</button>
        </form>
      </div>
    );
  }

  if (selectedId) {
    const tabs = ['overview', 'problems', 'standing', 'submissions'];
    const statusText = status ? t(`contests.${status}`) : '';
    const result = submissionResult || {};
    const cases = resultRows(result);

    return (
      <div className="window-page-shell contest-detail-shell">
        <div className="window-page-header contest-detail-header">
          <div>
            <button type="button" className="contest-back" onClick={selectedProblem || selectedSubmission ? () => { setSelectedProblem(null); setSelectedSubmission(null); setSubmissionDetail(null); } : closeDetails}>
              ← {t('contests.back')}
            </button>
            <p className="window-page-kicker">{t('contests.kicker')}</p>
            <h2>{selectedProblem ? `${problemLabelOf(selectedProblem)} · ${problemTitleOf(selectedProblem)}` : selectedSubmission ? t('contests.submissionTitle', { id: selectedSubmission }) : contest?.title || t('contests.loading')}</h2>
          </div>
          {!selectedProblem && !selectedSubmission && contest && <span className={`contest-status ${status}`}>{statusText}</span>}
        </div>

        {detailLoading ? <div className="window-page-state">{t('contests.loading')}</div>
          : detailError ? <div className="window-page-state error">{detailError}</div>
          : selectedProblem ? (
            <div className="contest-problem-view">
              {problemLoading ? <div className="window-page-state">{t('problemDetail.loading')}</div>
                : problemError ? <div className="window-page-state error">{problemError}</div>
                : problemDetail && (
                  <div className="contest-problem-description">
                    <div dangerouslySetInnerHTML={renderMarkdown(problemDetail.description || problemDetail.content || '')} />
                    {problemDetail.input_format && <><h4>{t('problemDetail.input')}</h4><pre>{problemDetail.input_format}</pre></>}
                    {problemDetail.output_format && <><h4>{t('problemDetail.output')}</h4><pre>{problemDetail.output_format}</pre></>}
                    {asList(problemDetail.examples || problemDetail.samples || problemDetail.test_cases, []).map((sample, index) => (
                      <div className="contest-sample" key={sample.id ?? index}>
                        <strong>{t('problemDetail.sampleInput', { n: index + 1 })}</strong>
                        <pre>{sample.input ?? sample.input_data ?? sample.in ?? ''}</pre>
                        <strong>{t('problemDetail.sampleOutput', { n: index + 1 })}</strong>
                        <pre>{sample.expected_output ?? sample.output ?? sample.output_data ?? sample.out ?? ''}</pre>
                        {(sample.explanation || sample.note) && <><strong>{t('problemDetail.sampleExplanation', { n: index + 1 })}</strong><p>{sample.explanation || sample.note}</p></>}
                      </div>
                    ))}
                  </div>
                )}
              <form className="contest-code-form" onSubmit={submitContestProblem}>
                <div className="contest-code-toolbar">
                  <select value={codeLanguage} onChange={(event) => setCodeLanguage(event.target.value)} disabled={submitting}>
                    {LANGUAGES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <button className="contest-button primary" disabled={!canSubmit || submitting || !code.trim()}>{submitting ? t('contests.judging') : t('contests.submit')}</button>
                </div>
                {!currentUser && <p className="contest-notice">{t('contests.loginRequired')}</p>}
                {currentUser && requiresRegistration && !isRegistered && <p className="contest-notice">{t('contests.registerBeforeSubmit')}</p>}
                {status !== 'running' && <p className="contest-notice">{t('contests.submissionWindowClosed')}</p>}
                <Editor
                  height="260px"
                  language={codeLanguage}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
                />
              </form>
              {submissionError && <div className="window-page-state error">{submissionError}</div>}
              {submissionResult && (
                <div className="contest-result">
                  <strong>{t('contests.result')}: {normalizeStatus(result.status)}</strong>
                  <span>{result.passed ?? result.passed_cases ?? '?'}/{result.total ?? result.total_cases ?? '?'}</span>
                  {result.id && <button type="button" className="contest-button secondary" onClick={() => { setSelectedSubmission(result.id); setSelectedProblem(null); }}>{t('contests.viewSubmission')}</button>}
                  {cases.map((item, index) => <div className="contest-case" key={item.case ?? index}>
                    <strong>{t('submissionDetail.case', { n: item.case ?? index + 1 })}</strong>
                    <span>{normalizeStatus(item.status)}</span>
                    <span>{item.time_ms ?? '—'}ms</span>
                    {item.stderr && <pre>{item.stderr}</pre>}
                  </div>)}
                </div>
              )}
            </div>
          ) : selectedSubmission ? (
            submissionDetailError ? <div className="window-page-state error">{submissionDetailError}</div>
              : !submissionDetail ? <div className="window-page-state">{t('submissionDetail.loading')}</div>
                : <div className="contest-submission-detail">
                  <div className="contest-meta">
                    <span>{t('submissions.status')}: {normalizeStatus(submissionDetail.status)}</span>
                    <span>{t('submissions.language')}: {submissionDetail.language || '—'}</span>
                    <span>{t('submissions.passed')}: {submissionDetail.passed ?? submissionDetail.passed_cases ?? '?'}/{submissionDetail.total ?? submissionDetail.total_cases ?? '?'}</span>
                  </div>
                  {submissionDetail.code && <pre>{submissionDetail.code}</pre>}
                  {resultRows(submissionDetail).map((item, index) => <div className="contest-case" key={item.case ?? index}>
                    <strong>{t('submissionDetail.case', { n: item.case ?? index + 1 })}</strong>
                    <span>{normalizeStatus(item.status)}</span>
                    <span>{item.time_ms ?? '—'}ms</span>
                    {item.stderr && <pre>{item.stderr}</pre>}
                  </div>)}
                </div>
          ) : contest && (
            <>
              <div className="contest-detail-actions">
                {requiresRegistration && currentUser && status !== 'ended' && <button className={`contest-button ${isRegistered ? 'secondary' : 'primary'}`} onClick={changeRegistration} disabled={registrationBusy}>
                  {registrationBusy ? t('contests.working') : isRegistered ? t('contests.unregister') : t('contests.register')}
                </button>}
                {requiresRegistration && !currentUser && <span className="contest-notice">{t('contests.loginRequired')}</span>}
                {isAdmin && <><button className="contest-button secondary" onClick={() => openForm('edit', contest)}>{t('contests.edit')}</button><button className="contest-button danger" onClick={() => removeContest(selectedId)}>{t('contests.delete')}</button></>}
              </div>
              {actionError && <div className="window-page-state error">{actionError}</div>}
              <nav className="contest-tabs">
                {tabs.map((tab) => <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{t(`contests.tab_${tab}`)}</button>)}
              </nav>
              {activeTab === 'overview' && <div className="contest-overview">
                <p>{contest.description || t('contests.noDescription')}</p>
                <dl>
                  <div><dt>{t('contests.starts')}</dt><dd>{formatDate(contest.start_time, language)}</dd></div>
                  <div><dt>{t('contests.ends')}</dt><dd>{formatDate(contest.end_time, language)}</dd></div>
                  <div><dt>{t('contests.registration')}</dt><dd>{requiresRegistration ? (isRegistered ? t('contests.registered') : t('contests.required')) : t('contests.optional')}</dd></div>
                </dl>
              </div>}
              {activeTab === 'problems' && <section className="contest-panel">
                {isAdmin && <form className="contest-add-problem" onSubmit={manageProblem}>
                  <input type="number" min="1" placeholder={t('contests.problemId')} value={problemForm.problem_id} onChange={(event) => setProblemForm((current) => ({ ...current, problem_id: event.target.value }))} required />
                  <input placeholder={t('contests.label')} value={problemForm.label} onChange={(event) => setProblemForm((current) => ({ ...current, label: event.target.value }))} required />
                  <input type="number" min="1" placeholder={t('contests.order')} value={problemForm.order} onChange={(event) => setProblemForm((current) => ({ ...current, order: event.target.value }))} required />
                  <button className="contest-button primary" disabled={problemBusy}>{t(problemBusy ? 'contests.working' : 'contests.addProblem')}</button>
                </form>}
                {tabErrors.problems && <div className="window-page-state error">{tabErrors.problems}</div>}
                {contestProblems.length ? <div className="contest-problem-list">{contestProblems.map((item) => <div className="contest-problem-row" key={problemIdOf(item)}>
                  <button type="button" onClick={() => setSelectedProblem(item)}><strong>{problemLabelOf(item)}</strong><span>{problemTitleOf(item)}</span></button>
                  {isAdmin && <button type="button" className="contest-remove" onClick={() => removeProblem(problemIdOf(item))}>{t('contests.remove')}</button>}
                </div>)}</div> : !tabErrors.problems && <div className="window-page-state">{t('contests.noProblems')}</div>}
              </section>}
              {activeTab === 'standing' && <section className="contest-panel">
                {loadingTab === 'standing' && <div className="window-page-state">{t('common.loading')}</div>}
                {tabErrors.standing && <div className="window-page-state error">{tabErrors.standing}</div>}
                {!loadingTab && !tabErrors.standing && <><button className="contest-refresh" onClick={() => refreshTab('standing')}>{t('contests.refresh')}</button>
                  {standings.length ? <div className="contest-table-wrap"><table className="contest-table"><thead><tr><th>#</th><th>{t('contests.username')}</th><th>{t('contests.solved')}</th><th>{t('contests.penalty')}</th>{contestProblems.map((item) => <th key={problemIdOf(item)}>{problemLabelOf(item) || problemIdOf(item)}</th>)}</tr></thead><tbody>
                    {standings.map((row, index) => <tr key={row.username ?? row.user?.username ?? row.user ?? index}><td>{row.rank ?? index + 1}</td><td>{row.username ?? row.user?.username ?? row.user ?? row.name ?? '—'}</td><td>{row.solved ?? row.solved_count ?? row.accepted ?? 0}</td><td>{row.penalty ?? row.penalty_time ?? 0}</td>{contestProblems.map((item) => {
                      const perProblem = row.problems ?? row.problem_results ?? row.results ?? {};
                      const key = String(problemIdOf(item));
                      const cell = Array.isArray(perProblem)
                        ? perProblem.find((entry) => String(entry.problem_id ?? entry.problem?.id ?? entry.id) === key || String(entry.label) === String(problemLabelOf(item)))
                        : perProblem[key] ?? perProblem[problemLabelOf(item)];
                      const cellStatus = String(cell?.status || '').toLowerCase();
                      const accepted = cell?.accepted ?? cell?.solved ?? cell?.is_accepted
                        ?? ['accepted', 'ac'].includes(cellStatus);
                      const attempts = cell?.attempts ?? cell?.submissions;
                      const value = typeof cell === 'string'
                        ? cell
                        : cell ? (accepted ? `+${attempts > 1 ? attempts - 1 : ''}` : attempts ?? '·') : '·';
                      return <td className={accepted ? 'contest-score-accepted' : ''} key={key}>{value}</td>;
                    })}</tr>)}
                  </tbody></table></div> : <div className="window-page-state">{t('contests.noStanding')}</div>}
                </>}
              </section>}
              {activeTab === 'submissions' && <section className="contest-panel">
                {loadingTab === 'submissions' && <div className="window-page-state">{t('common.loading')}</div>}
                {tabErrors.submissions && <div className="window-page-state error">{tabErrors.submissions}</div>}
                {!loadingTab && !tabErrors.submissions && <><button className="contest-refresh" onClick={() => refreshTab('submissions')}>{t('contests.refresh')}</button>
                  {submissions.length ? <div className="contest-table-wrap"><table className="contest-table"><thead><tr><th>{t('submissions.id')}</th><th>{t('submissions.problem')}</th><th>{t('contests.username')}</th><th>{t('submissions.language')}</th><th>{t('submissions.status')}</th><th>{t('submissions.submitted')}</th></tr></thead><tbody>
                    {submissions.map((row) => <tr key={row.id ?? row.submission_id}><td><button className="contest-table-link" onClick={() => setSelectedSubmission(row.id ?? row.submission_id)}>{row.id ?? row.submission_id}</button></td><td>{row.problem_title ?? row.problem?.title ?? `#${row.problem_id ?? row.problem?.id ?? '—'}`}</td><td>{row.username ?? row.user?.username ?? row.user ?? '—'}</td><td>{row.language ?? '—'}</td><td>{normalizeStatus(row.status)}</td><td>{formatDate(row.created_at, language)}</td></tr>)}
                  </tbody></table></div> : <div className="window-page-state">{t('contests.noSubmissions')}</div>}
                </>}
              </section>}
            </>
          )}
      </div>
    );
  }

  return (
    <div className="window-page-shell">
      <div className="window-page-header">
        <div><p className="window-page-kicker"><Icon name="contests" size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />{t('contests.kicker')}</p><h2>{t('contests.title')}</h2></div>
        <div className="contest-list-actions">
          <div className="window-page-pill">{t('common.items', { count: contests.length })}</div>
          {isAdmin && <button className="contest-button primary" onClick={() => openForm('create')}>{t('contests.createContest')}</button>}
        </div>
      </div>
      {listError && <div className="window-page-state error">{listError}</div>}
      {actionError && <div className="window-page-state error">{actionError}</div>}
      {loading ? <div className="window-page-state">{t('contests.loading')}</div>
        : !sortedContests.length ? <div className="window-page-state">{t('contests.empty')}</div>
          : <div className="contest-cards-container">
            {sortedContests.map((item) => {
              const itemStatus = contestStatus(item);
              return <article key={item.id} className={`contest-card ${itemStatus}`}>
                <button className="contest-card-main" type="button" onClick={() => setSelectedId(item.id)}>
                  <span className="contest-card-header"><strong className="contest-title">{item.title}</strong><span className={`contest-status ${itemStatus}`}>{t(`contests.${itemStatus}`)}</span></span>
                  <span className="contest-card-body">
                    <span className="contest-description">{item.description || t('contests.noDescription')}</span>
                    <span className="contest-meta">
                      <span className="meta-item"><span className="meta-label">{t('contests.starts')}</span><span className="meta-value">{formatDate(item.start_time, language)}</span></span>
                      <span className="meta-item"><span className="meta-label">{t('contests.ends')}</span><span className="meta-value">{formatDate(item.end_time, language)}</span></span>
                    </span>
                  </span>
                </button>
                {isAdmin && <div className="contest-card-admin"><button onClick={() => openForm('edit', item)}>{t('contests.edit')}</button><button onClick={() => removeContest(item.id)}>{t('contests.delete')}</button></div>}
              </article>;
            })}
          </div>}
    </div>
  );
}
