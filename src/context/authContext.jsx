import { createContext, useState, useEffect, useContext } from 'react';
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

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        migrateLocalStorageToCookies();
      } catch (e) {}

      const token =
        getCookie('authToken') ||
        getCookie('userToken') ||
        getCookie('sessionToken');

      if (token) {
        // 1. 优先从 sql.js 会话恢复（含完整 userData）
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

        // 2. 回退：直接从 user cookie 读取用户数据
        //    （即使 sql.js/localStorage 被清，只要 cookie 在就保留登录态）
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
      // token + 完整用户数据都写入 cookie，保证清 cookie 之前一直保留登录态
      setCookie('authToken', clientToken, 30);
      setCookie('userToken', clientToken, 30);
      setCookie('user', JSON.stringify(normalizedUser), 30);
      await saveUserSession(clientToken, normalizedUser);
    } catch (e) {
      // ignore
    }

    setCurrentUser(normalizedUser);
  };

  const logout = async () => {
    const token =
      getCookie('authToken') ||
      getCookie('userToken') ||
      getCookie('sessionToken');
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

  /**
   * 增量更新当前用户信息（头像、昵称等）。
   * 同时同步到 React state、user cookie、sql.js session，
   * 保证侧边栏/任务栏/桌面的所有头像组件立即重渲染，且刷新后仍在。
   */
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

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, login, logout, updateCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext() {
  return useContext(AuthContext);
}
