// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { getCookie, setCookie, deleteCookie, migrateLocalStorageToCookies } from '../services/authService';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 迁移旧的 localStorage（如果存在）到带安全属性的 cookie
    try {
      migrateLocalStorageToCookies();
    } catch (e) {}

    // 从 cookie 加载用户数据
    const userCookie = getCookie('user');
    if (userCookie) {
      try {
        setCurrentUser(JSON.parse(userCookie));
      } catch (e) {
        // 如果不是 JSON，则忽略
        try {
          setCurrentUser({ username: userCookie });
        } catch (err) {}
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    try {
      setCookie('user', JSON.stringify(userData), 30);
    } catch (e) {
      // fallback: store minimal
      setCookie('user', userData.username || '', 30);
    }
    setCurrentUser(userData);
  };

  const logout = () => {
    deleteCookie('user');
    deleteCookie('authToken');
    deleteCookie('refreshToken');
    setCurrentUser(null);
  };

  return { currentUser, isLoading, login, logout };
}