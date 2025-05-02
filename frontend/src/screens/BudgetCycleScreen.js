import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
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

// Currency formatting function with error handling
const formatCurrency = (amount, currency) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(isNaN(amount) ? 0 : amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(isNaN(amount) ? 0 : amount);
  }
};

const BudgetCycleScreen = ({ navigation, route }) => {
  const { user, token, setUser } = useAuth();
  const existingCycle = route.params?.cycle;

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
      { name: 'Medical Expenses', allocation: '', id: '7' },
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
              { name: 'Medical Expenses', allocation: existingCycle.allocatedMedicalExpenses?.toString() || '', id: '7' },
              { name: 'Accommodation', allocation: existingCycle.allocatedAccommodation?.toString() || '', id: '8' },
              { name: 'Vacation', allocation: existingCycle.allocatedVacation?.toString() || '', id: '9' },
              { name: 'Other Expenses', allocation: existingCycle.allocatedOtherExpenses?.toString() || '', id: '10' },
            ],
          }
          : initialBudgetData
  );

  const [isEditing, setIsEditing] = useState(!!existingCycle);
  const [expandedSections, setExpandedSections] = useState({ details: true, categories: true });
  const [detailsContentHeight, setDetailsContentHeight] = useState(0);
  const [categoriesContentHeight, setCategoriesContentHeight] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const detailsHeight = useRef(new Animated.Value(1)).current;
  const categoriesHeight = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

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

  const toggleSection = (section) => {
    const isExpanded = expandedSections[section];
    setExpandedSections((prev) => ({ ...prev, [section]: !isExpanded }));
    Animated.timing(section === 'details' ? detailsHeight : categoriesHeight, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const calculateEndDate = () => {
    try {
      const start = new Date(budgetData.startDate);
      if (isNaN(start.getTime())) throw new Error('Invalid start date');
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
    } catch (error) {
      console.error('Error calculating end date:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  const calculateRemainingBudget = () => {
    const totalMoneyAllocation = parseFloat(budgetData.totalMoneyAllocation) || 0;
    const allocatedAmount = budgetData.categories.reduce(
        (sum, category) => sum + (parseFloat(category.allocation) || 0),
        0
    );
    return totalMoneyAllocation - allocatedAmount;
  };

  const calculateProgress = () => {
    const total = parseFloat(budgetData.totalMoneyAllocation) || 0;
    const allocated = budgetData.categories.reduce(
        (sum, category) => sum + (parseFloat(category.allocation) || 0),
        0
    );
    return total > 0 ? (allocated / total) * 100 : 0;
  };

  const checkTransactions = async () => {
    if (!existingCycle) return false;
    try {
      const transactions = await transactionService.getTransactionsByBudgetCycle(existingCycle.budgetCycleId, token);
      return Array.isArray(transactions) && transactions.length > 0;
    } catch (error) {
      console.error('Error checking transactions:', error);
      return false;
    }
  };

  const hasActiveCycle = () => {
    if (!user?.cycle || !Array.isArray(user.cycle)) return false;
    const currentDate = new Date();
    return user.cycle.some((cycle) => {
      try {
        return new Date(cycle.endDate) > currentDate;
      } catch {
        return false;
      }
    });
  };

  const getActiveCycle = () => {
    if (!user?.cycle || !Array.isArray(user.cycle)) return null;
    const currentDate = new Date();
    const activeCycle = user.cycle.find((cycle) => {
      const cycleData = cycle.budget || cycle;
      try {
        return cycleData.endDate && new Date(cycleData.endDate) > currentDate;
      } catch {
        return false;
      }
    });
    return activeCycle ? (activeCycle.budget || activeCycle) : null;
  };

  const handleSaveBudget = async () => {
    if (!isEditing && hasActiveCycle()) {
      Alert.alert('Error', 'You cannot create a new budget cycle while an active one exists.');
      return;
    }

    if (!budgetData.cycleName || !budgetData.totalMoneyAllocation || !budgetData.savingsTarget) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Cycle Name, Total Money Allocation, and Savings Target).');
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
      if (isNaN(startDate.getTime())) throw new Error('Invalid start date');

      const endDate = calculateEndDate();

      const categoryAllocations = budgetData.categories.reduce((acc, cat) => {
        const key = `allocated${cat.name.replace(/\s+/g, '')}`;
        const value = parseFloat(cat.allocation) || 0;
        acc[key] = value;
        return acc;
      }, {});

      const budgetToSave = {
        userId: user?.userId || '',
        cycleName: budgetData.cycleName,
        budgetCycleDuration: budgetData.budgetCycleDuration,
        startDate: startDate.toISOString().split('T')[0],
        endDate,
        totalMoneyAllocation,
        savingsTarget,
        currency: user?.currency || 'USD',
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
        updatedCycle = response?.budget || response;
      } else {
        budgetToSave.budgetCycleId = Date.now().toString();
        const response = await budgetService.createBudgetCycle(budgetToSave, token);
        updatedCycle = response?.budget || response;
      }

      if (!updatedCycle?.budgetCycleId) {
        throw new Error('Invalid cycle data returned from API');
      }

      const updatedUser = {
        ...user,
        cycle: user?.cycle && Array.isArray(user.cycle)
            ? [
              ...user.cycle.filter((c) => c.budgetCycleId !== updatedCycle.budgetCycleId),
              updatedCycle,
            ]
            : [updatedCycle],
      };

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      setUser(updatedUser);
      setIsEditing(false);
      navigation.setParams({ cycle: null });

      Alert.alert('Success', `Budget cycle ${isEditing ? 'updated' : 'created'} successfully`, [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error) {
      console.error('Error saving budget:', error);
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
                if (Array.isArray(transactions) && transactions.length > 0) {
                  Alert.alert('Error', 'Cannot delete a cycle with transactions.');
                  return;
                }

                await budgetService.deleteBudgetCycle(idToDelete, token);
                const updatedCycles = user?.cycle?.filter((cycle) => cycle.budgetCycleId !== idToDelete) || [];
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
                Alert.alert('Error', `Delete failed: ${error.message || 'An unknown error occurred'}`);
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
          { name: 'Medical Expenses', allocation: activeCycle.allocatedMedicalExpenses?.toString() || '', id: '7' },
          { name: 'Accommodation', allocation: activeCycle.allocatedAccommodation?.toString() || '', id: '8' },
          { name: 'Vacation', allocation: activeCycle.allocatedVacation?.toString() || '', id: '9' },
          { name: 'Other Expenses', allocation: activeCycle.allocatedOtherExpenses?.toString() || '', id: '10' },
        ],
      });
      setIsEditing(true);
      navigation.setParams({ cycle: activeCycle });
    }
  };

  const activeCycle = getActiveCycle();

  const renderActiveCycle = () => {
    if (!activeCycle) return null;

    const categories = [
      { name: 'Entertainment', value: activeCycle.allocatedEntertainment || 0 },
      { name: 'Groceries', value: activeCycle.allocatedGroceries || 0 },
      { name: 'Utilities', value: activeCycle.allocatedUtilities || 0 },
      { name: 'Commute', value: activeCycle.allocatedCommute || 0 },
      { name: 'Shopping', value: activeCycle.allocatedShopping || 0 },
      { name: 'DiningOut', value: activeCycle.allocatedDiningOut || 0 },
      { name: 'Medical Expenses', value: activeCycle.allocatedMedicalExpenses || 0 },
      { name: 'Accommodation', value: activeCycle.allocatedAccommodation || 0 },
      { name: 'Vacation', value: activeCycle.allocatedVacation || 0 },
      { name: 'Other Expenses', value: activeCycle.allocatedOtherExpenses || 0 },
    ];

    const totalAllocated = categories.reduce((sum, cat) => sum + (parseFloat(cat.value) || 0), 0);
    const remaining = (parseFloat(activeCycle.totalMoneyAllocation) || 0) - totalAllocated;
    const progress = activeCycle.totalMoneyAllocation > 0 ? (totalAllocated / activeCycle.totalMoneyAllocation) * 100 : 0;

    return (
        <Animated.View style={[styles.activeCycleContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.headerContainer}>
            <Text style={styles.activeCycleTitle}>{activeCycle.cycleName}</Text>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={handleEditActiveCycle} style={styles.iconButton}>
                <Icon name="edit" size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteBudget(activeCycle.budgetCycleId)} style={styles.iconButton}>
                <Icon name="delete" size={20} color="#E53935" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.activeCycleSubtitle}>Active until {activeCycle.endDate}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(progress, 100)}%`,
                    },
                  ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}% Allocated</Text>
          </View>

          <View style={styles.activeCycleCard}>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Duration</Text>
              <Text style={styles.activeCycleValue}>{activeCycle.budgetCycleDuration}</Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Start</Text>
              <Text style={styles.activeCycleValue}>{activeCycle.startDate}</Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>End</Text>
              <Text style={styles.activeCycleValue}>{activeCycle.endDate}</Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Total</Text>
              <Text style={styles.activeCycleValue}>
                {formatCurrency(activeCycle.totalMoneyAllocation, user?.currency)}
              </Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Savings</Text>
              <Text style={styles.activeCycleValue}>
                {formatCurrency(activeCycle.savingsTarget, user?.currency)}
              </Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Allocated</Text>
              <Text style={styles.activeCycleValue}>
                {formatCurrency(totalAllocated, user?.currency)}
              </Text>
            </View>
            <View style={styles.activeCycleRow}>
              <Text style={styles.activeCycleLabel}>Remaining</Text>
              <Text
                  style={[
                    styles.activeCycleValue,
                    { color: remaining < 0 ? '#E53935' : '#4CAF50' },
                  ]}
              >
                {formatCurrency(remaining, user?.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.activeCycleCard}>
            <TouchableOpacity onPress={() => toggleSection('categories')}>
              <View style={styles.sectionHeader}>
                <Text style={styles.activeCycleSectionTitle}>Categories</Text>
                <Icon
                    name={expandedSections.categories ? 'expand-less' : 'expand-more'}
                    size={24}
                    color="#1A1A1A"
                />
              </View>
            </TouchableOpacity>
            <Animated.View
                style={{
                  height: categoriesHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, categoriesContentHeight || 200], // Use measured height or fallback
                  }),
                  opacity: categoriesHeight,
                  overflow: 'hidden',
                }}
            >
              <View
                  onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setCategoriesContentHeight(height + 16); // Add padding for safety
                  }}
              >
                {categories.map((cat, index) => (
                    <View key={index} style={styles.categoryRow}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      <Text style={styles.categoryValue}>
                        {formatCurrency(cat.value, user?.currency)}
                      </Text>
                    </View>
                ))}
              </View>
            </Animated.View>
          </View>
        </Animated.View>
    );
  };

  return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <Text style={styles.screenTitle}>
              {isEditing ? 'Edit Budget' : activeCycle ? 'Active Budget' : 'New Budget'}
            </Text>

            {activeCycle && !isEditing ? (
                renderActiveCycle()
            ) : (
                <>
                  <View style={styles.card}>
                    <TouchableOpacity onPress={() => toggleSection('details')}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Budget Details</Text>
                        <Icon
                            name={expandedSections.details ? 'expand-less' : 'expand-more'}
                            size={24}
                            color="#1A1A1A"
                        />
                      </View>
                    </TouchableOpacity>
                    <Animated.View
                        style={{
                          height: detailsHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, detailsContentHeight || 300], // Use measured height or fallback
                          }),
                          opacity: detailsHeight,
                          overflow: 'hidden',
                        }}
                    >
                      <View
                          onLayout={(event) => {
                            const { height } = event.nativeEvent.layout;
                            setDetailsContentHeight(height + 16); // Add padding for safety
                          }}
                      >
                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Cycle Name</Text>
                          <TextInput
                              style={styles.input}
                              placeholder="e.g., May 2025"
                              value={budgetData.cycleName}
                              onChangeText={(text) => handleChange('cycleName', text)}
                              accessibilityLabel="Cycle Name"
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
                              accessibilityLabel="Cycle Duration"
                          />
                        </View>
                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Total Budget ({user?.currency || 'USD'})</Text>
                          <TextInput
                              style={styles.input}
                              placeholder="Enter amount"
                              keyboardType="numeric"
                              value={budgetData.totalMoneyAllocation}
                              onChangeText={(text) => handleChange('totalMoneyAllocation', text)}
                              accessibilityLabel="Total Budget"
                          />
                        </View>
                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Savings Goal ({user?.currency || 'USD'})</Text>
                          <TextInput
                              style={styles.input}
                              placeholder="Enter savings goal"
                              keyboardType="numeric"
                              value={budgetData.savingsTarget}
                              onChangeText={(text) => handleChange('savingsTarget', text)}
                              accessibilityLabel="Savings Goal"
                          />
                        </View>
                      </View>
                    </Animated.View>
                  </View>

                  <View style={styles.card}>
                    <TouchableOpacity onPress={() => toggleSection('categories')}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Categories</Text>
                        <Icon
                            name={expandedSections.categories ? 'expand-less' : 'expand-more'}
                            size={24}
                            color="#1A1A1A"
                        />
                      </View>
                    </TouchableOpacity>
                    <Animated.View
                        style={{
                          height: categoriesHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 600], // Adjust based on content height
                          }),
                          opacity: categoriesHeight,
                          overflow: 'hidden',
                        }}
                    >
                      <Text style={styles.description}>
                        Allocate your budget across categories. Savings come from spending less than allocated.
                      </Text>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <Animated.View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${Math.min(calculateProgress(), 100)}%`,
                                },
                              ]}
                          />
                        </View>
                        <Text style={styles.progressText}>{Math.round(calculateProgress())}% Allocated</Text>
                      </View>
                      {budgetData.categories.map((category) => (
                          <View key={category.id} style={styles.categoryContainer}>
                            <Text style={styles.categoryName}>{category.name}</Text>
                            <TextInput
                                style={styles.categoryInput}
                                placeholder="0"
                                keyboardType="numeric"
                                value={category.allocation}
                                onChangeText={(text) => handleCategoryChange(category.id, text)}
                                accessibilityLabel={`${category.name} Allocation`}
                            />
                          </View>
                      ))}
                      <View style={styles.summaryContainer}>
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>Total Budget</Text>
                          <Text style={styles.summaryValue}>
                            {formatCurrency(parseFloat(budgetData.totalMoneyAllocation || 0), user?.currency)}
                          </Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>Allocated</Text>
                          <Text style={styles.summaryValue}>
                            {formatCurrency(
                                budgetData.categories.reduce((sum, category) => sum + (parseFloat(category.allocation) || 0), 0),
                                user?.currency
                            )}
                          </Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>Savings Goal</Text>
                          <Text style={styles.summaryValue}>
                            {formatCurrency(parseFloat(budgetData.savingsTarget || 0), user?.currency)}
                          </Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>Remaining</Text>
                          <Text
                              style={[
                                styles.summaryValue,
                                { color: calculateRemainingBudget() < 0 ? '#E53935' : '#4CAF50' },
                              ]}
                          >
                            {formatCurrency(calculateRemainingBudget(), user?.currency)}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveBudget}
                        activeOpacity={0.8}
                    >
                      <Text style={styles.saveButtonText}>
                        {isEditing ? 'Update Budget' : 'Save Budget'}
                      </Text>
                    </TouchableOpacity>
                    {isEditing && existingCycle && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteBudget(existingCycle.budgetCycleId)}
                            activeOpacity={0.8}
                        >
                          <Text style={styles.deleteButtonText}>Delete Budget</Text>
                        </TouchableOpacity>
                    )}
                  </View>
                </>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontWeight: '400',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    color: '#1A1A1A',
  },
  staticText: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontWeight: '400',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    color: '#6B7280',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
  },
  categoryInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 10,
    width: 100,
    fontSize: 15,
    fontWeight: '400',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    textAlign: 'right',
    color: '#1A1A1A',
  },
  summaryContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  deleteButton: {
    backgroundColor: '#E53935',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activeCycleContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  activeCycleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: -0.3,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeCycleSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 12,
  },
  activeCycleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activeCycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  activeCycleLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  activeCycleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  activeCycleSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6, // Reduced for compactness
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#E6ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 4,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontWeight: '400',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    color: '#1A1A1A',
  },
  inputAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontWeight: '400',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    color: '#1A1A1A',
  },
  placeholder: {
    color: '#9CA3AF',
  },
});

export { styles, pickerSelectStyles };

export default BudgetCycleScreen;