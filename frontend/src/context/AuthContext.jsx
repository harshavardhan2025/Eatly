import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import FoodLoader from '../components/FoodLoader';

const defaultValue = {
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAdmin: false
};

const AuthContext = createContext(defaultValue);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await api.getMe();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (phone, password) => {
    const res = await api.login(phone, password);
    const currentUser = await api.getMe();
    if (currentUser) {
      setUser(currentUser);
      return currentUser;
    }
    return res;
  };

  const register = async (name, phone, password) => {
    const res = await api.register(name, phone, password);
    const currentUser = await api.getMe();
    if (currentUser) {
      setUser(currentUser);
      return currentUser;
    }
    return res;
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext) || defaultValue;
