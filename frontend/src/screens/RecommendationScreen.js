import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const RecommendationScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const { recommendations, fetchRecommendations, approveRecommendation, delayRecommendation } = useData();
  const [loading, setLoading] = useState(false);

  // Fetch recommendations when screen loads
  useEffect(() => {
    if (user && token) {
      loadRecommendations();
    }
  }, [user, token]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      await fetchRecommendations();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setLoading(true);
      await approveRecommendation(id);
      Alert.alert('Success', 'Recommendation approved successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to approve recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelay = async (id) => {
    try {
      setLoading(true);
      await delayRecommendation(id);
      Alert.alert('Success', 'Recommendation delayed successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delay recommendation');
    } finally {
      setLoading(false);
    }
  };

  const renderRecommendation = (recommendation) => (
    <View key={recommendation.id} style={styles.recommendationCard}>
      <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
      <Text style={styles.recommendationDescription}>{recommendation.description}</Text>
      
      <View style={styles.reasoningContainer}>
        <Text style={styles.reasoningTitle}>Chain-of-Thought Reasoning:</Text>
        <Text style={styles.reasoningText}>{recommendation.reasoning}</Text>
      </View>
      
      <View style={styles.actionContainer}>
        <Text style={styles.actionTitle}>Recommended Action:</Text>
        <Text style={styles.actionText}>{recommendation.action}</Text>
      </View>
      
      <View style={styles.impactContainer}>
        <Text style={styles.impactTitle}>Financial Impact:</Text>
        <Text style={styles.impactText}>{recommendation.impact}</Text>
      </View>
      
      {recommendation.approved ? (
        <View style={styles.approvedContainer}>
          <Text style={styles.approvedText}>✓ Approved</Text>
          <Text style={styles.approvedDescription}>
            This recommendation has been added to your financial plan
          </Text>
        </View>
      ) : recommendation.delayed ? (
        <View style={styles.delayedContainer}>
          <Text style={styles.delayedText}>Delayed</Text>
          <Text style={styles.delayedDescription}>
            This recommendation has been delayed for later consideration
          </Text>
        </View>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.approveButton}
            onPress={() => handleApprove(recommendation.id)}
            disabled={loading}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.delayButton}
            onPress={() => handleDelay(recommendation.id)}
            disabled={loading}
          >
            <Text style={styles.delayButtonText}>Delay</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>AI Recommendations</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionDescription}>
          Based on your spending patterns and financial goals, our AI has generated the following recommendations:
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading recommendations...</Text>
          </View>
        ) : recommendations && recommendations.length > 0 ? (
          recommendations.map(renderRecommendation)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recommendations available</Text>
            <Text style={styles.emptySubtext}>Add more transactions to get personalized recommendations</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadRecommendations}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>Refresh Recommendations</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    padding: 20,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  recommendationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  reasoningContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  reasoningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionContainer: {
    marginBottom: 15,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  actionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  impactContainer: {
    marginBottom: 20,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  impactText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  delayButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  delayButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  approvedContainer: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  approvedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  approvedDescription: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
  },
  delayedContainer: {
    backgroundColor: '#FFF8E1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  delayedText: {
    color: '#FFA000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  delayedDescription: {
    color: '#FFA000',
    fontSize: 14,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default RecommendationScreen;
