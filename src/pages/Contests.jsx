import React, { useEffect, useState } from 'react';
import './Contests.css';
import { useLanguage } from '../context/languageContext';
import Icon from '../components/Icon';

const Contests = () => {
  const { t } = useLanguage();
  const [contests, setContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

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
        setError(true);
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

  return (
    <div className="window-page-shell">
      <div className="window-page-header">
        <div>
          <p className="window-page-kicker">
            <Icon name="contests" size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            {t('contests.kicker')}
          </p>
          <h2>{t('contests.title')}</h2>
        </div>
        <div className="window-page-pill">{t('common.items', { count: contests.length })}</div>
      </div>

      {isLoading ? (
        <div className="window-page-state">{t('contests.loading')}</div>
      ) : error ? (
        <div className="window-page-state error">{t('common.error')}</div>
      ) : (
        <div className="contest-cards-container">
          {contests.map((contest) => (
            <div key={contest.id} className={`contest-card ${contest.status}`}>
              <div className="contest-card-header">
                <h3 className="contest-title">{contest.title}</h3>
                <span className={`contest-status ${contest.status}`}>{t('contests.' + contest.status)}</span>
              </div>

              <div className="contest-card-body">
                <p className="contest-description">{contest.description}</p>

                <div className="contest-meta">
                  <div className="meta-item">
                    <span className="meta-label">{t('contests.organizer')}</span>
                    <span className="meta-value">{contest.organizer}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">{t('contests.starts')}</span>
                    <span className="meta-value">{formatDate(contest.startTime)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">{t('contests.ends')}</span>
                    <span className="meta-value">{formatDate(contest.endTime)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">{t('contests.participants')}</span>
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