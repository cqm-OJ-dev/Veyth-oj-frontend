import React, { useEffect, useState } from 'react';
import './Problems.css';

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const mockProblems = [
          { id: 101, title: 'Two Sum', difficulty: 'Easy', acceptance: '72.5%', submissions: 1500 },
          { id: 102, title: 'Reverse Linked List', difficulty: 'Medium', acceptance: '58.3%', submissions: 1200 },
          { id: 103, title: 'Longest Palindromic Substring', difficulty: 'Hard', acceptance: '32.1%', submissions: 800 },
        ];

        setProblems(mockProblems);
      } catch (err) {
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