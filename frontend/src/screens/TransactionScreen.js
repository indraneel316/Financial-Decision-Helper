import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const TransactionScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const { 
    transactions, 
    fetchTransactions, 
    createTransaction, 
    currentBudgetCycle 
  } = useData();
  
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: '',
  });
  
  const categories = [
    'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Other'
  ];
  
  // Fetch transactions when screen loads
  useEffect(() => {
    if (user && token) {
      fetchTransactions(currentBudgetCycle?.id);
    }
  }, [user, token, currentBudgetCycle]);
  
  const handleChange = (field, value) => {
    setNewTransaction({ ...newTransaction, [field]: value });
  };
  
  const handleAddTransaction = async () => {
    // Validate transaction data
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.date) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    
    try {
      // Add new transaction
      await createTransaction({
        ...newTransaction,
        budgetCycleId: currentBudgetCycle?.id,
        amount: parseFloat(newTransaction.amount)
      });
      
      // Reset form and close add transaction panel
      setNewTransaction({
        description: '',
        amount: '',
        category: 'Food',
        date: '',
      });
      setIsAddingTransaction(false);
      
      // Show success message
      Alert.alert('Success', 'Transaction added successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add transaction');
    }
  };
  
  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionAmount}>-${parseFloat(item.amount).toFixed(2)}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Transactions</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddingTransaction(!isAddingTransaction)}
        >
          <Text style={styles.addButtonText}>
            {isAddingTransaction ? 'Cancel' : '+ Add'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {isAddingTransaction ? (
        <View style={styles.addTransactionContainer}>
          <Text style={styles.sectionTitle}>Add New Transaction</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="What did you spend on?"
              value={newTransaction.description}
              onChangeText={(text) => handleChange('description', text)}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={newTransaction.amount}
              onChangeText={(text) => handleChange('amount', text)}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    newTransaction.category === category && styles.categoryButtonActive
                  ]}
                  onPress={() => handleChange('category', category)}
                >
                  <Text 
                    style={[
                      styles.categoryButtonText,
                      newTransaction.category === category && styles.categoryButtonTextActive
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/DD/YYYY"
              value={newTransaction.date}
              onChangeText={(text) => handleChange('date', text)}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleAddTransaction}
          >
            <Text style={styles.saveButtonText}>Save Transaction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.transactionList}>
          {transactions.length > 0 ? (
            transactions.map((transaction) => renderTransactionItem({ item: transaction }))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Add your first transaction to get started</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  addTransactionContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  categoryList: {
    paddingVertical: 5,
  },
  categoryButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
  },
  categoryButtonText: {
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#FFF',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionList: {
    padding: 15,
  },
  transactionItem: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E53935',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  transactionDate: {
    fontSize: 14,
    color: '#888',
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

export default TransactionScreen;
