import React, { useEffect, useState } from 'react';
import { getSubmission, pollSubmission } from '../services/judgeService';

const STATUS_COLORS = {
  Accepted: '#14804a',
  'Wrong Answer': '#c07a00',
  'Time Limit Exceeded': '#6941c6',
  'Memory Limit Exceeded': '#6941c6',
  'Runtime Error': '#a1241e',
  'Compile Error': '#a1241e',
  'Internal Error': '#a1241e',
  Pending: '#1f6feb',
  Running: '#1f6feb',
  Queued: '#1f6feb',
};

export default function SubmissionDetail({ submissionId, onOpenProblem }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sub, setSub] = useState(null);

  useEffect(() => {
    let canceled = false;
    setLoading(true); setError(''); setSub(null);
    if (!submissionId) { setLoading(false); return; }
    getSubmission(submissionId).then((r) => {
      const payload = r?.submission || r;
      const status = payload?.status || r?.status;
      setSub(payload);
      if (['Pending', 'Running', 'Queued'].includes(status)) {
        pollSubmission(submissionId, { maxWaitMs: 30000, intervalMs: 700 })
          .then((p) => { if (!canceled) setSub(p?.submission || p); });
      }
    }).catch((e) => { if (!canceled) setError(e.message || 'failed'); })
      .finally(() => { if (!canceled) setLoading(false); });
    return () => { canceled = true; };
  }, [submissionId]);

  const data = sub || {};
  const results = data.results || [];

  const statusColor = STATUS_COLORS[data.status] || '#333';

  return (
    <div className="window-page-shell" style={{ height: '100%', overflowY: 'auto', paddingBottom: 16 }}>
      <div className="window-page-header">
        <div>
          <p className="window-page-kicker">Submission</p>
          <h2>#{submissionId ?? '-'}</h2>
        </div>
        {data.id && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {data.problem_id && (
              <button className="pd-link-btn" onClick={() => onOpenProblem?.(data.problem_id)}>
                open problem #{data.problem_id}
              </button>
            )}
            <div className="window-page-pill">{data.language || '-'}</div>
          </div>
        )}
      </div>

      {loading ? <div className="window-page-state">Loading submission…</div>
        : error ? <div className="window-page-state error">{error}</div>
        : !submissionId ? <div className="window-page-state">No submission selected</div>
        : (
          <div style={{ padding: '4px 14px' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 10, marginBottom: 14,
            }}>
              <InfoCell label="Status" value={data.status || '-'} color={statusColor} bold />
              <InfoCell label="Passed" value={`${data.passed ?? '?'} / ${data.total ?? '?'}`} />
              <InfoCell label="Runtime" value={typeof data.time_ms === 'number' ? `${data.time_ms}ms` : '-'} />
              <InfoCell label="Memory" value={typeof data.memory_mb === 'number' ? `${data.memory_mb}MB` : '-'} />
              <InfoCell label="Language" value={data.language || '-'} />
              <InfoCell label="At" value={data.created_at ? new Date(data.created_at).toLocaleString() : '-'} />
            </div>

            {data.code !== undefined && (
              <div style={{ marginBottom: 14 }}>
                <h4 style={{ margin: '6px 0 4px', fontSize: 13 }}>Submitted Code</h4>
                <pre className="pd-pre">{String(data.code)}</pre>
              </div>
            )}

            {results.length > 0 && (
              <div>
                <h4 style={{ margin: '6px 0 8px', fontSize: 13 }}>Case Results</h4>
                <div className="pd-cases" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.map((c, idx) => {
                    const st = c.status || '-';
                    const cColor = STATUS_COLORS[st] || '#333';
                    return (
                      <div key={idx} style={{
                        border: '1px solid #e4e6ea', borderRadius: 6, padding: '8px 10px',
                        background: '#fff', display: 'grid', gridTemplateColumns: '80px 140px 100px 1fr', gap: 10, alignItems: 'center'
                      }}>
                        <div style={{ fontWeight: 600 }}>Case #{c.case ?? idx + 1}</div>
                        <div style={{ color: cColor, fontWeight: 700 }}>{st}</div>
                        <div style={{ color: '#555', fontSize: 12 }}>{c.time_ms ?? '?'}ms</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {c.stderr ? (
                            <details>
                              <summary style={{ fontSize: 12, color: '#a1241e', cursor: 'pointer' }}>Stderr</summary>
                              <pre className="pd-pre small" style={{ marginTop: 4 }}>{c.stderr}</pre>
                            </details>
                          ) : null}
                          {st === 'Wrong Answer' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div>
                                <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Expected</div>
                                <pre className="pd-pre small">{c.expected ?? ''}</pre>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Got</div>
                                <pre className="pd-pre small">{c.stdout ?? ''}</pre>
                              </div>
                            </div>
                          )}
                          {st === 'Accepted' && c.stdout !== undefined && !c.stderr ? (
                            <details>
                              <summary style={{ fontSize: 12, color: '#555', cursor: 'pointer' }}>Output</summary>
                              <pre className="pd-pre small" style={{ marginTop: 4 }}>{c.stdout}</pre>
                            </details>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!results.length && data.error && (
              <div>
                <h4 style={{ margin: '6px 0 4px', fontSize: 13 }}>Error</h4>
                <pre className="pd-pre" style={{ color: '#a1241e' }}>{String(data.error)}</pre>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

function InfoCell({ label, value, color, bold }) {
  return (
    <div style={{
      background: '#fafafa', border: '1px solid #e4e6ea', borderRadius: 6,
      padding: '8px 10px', minWidth: 0
    }}>
      <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{
        fontSize: 14,
        fontWeight: bold ? 700 : 600,
        color: color || '#1f2328',
        marginTop: 2,
        wordBreak: 'break-word'
      }}>{value}</div>
    </div>
  );
}
