import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/authContext';
import '../components/Desktop.css';

const Profile = () => {
  const { currentUser, logout, updateCurrentUser } = useAuthContext();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // 头像 URL 加载失败时，临时降级为首字母展示，防止破碎图标
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // {type:'ok'|'err', text}

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
  const showAvatarImg = currentUser.avatar && !avatarBroken;

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2200);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // 本地图片 -> base64 dataURL -> 直接写入全局 currentUser.avatar
  // （不需要等后端上传接口，任何前端路径都能立即看到效果；
  //   后端上传接口就绪后可以把这里改成调用 API 再用返回的 URL updateCurrentUser）
  const applyAvatar = async (newAvatar) => {
    setSaving(true);
    try {
      await updateCurrentUser({ avatar: newAvatar });
      setAvatarBroken(false);
      showToast('ok', '头像已更新');
    } catch (e) {
      showToast('err', '保存失败：' + (e?.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      showToast('err', '请选择图片文件');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showToast('err', '图片不能超过 4MB');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => showToast('err', '读取图片失败');
    reader.onload = () => applyAvatar(String(reader.result));
    reader.readAsDataURL(file);
    // 清空 input，允许下次选择同一个文件
    e.target.value = '';
  };

  const onUrlSubmit = (e) => {
    e.preventDefault();
    const url = avatarUrlInput.trim();
    if (!url) {
      showToast('err', '请输入头像 URL');
      return;
    }
    applyAvatar(url);
  };

  const onClearAvatar = async () => {
    setSaving(true);
    try {
      await updateCurrentUser({ avatar: '' });
      setAvatarBroken(false);
      setAvatarUrlInput('');
      showToast('ok', '已恢复为默认头像');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      {toast && (
        <div className={`profile-toast ${toast.type}`} role="status">
          {toast.text}
        </div>
      )}

      <div className="profile-header">
        <div className="profile-avatar">
          {showAvatarImg ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              onError={() => setAvatarBroken(true)}
            />
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
        <h3>头像设置</h3>
        <div className="avatar-actions">
          <div className="avatar-action-row">
            <button
              type="button"
              className="btn-primary"
              disabled={saving}
              onClick={() => fileRef.current?.click()}
            >
              {saving ? '保存中…' : '📷 从本地上传'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onPickFile}
            />
          </div>

          <form className="avatar-action-row" onSubmit={onUrlSubmit}>
            <input
              type="url"
              placeholder="或粘贴头像图片链接 (https://...)"
              value={avatarUrlInput}
              onChange={(e) => setAvatarUrlInput(e.target.value)}
              disabled={saving}
              className="avatar-url-input"
            />
            <button type="submit" className="btn-secondary" disabled={saving}>
              应用 URL
            </button>
          </form>

          <div className="avatar-action-row">
            <button
              type="button"
              className="btn-ghost"
              disabled={saving || !currentUser.avatar}
              onClick={onClearAvatar}
            >
              恢复默认（首字母）
            </button>
          </div>

          <p className="avatar-hint">
            提示：上传或填写 URL 后会立即同步到侧边栏、任务栏和顶部导航栏。
            若后端尚未开放头像上传接口，本地 base64 头像也能在前端正常显示。
          </p>
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
