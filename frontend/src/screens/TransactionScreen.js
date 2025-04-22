import React, { useState, useEffect, useRef, useCallback, memo } from "react";
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
import io from "socket.io-client";
import { debounce } from "lodash";

// Memoized TransactionItem component
const TransactionItem = memo(
    ({ item, expandedTransaction, toggleRecommendation, startEditing, handleDeleteTransaction, handleRecommendationSwitch }) => {
      console.log("Rendering TransactionItem:", {
        transactionId: item.transactionId,
        recommendation: item.recommendation,
        reasoning: item.reasoning,
        isExpanded: expandedTransaction === item.transactionId,
      });

      const hasRecommendationAndReasoning =
          item.recommendation &&
          item.recommendation !== "Recommendation pending" &&
          item.reasoning &&
          item.reasoning !== "Reasoning pending";

      return (
          <View style={styles.transactionItem}>
            <TouchableOpacity onPress={() => toggleRecommendation(item.transactionId)}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionDescription} numberOfLines={1} ellipsizeMode="tail">
                  {item.purchaseDescription}
                </Text>
                <View style={styles.transactionActions}>
                  <TouchableOpacity onPress={() => startEditing(item)}>
                    <Icon name="edit" size={20} color="#666" style={styles.actionIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteTransaction(item.transactionId)}>
                    <Icon name="delete" size={20} color="#E53935" style={styles.actionIcon} />
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
              <View style={styles.compactRecommendation}>
                <Text style={styles.compactRecommendationText}>
                  {item.recommendation || "Recommendation pending"}
                </Text>
                <Text style={styles.compactReasoningText}>
                  {item.reasoning || "Reasoning pending"}
                </Text>
              </View>
              <Icon
                  name={expandedTransaction === item.transactionId ? "expand-less" : "expand-more"}
                  size={24}
                  color="#666"
                  style={styles.toggleIcon}
              />
            </TouchableOpacity>
            {expandedTransaction === item.transactionId && (
                <View style={styles.recommendationContainer}>
                  <Text style={styles.recommendationTitle}>Recommendation</Text>
                  <Text style={styles.recommendationText}>
                    {item.recommendation || "Recommendation pending"}
                  </Text>
                  <Text style={styles.recommendationTitle}>Reasoning</Text>
                  <Text style={styles.recommendationText}>
                    {item.reasoning || "Reasoning pending"}
                  </Text>
                  {hasRecommendationAndReasoning && (
                      <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Performed after recommendation?</Text>
                        <Switch
                            value={item.isTransactionPerformedAfterRecommendation === "yes"}
                            onValueChange={(value) => handleRecommendationSwitch(item.transactionId, value)}
                            trackColor={{ false: "#DDD", true: "#4CAF50" }}
                            thumbColor="#FFF"
                        />
                      </View>
                  )}
                </View>
            )}
          </View>
      );
    },
    (prevProps, nextProps) => {
      return (
          prevProps.item.recommendation === nextProps.item.recommendation &&
          prevProps.item.reasoning === nextProps.item.reasoning &&
          prevProps.item.isTransactionPerformedAfterRecommendation === nextProps.item.isTransactionPerformedAfterRecommendation &&
          prevProps.expandedTransaction === nextProps.expandedTransaction
      );
    }
);

const TransactionScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const currentBudgetCycle = user?.cycle?.[0];

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isEditingTransaction, setIsEditingTransaction] = useState(null);
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
  const [editTransaction, setEditTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [socket, setSocket] = useState(null);
  const [flatListRenderKey, setFlatListRenderKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [limit] = useState(10); // Fixed limit of 10 transactions per page

  const transactionsRef = useRef(transactions);
  const subscribedIdsRef = useRef(new Set());

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

  // Update transactionsRef and force FlatList re-render
  useEffect(() => {
    transactionsRef.current = transactions;
    console.log("Updated transactionsRef:", transactionsRef.current);
    setFlatListRenderKey((prev) => prev + 1);
  }, [transactions]);

  // Debounced WebSocket handler
  const handleRecommendation = useCallback(
      debounce((data) => {
        console.log("Received recommendation:", {
          transactionId: data.transactionId,
          recommendationText: data.recommendationText,
          reasoning: data.reasoning,
        });
        setTransactions((prev) => {
          const updated = prev.map((t) =>
              t.transactionId === data.transactionId
                  ? { ...t, recommendation: data.recommendationText, reasoning: data.reasoning }
                  : t
          );
          console.log("Updated transactions:", updated);
          return [...updated];
        });
        setExpandedTransaction(data.transactionId);
      }, 100),
      []
  );

  // Initialize WebSocket
  useEffect(() => {
    if (!user || !token) {
      console.log("WebSocket skipped: missing user or token");
      return;
    }

    const socketInstance = io("http://10.0.0.115:5001", {
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("WebSocket connected");
      transactionsRef.current.forEach((t) => {
        if (!subscribedIdsRef.current.has(t.transactionId)) {
          socketInstance.emit("subscribe", `recommendation:${t.transactionId}`);
          subscribedIdsRef.current.add(t.transactionId);
          console.log("Subscribed to recommendation channel:", {
            transactionId: t.transactionId,
          });
        }
      });
    });

    socketInstance.on("recommendation", handleRecommendation);

    socketInstance.on("connect_error", (error) => {
      console.error("WebSocket connection error:", { message: error.message });
      Alert.alert("Connection Error", "Failed to connect to recommendation service.");
    });

    return () => {
      socketInstance.disconnect();
      console.log("WebSocket disconnected");
      subscribedIdsRef.current.clear();
    };
  }, [user, token, handleRecommendation]);

  // Subscribe to new transactions
  useEffect(() => {
    if (!socket) return;
    transactions.forEach((t) => {
      if (!subscribedIdsRef.current.has(t.transactionId)) {
        socket.emit("subscribe", `recommendation:${t.transactionId}`);
        subscribedIdsRef.current.add(t.transactionId);
        console.log("Subscribed to recommendation channel:", {
          transactionId: t.transactionId,
        });
      }
    });
  }, [socket, transactions]);

  // Apply filters and sort
  const applyFiltersAndSort = useCallback(
      (trans, category, sort) => {
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
        setFilteredTransactions([...filtered]);
        console.log("Applied filters and sort, new filteredTransactions:", filtered);
      },
      []
  );

  useEffect(() => {
    applyFiltersAndSort(transactions, filterCategory, sortBy);
  }, [transactions, filterCategory, sortBy, applyFiltersAndSort]);

  // Log filteredTransactions changes
  useEffect(() => {
    console.log("filteredTransactions changed:", filteredTransactions);
  }, [filteredTransactions]);

  // Fetch transactions with pagination
  const loadTransactions = useCallback(
      async (page = 1, refresh = false) => {
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
            page,
            limit,
          });
          const response = await transactionService.getTransactionsByBudgetCycle(
              currentBudgetCycle.budgetCycleId,
              token,
              page,
              limit
          );
          console.log("loadTransactions raw response:", response);
          const { transactions: fetchedTransactions, pagination } = response;
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
                    t.isTransactionPerformedAfterRecommendation || "no",
                recommendation: t.recommendation || null,
                reasoning: t.reasoning || null,
              }))
              : [];
          console.log("Mapped transactions:", mappedTransactions);
          setTransactions(mappedTransactions);
          setCurrentPage(pagination.currentPage);
          setTotalPages(pagination.totalPages);
          setTotalTransactions(pagination.totalTransactions);
        } catch (error) {
          console.error("loadTransactions error:", {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            status: error.response?.status,
          });
          Alert.alert("Error", "Failed to fetch transactions: " + (error.message || "Unknown error"));
          setTransactions([]);
          setFilteredTransactions([]);
          setTotalPages(1);
          setTotalTransactions(0);
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      },
      [user, token, currentBudgetCycle, limit]
  );

  const handleFilterChange = (category) => {
    setFilterCategory(category);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
  };

  useEffect(() => {
    loadTransactions(currentPage);
  }, [loadTransactions, currentPage]);

  const handleChange = (field, value) => {
    setNewTransaction((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditChange = (field, value) => {
    setEditTransaction((prev) => ({ ...prev, [field]: value }));
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
        isTransactionPerformedAfterRecommendation: "no",
      };
      console.log("Adding transaction:", transactionData);
      const response = await transactionService.createTransaction(transactionData, token);
      console.log("Transaction created:", response.data);
      const newTrans = {
        ...response.data.transaction,
        recommendation: null,
        reasoning: null,
        isTransactionPerformedAfterRecommendation:
            response.data.transaction.isTransactionPerformedAfterRecommendation || "no",
        date: new Date(response.data.transaction.transactionTimestamp).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      };
      // Add to current page if there's space, otherwise reset to page 1
      if (transactions.length < limit) {
        setTransactions((prev) => [newTrans, ...prev]);
        setTotalTransactions((prev) => prev + 1);
        setTotalPages(Math.ceil((totalTransactions + 1) / limit));
      } else {
        setCurrentPage(1);
        loadTransactions(1);
      }
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
      console.error("Create transaction error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert("Error", error.response?.data?.message || "Failed to add transaction");
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
      const original = transactions.find((t) => t.transactionId === editTransaction.transactionId);
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

      console.log("Editing transaction:", updatedFields);
      const response = await transactionService.updateTransaction(
          editTransaction.transactionId,
          updatedFields,
          token
      );
      console.log("Transaction updated:", response.data);
      const updatedTrans = {
        ...response.data.transaction,
        recommendation: response.data.transaction.recommendation || null,
        reasoning: response.data.transaction.reasoning || null,
        isTransactionPerformedAfterRecommendation:
            response.data.transaction.isTransactionPerformedAfterRecommendation || "no",
        date: new Date(response.data.transaction.transactionTimestamp).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      };
      setTransactions((prev) =>
          prev.map((t) => (t.transactionId === updatedTrans.transactionId ? updatedTrans : t))
      );
      setIsEditingTransaction(null);
      setEditTransaction(null);
      setExpandedTransaction(updatedTrans.transactionId);
      Alert.alert("Success", "Transaction updated successfully");
    } catch (error) {
      console.error("Edit transaction error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert("Error", error.response?.data?.message || "Failed to update transaction");
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("Deleting transaction:", { transactionId });
            await transactionService.deleteTransaction(transactionId, token);
            setTransactions((prev) => prev.filter((t) => t.transactionId !== transactionId));
            setTotalTransactions((prev) => prev - 1);
            setTotalPages(Math.ceil((totalTransactions - 1) / limit));
            if (socket) {
              socket.emit("unsubscribe", `recommendation:${transactionId}`);
              subscribedIdsRef.current.delete(transactionId);
              console.log("Unsubscribed from recommendation channel:", { transactionId });
            }
            // Reload current page to reflect updated transaction list
            if (transactions.length === 1 && currentPage > 1) {
              setCurrentPage((prev) => prev - 1);
            } else {
              loadTransactions(currentPage);
            }
            Alert.alert("Success", "Transaction deleted successfully");
          } catch (error) {
            console.error("Delete transaction error:", {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
            });
            Alert.alert("Error", error.response?.data?.message || "Failed to delete transaction");
          }
        },
      },
    ]);
  };

  const toggleRecommendation = (id) => {
    setExpandedTransaction((prev) => (prev === id ? null : id));
  };

  const handleRecommendationSwitch = async (transactionId, value) => {
    try {
      const updatedFields = {
        isTransactionPerformedAfterRecommendation: value ? "yes" : "no",
      };
      console.log("Updating recommendation switch:", { transactionId, updatedFields });
      const response = await transactionService.updateTransaction(
          transactionId,
          updatedFields,
          token
      );
      const updatedTrans = {
        ...response.data.transaction,
        recommendation: response.data.transaction.recommendation || null,
        reasoning: response.data.transaction.reasoning || null,
        isTransactionPerformedAfterRecommendation:
            response.data.transaction.isTransactionPerformedAfterRecommendation || "no",
        date: new Date(response.data.transaction.transactionTimestamp).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      };
      setTransactions((prev) =>
          prev.map((t) => (t.transactionId === transactionId ? updatedTrans : t))
      );
      setExpandedTransaction(transactionId);
    } catch (error) {
      console.error("Recommendation switch error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert("Error", error.response?.data?.message || "Failed to update recommendation status");
    }
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
          transaction.isTransactionPerformedAfterRecommendation || "no",
    });
  };

  const debugState = () => {
    console.log("Debug - Current state:", {
      transactions,
      filteredTransactions,
      subscribedIds: Array.from(subscribedIdsRef.current),
      pagination: { currentPage, totalPages, totalTransactions, limit },
    });
    Alert.alert(
        "Debug Info",
        `Transactions: ${transactions.length}, Subscribed IDs: ${subscribedIdsRef.current.size}, Page: ${currentPage}/${totalPages}, Total: ${totalTransactions}`
    );
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const renderHeader = () => (
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Transactions</Text>
        <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setIsAddingTransaction((prev) => !prev);
              setIsEditingTransaction(null);
              setEditTransaction(null);
            }}
        >
          <Text style={styles.addButtonText}>{isAddingTransaction ? "Cancel" : "+ Add"}</Text>
        </TouchableOpacity>
      </View>
  );

  const renderFilters = () => (
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {["All", ...categories.map((c) => c.name)].map((category) => (
              <TouchableOpacity
                  key={category}
                  style={[styles.categoryButton, filterCategory === category && styles.categoryButtonActive]}
                  onPress={() => handleFilterChange(category)}
              >
                <Text
                    style={[styles.categoryButtonText, filterCategory === category && styles.categoryButtonTextActive]}
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
        <TouchableOpacity style={styles.debugButton} onPress={debugState}>
          <Text style={styles.debugButtonText}>Debug</Text>
        </TouchableOpacity>
      </View>
  );

  const renderPaginationControls = () => (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={handlePreviousPage}
            disabled={currentPage === 1}
        >
          <Text style={styles.paginationButtonText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.paginationText}>
          Page {currentPage} of {totalPages} ({totalTransactions} transactions)
        </Text>
        <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationButtonText}>Next</Text>
        </TouchableOpacity>
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
                            newTransaction.purchaseCategory === category.name && styles.categoryButtonActive,
                          ]}
                          onPress={() => handleChange("purchaseCategory", category.name)}
                      >
                        <Text
                            style={[
                              styles.categoryButtonText,
                              newTransaction.purchaseCategory === category.name && styles.categoryButtonTextActive,
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
              <TouchableOpacity style={styles.saveButton} onPress={handleAddTransaction}>
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
                    onChangeText={(text) => handleEditChange("purchaseDescription", text)}
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
                            editTransaction.purchaseCategory === category.name && styles.categoryButtonActive,
                          ]}
                          onPress={() => handleEditChange("purchaseCategory", category.name)}
                      >
                        <Text
                            style={[
                              styles.categoryButtonText,
                              editTransaction.purchaseCategory === category.name && styles.categoryButtonTextActive,
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
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Performed after recommendation?</Text>
                <Switch
                    value={editTransaction.isTransactionPerformedAfterRecommendation === "yes"}
                    onValueChange={(value) =>
                        handleEditChange("isTransactionPerformedAfterRecommendation", value ? "yes" : "no")
                    }
                    trackColor={{ false: "#DDD", true: "#4CAF50" }}
                    thumbColor="#FFF"
                />
              </View>
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
                <TouchableOpacity style={styles.saveButton} onPress={handleEditTransaction}>
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
                  <>
                    <FlatList
                        data={filteredTransactions}
                        renderItem={({ item }) => (
                            <TransactionItem
                                item={item}
                                expandedTransaction={expandedTransaction}
                                toggleRecommendation={toggleRecommendation}
                                startEditing={startEditing}
                                handleDeleteTransaction={handleDeleteTransaction}
                                handleRecommendationSwitch={handleRecommendationSwitch}
                            />
                        )}
                        keyExtractor={(item) => item.transactionId.toString()}
                        extraData={filteredTransactions}
                        contentContainerStyle={styles.transactionList}
                        key={flatListRenderKey}
                        ListEmptyComponent={
                          <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No transactions yet</Text>
                            <Text style={styles.emptySubtext}>Add your first transaction to get started</Text>
                          </View>
                        }
                        refreshControl={
                          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadTransactions(1, true)} />
                        }
                        onLayout={() => console.log("FlatList rendered with data:", filteredTransactions)}
                    />
                    {totalPages > 1 && renderPaginationControls()}
                  </>
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
  debugButton: {
    backgroundColor: "#666",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  debugButtonText: {
    color: "#FFF",
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
    paddingBottom: 10,
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
  compactRecommendation: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  compactRecommendationText: {
    fontSize: 12,
    color: "#4CAF50",
    marginBottom: 5,
  },
  compactReasoningText: {
    fontSize: 12,
    color: "#666",
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
    marginBottom: 15,
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
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  paginationButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: "#CCC",
  },
  paginationButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  paginationText: {
    fontSize: 14,
    color: "#333",
  },
});

export default TransactionScreen;