import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>John</Text>
      </View>

      <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
      </TouchableOpacity>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Budget Cycle</Text>
        <Text style={styles.balanceTitle}>March 2025</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceValue}>$1,500</Text>
            <Text style={styles.balanceDescription}>Total Budget</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceValue}>$850</Text>
            <Text style={styles.balanceDescription}>Spent</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceValue}>$650</Text>
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
          onPress={() => navigation.navigate('Recommendations')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.menuIconText}>💡</Text>
          </View>
          <Text style={styles.menuText}>Recommendations</Text>
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
          <View style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionName}>Grocery Shopping</Text>
              <Text style={styles.transactionCategory}>Food</Text>
            </View>
            <Text style={styles.transactionAmount}>-$45.67</Text>
          </View>

          <View style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionName}>Gas Station</Text>
              <Text style={styles.transactionCategory}>Transportation</Text>
            </View>
            <Text style={styles.transactionAmount}>-$35.00</Text>
          </View>

          <View style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionName}>Movie Tickets</Text>
              <Text style={styles.transactionCategory}>Entertainment</Text>
            </View>
            <Text style={styles.transactionAmount}>-$24.99</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addTransactionButton}
        onPress={() => navigation.navigate('Transactions')}
      >
        <Text style={styles.addTransactionButtonText}>+ Add Transaction</Text>
      </TouchableOpacity>
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
    paddingBottom: 10,
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
  addTransactionButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    marginTop: 5,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },

  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
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
  addTransactionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
