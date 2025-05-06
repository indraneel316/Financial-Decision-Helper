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
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          setIsNewUser(parsedUser.isNewUser || false);
        }
      } catch (e) {
        console.error('Failed to load auth info from storage:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.register(userData);
      
      // After registration, automatically log in the user
      const loginResponse = await userService.login({
        email: userData.email,
        password: userData.password
      });

      const newUser = { ...response.user, isNewUser: true };
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      await AsyncStorage.setItem('token', loginResponse.token);
      setUser(newUser);
      setToken(loginResponse.token);
      setIsNewUser(true);
      return response;
    } catch (e) {
      setError(e.message || 'Registration failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.login(credentials);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('token', response.token);
      setUser(response.user);
      setToken(response.token);
      setIsNewUser(response.user.isNewUser || false);
      return response;
    } catch (e) {
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
      setIsNewUser(false);
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (onboardingData) => {
    try {
      setLoading(true);
      setError(null);
      if (!user || !token) throw new Error('User not authenticated');

      const response = await userService.updateProfile(user.userId, onboardingData, token);
      const updatedUser = { ...user, ...response.user, isNewUser: false };
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsNewUser(false);
      return response;
    } catch (e) {
      setError(e.message || 'Failed to complete onboarding');
      throw e;
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
      setError(e.message || 'Profile update failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const value = { 
    user, 
    setUser, 
    token, 
    loading, 
    error, 
    isNewUser,
    login, 
    logout, 
    register,
    completeOnboarding,
    updateProfile 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};