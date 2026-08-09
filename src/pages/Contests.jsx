import React, { useEffect, useState } from 'react';
import './Contests.css';

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const mockContests = [
          {
            id: 1,
            title: 'Spring Challenge',
            startTime: '2023-05-01T09:00:00',
            endTime: '2023-05-01T12:00:00',
            participants: 1250,
            description: 'A large-scale programming contest featuring multiple algorithm topics.',
            organizer: 'Veyth Studio'
          },
          {
            id: 2,
            title: 'Algorithm Sprint',
            startTime: '2023-06-15T14:00:00',
            endTime: '2023-06-15T17:00:00',
            participants: 800,
            description: 'A focused contest for data structure and algorithm practice.',
            organizer: 'Algorithm Club'
          },
          {
            id: 3,
            title: 'Beginner Training',
            startTime: '2025-06-07T21:00:00',
            endTime: '2025-06-07T21:10:00',
            participants: 10,
            description: 'A short contest designed for newcomers to get started quickly.',
            organizer: 'Learning Circle'
          }
        ];

        const contestsWithStatus = mockContests.map((contest) => ({
          ...contest,
          status: getContestStatus(contest.startTime, contest.endTime)
        }));

        setContests(contestsWithStatus);
      } catch (err) {
        setError('Failed to load contest list');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContests();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US');
  };

  const getContestStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'ongoing';
  };

  const getStatusText = (status) => {
    const statusMap = {
      upcoming: 'Upcoming',
      ongoing: 'Ongoing',
      ended: 'Ended'
    };

    return statusMap[status] || status;
  };

  return (
    <div className="window-page-shell">
      <div className="window-page-header">
        <div>
          <p className="window-page-kicker">Upcoming events</p>
          <h2>Contests</h2>
        </div>
        <div className="window-page-pill">{contests.length} items</div>
      </div>

      {isLoading ? (
        <div className="window-page-state">Loading contests…</div>
      ) : error ? (
        <div className="window-page-state error">{error}</div>
      ) : (
        <div className="contest-cards-container">
          {contests.map((contest) => (
            <div key={contest.id} className={`contest-card ${contest.status}`}>
              <div className="contest-card-header">
                <h3 className="contest-title">{contest.title}</h3>
                <span className={`contest-status ${contest.status}`}>{getStatusText(contest.status)}</span>
              </div>

              <div className="contest-card-body">
                <p className="contest-description">{contest.description}</p>

                <div className="contest-meta">
                  <div className="meta-item">
                    <span className="meta-label">Organizer</span>
                    <span className="meta-value">{contest.organizer}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Starts</span>
                    <span className="meta-value">{formatDate(contest.startTime)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Ends</span>
                    <span className="meta-value">{formatDate(contest.endTime)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Participants</span>
                    <span className="meta-value">{contest.participants}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Contests;