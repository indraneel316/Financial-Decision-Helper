import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        console.log('AuthContext - Loaded from storage:', { storedUser, storedToken });
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (e) {
        console.error('AuthContext - Failed to load auth info from storage:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('AuthContext - Login started with credentials:', credentials);
      setLoading(true);
      setError(null);
      const response = await userService.login(credentials);
      console.log('AuthContext - Login response:', response);

      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('token', response.token);
      setUser(response.user);
      setToken(response.token);
      return response;
    } catch (e) {
      console.error('AuthContext - Login error:', e);
      setError(e.message || 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } catch (e) {
      console.error('AuthContext - Logout failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      if (!user || !token) throw new Error('User not authenticated');

      const response = await userService.updateProfile(user.userId, userData, token);

      const updatedUser = { ...user, ...response.user };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return response;
    } catch (e) {
      console.error('AuthContext - Update profile error:', e);
      setError(e.message || 'Profile update failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const value = { user, token, loading, error, login, logout, updateProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};