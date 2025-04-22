import axios from 'axios';

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
      console.log("TRACK DATA 2", response.data);
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
      console.log("RESPONSE TRACK DATA ", response.data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  }
};

export const budgetService = {
  createBudgetCycle: async (budgetData, token) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/budget-cycles`, budgetData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('API response:', response.data);
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
      const response = await axios.put(`${API_BASE_URL}/budget-cycles/${budgetData.budgetCycleId}`, budgetData, {
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
      console.log("getTransactionsByBudgetCycle response:", response.status, response.data);
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