import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TransactionDetailsScreen = ({ navigation, route }) => {
    const { transactions = [], cycleName, budgetCycleId } = route.params || {};

    // Log route.params for debugging


    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        } catch {
            return 'N/A';
        }
    };

    const formatAmount = (amount) => {
        return `$${Number(amount).toFixed(2)}`;
    };

    const renderTransaction = ({ item: transaction, index }) => (
        <View key={`${transaction.transactionId}-${index}`} style={styles.transactionItem}>
            <View style={styles.transactionRow}>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>{transaction.purchaseDescription || 'N/A'}</Text>
                    <Text style={styles.transactionCategory}>{transaction.purchaseCategory || 'N/A'}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.transactionTimestamp)}</Text>
                    {transaction.recommendation && (
                        <Text style={styles.transactionRecommendation}>
                            Recommendation: {transaction.recommendation}
                        </Text>
                    )}
                    {transaction.reasoning && (
                        <Text style={styles.transactionRecommendation}>
                            Reasoning: {transaction.reasoning}
                        </Text>
                    )}
                    {transaction.chainOfThought && (
                        <Text style={styles.transactionRecommendation}>
                            Chain of Thought: {transaction.chainOfThought}
                        </Text>
                    )}
                    {transaction.llmConfidenceScore && (
                        <Text style={styles.transactionRecommendation}>
                            Confidence Score: {(transaction.llmConfidenceScore * 100).toFixed(1)}%
                        </Text>
                    )}
                    <Text style={styles.transactionRecommendation}>
                        Performed After Recommendation: {transaction.isTransactionPerformedAfterRecommendation || 'N/A'}
                    </Text>
                </View>
                <Text style={styles.transactionAmount}>{formatAmount(transaction.purchaseAmount)}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>{cycleName} Transactions</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={item => `${item.transactionId}-${item.transactionTimestamp}`}
                contentContainerStyle={styles.scrollContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No transactions recorded</Text>
                        <Text style={styles.emptySubtext}>
                            No transactions were found for {cycleName} (Cycle ID: {budgetCycleId || 'N/A'}).
                            Add transactions in the Transactions screen.
                        </Text>
                        <TouchableOpacity
                            style={styles.navigateButton}
                            onPress={() => navigation.navigate('Transaction')}
                        >
                            <Text style={styles.navigateButtonText}>Go to Transactions</Text>
                        </TouchableOpacity>
                    </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        paddingBottom: 30,
    },
    transactionItem: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    transactionDetails: {
        flex: 1,
        marginRight: 10,
    },
    transactionDescription: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 6,
    },
    transactionCategory: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
    },
    transactionDate: {
        fontSize: 13,
        color: '#888',
        marginBottom: 6,
    },
    transactionRecommendation: {
        fontSize: 13,
        color: '#888',
        marginBottom: 6,
        fontStyle: 'italic',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
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
        marginBottom: 20,
    },
    navigateButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    navigateButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TransactionDetailsScreen;