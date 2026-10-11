import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const UserAvatar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  // 头像 URL 加载失败后，降级为首字母，永远不显示破碎图
  const [avatarBroken, setAvatarBroken] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // 只要 user.avatar 变了（切账号/上传新图），就清空 onError 的降级标记
  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.avatar]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleLogout = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    }
    navigate('/login', { replace: true });
  };

  const onImgError = useCallback(() => setAvatarBroken(true), []);

  if (!user) return null;

  const initial = (user.username || 'U').charAt(0).toUpperCase();
  const showAvatarImg = user.avatar && !avatarBroken;

  return (
    <div className="user-avatar-container" ref={containerRef}>
      <button
        className="avatar-button"
        title={user.username}
        onClick={() => setIsOpen((open) => !open)}
      >
        {showAvatarImg ? (
          <img
            src={user.avatar}
            alt=""
            className="avatar-img"
            onError={onImgError}
          />
        ) : (
          <span>{initial}</span>
        )}
      </button>

      {isOpen && (
        <div className="user-dropdown" role="menu">
          <div className="user-info">
            <div className="user-info-avatar">
              {showAvatarImg ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="dropdown-avatar"
                  onError={onImgError}
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="user-info-text">
              <span className="username">{user.username}</span>
              {user.email && <span className="email">{user.email}</span>}
              {user.is_staff && (
                <span className="staff-badge">管理员</span>
              )}
            </div>
          </div>
          <div className="dropdown-divider" />
          <button
            className="dropdown-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              navigate('/profile');
            }}
          >
            <span className="dropdown-icon">👤</span>
            <span>个人中心</span>
          </button>
          <button
            className="dropdown-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              navigate('/settings');
            }}
          >
            <span className="dropdown-icon">⚙️</span>
            <span>设置</span>
          </button>
          <div className="dropdown-divider" />
          <button
            className="dropdown-item logout"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
          >
            <span className="dropdown-icon">🚪</span>
            <span>退出登录</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
