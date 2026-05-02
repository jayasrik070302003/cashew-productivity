import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(() => {
    const saved = localStorage.getItem('cashew_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken]   = useState(() => localStorage.getItem('cashew_token'));
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    const res = await api.post('/auth/login', { username, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('cashew_token', newToken);
    localStorage.setItem('cashew_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('cashew_token');
    localStorage.removeItem('cashew_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
