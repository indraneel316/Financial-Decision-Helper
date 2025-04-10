import React, { createContext, useState, useContext } from 'react';
import { budgetService, transactionService, recommendationService, analyticsService } from '../services/api';
import { useAuth } from './AuthContext';

// Create the Data Context
const DataContext = createContext();

// Custom hook to use the data context
export const useData = () => useContext(DataContext);

// Provider component that wraps the app and makes data object available
export const DataProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [budgetCycles, setBudgetCycles] = useState([]);
  const [currentBudgetCycle, setCurrentBudgetCycle] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState({
    spendingByCategory: [],
    monthlySpending: [],
    savingsProgress: {},
    insights: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Budget Cycle Methods
  const fetchBudgetCycles = async () => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await budgetService.getBudgetCycles(user.id, token);
      setBudgetCycles(data);
      
      // Set current budget cycle to the most recent one
      if (data.length > 0) {
        const sortedCycles = [...data].sort((a, b) => 
          new Date(b.startDate) - new Date(a.startDate)
        );
        setCurrentBudgetCycle(sortedCycles[0]);
      }
      
      return data;
    } catch (e) {
      setError(e.message || 'Failed to fetch budget cycles');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const createBudgetCycle = async (budgetData) => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await budgetService.createBudgetCycle({
        ...budgetData,
        userId: user.id
      }, token);
      
      // Update budget cycles list
      setBudgetCycles([...budgetCycles, data]);
      setCurrentBudgetCycle(data);
      
      return data;
    } catch (e) {
      setError(e.message || 'Failed to create budget cycle');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateBudgetCycle = async (cycleId, budgetData) => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await budgetService.updateBudgetCycle(cycleId, budgetData, token);
      
      // Update budget cycles list
      setBudgetCycles(budgetCycles.map(cycle => 
        cycle.id === cycleId ? data : cycle
      ));
      
      // Update current budget cycle if it's the one being updated
      if (currentBudgetCycle && currentBudgetCycle.id === cycleId) {
        setCurrentBudgetCycle(data);
      }
      
      return data;
    } catch (e) {
      setError(e.message || 'Failed to update budget cycle');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteBudgetCycle = async (cycleId) => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      await budgetService.deleteBudgetCycle(cycleId, token);
      
      // Update budget cycles list
      const updatedCycles = budgetCycles.filter(cycle => cycle.id !== cycleId);
      setBudgetCycles(updatedCycles);
      
      // Update current budget cycle if it's the one being deleted
      if (currentBudgetCycle && currentBudgetCycle.id === cycleId) {
        setCurrentBudgetCycle(updatedCycles.length > 0 ? updatedCycles[0] : null);
      }
      
      return true;
    } catch (e) {
      setError(e.message || 'Failed to delete budget cycle');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Transaction Methods
  const fetchTransactions = async (cycleId = null) => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (cycleId) {
        data = await transactionService.getTransactionsByBudgetCycle(cycleId, token);
      } else {
        data = await transactionService.getTransactionsByUser(user.id, token);
      }
      
      setTransactions(data);
      return data;
    } catch (e) {
      setError(e.message || 'Failed to fetch transactions');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transactionData) => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await transactionService.createTransaction({
        ...transactionData,
        userId: user.id
      }, token);
      
      // Update transactions list
      setTransactions([...transactions, data]);
      
      return data;
    } catch (e) {
      setError(e.message || 'Failed to create transaction');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (transactionId, transactionData) => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await transactionService.updateTransaction(transactionId, transactionData, token);
      
      // Update transactions list
      setTransactions(transactions.map(transaction => 
        transaction.id === transactionId ? data : transaction
      ));
      
      return data;
    } catch (e) {
      setError(e.message || 'Failed to update transaction');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (transactionId) => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      await transactionService.deleteTransaction(transactionId, token);
      
      // Update transactions list
      setTransactions(transactions.filter(transaction => transaction.id !== transactionId));
      
      return true;
    } catch (e) {
      setError(e.message || 'Failed to delete transaction');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Recommendation Methods
  const fetchRecommendations = async () => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await recommendationService.getRecommendations(user.id, token);
      setRecommendations(data);
      return data;
    } catch (e) {
      setError(e.message || 'Failed to fetch recommendations');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const approveRecommendation = async (recommendationId) => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await recommendationService.approveRecommendation(recommendationId, token);
      
      // Update recommendations list
      setRecommendations(recommendations.map(recommendation => 
        recommendation.id === recommendationId ? { ...recommendation, approved: true } : recommendation
      ));
      
      return data;
    } catch (e) {
      setError(e.message || 'Failed to approve recommendation');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const delayRecommendation = async (recommendationId) => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await recommendationService.delayRecommendation(recommendationId, token);
      
      // Update recommendations list
      setRecommendations(recommendations.map(recommendation => 
        recommendation.id === recommendationId ? { ...recommendation, delayed: true } : recommendation
      ));
      
      return data;
    } catch (e) {
      setError(e.message || 'Failed to delay recommendation');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Analytics Methods
  const fetchAnalytics = async (cycleId = null) => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get current year
      const year = new Date().getFullYear();
      
      // Fetch all analytics data in parallel
      const [spendingByCategory, monthlySpending, savingsProgress, insights] = await Promise.all([
        analyticsService.getSpendingByCategory(user.id, cycleId, token),
        analyticsService.getMonthlySpending(user.id, year, token),
        analyticsService.getSavingsProgress(user.id, token),
        analyticsService.getBehavioralInsights(user.id, token)
      ]);
      
      const analyticsData = {
        spendingByCategory,
        monthlySpending,
        savingsProgress,
        insights
      };
      
      setAnalytics(analyticsData);
      return analyticsData;
    } catch (e) {
      setError(e.message || 'Failed to fetch analytics');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // The value passed to the provider
  const value = {
    budgetCycles,
    currentBudgetCycle,
    transactions,
    recommendations,
    analytics,
    loading,
    error,
    fetchBudgetCycles,
    createBudgetCycle,
    updateBudgetCycle,
    deleteBudgetCycle,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchRecommendations,
    approveRecommendation,
    delayRecommendation,
    fetchAnalytics,
    setCurrentBudgetCycle
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
