import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/languageContext';
import { listSubmissions, normalizeSubmissionStatus } from '../services/judgeService';
import './Submissions.css';

const statusKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, '-');
const PAGE_SIZE = 10;

const Submissions = ({ onOpenSubmission, onOpenProblem }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    let refreshTimer;
    let requestInFlight = false;
    if (!currentUser) {
      setIsLoading(false);
      return () => { alive = false; };
    }

    const fetchSubmissions = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const data = await listSubmissions();
        const arr = Array.isArray(data?.submissions) ? data.submissions
          : Array.isArray(data?.results) ? data.results
          : Array.isArray(data) ? data : [];
        if (alive) {
          setSubmissions(arr);
          setError('');
        }
      } catch (err) {
        if (alive) setError(err?.message || 'Failed to load submissions');
      } finally {
        requestInFlight = false;
        if (alive) {
          setIsLoading(false);
          refreshTimer = setTimeout(fetchSubmissions, 5000);
        }
      }
    };
    fetchSubmissions();
    return () => {
      alive = false;
      clearTimeout(refreshTimer);
    };
  }, [currentUser]);

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return submissions;
    return submissions.filter((submission) => {
      const problemId = submission.problem_id ?? submission.problem?.id ?? '';
      const status = normalizeSubmissionStatus(submission.status) ?? '';
      const translatedStatus = t(`status.${status}`);
      return String(problemId).toLocaleLowerCase().includes(query)
        || String(status).toLocaleLowerCase().includes(query)
        || (translatedStatus !== `status.${status}` && translatedStatus.toLocaleLowerCase().includes(query));
    });
  }, [search, submissions, t]);
  const pageCount = Math.max(1, Math.ceil(filteredSubmissions.length / PAGE_SIZE));
  const visibleSubmissions = filteredSubmissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageStart = filteredSubmissions.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const pageEnd = Math.min(page * PAGE_SIZE, filteredSubmissions.length);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const openSub = (s) => {
    const id = s?.id ?? s?.submission_id;
    if (id != null) onOpenSubmission?.(id);
  };
  const openPb = (s, e) => {
    e.stopPropagation?.();
    const pid = s?.problem_id ?? s?.problem?.id;
    if (pid != null) onOpenProblem?.(pid);
  };

  return (
    <div className="window-page-shell">
      <div className="window-page-header">
        <div>
          <p className="window-page-kicker">{t('submissions.kicker')}</p>
          <h2>{t('submissions.title')}</h2>
        </div>
        <div className="window-page-pill">{t('common.entries', { count: submissions.length })}</div>
      </div>

      {!currentUser ? (
        <div className="window-page-state">{t('submissions.noSession')}</div>
      ) : isLoading ? (
        <div className="window-page-state">{t('submissions.loading')}</div>
      ) : error ? (
        <div className="window-page-state error">{error}</div>
      ) : (
        <>
          <div className="list-controls">
            <input
              className="list-search"
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder={t('submissions.searchPlaceholder')}
              aria-label={t('submissions.searchPlaceholder')}
            />
            <span className="list-count">
              {t('common.paginationRange', { start: pageStart, end: pageEnd, total: filteredSubmissions.length })}
            </span>
          </div>
          <div className="submissions-table-container">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>{t('submissions.id')}</th>
                  <th>{t('submissions.problem')}</th>
                  <th>{t('submissions.language')}</th>
                  <th>{t('submissions.status')}</th>
                  <th>{t('submissions.passed')}</th>
                  <th>{t('submissions.runtime')}</th>
                  <th>{t('submissions.memory')}</th>
                  <th>{t('submissions.submitted')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleSubmissions.length === 0 ? (
                  <tr><td colSpan={8} className="submissions-empty">{submissions.length ? t('common.noSearchResults') : t('submissions.empty')}</td></tr>
                ) : visibleSubmissions.map((sub) => {
                  const id = sub.id ?? sub.submission_id;
                  const problemTitle = sub.problem_title ?? sub.problemTitle ?? sub.problem?.title ?? `#${sub.problem_id ?? sub.problem?.id ?? '—'}`;
                  const status = normalizeSubmissionStatus(sub.status) ?? '-';
                  const translatedStatus = t(`status.${status}`);
                  const runtime = typeof (sub.time_ms ?? sub.max_time_ms) === 'number'
                    ? `${sub.time_ms ?? sub.max_time_ms}ms`
                    : (sub.runtime ?? 'N/A');
                  const memory = typeof (sub.memory_mb ?? sub.max_memory_mb) === 'number'
                    ? `${sub.memory_mb ?? sub.max_memory_mb}MB`
                    : (sub.memory ?? 'N/A');
                  const at = sub.created_at ?? sub.submitted_at ?? sub.submittedAt;
                  const passedTotal = sub.passed_cases != null || sub.total_cases != null || sub.passed != null || sub.total != null
                    ? `${sub.passed ?? sub.passed_cases ?? '?'}/${sub.total ?? sub.total_cases ?? '?'}`
                    : '—';
                  return (
                    <tr
                      key={id ?? sub.submittedAt ?? sub.time_ms}
                      className="sub-row"
                      onClick={() => openSub(sub)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{id ?? '—'}</td>
                      <td onClick={(e) => openPb(sub, e)} title="open problem">
                        <button
                          type="button"
                          className="sub-problem-link sub-problem-btn"
                          onClick={(e) => { e.stopPropagation(); openPb(sub, e); }}
                        >
                          {problemTitle}
                        </button>
                      </td>
                      <td>{sub.language ?? '—'}</td>
                      <td>
                        <span className={`status ${statusKey(status)}`}>
                          {translatedStatus === `status.${status}` ? status : translatedStatus}
                        </span>
                      </td>
                      <td>{passedTotal}</td>
                      <td>{runtime}</td>
                      <td>{memory}</td>
                      <td>{at ? new Date(at).toLocaleString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <nav className="list-pagination" aria-label={t('common.pagination')}>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                {t('common.previous')}
              </button>
              <span>{t('common.pageOf', { page, pages: pageCount })}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>
                {t('common.next')}
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default Submissions;