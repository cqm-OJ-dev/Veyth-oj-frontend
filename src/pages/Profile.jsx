import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/authContext';
import '../components/Desktop.css';

const Profile = () => {
  const { currentUser, logout } = useAuthContext();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>未登录</p>
          <button onClick={() => navigate('/login')}>去登录</button>
        </div>
      </div>
    );
  }

  const initial = (currentUser.username || 'U').charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt="" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="profile-header-text">
          <h2>{currentUser.username}</h2>
          {currentUser.email && <p className="profile-email">{currentUser.email}</p>}
          <div className="profile-badges">
            {currentUser.is_staff && <span className="staff-badge">管理员</span>}
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3>账户信息</h3>
        <div className="info-list">
          <div className="info-row">
            <span className="info-label">用户名</span>
            <span className="info-value">{currentUser.username}</span>
          </div>
          {currentUser.email && (
            <div className="info-row">
              <span className="info-label">邮箱</span>
              <span className="info-value">{currentUser.email}</span>
            </div>
          )}
          {currentUser.nickname && (
            <div className="info-row">
              <span className="info-label">昵称</span>
              <span className="info-value">{currentUser.nickname}</span>
            </div>
          )}
          {currentUser.accessToken && (
            <div className="info-row">
              <span className="info-label">Access Token</span>
              <span className="info-value mono">{currentUser.accessToken.substring(0, 16)}...</span>
            </div>
          )}
        </div>
      </div>

      <div className="profile-actions">
        <button className="btn-secondary" onClick={() => navigate('/')}>
          返回桌面
        </button>
        <button className="btn-danger" onClick={handleLogout}>
          退出登录
        </button>
      </div>
    </div>
  );
};

export default Profile;
