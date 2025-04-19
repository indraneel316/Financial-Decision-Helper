import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Switch,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import { transactionService } from "../services/api";

const TransactionScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const currentBudgetCycle = user?.cycle?.[0];

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isEditingTransaction, setIsEditingTransaction] = useState(null); // Track editing transaction ID
  const [newTransaction, setNewTransaction] = useState({
    purchaseDescription: "",
    purchaseAmount: "",
    purchaseCategory: "Groceries",
    date: new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }),
  });
  const [editTransaction, setEditTransaction] = useState(null); // Track edit form state
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedTransaction, setExpandedTransaction] = useState(null);

  const categories = [
    { name: "Entertainment", allocation: "", id: "1" },
    { name: "Groceries", allocation: "", id: "2" },
    { name: "Utilities", allocation: "", id: "3" },
    { name: "Commute", allocation: "", id: "4" },
    { name: "Shopping", allocation: "", id: "5" },
    { name: "DiningOut", allocation: "", id: "6" },
    { name: "Medical Expense", allocation: "", id: "7" },
    { name: "Accommodation", allocation: "", id: "8" },
    { name: "Vacation", allocation: "", id: "9" },
    { name: "Other Expenses", allocation: "", id: "10" },
  ];

  // Generate random transactionId
  const generateTransactionId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Dummy recommendation function
  const generateDummyRecommendation = (transaction) => {
    const { purchaseCategory, purchaseAmount } = transaction;
    if (purchaseAmount > 50) {
      return `High expense of $${purchaseAmount.toFixed(2)} in ${purchaseCategory}. Consider alternatives.`;
    }
    return `Reduce spending on ${purchaseCategory} to stay within budget.`;
  };

  // Fetch all transactions
  const loadTransactions = async (refresh = false) => {
    if (!user || !token || !currentBudgetCycle?.budgetCycleId) {
      console.log("loadTransactions validation failed:", {
        user: !!user,
        token: !!token,
        budgetCycleId: currentBudgetCycle?.budgetCycleId,
      });
      Alert.alert("Error", "Missing user or budget cycle data");
      return;
    }
    setIsLoading(!refresh);
    setIsRefreshing(refresh);
    try {
      console.log("loadTransactions starting:", {
        budgetCycleId: currentBudgetCycle.budgetCycleId,
        token,
      });
      const fetchedTransactions = await transactionService.getTransactionsByBudgetCycle(
          currentBudgetCycle.budgetCycleId,
          token
      );
      console.log("loadTransactions raw response:", fetchedTransactions);
      const mappedTransactions = Array.isArray(fetchedTransactions)
          ? fetchedTransactions.map((t) => ({
            transactionId: t.transactionId,
            budgetCycleId: t.budgetCycleId,
            userId: t.userId,
            purchaseDescription: t.purchaseDescription,
            purchaseAmount: t.purchaseAmount,
            purchaseCategory: t.purchaseCategory,
            date: new Date(t.transactionTimestamp).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            }),
            isTransactionPerformedAfterRecommendation:
            t.isTransactionPerformedAfterRecommendation,
          }))
          : [];
      console.log("Mapped transactions:", mappedTransactions);
      const transactionsWithRecs = mappedTransactions.map((t) => ({
        ...t,
        recommendation: generateDummyRecommendation(t),
      }));
      setTransactions(transactionsWithRecs);
      applyFiltersAndSort(transactionsWithRecs, filterCategory, sortBy);
    } catch (error) {
      console.log("loadTransactions error:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });
      Alert.alert(
          "Error",
          "Failed to fetch transactions: " +
          (error.response?.data?.message || error.message)
      );
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Apply client-side filtering and sorting
  const applyFiltersAndSort = (trans, category, sort) => {
    let filtered = [...trans];
    if (category !== "All") {
      filtered = filtered.filter((t) => t.purchaseCategory === category);
    }
    filtered.sort((a, b) => {
      if (sort === "date-asc") {
        return new Date(a.date) - new Date(b.date);
      } else if (sort === "date-desc") {
        return new Date(b.date) - new Date(a.date);
      } else if (sort === "amount-asc") {
        return a.purchaseAmount - b.purchaseAmount;
      } else if (sort === "amount-desc") {
        return b.purchaseAmount - a.purchaseAmount;
      }
      return 0;
    });
    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (category) => {
    setFilterCategory(category);
    applyFiltersAndSort(transactions, category, sortBy);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    applyFiltersAndSort(transactions, filterCategory, sort);
  };

  useEffect(() => {
    loadTransactions();
  }, [user, token, currentBudgetCycle]);

  const handleChange = (field, value) => {
    setNewTransaction({ ...newTransaction, [field]: value });
  };

  const handleEditChange = (field, value) => {
    setEditTransaction({ ...editTransaction, [field]: value });
  };

  const handleAddTransaction = async () => {
    if (
        !newTransaction.purchaseDescription ||
        !newTransaction.purchaseAmount ||
        !newTransaction.date
    ) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }
    const purchaseAmount = parseFloat(newTransaction.purchaseAmount);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      Alert.alert("Invalid Input", "Amount must be a positive number");
      return;
    }
    const dateRegex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!dateRegex.test(newTransaction.date)) {
      Alert.alert("Invalid Date", "Date must be in MM/DD/YYYY format");
      return;
    }

    try {
      const transactionData = {
        budgetCycleId: currentBudgetCycle?.budgetCycleId,
        userId: user.userId,
        purchaseDescription: newTransaction.purchaseDescription,
        purchaseAmount,
        purchaseCategory: newTransaction.purchaseCategory,
        date: newTransaction.date,
        transactionId: generateTransactionId(),
      };
      console.log("TRANSACTION COOKED DATA:", transactionData);
      const response = await transactionService.createTransaction(
          transactionData,
          token
      );
      console.log("TRANSACTION DATA:", response.data);
      const newTrans = {
        ...response.data.transaction,
        recommendation: generateDummyRecommendation({
          ...response.data.transaction,
          purchaseAmount,
          purchaseCategory: newTransaction.purchaseCategory,
        }),
      };
      const updatedTransactions = [newTrans, ...transactions];
      setTransactions(updatedTransactions);
      applyFiltersAndSort(updatedTransactions, filterCategory, sortBy);
      setNewTransaction({
        purchaseDescription: "",
        purchaseAmount: "",
        purchaseCategory: "Groceries",
        date: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      });
      setIsAddingTransaction(false);
      setExpandedTransaction(newTrans.transactionId);
      Alert.alert("Success", "Transaction added successfully");
    } catch (error) {
      console.log("Create transaction error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to add transaction"
      );
    }
  };

  const handleEditTransaction = async () => {
    if (
        !editTransaction.purchaseDescription ||
        !editTransaction.purchaseAmount ||
        !editTransaction.date
    ) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }
    const purchaseAmount = parseFloat(editTransaction.purchaseAmount);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      Alert.alert("Invalid Input", "Amount must be a positive number");
      return;
    }
    const dateRegex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!dateRegex.test(editTransaction.date)) {
      Alert.alert("Invalid Date", "Date must be in MM/DD/YYYY format");
      return;
    }

    try {
      // Find original transaction
      const original = transactions.find(
          (t) => t.transactionId === editTransaction.transactionId
      );
      // Only send changed fields
      const updatedFields = {};
      if (editTransaction.purchaseDescription !== original.purchaseDescription) {
        updatedFields.purchaseDescription = editTransaction.purchaseDescription;
      }
      if (purchaseAmount !== original.purchaseAmount) {
        updatedFields.purchaseAmount = purchaseAmount;
      }
      if (editTransaction.purchaseCategory !== original.purchaseCategory) {
        updatedFields.purchaseCategory = editTransaction.purchaseCategory;
      }
      if (editTransaction.date !== original.date) {
        updatedFields.date = editTransaction.date;
      }
      if (
          editTransaction.isTransactionPerformedAfterRecommendation !==
          original.isTransactionPerformedAfterRecommendation
      ) {
        updatedFields.isTransactionPerformedAfterRecommendation =
            editTransaction.isTransactionPerformedAfterRecommendation;
      }

      if (Object.keys(updatedFields).length === 0) {
        Alert.alert("No Changes", "No fields were modified");
        setIsEditingTransaction(null);
        setEditTransaction(null);
        return;
      }

      console.log("EDIT TRANSACTION DATA:", updatedFields);
      const response = await transactionService.updateTransaction(
          editTransaction.transactionId,
          updatedFields,
          token
      );
      console.log("EDIT TRANSACTION RESPONSE:", response.data);
      const updatedTrans = {
        ...response.data.transaction,
        recommendation: generateDummyRecommendation({
          ...response.data.transaction,
          purchaseAmount,
          purchaseCategory: editTransaction.purchaseCategory,
        }),
      };
      const updatedTransactions = transactions.map((t) =>
          t.transactionId === updatedTrans.transactionId ? updatedTrans : t
      );
      setTransactions(updatedTransactions);
      applyFiltersAndSort(updatedTransactions, filterCategory, sortBy);
      setIsEditingTransaction(null);
      setEditTransaction(null);
      Alert.alert("Success", "Transaction updated successfully");
    } catch (error) {
      console.log("Edit transaction error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to update transaction"
      );
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this transaction?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                console.log("DELETE TRANSACTION:", { transactionId });
                await transactionService.deleteTransaction(transactionId, token);
                const updatedTransactions = transactions.filter(
                    (t) => t.transactionId !== transactionId
                );
                setTransactions(updatedTransactions);
                applyFiltersAndSort(updatedTransactions, filterCategory, sortBy);
                Alert.alert("Success", "Transaction deleted successfully");
              } catch (error) {
                console.log("Delete transaction error:", {
                  message: error.message,
                  response: error.response?.data,
                  status: error.response?.status,
                });
                Alert.alert(
                    "Error",
                    error.response?.data?.message || "Failed to delete transaction"
                );
              }
            },
          },
        ]
    );
  };

  const toggleRecommendation = (id) => {
    setExpandedTransaction(expandedTransaction === id ? null : id);
  };

  const handleRecommendationSwitch = (transactionId, value) => {
    const updatedTransactions = transactions.map((t) =>
        t.transactionId === transactionId
            ? {
              ...t,
              isTransactionPerformedAfterRecommendation: value ? "yes" : "no",
            }
            : t
    );
    setTransactions(updatedTransactions);
    applyFiltersAndSort(updatedTransactions, filterCategory, sortBy);
  };

  const startEditing = (transaction) => {
    setIsEditingTransaction(transaction.transactionId);
    setEditTransaction({
      transactionId: transaction.transactionId,
      purchaseDescription: transaction.purchaseDescription,
      purchaseAmount: transaction.purchaseAmount.toString(),
      purchaseCategory: transaction.purchaseCategory,
      date: transaction.date,
      isTransactionPerformedAfterRecommendation:
      transaction.isTransactionPerformedAfterRecommendation,
    });
  };

  const renderTransactionItem = ({ item }) => (
      <View style={styles.transactionItem}>
        <TouchableOpacity onPress={() => toggleRecommendation(item.transactionId)}>
          <View style={styles.transactionHeader}>
            <Text
                style={styles.transactionDescription}
                numberOfLines={1}
                ellipsizeMode="tail"
            >
              {item.purchaseDescription}
            </Text>
            <View style={styles.transactionActions}>
              <TouchableOpacity onPress={() => startEditing(item)}>
                <Icon name="edit" size={20} color="#666" style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity
                  onPress={() => handleDeleteTransaction(item.transactionId)}
              >
                <Icon
                    name="delete"
                    size={20}
                    color="#E53935"
                    style={styles.actionIcon}
                />
              </TouchableOpacity>
              <Text style={styles.transactionAmount}>
                -${parseFloat(item.purchaseAmount).toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionCategory}>{item.purchaseCategory}</Text>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
          <Icon
              name={expandedTransaction === item.transactionId ? "expand-less" : "expand-more"}
              size={24}
              color="#666"
              style={styles.toggleIcon}
          />
        </TouchableOpacity>
        {expandedTransaction === item.transactionId && item.recommendation && (
            <View style={styles.recommendationContainer}>
              <Text style={styles.recommendationTitle}>Recommendation</Text>
              <Text style={styles.recommendationText}>{item.recommendation}</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>
                  Performed after recommendation?
                </Text>
                <Switch
                    value={
                        item.isTransactionPerformedAfterRecommendation === "yes"
                    }
                    onValueChange={(value) =>
                        handleRecommendationSwitch(item.transactionId, value)
                    }
                    trackColor={{ false: "#DDD", true: "#4CAF50" }}
                    thumbColor="#FFF"
                />
              </View>
            </View>
        )}
      </View>
  );

  const renderHeader = () => (
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Transactions</Text>
        <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setIsAddingTransaction(!isAddingTransaction);
              setIsEditingTransaction(null);
              setEditTransaction(null);
            }}
        >
          <Text style={styles.addButtonText}>
            {isAddingTransaction ? "Cancel" : "+ Add"}
          </Text>
        </TouchableOpacity>
      </View>
  );

  const renderFilters = () => (
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by:</Text>
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
        >
          {["All", ...categories.map((c) => c.name)].map((category) => (
              <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    filterCategory === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => handleFilterChange(category)}
              >
                <Text
                    style={[
                      styles.categoryButtonText,
                      filterCategory === category && styles.categoryButtonTextActive,
                    ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.sortContainer}>
          <Text style={styles.filterLabel}>Sort:</Text>
          <TouchableOpacity
              style={styles.sortButton}
              onPress={() =>
                  handleSortChange(
                      sortBy === "date-desc"
                          ? "date-asc"
                          : sortBy === "date-asc"
                              ? "amount-desc"
                              : sortBy === "amount-desc"
                                  ? "amount-asc"
                                  : "date-desc"
                  )
              }
          >
            <Text style={styles.sortButtonText}>
              {sortBy === "date-desc"
                  ? "Date ↓"
                  : sortBy === "date-asc"
                      ? "Date ↑"
                      : sortBy === "amount-desc"
                          ? "Amount ↓"
                          : "Amount ↑"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
  );

  return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {isAddingTransaction ? (
            <View style={styles.addTransactionContainer}>
              <Text style={styles.sectionTitle}>Add New Transaction</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.input}
                    placeholder="What did you spend on?"
                    value={newTransaction.purchaseDescription}
                    onChangeText={(text) => handleChange("purchaseDescription", text)}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Amount</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={newTransaction.purchaseAmount}
                    onChangeText={(text) => handleChange("purchaseAmount", text)}
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
                          key={category.id}
                          style={[
                            styles.categoryButton,
                            newTransaction.purchaseCategory === category.name &&
                            styles.categoryButtonActive,
                          ]}
                          onPress={() => handleChange("purchaseCategory", category.name)}
                      >
                        <Text
                            style={[
                              styles.categoryButtonText,
                              newTransaction.purchaseCategory === category.name &&
                              styles.categoryButtonTextActive,
                            ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date (MM/DD/YYYY)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="MM/DD/YYYY"
                    value={newTransaction.date}
                    onChangeText={(text) => handleChange("date", text)}
                />
              </View>
              <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddTransaction}
              >
                <Text style={styles.saveButtonText}>Save Transaction</Text>
              </TouchableOpacity>
            </View>
        ) : isEditingTransaction ? (
            <View style={styles.addTransactionContainer}>
              <Text style={styles.sectionTitle}>Edit Transaction</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.input}
                    placeholder="What did you spend on?"
                    value={editTransaction.purchaseDescription}
                    onChangeText={(text) =>
                        handleEditChange("purchaseDescription", text)
                    }
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Amount</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={editTransaction.purchaseAmount}
                    onChangeText={(text) => handleEditChange("purchaseAmount", text)}
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
                          key={category.id}
                          style={[
                            styles.categoryButton,
                            editTransaction.purchaseCategory === category.name &&
                            styles.categoryButtonActive,
                          ]}
                          onPress={() =>
                              handleEditChange("purchaseCategory", category.name)
                          }
                      >
                        <Text
                            style={[
                              styles.categoryButtonText,
                              editTransaction.purchaseCategory === category.name &&
                              styles.categoryButtonTextActive,
                            ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date (MM/DD/YYYY)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="MM/DD/YYYY"
                    value={editTransaction.date}
                    onChangeText={(text) => handleEditChange("date", text)}
                />
              </View>
              {editTransaction.recommendation && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Performed after recommendation?</Text>
                    <Switch
                        value={
                            editTransaction.isTransactionPerformedAfterRecommendation ===
                            "yes"
                        }
                        onValueChange={(value) =>
                            handleEditChange(
                                "isTransactionPerformedAfterRecommendation",
                                value ? "yes" : "no"
                            )
                        }
                        trackColor={{ false: "#DDD", true: "#4CAF50" }}
                        thumbColor="#FFF"
                    />
                  </View>
              )}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.saveButton, styles.cancelButton]}
                    onPress={() => {
                      setIsEditingTransaction(null);
                      setEditTransaction(null);
                    }}
                >
                  <Text style={styles.saveButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleEditTransaction}
                >
                  <Text style={styles.saveButtonText}>Update Transaction</Text>
                </TouchableOpacity>
              </View>
            </View>
        ) : (
            <>
              {renderFilters()}
              {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                  </View>
              ) : (
                  <FlatList
                      data={filteredTransactions}
                      renderItem={renderTransactionItem}
                      keyExtractor={(item) => item.transactionId.toString()}
                      contentContainerStyle={styles.transactionList}
                      ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                          <Text style={styles.emptyText}>No transactions yet</Text>
                          <Text style={styles.emptySubtext}>
                            Add your first transaction to get started
                          </Text>
                        </View>
                      }
                      refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => loadTransactions(true)}
                        />
                      }
                  />
              )}
            </>
        )}
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  addTransactionContainer: {
    backgroundColor: "#FFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  categoryList: {
    paddingVertical: 5,
  },
  categoryButton: {
    backgroundColor: "#F0F0F0",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: "#4CAF50",
  },
  categoryButtonText: {
    color: "#666",
  },
  categoryButtonTextActive: {
    color: "#FFF",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#E53935",
    marginRight: 10,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterContainer: {
    backgroundColor: "#FFF",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  sortButton: {
    backgroundColor: "#F0F0F0",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 10,
  },
  sortButtonText: {
    color: "#333",
    fontSize: 14,
  },
  transactionList: {
    padding: 15,
  },
  transactionItem: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    marginBottom: 5,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E53935",
  },
  transactionActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    marginLeft: 10,
  },
  transactionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  transactionCategory: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#F0F0F0",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  transactionDate: {
    fontSize: 14,
    color: "#888",
  },
  toggleIcon: {
    alignSelf: "center",
    padding: 10,
  },
  recommendationContainer: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  recommendationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 14,
    color: "#333",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TransactionScreen;