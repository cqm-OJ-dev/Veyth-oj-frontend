import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/languageContext';
import { listSubmissions } from '../services/judgeService';
import './Submissions.css';

const statusKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, '-');

const Submissions = ({ onOpenSubmission, onOpenProblem }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const fetchSubmissions = async () => {
      try {
        if (!currentUser) { if (alive) { setIsLoading(false); } return; }
        const data = await listSubmissions();
        const arr = Array.isArray(data?.submissions) ? data.submissions
          : Array.isArray(data?.results) ? data.results
          : Array.isArray(data) ? data : [];
        if (alive) setSubmissions(arr);
      } catch (err) {
        if (alive) setError(err?.message || 'Failed to load submissions');
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    fetchSubmissions();
    return () => { alive = false; };
  }, [currentUser]);

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
              {submissions.length === 0 ? (
                <tr><td colSpan={8} className="submissions-empty">{t('submissions.empty')}</td></tr>
              ) : submissions.map((sub) => {
                const id = sub.id ?? sub.submission_id;
                const problemTitle = sub.problem_title ?? sub.problemTitle ?? sub.problem?.title ?? `#${sub.problem_id ?? sub.problem?.id ?? '—'}`;
                const status = sub.status ?? '-';
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
                      <span className={`status ${statusKey(status)}`}>{t('status.' + status) || status}</span>
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
      )}
    </div>
  );
};

export default Submissions;