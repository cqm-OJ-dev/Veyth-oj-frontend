import React, { useEffect, useState } from 'react';
import { listProblems } from '../services/judgeService';
import './Problems.css';

const Problems = ({ onOpenProblem }) => {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const data = await listProblems();
        setProblems(Array.isArray(data?.problems) ? data.problems : (Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : [])));
      } catch (err) {
        console.error('Failed to load problem list:', err);
        setError(err?.message || 'Failed to load problem list');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblems();
  }, []);

  const getDifficultyClass = (difficulty) => {
    if (difficulty === 'Easy') return 'easy';
    if (difficulty === 'Medium') return 'medium';
    return 'hard';
  };

  const openIt = (p) => onOpenProblem?.(p.id ?? p.problem_id ?? p);

  return (
    <div className="window-page-shell">
      <div className="window-page-header">
        <div>
          <p className="window-page-kicker">Workspace</p>
          <h2>Problems</h2>
        </div>
        <div className="window-page-pill">{problems.length} items</div>
      </div>

      {isLoading ? (
        <div className="window-page-state">Loading problems…</div>
      ) : error ? (
        <div className="window-page-state error">{error}</div>
      ) : (
        <div className="problem-list">
          {problems.map((problem) => (
            <article
              key={problem.id ?? problem.problem_id ?? problem.title}
              className="problem-card"
              onClick={() => openIt(problem)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openIt(problem); }}
            >
              <div className="problem-card-head">
                <div>
                  <div className="problem-id">#{problem.id ?? problem.problem_id ?? '—'}</div>
                  <h3>{problem.title}</h3>
                  {problem.tags && problem.tags.length > 0 && (
                    <div className="problem-tags">
                      {problem.tags.map((t, i) => (
                        <span key={i} className="problem-tag">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`difficulty ${getDifficultyClass(problem.difficulty)}`}>{problem.difficulty || '-'}</span>
              </div>

              <div className="problem-meta">
                <div className="problem-meta-item">
                  <span>Acceptance</span>
                  <strong>{problem.acceptance ?? '—'}</strong>
                </div>
                <div className="problem-meta-item">
                  <span>Submissions</span>
                  <strong>{problem.submissions ?? '—'}</strong>
                </div>
                {(problem.time_limit_ms || problem.time_limit) && (
                  <div className="problem-meta-item">
                    <span>Time</span>
                    <strong>{((problem.time_limit_ms ?? problem.time_limit * 1000) / 1000).toFixed(1)}s</strong>
                  </div>
                )}
                {(problem.memory_limit_mb || problem.memory_limit) && (
                  <div className="problem-meta-item">
                    <span>Memory</span>
                    <strong>{(problem.memory_limit_mb ?? problem.memory_limit)}MB</strong>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Problems;
