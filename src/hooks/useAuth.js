// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import {
  getCookie,
  setCookie,
  deleteCookie,
  migrateLocalStorageToCookies,
  saveUserSession,
  getUserSession,
  deleteUserSession,
  generateToken
} from '../services/authService';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      // 迁移旧的 localStorage（如果存在）到带安全属性的 cookie
      try {
        migrateLocalStorageToCookies();
      } catch (e) {}

      const token = getCookie('authToken') || getCookie('userToken') || getCookie('sessionToken');
      if (token) {
        try {
          const storedSession = await getUserSession(token);
          if (storedSession?.userData) {
            setCurrentUser(storedSession.userData);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          // ignore，继续走 cookie 回退
        }

        const userCookie = getCookie('user');
        if (userCookie) {
          try {
            const parsed = JSON.parse(userCookie);
            if (parsed && parsed.username) {
              setCurrentUser(parsed);
            }
          } catch (e) {
            // ignore
          }
        }
      }

      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (userData) => {
    const clientToken = generateToken(16);
    const normalizedUser = {
      ...userData,
      token: clientToken,
      accessToken: userData.accessToken || userData.token || null,
      refreshToken: userData.refreshToken || null
    };

    try {
      setCookie('authToken', clientToken, 30);
      setCookie('userToken', clientToken, 30);
      setCookie('user', JSON.stringify(normalizedUser), 30);
      await saveUserSession(clientToken, normalizedUser);
    } catch (e) {
      // ignore
    }

    setCurrentUser(normalizedUser);
  };

  const updateCurrentUser = async (patch) => {
    setCurrentUser((prev) => {
      const next = prev ? { ...prev, ...patch } : patch;
      try {
        setCookie('user', JSON.stringify(next), 30);
      } catch (e) {
        // ignore
      }
      const token =
        getCookie('authToken') ||
        getCookie('userToken') ||
        getCookie('sessionToken');
      if (token) {
        saveUserSession(token, next).catch(() => undefined);
      }
      return next;
    });
  };

  const logout = async () => {
    const token = getCookie('authToken') || getCookie('userToken') || getCookie('sessionToken');
    if (token) {
      try {
        await deleteUserSession(token);
      } catch (e) {
        // ignore
      }
    }

    deleteCookie('user');
    deleteCookie('authToken');
    deleteCookie('userToken');
    deleteCookie('sessionToken');
    deleteCookie('refreshToken');
    setCurrentUser(null);
  };

  return { currentUser, isLoading, login, logout, updateCurrentUser };
}