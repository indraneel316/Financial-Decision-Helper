import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HomeScreen = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchRef = useRef(null);

  const API_BASE_URL = 'http://10.0.0.115:5001/api';

  const fetchData = async (isFocusRefresh = false) => {
    if (!user?.userId) {
      setError('User not authenticated.');
      console.log('Fetch aborted: No user');
      setIsInitialLoading(false);
      return;
    }

    if (!user?.cycle?.[0]?.budgetCycleId) {
      setIsInitialLoading(false);
      setError(null);
      setTransactions([]);
      setAnalytics(null);
      return;
    }

    const fetchId = Date.now();
    fetchRef.current = fetchId;

    try {
      console.log(`Starting fetch (ID: ${fetchId}, isFocusRefresh: ${isFocusRefresh})`);
      if (!isFocusRefresh) {
        setIsInitialLoading(true);
      }

      const budgetCycleId = user.cycle[0].budgetCycleId;

      const promises = [
        axios.get(`${API_BASE_URL}/budget-cycles/${budgetCycleId}`).catch(err => ({
          error: err,
          data: null,
        })),
        axios.get(`${API_BASE_URL}/transactions/budget-cycle/${budgetCycleId}`).catch(err => ({
          error: err,
          data: null,
        })),
        axios.get(`${API_BASE_URL}/users/${user.userId}/analytics/`).catch(err => ({
          error: err,
          data: null,
        })),
      ];

      const [budgetCycleResult, transactionsResult, analyticsResult] = await Promise.all(promises);

      if (fetchRef.current !== fetchId) {
        console.log(`Fetch ${fetchId} aborted: Superseded by newer fetch`);
        return;
      }

      if (budgetCycleResult.error) {
        console.error('Budget cycle fetch error:', budgetCycleResult.error);
      } else {
        const updatedBudgetCycle = budgetCycleResult.data;
        setUser(prev => ({
          ...prev,
          cycle: [updatedBudgetCycle],
        }));
      }

      if (transactionsResult.error) {
        console.error('Transactions fetch error:', transactionsResult.error);
      } else {
        let fetchedTransactions = Array.isArray(transactionsResult.data)
            ? transactionsResult.data
            : transactionsResult.data.transactions && Array.isArray(transactionsResult.data.transactions)
                ? transactionsResult.data.transactions
                : [];


        const mappedTransactions = fetchedTransactions.map(txn => ({
          description: txn.purchaseDescription || 'Transaction',
          category: txn.purchaseCategory || 'Other',
          amount: txn.purchaseAmount || 0,
          isTransactionPerformedAfterRecommendation: txn.isTransactionPerformedAfterRecommendation === 'yes',
          updatedAt: txn.updatedAt || new Date().toISOString(),
        }));

        const sortedTransactions = mappedTransactions
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 3);
        setTransactions(sortedTransactions);
      }

      if (analyticsResult.error) {
        console.error('Analytics fetch error:', analyticsResult.error);
      } else {
        setAnalytics(analyticsResult.data);
      }


      if (budgetCycleResult.error && transactionsResult.error && analyticsResult.error) {
        setError('Failed to load data. Please try again.');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected fetch error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError('Failed to load data. Please try again.');
    } finally {
      if (fetchRef.current === fetchId) {
        setIsInitialLoading(false);
      }
    }
  };

  const debouncedFetch = useCallback(() => {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fetchData(true), 300);
    };
  }, [user?.userId, user?.cycle?.[0]?.budgetCycleId]);

  useEffect(() => {
    fetchData();
  }, [user?.userId, user?.cycle?.[0]?.budgetCycleId]);

  useFocusEffect(
      useCallback(() => {
        const fetch = debouncedFetch();
        fetch();
        return () => {
          fetchRef.current = null;
        };
      }, [debouncedFetch])
  );

  const getFirstName = (email) => {
    if (!email) return 'User';
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const formatCurrency = (amount, currency) => {
    return `${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getCycleDate = () => {
    return user.cycle?.[0].cycleName || 'Current Cycle';
  };

  const calculateRemaining = (total, spent) => {
    return (parseFloat(total || 0) - parseFloat(spent || 0)).toFixed(2);
  };

  const getTransactionCategory = (category) => {
    const categories = {
      Groceries: 'Food',
      Entertainment: 'Entertainment',
      Transportation: 'Transportation',
      Utilities: 'Utilities',
      Shopping: 'Shopping',
      DiningOut: 'Dining Out',
      MedicalExpenses: 'Medical',
      Accommodation: 'Accommodation',
      Vacation: 'Vacation',
      OtherExpenses: 'Other'
    };
    return categories[category] || category;
  };

  if (isInitialLoading) {
    return (
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </SafeAreaView>
    );
  }

  if (!user?.userId) {
    return (
        <SafeAreaView style={styles.container}>
          <Text style={styles.errorText}>User not authenticated.</Text>
        </SafeAreaView>
    );
  }

  const hasBudgetCycle = !!user?.cycle?.[0];
  const firstName = getFirstName(user.email);

  if (!hasBudgetCycle) {
    return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>{firstName}</Text>
              </View>
              <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => navigation.navigate('Settings')}
              >
                <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.noCycleContainer}>
              <Text style={styles.noCycleText}>
                You don’t have a budget cycle yet. Create one to start tracking your finances!
              </Text>
              <TouchableOpacity
                  style={styles.createCycleButton}
                  onPress={() => navigation.navigate('BudgetCycle')}
              >
                <Text style={styles.createCycleButtonText}>Create Budget Cycle</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuGrid}>
              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate('Transactions')}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={styles.menuIconText}>💰</Text>
                </View>
                <Text style={styles.menuText}>Transactions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate('BudgetCycle')}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={styles.menuIconText}>📅</Text>
                </View>
                <Text style={styles.menuText}>Budget Cycle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate('History')}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="time-outline" size={24} color="#333" />
                </View>
                <Text style={styles.menuText}>History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigation.navigate('Analytics')}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Text style={styles.menuIconText}>📊</Text>
                </View>
                <Text style={styles.menuText}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
    );
  }

  const budgetCycle = user.cycle[0];
  const totalBudget = budgetCycle.totalMoneyAllocation;
  const spent = budgetCycle.spentSoFar;
  const remaining = calculateRemaining(totalBudget, spent);
  const currency = budgetCycle.currency || 'AUD';
  const cycleDate = getCycleDate();

  return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
            <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Budget Cycle</Text>
            <Text style={styles.balanceTitle}>{cycleDate}</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceValue}>{formatCurrency(totalBudget, currency)}</Text>
                <Text style={styles.balanceDescription}>Total Budget</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceValue}>{formatCurrency(spent, currency)}</Text>
                <Text style={styles.balanceDescription}>Spent</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceValue}>{formatCurrency(remaining, currency)}</Text>
                <Text style={styles.balanceDescription}>Remaining</Text>
              </View>
            </View>
          </View>

          <View style={styles.menuGrid}>
            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Transactions')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.menuIconText}>💰</Text>
              </View>
              <Text style={styles.menuText}>Transactions</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('BudgetCycle')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.menuIconText}>📅</Text>
              </View>
              <Text style={styles.menuText}>Budget Cycle</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('History')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="time-outline" size={24} color="#333" />
              </View>
              <Text style={styles.menuText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Analytics')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#F3E5F5' }]}>
                <Text style={styles.menuIconText}>📊</Text>
              </View>
              <Text style={styles.menuText}>Analytics</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentTransactionsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionList}>
              {transactions.length > 0 ? (
                  transactions.map((txn, index) => (
                      <View key={index} style={styles.transactionItem}>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionName}>{txn.description}</Text>
                          <Text style={styles.transactionCategory}>
                            {getTransactionCategory(txn.category)}
                            {txn.isTransactionPerformedAfterRecommendation ? ' (Post-Recommendation)' : ''}
                          </Text>
                        </View>
                        <Text style={styles.transactionAmount}>-{formatCurrency(txn.amount, currency)}</Text>
                      </View>
                  ))
              ) : (
                  <Text style={styles.noTransactionsText}>No recent transactions</Text>
              )}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 30,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  noCycleContainer: {
    margin: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noCycleText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  createCycleButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createCycleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#4CAF50',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  balanceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  balanceDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recentTransactionsContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    marginTop: 5,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  transactionList: {
    marginTop: 5,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935',
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    textAlign: 'center',
    marginVertical: 20,
  },
  noTransactionsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default HomeScreen;