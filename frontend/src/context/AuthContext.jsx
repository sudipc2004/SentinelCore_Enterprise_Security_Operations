import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8080';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set default auth header if token exists
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const response = await axios.get('/api/auth/profile');
          setUser(response.data);
          setToken(storedToken);
        } catch (err) {
          console.error("Auto login failed", err);
          logoutLocal();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Axios interceptor to catch 401 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (err) => {
        if (err.response && err.response.status === 401) {
          logoutLocal();
        }
        return Promise.reject(err);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const logoutLocal = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: jwtToken, ...userData } = response.data;
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      setLoading(false);
      return userData;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const register = async (name, email, password, role, department) => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', { name, email, password, role, department });
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Call logout API to write the audit trail event
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.warn("Logout API call failed, signing out locally...", err);
    } finally {
      logoutLocal();
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData) => {
    setError(null);
    try {
      const response = await axios.put(`/api/users/${user.id}`, updatedData);
      // If we are updating ourselves, update user state
      setUser(response.data);
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Profile update failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
