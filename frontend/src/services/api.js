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
          'Content-Type': 'application/json', // Explicitly set, though Axios defaults to this
        },
      });
      console.log('API response:', response.data); // Add this
      return response.data; // { message: 'Budget created successfully', budget }
    } catch (error) {
      // Handle backend error format: { error: "message" }
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

  // Get a specific budget cycle
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

  // Update a budget cycle
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

  // Delete a budget cycle
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
  // Get all transactions for a budget cycle
  getTransactionsByBudgetCycle: async (cycleId, token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/transactions/budget-cycle/${cycleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("getTransactionsByBudgetCycle response:", response.status, response.data);
      return response.data;
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
        headers: {Authorization: `Bearer ${token}`}
      })
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

  // Approve a recommendation
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

  // Delay a recommendation
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

  // Get savings progress
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

  // Get behavioral insights
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
