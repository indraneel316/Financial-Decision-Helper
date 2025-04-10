import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';

// Mock data for analytics
const mockData = {
  spendingByCategory: [
    { category: 'Food', amount: 450, percentage: 30 },
    { category: 'Transportation', amount: 200, percentage: 13.33 },
    { category: 'Entertainment', amount: 150, percentage: 10 },
    { category: 'Utilities', amount: 300, percentage: 20 },
    { category: 'Shopping', amount: 400, percentage: 26.67 },
  ],
  monthlySpending: [
    { month: 'Jan', amount: 1200 },
    { month: 'Feb', amount: 1350 },
    { month: 'Mar', amount: 1500 },
    { month: 'Apr', amount: 1400 },
    { month: 'May', amount: 1300 },
    { month: 'Jun', amount: 1450 },
  ],
  savingsProgress: {
    goal: 5000,
    current: 3200,
    percentage: 64,
  },
  insights: [
    {
      id: '1',
      title: 'Food Spending Trend',
      description: 'Your food spending has increased by 15% compared to last month.',
    },
    {
      id: '2',
      title: 'Savings Goal Progress',
      description: 'You\'re on track to reach your savings goal in 3 months.',
    },
    {
      id: '3',
      title: 'Spending Pattern',
      description: 'You tend to spend more on weekends, especially on entertainment.',
    },
  ],
};

const AnalyticsScreen = ({ navigation }) => {
  const screenWidth = Dimensions.get('window').width;
  
  // Render bar for spending by category
  const renderCategoryBar = (category, percentage, index) => {
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336'];
    return (
      <View key={index} style={styles.categoryItem}>
        <View style={styles.categoryLabelContainer}>
          <Text style={styles.categoryLabel}>{category.category}</Text>
          <Text style={styles.categoryAmount}>${category.amount}</Text>
        </View>
        <View style={styles.barContainer}>
          <View 
            style={[
              styles.bar, 
              { 
                width: `${category.percentage}%`,
                backgroundColor: colors[index % colors.length],
              }
            ]} 
          />
        </View>
        <Text style={styles.percentage}>{category.percentage.toFixed(1)}%</Text>
      </View>
    );
  };

  // Render monthly spending bars
  const renderMonthlyBar = (month, index) => {
    const maxAmount = Math.max(...mockData.monthlySpending.map(m => m.amount));
    const percentage = (month.amount / maxAmount) * 100;
    
    return (
      <View key={index} style={styles.monthItem}>
        <View style={styles.monthBarContainer}>
          <View 
            style={[
              styles.monthBar, 
              { height: `${percentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.monthLabel}>{month.month}</Text>
        <Text style={styles.monthAmount}>${month.amount}</Text>
      </View>
    );
  };

  // Render savings progress
  const renderSavingsProgress = () => {
    const { goal, current, percentage } = mockData.savingsProgress;
    
    return (
      <View style={styles.savingsContainer}>
        <View style={styles.savingsTextContainer}>
          <Text style={styles.savingsTitle}>Savings Goal Progress</Text>
          <Text style={styles.savingsAmount}>${current} / ${goal}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar,
              { width: `${percentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressPercentage}>{percentage}% Complete</Text>
      </View>
    );
  };

  // Render insights
  const renderInsights = () => {
    return mockData.insights.map((insight, index) => (
      <View key={index} style={styles.insightItem}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Analytics</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.categoryContainer}>
            {mockData.spendingByCategory.map((category, index) => 
              renderCategoryBar(category, category.percentage, index)
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Spending</Text>
          <View style={styles.monthlyContainer}>
            {mockData.monthlySpending.map((month, index) => 
              renderMonthlyBar(month, index)
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          {renderSavingsProgress()}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightsContainer}>
            {renderInsights()}
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
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoryContainer: {
    marginTop: 10,
  },
  categoryItem: {
    marginBottom: 15,
  },
  categoryLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#555',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  barContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
  },
  percentage: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
    textAlign: 'right',
  },
  monthlyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    marginTop: 20,
  },
  monthItem: {
    alignItems: 'center',
    flex: 1,
  },
  monthBarContainer: {
    width: 20,
    height: 150,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  monthBar: {
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  monthLabel: {
    fontSize: 12,
    color: '#555',
    marginTop: 5,
  },
  monthAmount: {
    fontSize: 10,
    color: '#888',
  },
  savingsContainer: {
    alignItems: 'center',
  },
  savingsTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  savingsAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  progressBarContainer: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
    width: '100%',
  },
  insightsContainer: {
    marginTop: 10,
  },
  insightItem: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default AnalyticsScreen;
