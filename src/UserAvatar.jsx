// UserAvatar.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteCookie } from './services/authService';

const UserAvatar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    try { deleteCookie('user'); } catch (e) {}
    try { deleteCookie('authToken'); } catch (e) {}
    try { deleteCookie('refreshToken'); } catch (e) {}
    navigate('/login');
  };

  return (
    <div className="user-avatar-container">
      <button 
        className="avatar-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {user.username.charAt(0).toUpperCase()}
      </button>
      
      {isOpen && (
        <div className="user-dropdown">
          <div className="user-info">
            <span className="username">{user.username}</span>
            <span className="email">{user.email}</span>
          </div>
          <button 
            className="dropdown-item"
            onClick={() => navigate('/profile')}
          >
            个人中心
          </button>
          <button 
            className="dropdown-item logout"
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;