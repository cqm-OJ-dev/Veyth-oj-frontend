import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { listSubmissions } from '../services/judgeService';
import './Submissions.css';

const statusKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, '-');

const Submissions = ({ onOpenSubmission, onOpenProblem }) => {
  const { currentUser } = useAuth();
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
          <p className="window-page-kicker">Recent activity</p>
          <h2>Submissions</h2>
        </div>
        <div className="window-page-pill">{submissions.length} entries</div>
      </div>

      {!currentUser ? (
        <div className="window-page-state">No active session yet.</div>
      ) : isLoading ? (
        <div className="window-page-state">Loading submissions…</div>
      ) : error ? (
        <div className="window-page-state error">{error}</div>
      ) : (
        <div className="submissions-table-container">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Problem</th>
                <th>Language</th>
                <th>Status</th>
                <th>Passed</th>
                <th>Runtime</th>
                <th>Memory</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#666', padding: 24 }}>No submissions yet.</td></tr>
              ) : submissions.map((sub) => {
                const id = sub.id ?? sub.submission_id;
                const problemTitle = sub.problem_title ?? sub.problemTitle ?? sub.problem?.title ?? `#${sub.problem_id ?? sub.problem?.id ?? '—'}`;
                const status = sub.status ?? '-';
                const runtime = typeof sub.time_ms === 'number'
                  ? `${sub.time_ms}ms`
                  : (sub.runtime ?? 'N/A');
                const memory = typeof sub.memory_mb === 'number'
                  ? `${sub.memory_mb}MB`
                  : (sub.memory ?? 'N/A');
                const at = sub.created_at ?? sub.submitted_at ?? sub.submittedAt;
                const passedTotal = sub.passed != null || sub.total != null
                  ? `${sub.passed ?? '?'}/${sub.total ?? '?'}`
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
                      <a className="sub-problem-link" onClick={(e) => { e.preventDefault(); openPb(sub, e); }}>
                        {problemTitle}
                      </a>
                    </td>
                    <td>{sub.language ?? '—'}</td>
                    <td>
                      <span className={`status ${statusKey(status)}`}>{status}</span>
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
