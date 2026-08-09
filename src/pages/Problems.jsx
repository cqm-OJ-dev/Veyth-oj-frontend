import React, { useEffect, useState } from 'react';
import './Problems.css';

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch('http://localhost:1029/problems/problems/');
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setProblems(Array.isArray(data?.problems) ? data.problems : []);
      } catch (err) {
        console.error('Failed to load problem list:', err);
        setError('Failed to load problem list');
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
            <article key={problem.id} className="problem-card">
              <div className="problem-card-head">
                <div>
                  <div className="problem-id">#{problem.id}</div>
                  <h3>{problem.title}</h3>
                </div>
                <span className={`difficulty ${getDifficultyClass(problem.difficulty)}`}>{problem.difficulty}</span>
              </div>

              <div className="problem-meta">
                <div className="problem-meta-item">
                  <span>Acceptance</span>
                  <strong>{problem.acceptance}</strong>
                </div>
                <div className="problem-meta-item">
                  <span>Submissions</span>
                  <strong>{problem.submissions}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Problems;