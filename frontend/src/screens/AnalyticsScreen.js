import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const parseMarkdown = (markdown) => {
  if (!markdown) return [{ type: 'text', content: 'No AI insights available', key: 'no-insights' }];
  let cleaned = markdown
      .replace(/###\s/g, '')
      .replace(/\*\*/g, '')
      .trim();

  const lines = cleaned.split('\n').filter((line) => line.trim());
  const components = [];

  lines.forEach((line, index) => {
    if (line.startsWith('- ')) {
      components.push({
        type: 'bullet',
        content: line.replace('- ', '').trim(),
        key: `bullet-${index}`,
      });
    } else {
      components.push({
        type: 'text',
        content: line.trim(),
        key: `text-${index}`,
      });
    }
  });

  return components.length ? components : [{ type: 'text', content: 'No AI insights available', key: 'no-insights' }];
};

const AnalyticsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('current');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const API_BASE_URL = 'http://10.0.0.115:5001/api';

  const userId = useMemo(() => user?.userId, [user?.userId]);
  const budgetCycleId = useMemo(() => user?.cycle?.[0]?.budgetCycleId, [user?.cycle]);

  const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, { timeout: 10000 });
        return response;
      } catch (err) {
        if (i === retries - 1) throw err;
        console.warn(`Retrying ${url} (attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId) {
        setError('User not authenticated.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let localBudgetCycleId = budgetCycleId;
        let hasBudgetCycle = !!budgetCycleId;
        if (!hasBudgetCycle) {
          const cyclesResponse = await fetchWithRetry(`${API_BASE_URL}/users/${userId}/cycles`).catch(
              (err) => {
                console.error('Cycles fetch error:', {
                  message: err.message,
                  status: err.response?.status,
                  data: err.response?.data,
                });
                return { data: [] };
              },
          );
          const cycles = Array.isArray(cyclesResponse.data) ? cyclesResponse.data : [];
          if (cycles.length > 0) {
            localBudgetCycleId = cycles[0].budgetCycleId;
            hasBudgetCycle = true;
            console.log('Found cycles:', cycles);
          }
        }

        const overallResponse = await fetchWithRetry(
            `${API_BASE_URL}/users/${userId}/analytics`,
        ).catch((err) => {
          console.error('Overall analytics error:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });
          return { data: {} };
        });
        const overallAnalytics = overallResponse.data || {};
        if (!Object.keys(overallAnalytics).length) {
          console.warn('Empty overall analytics response');
        }

        let budgetCycleResponse = { data: {} };
        let transactionsResponse = { data: [] };
        let currentSpendingByCategory = [];
        let currentCycle = null;
        let currentSavingsProgress = null;

        if (hasBudgetCycle && localBudgetCycleId) {
          [budgetCycleResponse, transactionsResponse] = await Promise.all([
            fetchWithRetry(`${API_BASE_URL}/budget-cycles/${localBudgetCycleId}`).catch((err) => {
              console.error('Budget cycle error:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
              });
              return { data: {} };
            }),
            fetchWithRetry(`${API_BASE_URL}/transactions/budget-cycle/${localBudgetCycleId}`).catch(
                (err) => {
                  console.error('Transactions error:', {
                    message: err.message,
                    status: err.response?.status,
                    data: err.response?.data,
                  });
                  return { data: [] };
                },
            ),
          ]);

          const budgetCycle = budgetCycleResponse.data || {};
          const currentTransactions = Array.isArray(transactionsResponse.data)
              ? transactionsResponse.data
              : transactionsResponse.data.transactions || [];

          const categoryAllocations = {
            Entertainment: 'allocatedEntertainment',
            Groceries: 'allocatedGroceries',
            Utilities: 'allocatedUtilities',
            Commute: 'allocatedCommute',
            DiningOut: 'allocatedDiningOut',
            Accommodation: 'allocatedAccommodation',
            Shopping: 'allocatedShopping',
            MedicalExpense: 'allocatedMedicalExpense',
            Vacation: 'allocatedVacation',
            OtherExpenses: 'allocatedOtherExpenses',
          };

          const totalSpent = isNaN(parseFloat(budgetCycle.spentSoFar))
              ? (console.warn('Invalid spentSoFar:', budgetCycle.spentSoFar), 0)
              : parseFloat(budgetCycle.spentSoFar);
          const categorySpent = budgetCycle.categorySpent || {};

          // Create a set of categories to include: all categorySpent keys and all allocated categories
          const categoriesToInclude = new Set([
            ...Object.keys(categorySpent),
            ...Object.keys(categoryAllocations).filter(
                (category) =>
                    !isNaN(parseFloat(budgetCycle[categoryAllocations[category]])) &&
                    parseFloat(budgetCycle[categoryAllocations[category]]) > 0,
            ),
          ]);

          currentSpendingByCategory = Array.from(categoriesToInclude)
              .map((category) => {
                const allocatedField = categoryAllocations[category] || 'allocatedOtherExpenses';
                const allocated = isNaN(parseFloat(budgetCycle[allocatedField]))
                    ? (console.warn(`Invalid ${allocatedField}:`, budgetCycle[allocatedField]), 0)
                    : parseFloat(budgetCycle[allocatedField]);
                const amount = isNaN(parseFloat(categorySpent[category]))
                    ? (console.warn(`Invalid categorySpent[${category}]:`, categorySpent[category]), 0)
                    : parseFloat(categorySpent[category]);
                return {
                  category,
                  amount,
                  allocated,
                  percentage: allocated > 0 ? (amount / allocated) * 100 : amount > 0 ? (amount / totalSpent) * 100 : 0,
                };
              })
              .filter((item) => item.amount > 0 || item.allocated > 0)
              .sort((a, b) => b.amount - a.amount);

          currentCycle = {
            budgetCycleId: localBudgetCycleId,
            cycleName: budgetCycle.cycleName || 'Completed Cycle',
            amount: totalSpent,
            duration: budgetCycle.budgetCycleDuration || 'monthly',
            startDate: budgetCycle.startDate || new Date().toISOString(),
            endDate: budgetCycle.endDate || new Date().toISOString(),
            totalMoneyAllocation: isNaN(parseFloat(budgetCycle.totalMoneyAllocation))
                ? (console.warn('Invalid totalMoneyAllocation:', budgetCycle.totalMoneyAllocation), 0)
                : parseFloat(budgetCycle.totalMoneyAllocation),
            savingsTarget: isNaN(parseFloat(budgetCycle.savingsTarget))
                ? (console.warn('Invalid savingsTarget:', budgetCycle.savingsTarget), 0)
                : parseFloat(budgetCycle.savingsTarget),
            topTransactions: currentTransactions
                .filter((txn) => txn.isTransactionPerformedAfterRecommendation === 'yes')
                .sort((a, b) => (parseFloat(b.purchaseAmount) || 0) - (parseFloat(a.purchaseAmount) || 0))
                .slice(0, 3)
                .map((txn) => ({
                  amount: isNaN(parseFloat(txn.purchaseAmount))
                      ? (console.warn('Invalid purchaseAmount:', txn.purchaseAmount), 0)
                      : parseFloat(txn.purchaseAmount),
                })),
            isCompleted: budgetCycle.status !== 'active',
          };

          const currentSavings = currentCycle.totalMoneyAllocation - totalSpent;
          currentSavingsProgress = {
            goal: currentCycle.savingsTarget,
            current: currentSavings,
            percentage: currentCycle.savingsTarget > 0 ? (currentSavings / currentCycle.savingsTarget) * 100 : 0,
            status:
                currentSavings < 0 ||
                (currentCycle.savingsTarget > 0 && currentSavings / currentCycle.savingsTarget < 0.5)
                    ? 'Danger Zone'
                    : currentSavings / currentCycle.savingsTarget >= 0.9
                        ? 'Target Met'
                        : 'On Track',
          };
        }

        const overallCategorySummaries = overallAnalytics.categorySummaries || {};
        const totalSpent = isNaN(parseFloat(overallAnalytics.spentSoFar))
            ? (console.warn('Invalid overall spentSoFar:', overallAnalytics.spentSoFar), 0)
            : parseFloat(overallAnalytics.spentSoFar);
        const overallSpendingByCategory = Object.entries(overallCategorySummaries)
            .map(([category, summary]) => {
              const spent = isNaN(parseFloat(summary.totalSpentBase))
                  ? (console.warn(`Invalid totalSpentBase[${category}]:`, summary.totalSpentBase), 0)
                  : parseFloat(summary.totalSpentBase);
              const allocated = isNaN(parseFloat(summary.allocation))
                  ? (console.warn(`Invalid allocation for ${category}:`, summary.allocation), 0)
                  : parseFloat(summary.allocation);
              return {
                category,
                amount: spent,
                allocated,
                percentage: allocated > 0 ? (spent / allocated) * 100 : (spent / totalSpent) * 100,
              };
            })
            .filter((item) => item.amount > 0)
            .sort((a, b) => b.amount - a.amount);

        const overallSavingsProgress = {
          goal: isNaN(parseFloat(overallAnalytics.savingsTarget))
              ? (console.warn('Invalid savingsTarget:', overallAnalytics.savingsTarget), 0)
              : parseFloat(overallAnalytics.savingsTarget),
          current: isNaN(parseFloat(overallAnalytics.totalSavingsBase))
              ? (console.warn('Invalid totalSavingsBase:', overallAnalytics.totalSavingsBase), 0)
              : parseFloat(overallAnalytics.totalSavingsBase),
          percentage: isNaN(parseFloat(overallAnalytics.savingsAchievementRate))
              ? (console.warn('Invalid savingsAchievementRate:', overallAnalytics.savingsAchievementRate), 0)
              : parseFloat(overallAnalytics.savingsAchievementRate),
          status:
              overallAnalytics.savingsProgress === 'Positive' &&
              !isNaN(parseFloat(overallAnalytics.savingsAchievementRate)) &&
              parseFloat(overallAnalytics.savingsAchievementRate) >= 90
                  ? 'Target Met'
                  : overallAnalytics.savingsProgress === 'Positive'
                      ? 'On Track'
                      : 'Danger Zone',
        };

        const overallTopTransactions = hasBudgetCycle
            ? (Array.isArray(transactionsResponse.data)
                    ? transactionsResponse.data
                    : transactionsResponse.data.transactions || []
            )
                .filter((txn) => txn.isTransactionPerformedAfterRecommendation === 'yes')
                .sort((a, b) => (parseFloat(b.purchaseAmount) || 0) - (parseFloat(a.purchaseAmount) || 0))
                .slice(0, 3)
                .map((txn) => ({
                  amount: isNaN(parseFloat(txn.purchaseAmount))
                      ? (console.warn('Invalid purchaseAmount:', txn.purchaseAmount), 0)
                      : parseFloat(txn.purchaseAmount),
                }))
            : [];

        const overallInsights = [];
        const topOverallCategory = overallSpendingByCategory.reduce(
            (max, curr) => (curr.amount > max.amount ? curr : max),
            { amount: 0, category: '' },
        );
        if (topOverallCategory.percentage > 100 && topOverallCategory.allocated > 0) {
          overallInsights.push({
            id: '1',
            title: `${topOverallCategory.category} Overspending`,
            description: `You've spent ${topOverallCategory.percentage.toFixed(1)}% of your total ${
                topOverallCategory.category
            } allocation.`,
          });
        }
        if (overallSavingsProgress.percentage > 50 && overallSavingsProgress.current > 0) {
          overallInsights.push({
            id: '2',
            title: 'Strong Overall Savings',
            description: `You're ${overallSavingsProgress.percentage.toFixed(1)}% towards your total ${overallSavingsProgress.goal.toFixed(
                2,
            )} ${overallAnalytics.baseCurrency || 'AUD'} savings goal!`,
          });
        }
        if (overallAnalytics.warnings?.length) {
          overallAnalytics.warnings.forEach((warning, index) => {
            overallInsights.push({
              id: `warning-${index}`,
              title: 'Warning',
              description: warning,
            });
          });
        }
        if (overallAnalytics.spendingTrend) {
          overallInsights.push({
            id: 'spending-trend',
            title: 'Spending Trend',
            description: `Your spending is ${overallAnalytics.spendingTrend.toLowerCase()}.`,
          });
        }

        setAnalyticsData({
          current: {
            spendingByCategory: currentSpendingByCategory,
            currentCycle,
            savingsProgress: currentSavingsProgress,
            insights: [],
          },
          overall: {
            spendingByCategory: overallSpendingByCategory,
            totalSpent,
            totalAllocated: isNaN(parseFloat(overallAnalytics.totalMoneyAllocation))
                ? (console.warn('Invalid totalMoneyAllocation:', overallAnalytics.totalMoneyAllocation), 0)
                : parseFloat(overallAnalytics.totalMoneyAllocation),
            savingsProgress: overallSavingsProgress,
            topTransactions: overallTopTransactions,
            insights: overallInsights,
            averages: {
              savingsPerCycle: isNaN(parseFloat(overallAnalytics.avgSavingsPerCycle))
                  ? (console.warn('Invalid avgSavingsPerCycle:', overallAnalytics.avgSavingsPerCycle), 0)
                  : parseFloat(overallAnalytics.avgSavingsPerCycle),
              spentPerCycle: isNaN(parseFloat(overallAnalytics.avgSpentPerCycle))
                  ? (console.warn('Invalid avgSpentPerCycle:', overallAnalytics.avgSpentPerCycle), 0)
                  : parseFloat(overallAnalytics.avgSpentPerCycle),
              txnCount: isNaN(parseFloat(overallAnalytics.avgTxnCount))
                  ? (console.warn('Invalid avgTxnCount:', overallAnalytics.avgTxnCount), 0)
                  : parseFloat(overallAnalytics.avgTxnCount),
            },
            transactionStats: {
              max: isNaN(parseFloat(overallAnalytics.maxTxnAmount))
                  ? (console.warn('Invalid maxTxnAmount:', overallAnalytics.maxTxnAmount), 0)
                  : parseFloat(overallAnalytics.maxTxnAmount),
              median: isNaN(parseFloat(overallAnalytics.medianTxnAmount))
                  ? (console.warn('Invalid medianTxnAmount:', overallAnalytics.medianTxnAmount), 0)
                  : parseFloat(overallAnalytics.medianTxnAmount),
              min: isNaN(parseFloat(overallAnalytics.minTxnAmount))
                  ? (console.warn('Invalid minTxnAmount:', overallAnalytics.minTxnAmount), 0)
                  : parseFloat(overallAnalytics.minTxnAmount),
              avgDay: overallAnalytics.avgTxnDay || 'N/A',
            },
            predictions: {
              spendingNextCycle: isNaN(parseFloat(overallAnalytics.predictedSpendingNextCycle))
                  ? (console.warn('Invalid predictedSpendingNextCycle:', overallAnalytics.predictedSpendingNextCycle), 0)
                  : parseFloat(overallAnalytics.predictedSpendingNextCycle),
              savingsAchievementRate: isNaN(parseFloat(overallAnalytics.savingsAchievementRate))
                  ? (console.warn('Invalid savingsAchievementRate:', overallAnalytics.savingsAchievementRate), 0)
                  : parseFloat(overallAnalytics.savingsAchievementRate),
            },
            trends: {
              spending: overallAnalytics.spendingTrend || 'Stable',
              savings: overallAnalytics.totalSavingsBase < 0 ? 'Decreasing' : overallAnalytics.savingsTrend || 'Stable',
            },
            cycleCount: overallAnalytics.cycleCount || 0,
            currency: overallAnalytics.baseCurrency || 'AUD',
            mlSummary: overallAnalytics.mlSummary || '',
          },
        });

        console.log('ANALYTICS FETCHED:', {
          current: {
            totalSpent: currentCycle?.amount,
            hasBudgetCycle,
            spendingByCategoryCount: currentSpendingByCategory.length,
            transactionsCount: currentCycle?.topTransactions.length,
          },
          overall: {
            totalSpent: overallAnalytics.spentSoFar,
            cycleCount: overallAnalytics.cycleCount,
            transactionStats: overallAnalytics.transactionStats,
          },
        });

        console.log('ANALYTICS DEBUG:', {
          current: {
            totalSpent: currentCycle?.amount,
            spendingByCategory: currentSpendingByCategory,
            currentCycle,
            savingsProgress: currentSavingsProgress,
            filteredTransactionsCount: currentCycle?.topTransactions.length,
            insights: [],
          },
          overall: {
            totalSpent: overallAnalytics.spentSoFar,
            spendingByCategory: overallSpendingByCategory,
            savingsProgress: overallSavingsProgress,
            filteredTransactionsCount: overallTopTransactions.length,
            averages: {
              savingsPerCycle: overallAnalytics.avgSavingsPerCycle,
              spentPerCycle: overallAnalytics.avgSpentPerCycle,
              txnCount: overallAnalytics.avgTxnCount,
            },
            transactionStats: {
              max: overallAnalytics.maxTxnAmount,
              median: overallAnalytics.medianTxnAmount,
              min: overallAnalytics.maxTxnAmount,
              avgDay: overallAnalytics.avgTxnDay,
            },
            predictions: {
              spendingNextCycle: overallAnalytics.predictedSpendingNextCycle,
              savingsAchievementRate: overallAnalytics.savingsAchievementRate,
            },
            insights: overallInsights,
            mlSummary: overallAnalytics.mlSummary,
          },
        });

        setError(null);
      } catch (err) {
        console.error('Fetch analytics failed:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError(
            err.message === 'Network Error'
                ? 'Unable to connect to the server. Please check your network or try again later.'
                : 'Failed to load analytics. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId, budgetCycleId]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [view, analyticsData]);

  const renderCategoryBar = (category, index, isOverall = false) => {
    const isOverspending = category.percentage > 100 || (isOverall && category.amount > analyticsData.overall.totalAllocated / analyticsData.overall.spendingByCategory.length);
    return (
        <Animated.View key={index} style={[styles.categoryItem, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.categoryLabelContainer}>
            <Text style={styles.categoryLabel}>{category.category}</Text>
            <Text style={[styles.categoryAmount, isOverspending && styles.overspendingText]}>
              {analyticsData?.overall?.currency || 'AUD'} {category.amount.toFixed(2)}
              {category.allocated > 0 ? ` / ${category.allocated.toFixed(2)}` : ''}
            </Text>
          </View>
          <View style={styles.barContainer}>
            <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.min(category.percentage, 100)}%`,
                    backgroundColor: isOverspending ? '#FF6B6B' : isOverall ? '#4A90E2' : '#4CAF50',
                  },
                ]}
            />
          </View>
          <Text style={[styles.percentage, isOverspending && styles.overspendingText]}>
            {category.allocated > 0 ? `${category.percentage.toFixed(1)}%` : `${category.amount.toFixed(2)} AUD`}
          </Text>
        </Animated.View>
    );
  };

  const renderNoData = (title, message) => (
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>{message}</Text>
        </View>
      </Animated.View>
  );

  const renderCurrentCycleCharts = () => {
    if (!analyticsData?.current?.currentCycle) {
      return renderNoData(
          'Cycle Overview',
          'No cycle overview available due to no active cycle.'
      );
    }

    const { cycleName, amount, duration, totalMoneyAllocation, savingsTarget, topTransactions, isCompleted } =
        analyticsData.current.currentCycle;
    const currency = analyticsData?.overall?.currency || 'AUD';

    const overviewData = {
      labels: ['Spent', 'Budget', 'Savings Target'],
      datasets: [
        {
          data: [amount || 0, totalMoneyAllocation || 0, savingsTarget || 0],
          colors: [
            (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
            (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
            (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
          ],
        },
      ],
    };

    const pieData = topTransactions?.length
        ? topTransactions.map((txn, index) => ({
          name: `Txn ${index + 1}`,
          amount: txn.amount,
          color: ['#E53935', '#F7A1A1', '#F7E1A1'][index % 3],
          legendFontColor: '#666',
          legendFontSize: 12,
        }))
        : [{ name: 'No Data', amount: 1, color: '#E0E0E0', legendFontColor: '#666', legendFontSize: 12 }];

    return (
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>
            {cycleName} {isCompleted ? '(Completed)' : `(${duration})`}
          </Text>
          <View style={styles.chartCard}>
            <Text style={styles.subTitle}>Overview ({currency})</Text>
            <View style={styles.chartContainer} pointerEvents="none">
              <BarChart
                  data={overviewData}
                  width={screenWidth - 60}
                  height={200}
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForLabels: { fontSize: 10, fontWeight: '600' },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  withCustomBarColorFromData
              />
            </View>
          </View>
          <View style={styles.chartCard}>
            <Text style={styles.subTitle}>Top Recommended Transactions ({currency})</Text>
            {topTransactions?.length ? (
                <View style={styles.chartContainer} pointerEvents="none">
                  <PieChart
                      data={pieData}
                      width={screenWidth - 60}
                      height={200}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                        propsForLabels: { fontSize: 10, fontWeight: '600' },
                      }}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                      style={styles.chart}
                  />
                </View>
            ) : (
                <Text style={styles.noDataText}>No qualifying transactions after recommendation</Text>
            )}
          </View>
        </Animated.View>
    );
  };

  const renderOverallCharts = () => {
    if (!analyticsData?.overall) return renderNoData('Overall Analytics', 'No overall analytics data available.');

    const { totalSpent, totalAllocated, topTransactions, transactionStats } = analyticsData.overall;
    const currency = analyticsData.overall.currency || 'AUD';

    const overviewData = {
      labels: ['Spent', 'Budget'],
      datasets: [
        {
          data: [totalSpent || 0, totalAllocated || 0],
          colors: [
            (opacity = 1) => totalSpent > totalAllocated ? `rgba(255, 107, 107, ${opacity})` : `rgba(78, 205, 196, ${opacity})`,
            (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
          ],
        },
      ],
    };

    const pieData = topTransactions?.length
        ? topTransactions.map((txn, index) => ({
          name: `Txn ${index + 1}`,
          amount: txn.amount,
          color: ['#E53935', '#F7A1A1', '#F7E1A1'][index % 3],
          legendFontColor: '#666',
          legendFontSize: 12,
        }))
        : [{ name: 'No Data', amount: 1, color: '#E0E0E0', legendFontColor: '#666', legendFontSize: 12 }];

    const transactionDistributionData = {
      labels: ['Min', 'Median', 'Max'],
      datasets: [
        {
          data: [
            transactionStats.min || 0,
            transactionStats.median || 0,
            transactionStats.max || 0,
          ],
          colors: [
            (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
            (opacity = 1) => `rgba(247, 161, 161, ${opacity})`,
            (opacity = 1) => `rgba(247, 225, 161, ${opacity})`,
          ],
        },
      ],
    };

    return (
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Overall Analytics</Text>
          <View style={styles.chartCard}>
            <Text style={styles.subTitle}>Spending Overview ({currency})</Text>
            <View style={styles.chartContainer} pointerEvents="none">
              <BarChart
                  data={overviewData}
                  width={screenWidth - 60}
                  height={200}
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForLabels: { fontSize: 10, fontWeight: '600' },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  withCustomBarColorFromData
              />
            </View>
          </View>
          <View style={styles.chartCard}>
            <Text style={styles.subTitle}>Top Recommended Transactions ({currency})</Text>
            {topTransactions?.length ? (
                <View style={styles.chartContainer} pointerEvents="none">
                  <PieChart
                      data={pieData}
                      width={screenWidth - 60}
                      height={200}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                        propsForLabels: { fontSize: 10, fontWeight: '600' },
                      }}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                      style={styles.chart}
                  />
                </View>
            ) : (
                <Text style={styles.noDataText}>No qualifying transactions after recommendation</Text>
            )}
          </View>
          <View style={styles.chartCard}>
            <Text style={styles.subTitle}>Transaction Distribution ({currency})</Text>
            <View style={styles.chartContainer} pointerEvents="none">
              <BarChart
                  data={transactionDistributionData}
                  width={screenWidth - 60}
                  height={200}
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForLabels: { fontSize: 10, fontWeight: '600' },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  withCustomBarColorFromData
              />
            </View>
          </View>
        </Animated.View>
    );
  };

  const renderOverallSummary = () => {
    if (!analyticsData?.overall) return renderNoData('Your Money Summary', 'No summary data available.');

    const { averages, transactionStats, predictions, trends, cycleCount, currency } = analyticsData.overall;

    if (!cycleCount && !analyticsData.overall.totalSpent) {
      return renderNoData('Your Money Summary', 'No analytics data available. Create a budget cycle to see insights.');
    }

    return (
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Your Money Summary</Text>
          <View style={styles.chartCard}>
            <Text style={styles.subTitle}>Your Average Budget Cycles Habits</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryHeading}>Spending</Text>
              <Text style={styles.metricText}>
                {currency} {averages.spentPerCycle.toFixed(2)} (You typically spend this much each budget cycle)
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryHeading}>Savings</Text>
              <Text style={styles.metricText}>
                {currency} {averages.savingsPerCycle.toFixed(2)} (You usually save this amount each budget cycle)
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryHeading}>Purchases</Text>
              <Text style={styles.metricText}>
                {averages.txnCount.toFixed(0)} (Number of transactions you make each budget cycle)
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryHeading}>Spending Trend</Text>
              <Text style={styles.metricText}>
                {trends.spending} (Your spending is {trends.spending.toLowerCase()})
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryHeading}>Savings Trend</Text>
              <Text style={styles.metricText}>
                {trends.savings} (Your savings are {trends.savings.toLowerCase()})
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryHeading}>Transaction Stats</Text>
              <Text style={styles.metricText}>
                Max: {currency} {transactionStats.max.toFixed(2)}
              </Text>
              <Text style={styles.metricText}>
                Median: {currency} {transactionStats.median.toFixed(2)}
              </Text>
              <Text style={styles.metricText}>
                Min: {currency} {transactionStats.min.toFixed(2)}
              </Text>
              <Text style={styles.metricText}>Most Active Day: {transactionStats.avgDay}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryHeading}>Predictions</Text>
              <Text style={styles.metricText}>
                Next Cycle Spending: {currency} {predictions.spendingNextCycle.toFixed(2)}
              </Text>
              <Text style={styles.metricText}>
                Savings Goal Progress: {predictions.savingsAchievementRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </Animated.View>
    );
  };

  const renderSavingsProgress = () => {
    if (view === 'current' && !analyticsData?.current?.savingsProgress) {
      return renderNoData(
          'Savings Progress',
          'No savings progress available due to no active cycle.'
      );
    }
    if (view === 'overall' && !analyticsData?.overall?.savingsProgress) {
      return renderNoData('Savings Progress', 'No overall savings progress data available.');
    }

    const savingsProgress = view === 'current' ? analyticsData.current.savingsProgress : analyticsData.overall.savingsProgress;
    const currency = analyticsData?.overall?.currency || 'AUD';

    const progressData = {
      labels: ['Savings'],
      data: [Math.max(savingsProgress.percentage / 100, 0)],
      colors: [(opacity = 1) => savingsProgress.current < 0 ? `rgba(255, 107, 107, ${opacity})` : `rgba(78, 205, 196, ${opacity})`],
    };

    return (
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Savings Progress</Text>
          <View style={styles.chartCard}>
            <Text style={styles.subTitle}>
              {view === 'current' ? 'Current Cycle' : 'Overall'} Savings
            </Text>
            <Text style={styles.metricText}>
              Goal: {currency} {savingsProgress.goal.toFixed(2)}
            </Text>
            <Text style={[styles.metricText, savingsProgress.current < 0 && styles.overspendingText]}>
              Current: {currency} {savingsProgress.current.toFixed(2)}
            </Text>
            <Text style={styles.metricText}>Status: {savingsProgress.status}</Text>
            <View style={styles.chartContainer} pointerEvents="none">
              <ProgressChart
                  data={progressData}
                  width={screenWidth - 60}
                  height={180}
                  strokeWidth={16}
                  radius={60}
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                  }}
                  hideLegend
                  style={styles.chart}
              />
            </View>
          </View>
        </Animated.View>
    );
  };

  const renderSpendingByCategory = () => {
    const spendingByCategory =
        view === 'current' ? analyticsData?.current?.spendingByCategory : analyticsData?.overall?.spendingByCategory;

    if (view === 'current' && !spendingByCategory?.length) {
      return renderNoData(
          'Spending by Category',
          'No spending data available due to no active cycle.'
      );
    }
    if (view === 'overall' && !spendingByCategory?.length) {
      return renderNoData('Spending by Category', 'No overall spending data.');
    }

    return (
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.chartCard}>
            <Text style={styles.subTitle}>How Your Money is Spent ({analyticsData?.overall?.currency || 'AUD'})</Text>
            {spendingByCategory.map((category, index) => renderCategoryBar(category, index, view === 'overall'))}
          </View>
        </Animated.View>
    );
  };

  const renderInsights = () => {
    const insights = view === 'current' ? analyticsData?.current?.insights : analyticsData?.overall?.insights;

    if (view === 'current' && !insights?.length) {
      return renderNoData(
          'Key Insights',
          'No insights available due to no active cycle.'
      );
    }
    if (view === 'overall' && !insights?.length) {
      return renderNoData('Key Insights', 'No overall insights available.');
    }

    return (
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          <View style={styles.chartCard}>
            {insights.map((insight) => (
                <View key={insight.id} style={styles.insightItem}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
            ))}
          </View>
        </Animated.View>
    );
  };

  const renderAIInsights = () => {
    if (view !== 'overall' || !analyticsData?.overall?.mlSummary) {
      return null;
    }

    const parsedInsights = parseMarkdown(analyticsData.overall.mlSummary);
    const specialHeadings = ['Spending Overview', 'Savings Performance', 'Category Concerns', 'Warnings', 'Recommendation'];

    return (
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <View style={styles.chartCard}>
            {parsedInsights.map((component) => (
                <Text
                    key={component.key}
                    style={[
                      styles.insightDescription,
                      component.type === 'bullet' && styles.insightBullet,
                      component.type === 'text' && styles.insightHeading,
                      component.type === 'text' && specialHeadings.some(heading => component.content.startsWith(heading)) && styles.insightSpecialHeading,
                    ]}
                >
                  {component.type === 'bullet' ? '• ' : ''}{component.content}
                </Text>
            ))}
          </View>
        </Animated.View>
    );
  };

  if (isLoading) {
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading your analytics...</Text>
          </View>
        </SafeAreaView>
    );
  }

  if (!userId) {
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Please sign in to view analytics</Text>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('SignIn')}
            >
              <Text style={styles.actionButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  if (error || !analyticsData || (!analyticsData.current && !analyticsData.overall)) {
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || 'No analytics data available.'}</Text>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setIsLoading(true);
                  setError(null);
                  fetchAnalytics();
                }}
            >
              <Text style={styles.actionButtonText}>Retry</Text>
            </TouchableOpacity>
            {error?.includes('Unable to connect') && (
                <Text style={styles.errorHint}>
                  Ensure the server is running and your device is connected.
                </Text>
            )}
          </View>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
              style={[styles.tab, view === 'current' && styles.activeTab]}
              onPress={() => setView('current')}
          >
            <Text style={[styles.tabText, view === 'current' && styles.activeTabText]}>Current Cycle</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={[styles.tab, view === 'overall' && styles.activeTab]}
              onPress={() => setView('overall')}
          >
            <Text style={[styles.tabText, view === 'overall' && styles.activeTabText]}>Overall</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {view === 'current' ? renderCurrentCycleCharts() : renderOverallCharts()}
          {renderSavingsProgress()}
          {renderSpendingByCategory()}
          {renderInsights()}
          {view === 'overall' && renderAIInsights()}
          {view === 'overall' && renderOverallSummary()}
        </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4A90E2',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  noDataContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  chart: {
    borderRadius: 12,
  },
  metricText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  overspendingText: {
    color: '#FF6B6B',
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  categoryAmount: {
    fontSize: 16,
    color: '#374151',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  insightItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  insightBullet: {
    marginLeft: 12,
    marginBottom: 8,
  },
  insightHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  insightSpecialHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginVertical: 10,
  },
  summaryItem: {
    marginBottom: 12,
  },
  summaryHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4A90E2',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#374151',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AnalyticsScreen;