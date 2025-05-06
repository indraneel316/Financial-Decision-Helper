import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the backend API
const API_BASE_URL = 'http://10.0.0.115:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// API service for user-related operations
export const userService = {
  register: async (userData) => {
    try {
      console.log('Registering user with data:', userData);
      const response = await api.post('/auth/signup', userData);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to register user');
    }
  },

  // Login a user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/signin', credentials);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to login');
    }
  },

  // Get user profile
  getProfile: async (userId, token) => {
    try {
      const response = await api.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to get profile');
    }
  },

  updateProfile: async (userId, userData, token) => {
    try {
      const response = await api.put(`/users/${userId}`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to update profile');
    }
  }
};

export const budgetService = {
  createBudgetCycle: async (budgetData, token) => {
    try {
      // Fetch user currency from AsyncStorage
      let currency = 'USD'; // Fallback
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          currency = user.currency || 'USD';
        } else {
          console.warn('No user data found in AsyncStorage, using default currency: USD');
        }
      } catch (error) {
        console.error('Error reading user currency from AsyncStorage:', error);
      }

      // Include currency in budgetData
      const payload = {
        ...budgetData,
        currency
      };
      const response = await api.post('/budget-cycles', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data; // { message: 'Budget created successfully', budget }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to create budget cycle');
    }
  },

  getBudgetCycles: async (userId, token) => {
    try {
      const response = await api.get(`/budgetcycles/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  getBudgetCycle: async (cycleId, token) => {
    try {
      const response = await api.get(`/budgetcycles/${cycleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  updateBudgetCycle: async (cycleId, budgetData, token) => {
    try {
      // Fetch user currency from AsyncStorage
      let currency = 'USD'; // Fallback
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          currency = user.currency || 'USD';
        } else {
          console.warn('No user data found in AsyncStorage, using default currency: USD');
        }
      } catch (error) {
        console.error('Error reading user currency from AsyncStorage:', error);
      }

      // Include currency in budgetData
      const payload = {
        ...budgetData,
        currency
      };
      const response = await api.put(`/budget-cycles/${budgetData.budgetCycleId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  deleteBudgetCycle: async (cycleId, token) => {
    try {
      const response = await api.delete(`/budget-cycles/${cycleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  }
};

export const transactionService = {
  createTransaction: async (data, token) => {
    try {
      const response = await api.post('/transactions', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response;
    } catch (error) {
      console.log("transactionService error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // Get paginated transactions for a budget cycle
  getTransactionsByBudgetCycle: async (cycleId, token, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/transactions/budget-cycle/${cycleId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit },
      });
      return response.data; // Returns { transactions, pagination }
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  getTransactionsByUser: async (userId, token) => {
    try {
      const response = await api.get(`/transactions/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  getTransaction: async (transactionId, token) => {
    try {
      const response = await api.get(`/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  updateTransaction: async (transactionId, transactionData, token) => {
    try {
      return await api.put(`/transactions/${transactionId}`, transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  deleteTransaction: async (transactionId, token) => {
    try {
      const response = await api.delete(`/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  }
};

export const recommendationService = {
  getRecommendations: async (userId, token) => {
    try {
      const response = await api.get(`/recommendations/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  approveRecommendation: async (recommendationId, token) => {
    try {
      const response = await api.put(`/recommendations/${recommendationId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  delayRecommendation: async (recommendationId, token) => {
    try {
      const response = await api.put(`/recommendations/${recommendationId}/delay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  }
};

export const analyticsService = {
  getSpendingByCategory: async (userId, cycleId, token) => {
    try {
      const response = await api.get('/analytics/spending-by-category', {
        params: { userId, cycleId },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  getMonthlySpending: async (userId, year, token) => {
    try {
      const response = await api.get('/analytics/monthly-spending', {
        params: { userId, year },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  getSavingsProgress: async (userId, token) => {
    try {
      const response = await api.get('/analytics/savings-progress', {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  getBehavioralInsights: async (userId, token) => {
    try {
      const response = await api.get('/analytics/behavioral-insights', {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  }
};