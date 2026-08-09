import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Submissions.css';

const Submissions = () => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        if (!currentUser) return;

        const mockSubmissions = [
          {
            id: 1,
            problemTitle: 'Two Sum',
            language: 'Python',
            status: 'Compile Error',
            runtime: '45ms',
            memory: '14.5MB',
            submittedAt: '2023-04-10T14:30:00'
          },
          {
            id: 2,
            problemTitle: 'Reverse Linked List',
            language: 'C++',
            status: 'Wrong Answer',
            runtime: 'N/A',
            memory: 'N/A',
            submittedAt: '2023-04-08T09:15:00'
          }
        ];

        setSubmissions(mockSubmissions);
      } catch (err) {
        setError('Failed to load submissions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [currentUser]);

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
                <th>Runtime</th>
                <th>Memory</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td>{sub.id}</td>
                  <td>{sub.problemTitle}</td>
                  <td>{sub.language}</td>
                  <td>
                    <span className={`status ${sub.status.toLowerCase().replace(' ', '-')}`}>{sub.status}</span>
                  </td>
                  <td>{sub.runtime}</td>
                  <td>{sub.memory}</td>
                  <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Submissions;