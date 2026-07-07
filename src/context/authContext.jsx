import { createContext, useState, useEffect } from 'react';
import { getCookie, setCookie, deleteCookie, migrateLocalStorageToCookies } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try { migrateLocalStorageToCookies(); } catch (e) {}
    const userCookie = getCookie('user');
    if (userCookie) {
      try {
        setCurrentUser(JSON.parse(userCookie));
      } catch (e) {
        setCurrentUser({ username: userCookie });
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    try { setCookie('user', JSON.stringify(userData), 30); } catch (e) { setCookie('user', userData.username || '', 30); }
    setCurrentUser(userData);
  };

  const logout = () => {
    deleteCookie('user');
    deleteCookie('authToken');
    deleteCookie('refreshToken');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};