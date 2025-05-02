import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the backend API
const API_BASE_URL = 'http://10.0.0.115:5001/api';

// API service for user-related operations
export const userService = {
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Login a user
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signin`, credentials);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // Get user profile
  getProfile: async (userId, token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  updateProfile: async (userId, userData, token) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
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
      const response = await axios.post(`${API_BASE_URL}/budget-cycles`, payload, {
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
      const response = await axios.get(`${API_BASE_URL}/budgetcycles/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  getBudgetCycle: async (cycleId, token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/budgetcycles/${cycleId}`, {
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
      const response = await axios.put(`${API_BASE_URL}/budget-cycles/${budgetData.budgetCycleId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  deleteBudgetCycle: async (cycleId, token) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/budget-cycles/${cycleId}`, {
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
      const response = await axios.post(`${API_BASE_URL}/transactions`, data, {
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
      const response = await axios.get(`${API_BASE_URL}/transactions/budget-cycle/${cycleId}`, {
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
      const response = await axios.get(`${API_BASE_URL}/transactions/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  getTransaction: async (transactionId, token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  updateTransaction: async (transactionId, transactionData, token) => {
    try {
      return await axios.put(`${API_BASE_URL}/transactions/${transactionId}`, transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  deleteTransaction: async (transactionId, token) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/transactions/${transactionId}`, {
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
      const response = await axios.get(`${API_BASE_URL}/recommendations/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  approveRecommendation: async (recommendationId, token) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/recommendations/${recommendationId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  delayRecommendation: async (recommendationId, token) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/recommendations/${recommendationId}/delay`, {}, {
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
      const response = await axios.get(`${API_BASE_URL}/analytics/spending-by-category`, {
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
      const response = await axios.get(`${API_BASE_URL}/analytics/monthly-spending`, {
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
      const response = await axios.get(`${API_BASE_URL}/analytics/savings-progress`, {
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
      const response = await axios.get(`${API_BASE_URL}/analytics/behavioral-insights`, {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  }
};