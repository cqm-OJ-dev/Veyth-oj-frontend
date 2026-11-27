import React, { useEffect, useState } from 'react';
import './ProblemDetail.css';
import { getSubmission, isSubmissionPending, normalizeSubmissionStatus } from '../services/judgeService';
import { useLanguage } from '../context/languageContext';

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
  Judging: '#1f6feb',
};

export default function SubmissionDetail({ submissionId, onOpenProblem }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sub, setSub] = useState(null);

  useEffect(() => {
    let canceled = false;
    let refreshTimer;
    let hasLoaded = false;
    setLoading(true); setError(''); setSub(null);
    if (!submissionId) { setLoading(false); return; }

    const refreshSubmission = async () => {
      try {
        const response = await getSubmission(submissionId);
        const payload = response?.submission || response;
        const status = normalizeSubmissionStatus(payload?.status || response?.status);
        const updatedPayload = status && status !== payload?.status
          ? { ...payload, status }
          : payload;

        if (canceled) return;
        hasLoaded = true;
        setSub(updatedPayload);
        setError('');
        setLoading(false);

        if (isSubmissionPending(status)) {
          refreshTimer = setTimeout(refreshSubmission, 5000);
        }
      } catch (e) {
        if (canceled) return;
        if (!hasLoaded) setError(e.message || 'failed');
        setLoading(false);
        refreshTimer = setTimeout(refreshSubmission, 5000);
      }
    };

    refreshSubmission();
    return () => {
      canceled = true;
      clearTimeout(refreshTimer);
    };
  }, [submissionId]);

  const data = sub || {};
  const results = data.case_results || data.results || [];

  const statusColor = STATUS_COLORS[normalizeSubmissionStatus(data.status)] || '#333';
  const statusText = (status) => {
    const normalizedStatus = normalizeSubmissionStatus(status);
    if (!normalizedStatus) return '-';
    const translated = t(`status.${normalizedStatus}`);
    return translated === `status.${normalizedStatus}` ? normalizedStatus : translated;
  };

  return (
    <div className="window-page-shell sd-shell">
      <div className="window-page-header">
        <div>
          <p className="window-page-kicker">{t('submissionDetail.kicker')}</p>
          <h2>#{submissionId ?? '-'}</h2>
        </div>
        {data.id && (
          <div className="sd-actions">
            {data.problem_id && (
              <button className="pd-link-btn" onClick={() => onOpenProblem?.(data.problem_id)}>
                {t('submissionDetail.openProblem', { id: data.problem_id })}
              </button>
            )}
            <div className="window-page-pill">{data.language || '-'}</div>
          </div>
        )}
      </div>

      {loading ? <div className="window-page-state">{t('submissionDetail.loading')}</div>
        : error ? <div className="window-page-state error">{error}</div>
        : !submissionId ? <div className="window-page-state">{t('submissionDetail.noSubmission')}</div>
        : (
          <div className="sd-body">
            <div className="sd-grid">
              <InfoCell label={t('submissionDetail.status')} value={statusText(data.status)} color={statusColor} bold />
              <InfoCell label={t('submissionDetail.passed')} value={`${data.passed ?? data.passed_cases ?? '?'} / ${data.total ?? data.total_cases ?? '?'}`} />
              <InfoCell label={t('submissionDetail.runtime')} value={typeof (data.time_ms ?? data.max_time_ms) === 'number' ? `${data.time_ms ?? data.max_time_ms}ms` : '-'} />
              <InfoCell label={t('submissionDetail.memory')} value={typeof (data.memory_mb ?? data.max_memory_mb) === 'number' ? `${data.memory_mb ?? data.max_memory_mb}MB` : '-'} />
              <InfoCell label={t('submissionDetail.language')} value={data.language || '-'} />
              <InfoCell label={t('submissionDetail.at')} value={data.created_at ? new Date(data.created_at).toLocaleString() : '-'} />
            </div>

            {data.code !== undefined && (
              <div className="sd-code-block">
                <h4 className="sd-section-title">{t('submissionDetail.code')}</h4>
                <pre className="pd-pre">{String(data.code)}</pre>
              </div>
            )}

            {results.length > 0 && (
              <div>
                <h4 className="sd-section-title">{t('submissionDetail.caseResults')}</h4>
                <div className="sd-cases">
                  {results.map((c, idx) => {
                    const st = normalizeSubmissionStatus(c.status) || '-';
                    const cColor = STATUS_COLORS[st] || '#333';
                    return (
                      <div key={idx} className="sd-case">
                        <div className="sd-case-id">{t('submissionDetail.case', { n: c.case ?? idx + 1 })}</div>
                        <div className="sd-case-status" style={{ color: cColor }}>{statusText(st)}</div>
                        <div className="sd-case-time">{c.time_ms ?? '?'}ms</div>
                        <div className="sd-case-detail">
                          {c.stderr ? (
                            <details>
                              <summary className="sd-summary err">{t('submissionDetail.stderr')}</summary>
                              <pre className="pd-pre small sd-detail-pre">{c.stderr}</pre>
                            </details>
                          ) : null}
                          {st === 'Wrong Answer' && (
                            <div className="sd-wa">
                              <div>
                                <div className="sd-wa-label">{t('submissionDetail.expected')}</div>
                                <pre className="pd-pre small">{c.expected ?? ''}</pre>
                              </div>
                              <div>
                                <div className="sd-wa-label">{t('submissionDetail.got')}</div>
                                <pre className="pd-pre small">{c.stdout ?? ''}</pre>
                              </div>
                            </div>
                          )}
                          {st === 'Accepted' && c.stdout !== undefined && !c.stderr ? (
                            <details>
                              <summary className="sd-summary muted">{t('submissionDetail.output')}</summary>
                              <pre className="pd-pre small sd-detail-pre">{c.stdout}</pre>
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
                <h4 className="sd-section-title">{t('submissionDetail.error')}</h4>
                <pre className="pd-pre sd-error-pre">{String(data.error)}</pre>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

function InfoCell({ label, value, color, bold }) {
  return (
    <div className="sd-info">
      <div className="sd-info-label">{label}</div>
      <div className={`sd-info-value${bold ? ' bold' : ''}`} style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}