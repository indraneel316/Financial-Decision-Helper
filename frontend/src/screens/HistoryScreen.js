import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HistoryScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCycles, setTotalCycles] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'http://10.0.0.115:5001/api';

  const loadCycles = useCallback(async (pageNum) => {
    if (!hasMore && pageNum !== 1) return;
    if (!user?.userId || !token) {
      Alert.alert('Error', 'Please sign in to view budget cycles');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users/${user.userId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pageNum, limit },
        timeout: 10000,
      });

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid API response');
      }

      const { cycles: newCycles = [], pagination = {} } = response.data;
      if (!Array.isArray(newCycles)) {
        console.warn('API returned non-array cycles:', newCycles);
        throw new Error('Invalid cycles data');
      }

      newCycles.forEach(cycle => {
        console.debug(`Cycle ${cycle.cycleName} has ${cycle.transactions?.length || 0} transactions`, {
          budgetCycleId: cycle.budgetCycleId,
          transactions: cycle.transactions,
        });
      });

      console.debug('API Response:', JSON.stringify({ cycles: newCycles, pagination }, null, 2));

      setCycles(prev => (pageNum === 1 ? newCycles : [...prev, ...newCycles]));
      setTotalCycles(pagination.totalCycles || 0);
      setHasMore(newCycles.length > 0 && (pagination.currentPage || 1) < (pagination.totalPages || 1));
    } catch (error) {
      console.error('Load cycles error:', error.message, error.response?.data);
      Alert.alert('Error', error.message || 'Failed to load budget cycles');
      setCycles([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user, token, hasMore, limit]);

  useEffect(() => {
    loadCycles(page);
  }, [loadCycles, page]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount) => {
    return `$${Number(amount || 0).toFixed(2)}`;
  };

  const renderCycle = ({ item: cycle }) => (
      <View style={styles.recommendationCard}>
        <TouchableOpacity
            activeOpacity={0.8}
            disabled={!cycle.transactions?.length}
            onPress={() => {
              navigation.navigate('TransactionDetails', {
                transactions: cycle.transactions || [],
                cycleName: cycle.cycleName,
                budgetCycleId: cycle.budgetCycleId,
              });
            }}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.recommendationTitle}>{cycle.cycleName}</Text>
            <Ionicons
                name={cycle.transactions?.length ? 'chevron-forward' : 'lock-closed'}
                size={24}
                color={cycle.transactions?.length ? '#666' : '#CCC'}
            />
          </View>
          <Text style={styles.recommendationDescription}>
            From {formatDate(cycle.startDate)} to {formatDate(cycle.endDate)}
          </Text>
          <View style={styles.reasoningContainer}>
            <Text style={styles.reasoningTitle}>Budget Summary</Text>
            <Text style={styles.reasoningText}>
              Spent: {formatAmount(cycle.spentSoFar)} / Allocated: {formatAmount(cycle.totalMoneyAllocation)}
            </Text>
            <Text style={styles.reasoningText}>
              Savings Target: {formatAmount(cycle.savingsTarget)}
            </Text>
          </View>
          <View style={styles.actionContainer}>
            <Text style={styles.actionTitle}>Categories</Text>
            {Object.entries(cycle.categorySpent || {}).map(([category, amount], index) => (
                <Text key={`${cycle.budgetCycleId}-cat-${index}`} style={styles.actionText}>
                  {category}: {formatAmount(amount)}
                </Text>
            ))}
          </View>
          {!cycle.transactions?.length && (
              <Text style={styles.noTransactionsText}>
                No transactions available for this cycle
              </Text>
          )}
        </TouchableOpacity>
      </View>
  );

  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Budget Cycle History</Text>
        </View>

        <FlatList
            data={cycles}
            renderItem={renderCycle}
            keyExtractor={item => item.budgetCycleId}
            contentContainerStyle={styles.scrollContainer}
            ListHeaderComponent={
              <Text style={styles.sectionDescription}>
                View your past budget cycles and their transactions.
              </Text>
            }
            ListEmptyComponent={
              loading && page === 1 ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading budget cycles...</Text>
                  </View>
              ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No past budget cycles available</Text>
                    <Text style={styles.emptySubtext}>
                      Complete a budget cycle to see it here
                    </Text>
                  </View>
              )
            }
            ListFooterComponent={
                hasMore && (
                    <TouchableOpacity
                        style={[styles.loadMoreButton, loading && styles.disabledButton]}
                        onPress={() => !loading && setPage(prev => prev + 1)}
                        disabled={loading}
                    >
                      <Text style={styles.loadMoreButtonText}>
                        {loading ? 'Loading...' : 'Load More'}
                      </Text>
                    </TouchableOpacity>
                )
            }
        />
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    lineHeight: 28,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  sectionDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    lineHeight: 22,
  },
  recommendationDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 15,
    lineHeight: 24,
  },
  reasoningContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    lineHeight: 18,
  },
  reasoningText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    lineHeight: 18,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    lineHeight: 20,
  },
  loadMoreButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  loadMoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 20,
  },
  disabledButton: {
    backgroundColor: '#90CAF9',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    lineHeight: 22,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  noTransactionsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    padding: 10,
    fontStyle: 'italic',
  },
});

export default HistoryScreen;