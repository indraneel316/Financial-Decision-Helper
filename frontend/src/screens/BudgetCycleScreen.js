import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { budgetService, transactionService } from '../services/api';

const cycleDurations = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Biweekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
];

const BudgetCycleScreen = ({ navigation, route }) => {
  const { user, token, setUser } = useAuth();
  const existingCycle = route.params?.cycle;

  console.log('Debug: existingCycle on mount:', existingCycle);
  console.log('Debug: user.cycle on mount:', user?.cycle);

  const initialBudgetData = {
    cycleName: '',
    startDate: new Date().toISOString().split('T')[0],
    budgetCycleDuration: 'monthly',
    totalMoneyAllocation: '',
    savingsTarget: '',
    categories: [
      { name: 'Entertainment', allocation: '', id: '1' },
      { name: 'Groceries', allocation: '', id: '2' },
      { name: 'Utilities', allocation: '', id: '3' },
      { name: 'Commute', allocation: '', id: '4' },
      { name: 'Shopping', allocation: '', id: '5' },
      { name: 'DiningOut', allocation: '', id: '6' },
      { name: 'Medical Expense', allocation: '', id: '7' },
      { name: 'Accommodation', allocation: '', id: '8' },
      { name: 'Vacation', allocation: '', id: '9' },
      { name: 'Other Expenses', allocation: '', id: '10' },
    ],
  };

  const [budgetData, setBudgetData] = useState(
      existingCycle
          ? {
            cycleName: existingCycle.cycleName || '',
            startDate: existingCycle.startDate || new Date().toISOString().split('T')[0],
            budgetCycleDuration: existingCycle.budgetCycleDuration || 'monthly',
            totalMoneyAllocation: existingCycle.totalMoneyAllocation?.toString() || '',
            savingsTarget: existingCycle.savingsTarget?.toString() || '',
            categories: [
              { name: 'Entertainment', allocation: existingCycle.allocatedEntertainment?.toString() || '', id: '1' },
              { name: 'Groceries', allocation: existingCycle.allocatedGroceries?.toString() || '', id: '2' },
              { name: 'Utilities', allocation: existingCycle.allocatedUtilities?.toString() || '', id: '3' },
              { name: 'Commute', allocation: existingCycle.allocatedCommute?.toString() || '', id: '4' },
              { name: 'Shopping', allocation: existingCycle.allocatedShopping?.toString() || '', id: '5' },
              { name: 'DiningOut', allocation: existingCycle.allocatedDiningOut?.toString() || '', id: '6' },
              { name: 'Medical Expense', allocation: existingCycle.allocatedMedicalExpense?.toString() || '', id: '7' },
              { name: 'Accommodation', allocation: existingCycle.allocatedAccommodation?.toString() || '', id: '8' },
              { name: 'Vacation', allocation: existingCycle.allocatedVacation?.toString() || '', id: '9' },
              { name: 'Other Expenses', allocation: existingCycle.allocatedOtherExpenses?.toString() || '', id: '10' },
            ],
          }
          : initialBudgetData
  );

  const [isEditing, setIsEditing] = useState(!!existingCycle);

  useEffect(() => {
    console.log('Debug: useEffect triggered, existingCycle:', existingCycle, 'isEditing:', isEditing);
    if (existingCycle) {
      setIsEditing(true);
      checkTransactions();
    } else {
      setIsEditing(false);
    }
  }, [existingCycle]);

  const handleChange = (field, value) => {
    setBudgetData({ ...budgetData, [field]: value });
  };

  const handleCategoryChange = (id, value) => {
    const updatedCategories = budgetData.categories.map((category) =>
        category.id === id ? { ...category, allocation: value } : category
    );
    setBudgetData({ ...budgetData, categories: updatedCategories });
  };

  const calculateEndDate = () => {
    const start = new Date(budgetData.startDate);
    let endDate = new Date(start);
    switch (budgetData.budgetCycleDuration) {
      case 'weekly':
        endDate.setDate(start.getDate() + 7);
        break;
      case 'biweekly':
        endDate.setDate(start.getDate() + 14);
        break;
      case 'monthly':
        endDate.setMonth(start.getMonth() + 1);
        break;
      default:
        endDate.setMonth(start.getMonth() + 1);
    }
    return endDate.toISOString().split('T')[0];
  };

  const calculateRemainingBudget = () => {
    const totalMoneyAllocation = parseFloat(budgetData.totalMoneyAllocation) || 0;
    const allocatedAmount = budgetData.categories.reduce(
        (sum, category) => sum + (parseFloat(category.allocation) || 0),
        0
    );
    return totalMoneyAllocation - allocatedAmount;
  };

  const checkTransactions = async () => {
    if (!existingCycle) return false;
    try {
      const transactions = await transactionService.getTransactionsByBudgetCycle(existingCycle.budgetCycleId, token);
      console.log('Debug: checkTransactions result:', transactions.length > 0);
      return transactions.length > 0;
    } catch (error) {
      console.error('Error checking transactions:', error);
      return false;
    }
  };

  const hasActiveCycle = () => {
    if (!user.cycle || !Array.isArray(user.cycle)) return false;
    const currentDate = new Date();
    return user.cycle.some((cycle) => new Date(cycle.endDate) > currentDate);
  };

  const getActiveCycle = () => {
    if (!user.cycle || !Array.isArray(user.cycle)) {
      console.log('Debug: getActiveCycle - no user.cycle or not an array:', user.cycle);
      return null;
    }
    const currentDate = new Date();
    const activeCycle = user.cycle.find((cycle) => {
      // Handle malformed cycle entries (e.g., { budget: {...} })
      const cycleData = cycle.budget || cycle;
      return cycleData.endDate && new Date(cycleData.endDate) > currentDate;
    });
    console.log('Debug: getActiveCycle - result:', activeCycle ? (activeCycle.budget || activeCycle) : null);
    return activeCycle ? (activeCycle.budget || activeCycle) : null;
  };

  const handleSaveBudget = async () => {
    console.log('Debug: handleSaveBudget - start, isEditing:', isEditing, 'budgetData:', budgetData);
    if (!isEditing && hasActiveCycle()) {
      Alert.alert('Error', 'You cannot create a new budget cycle while an active one exists.');
      return;
    }

    if (!budgetData.cycleName || !budgetData.totalMoneyAllocation || !budgetData.savingsTarget) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Cycle Name, Total Money Allocation, and Savings Target)');
      return;
    }

    const totalMoneyAllocation = parseFloat(budgetData.totalMoneyAllocation) || 0;
    const savingsTarget = parseFloat(budgetData.savingsTarget) || 0;
    const allocatedAmount = budgetData.categories.reduce(
        (sum, category) => sum + (parseFloat(category.allocation) || 0),
        0
    );

    if (totalMoneyAllocation <= 0) {
      Alert.alert('Invalid Input', 'Total Money Allocation must be greater than zero.');
      return;
    }

    if (savingsTarget < 0) {
      Alert.alert('Invalid Input', 'Savings Target cannot be negative.');
      return;
    }

    if (savingsTarget > totalMoneyAllocation) {
      Alert.alert('Invalid Input', 'Savings Target cannot exceed Total Money Allocation.');
      return;
    }

    if (allocatedAmount > totalMoneyAllocation) {
      Alert.alert('Budget Exceeded', 'The sum of category allocations exceeds the total money allocation.');
      return;
    }

    try {
      const startDate = new Date(budgetData.startDate);
      if (isNaN(startDate.getTime())) throw new Error('Invalid startDate');

      const endDate = calculateEndDate();

      const categoryAllocations = budgetData.categories.reduce((acc, cat) => {
        const key = `allocated${cat.name.replace(/\s+/g, '')}`;
        const value = parseFloat(cat.allocation) || 0;
        acc[key] = value;
        return acc;
      }, {});

      const budgetToSave = {
        userId: user.userId,
        cycleName: budgetData.cycleName,
        budgetCycleDuration: budgetData.budgetCycleDuration,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate,
        totalMoneyAllocation,
        savingsTarget,
        ...categoryAllocations,
      };

      let updatedCycle;

      if (isEditing && existingCycle) {
        budgetToSave.budgetCycleId = existingCycle.budgetCycleId;
        const hasTransactions = await checkTransactions();
        if (hasTransactions) {
          Alert.alert('Warning', 'This cycle has transactions. Only name, savings target, and allocations can be edited.');
          delete budgetToSave.startDate;
          delete budgetToSave.endDate;
        }
        const response = await budgetService.updateBudgetCycle(budgetToSave.budgetCycleId, budgetToSave, token);
        updatedCycle = response.budget || response; // Extract flat cycle object
        console.log('Debug: handleSaveBudget - updatedCycle:', updatedCycle);
      } else {
        budgetToSave.budgetCycleId = Date.now().toString();
        const response = await budgetService.createBudgetCycle(budgetToSave, token);
        updatedCycle = response.budget || response; // Extract flat cycle object
        console.log('Debug: handleSaveBudget - createdCycle:', updatedCycle);
      }

      // Ensure updatedCycle is a flat object
      if (!updatedCycle.budgetCycleId) {
        throw new Error('Invalid cycle data returned from API');
      }

      // Replace the old cycle or append the new one
      const updatedUser = {
        ...user,
        cycle: user.cycle && Array.isArray(user.cycle)
            ? [
              ...user.cycle.filter(c => c.budgetCycleId !== updatedCycle.budgetCycleId),
              updatedCycle
            ]
            : [updatedCycle],
      };

      console.log('Debug: handleSaveBudget - updatedUser.cycle:', updatedUser.cycle);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('Debug: handleSaveBudget - AsyncStorage saved');
      const storedUser = await AsyncStorage.getItem('user');
      console.log('Debug: handleSaveBudget - AsyncStorage verify user.cycle:', JSON.parse(storedUser).cycle);

      setUser(updatedUser);
      console.log('Debug: handleSaveBudget - setUser called');
      setIsEditing(false);
      console.log('Debug: handleSaveBudget - setIsEditing(false) called');
      navigation.setParams({ cycle: null });
      console.log('Debug: handleSaveBudget - navigation.setParams called');

      Alert.alert('Success', `Budget cycle ${isEditing ? 'updated' : 'created'} successfully`, [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error) {
      console.error('Debug: handleSaveBudget - error:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'save'} budget cycle: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteBudget = async (cycleId) => {
    Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this budget cycle?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const activeCycle = getActiveCycle();
                const idToDelete = cycleId || (activeCycle && activeCycle.budgetCycleId);
                if (!idToDelete) {
                  Alert.alert('Error', 'No budget cycle ID available to delete.');
                  return;
                }

                const transactions = await transactionService.getTransactionsByBudgetCycle(idToDelete, token);
                if (transactions.length > 0) {
                  Alert.alert('Error', 'Cannot delete a cycle with transactions.');
                  return;
                }
                await budgetService.deleteBudgetCycle(idToDelete, token);

                const updatedCycles = user.cycle.filter((cycle) => cycle.budgetCycleId !== idToDelete);
                const updatedUser = { ...user, cycle: updatedCycles };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);

                setBudgetData(initialBudgetData);
                setIsEditing(false);
                navigation.setParams({ cycle: null });

                Alert.alert('Success', 'Budget cycle deleted successfully', [
                  { text: 'OK', onPress: () => navigation.navigate('Home') },
                ]);
              } catch (error) {
                console.error('Error deleting budget cycle:', error);
                Alert.alert('Error', 'Delete failed: ' + (error.message || 'An unknown error occurred'));
              }
            },
          },
        ]
    );
  };

  const handleEditActiveCycle = () => {
    const activeCycle = getActiveCycle();
    if (activeCycle) {
      setBudgetData({
        cycleName: activeCycle.cycleName || '',
        startDate: activeCycle.startDate || new Date().toISOString().split('T')[0],
        budgetCycleDuration: activeCycle.budgetCycleDuration || 'monthly',
        totalMoneyAllocation: activeCycle.totalMoneyAllocation?.toString() || '',
        savingsTarget: activeCycle.savingsTarget?.toString() || '',
        categories: [
          { name: 'Entertainment', allocation: activeCycle.allocatedEntertainment?.toString() || '', id: '1' },
          { name: 'Groceries', allocation: activeCycle.allocatedGroceries?.toString() || '', id: '2' },
          { name: 'Utilities', allocation: activeCycle.allocatedUtilities?.toString() || '', id: '3' },
          { name: 'Commute', allocation: activeCycle.allocatedCommute?.toString() || '', id: '4' },
          { name: 'Shopping', allocation: activeCycle.allocatedShopping?.toString() || '', id: '5' },
          { name: 'DiningOut', allocation: activeCycle.allocatedDiningOut?.toString() || '', id: '6' },
          { name: 'Medical Expense', allocation: activeCycle.allocatedMedicalExpense?.toString() || '', id: '7' },
          { name: 'Accommodation', allocation: activeCycle.allocatedAccommodation?.toString() || '', id: '8' },
          { name: 'Vacation', allocation: activeCycle.allocatedVacation?.toString() || '', id: '9' },
          { name: 'Other Expenses', allocation: activeCycle.allocatedOtherExpenses?.toString() || '', id: '10' },
        ],
      });
      setIsEditing(true);
      navigation.setParams({ cycle: activeCycle });
      console.log('Debug: handleEditActiveCycle, set isEditing true, cycle:', activeCycle);
    }
  };

  const activeCycle = getActiveCycle();

  const renderActiveCycle = () => {
    if (!activeCycle) {
      console.log('Debug: renderActiveCycle - no activeCycle');
      return null;
    }

    console.log('Debug: renderActiveCycle - rendering with activeCycle:', activeCycle);

    const categories = [
      { name: 'Entertainment', value: activeCycle.allocatedEntertainment || 0 },
      { name: 'Groceries', value: activeCycle.allocatedGroceries || 0 },
      { name: 'Utilities', value: activeCycle.allocatedUtilities || 0 },
      { name: 'Commute', value: activeCycle.allocatedCommute || 0 },
      { name: 'Shopping', value: activeCycle.allocatedShopping || 0 },
      { name: 'DiningOut', value: activeCycle.allocatedDiningOut || 0 },
      { name: 'Medical Expense', value: activeCycle.allocatedMedicalExpense || 0 },
      { name: 'Accommodation', value: activeCycle.allocatedAccommodation || 0 },
      { name: 'Vacation', value: activeCycle.allocatedVacation || 0 },
      { name: 'Other Expenses', value: activeCycle.allocatedOtherExpenses || 0 },
    ];

    const totalAllocated = categories.reduce((sum, cat) => sum + cat.value, 0);
    const remaining = activeCycle.totalMoneyAllocation - totalAllocated;

    return (
        <View style={styles.activeCycleContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.activeCycleTitle}>{activeCycle.cycleName}</Text>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={handleEditActiveCycle} style={styles.iconButton}>
                <Icon name="edit" size={24} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteBudget(activeCycle.budgetCycleId)} style={styles.iconButton}>
                <Icon name="delete" size={24} color="#E53935" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.activeCycleSubtitle}>Your Current Budget Cycle</Text>

          <View style={styles.activeCycleCard}>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Duration:</Text>
              <Text style={styles.activeCycleValue}>{activeCycle.budgetCycleDuration}</Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Start Date:</Text>
              <Text style={styles.activeCycleValue}>{activeCycle.startDate}</Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>End Date:</Text>
              <Text style={styles.activeCycleValue}>{activeCycle.endDate}</Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Total Budget:</Text>
              <Text style={styles.activeCycleValue}>${activeCycle.totalMoneyAllocation.toFixed(2)}</Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Savings Goal:</Text>
              <Text style={styles.activeCycleValue}>${activeCycle.savingsTarget.toFixed(2)}</Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Allocated:</Text>
              <Text style={styles.activeCycleValue}>${totalAllocated.toFixed(2)}</Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Remaining:</Text>
              <Text
                  style={[
                    styles.activeCycleValue,
                    { color: remaining < 0 ? '#E53935' : '#4CAF50' },
                  ]}
              >
                ${remaining.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.activeCycleCard}>
            <Text style={styles.activeCycleSectionTitle}>Category Allocations</Text>
            {categories.map((cat, index) => (
                <View key={index} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryValue}>${cat.value.toFixed(2)}</Text>
                </View>
            ))}
          </View>

          <Text style={styles.activeCycleFooter}>
            This cycle is active until {activeCycle.endDate}.
          </Text>
        </View>
    );
  };

  console.log('Debug: Before render, activeCycle:', activeCycle, 'isEditing:', isEditing);
  console.log('Debug: Render condition (activeCycle && !isEditing):', activeCycle && !isEditing);

  return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.screenTitle}>
            {isEditing ? 'Edit Budget Cycle' : activeCycle ? 'Active Budget Cycle' : 'Create Budget Cycle'}
          </Text>

          {activeCycle && !isEditing ? (
              renderActiveCycle()
          ) : (
              <>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Budget Cycle Details</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Cycle Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., May 2025"
                        value={budgetData.cycleName}
                        onChangeText={(text) => handleChange('cycleName', text)}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Start Date</Text>
                    <Text style={styles.staticText}>{budgetData.startDate}</Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Cycle Duration</Text>
                    <RNPickerSelect
                        onValueChange={(value) => handleChange('budgetCycleDuration', value)}
                        items={cycleDurations}
                        value={budgetData.budgetCycleDuration}
                        style={pickerSelectStyles}
                        placeholder={{ label: 'Select duration...', value: null }}
                        useNativeAndroidPickerStyle={false}
                        textInputProps={{ underlineColorAndroid: 'transparent' }}
                        doneText="Done"
                        disabled={isEditing}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Total Money Allocation</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter amount"
                        keyboardType="numeric"
                        value={budgetData.totalMoneyAllocation}
                        onChangeText={(text) => handleChange('totalMoneyAllocation', text)}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Savings Target</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter savings goal"
                        keyboardType="numeric"
                        value={budgetData.savingsTarget}
                        onChangeText={(text) => handleChange('savingsTarget', text)}
                    />
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Budget Categories</Text>
                  <Text style={styles.description}>
                    Allocate your total budget across spending categories. Savings will come from spending less than allocated.
                  </Text>
                  {budgetData.categories.map((category) => (
                      <View key={category.id} style={styles.categoryContainer}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <TextInput
                            style={styles.categoryInput}
                            placeholder="0"
                            keyboardType="numeric"
                            value={category.allocation}
                            onChangeText={(text) => handleCategoryChange(category.id, text)}
                        />
                      </View>
                  ))}
                  <View style={styles.summaryContainer}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total Money Allocation:</Text>
                      <Text style={styles.summaryValue}>
                        ${parseFloat(budgetData.totalMoneyAllocation || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Allocated:</Text>
                      <Text style={styles.summaryValue}>
                        ${budgetData.categories
                          .reduce((sum, category) => sum + (parseFloat(category.allocation) || 0), 0)
                          .toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Savings Target:</Text>
                      <Text style={styles.summaryValue}>
                        ${parseFloat(budgetData.savingsTarget || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Remaining to Allocate:</Text>
                      <Text
                          style={[
                            styles.summaryValue,
                            { color: calculateRemainingBudget() < 0 ? '#E53935' : '#4CAF50' },
                          ]}
                      >
                        ${calculateRemainingBudget().toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveBudget}>
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Update Budget Cycle' : 'Save Budget Cycle'}
                  </Text>
                </TouchableOpacity>

                {isEditing && existingCycle && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteBudget(existingCycle.budgetCycleId)}
                    >
                      <Text style={styles.deleteButtonText}>Delete Budget Cycle</Text>
                    </TouchableOpacity>
                )}
              </>
          )}
        </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  card: {
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
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
  staticText: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  categoryInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 10,
    width: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    textAlign: 'right',
  },
  summaryContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#E53935',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  activeCycleContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  activeCycleTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  iconContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },
  activeCycleSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  activeCycleCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeCycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  activeCycleLabel: {
    fontSize: 16,
    color: '#666',
  },
  activeCycleValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activeCycleSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
  },
  activeCycleFooter: {
    fontSize: 14,
    color: '#E53935',
    textAlign: 'center',
    marginTop: 10,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    color: '#333',
  },
  inputAndroid: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
});

export default BudgetCycleScreen;