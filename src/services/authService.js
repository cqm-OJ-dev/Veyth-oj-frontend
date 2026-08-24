export const API_BASE = process.env.REACT_APP_API_BASE || 'https://cqiming.pythonanywhere.com';

import {
  createContext,
  useState,
  useEffect,
  useContext
} from 'react';

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
          // ignore
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
  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
export function useAuthContext() {
  return useContext(AuthContext);
}
