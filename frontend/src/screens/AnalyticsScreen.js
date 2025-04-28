import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
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
        let currentInsights = [];

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
            OtherExpenses: 'allocatedOtherExpenses',
          };

          const totalSpent = isNaN(parseFloat(budgetCycle.spentSoFar))
              ? (console.warn('Invalid spentSoFar:', budgetCycle.spentSoFar), 0)
              : parseFloat(budgetCycle.spentSoFar);
          const categorySpent = budgetCycle.categorySpent || {};
          currentSpendingByCategory = Object.entries(categoryAllocations)
              .map(([category, allocatedField]) => {
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
                  percentage: allocated > 0 ? (amount / allocated) * 100 : (amount / totalSpent) * 100,
                };
              })
              .filter((item) => item.amount > 0 || item.allocated > 0)
              .sort((a, b) => b.amount - a.amount);

          currentCycle = {
            budgetCycleId: localBudgetCycleId,
            cycleName: budgetCycle.cycleName || 'Completed Cycle',
            amount: totalSpent,
            duration: budgetCycle.duration || 'monthly',
            startDate: budgetCycle.startDate || new Date().toISOString(),
            endDate: budgetCycle.endDate || new Date().toISOString(),
            totalMoneyAllocation: isNaN(parseFloat(budgetCycle.totalMoneyAllocation))
                ? (console.warn('Invalid totalMoneyAllocation:', budgetCycle.totalMoneyAllocation), 0)
                : parseFloat(budgetCycle.totalMoneyAllocation),
            savingsTarget: isNaN(parseFloat(budgetCycle.savingsTarget))
                ? (console.warn('Invalid savingsTarget:', budgetCycle.savingsTarget), 5000)
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
            isCompleted: budgetCycle.status === 'completed' || !budgetCycle.isActive,
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

          const topCurrentCategory = currentSpendingByCategory.reduce(
              (max, curr) => (curr.amount > max.amount ? curr : max),
              { amount: 0, category: '' },
          );
          if (topCurrentCategory.percentage > 100 && topCurrentCategory.allocated > 0) {
            currentInsights.push({
              id: '1',
              title: `${topCurrentCategory.category} Overspending`,
              description: `You've spent ${topCurrentCategory.percentage.toFixed(1)}% of your ${
                  topCurrentCategory.category
              } allocation.`,
            });
          }
          if (currentSavingsProgress.percentage > 50 && currentSavingsProgress.current > 0) {
            currentInsights.push({
              id: '2',
              title: 'Great Savings Progress',
              description: `You're ${currentSavingsProgress.percentage.toFixed(1)}% towards your ${currentCycle.savingsTarget.toFixed(
                  2,
              )} ${overallAnalytics.baseCurrency || 'AUD'} goal!`,
            });
          } else if (currentSavingsProgress.percentage < 0) {
            currentInsights.push({
              id: '2',
              title: 'Overspending Alert',
              description: `You've exceeded your budget by ${Math.abs(
                  currentSavingsProgress.current,
              ).toFixed(2)} ${overallAnalytics.baseCurrency || 'AUD'}.`,
            });
          }
        }

        const overallCategorySummaries = overallAnalytics.categorySummaries || {};
        const totalSpent = isNaN(parseFloat(overallAnalytics.spentSoFar))
            ? (console.warn('Invalid overall spentSoFar:', overallAnalytics.spentSoFar), 0)
            : parseFloat(overallAnalytics.spentSoFar);
        const overallSpendingByCategory = Object.entries(overallAnalytics.categorySpent || {})
            .map(([category, amount]) => {
              const summary = overallCategorySummaries[category] || {};
              const spent = isNaN(parseFloat(amount))
                  ? (console.warn(`Invalid categorySpent[${category}]:`, amount), 0)
                  : parseFloat(amount);
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
              ? (console.warn('Invalid savingsTarget:', overallAnalytics.savingsTarget), 300)
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
            insights: currentInsights,
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
            insights: currentInsights,
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
              min: overallAnalytics.minTxnAmount,
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

  const renderCategoryBar = (category, index, isOverall = false) => {
    const isOverspending = category.percentage > 100 || (isOverall && category.amount > analyticsData.overall.totalAllocated / analyticsData.overall.spendingByCategory.length);
    return (
        <View key={index} style={styles.categoryItem}>
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
        </View>
    );
  };

  const renderNoDataCard = (title, message) => (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.noDataCard}>
          <Text style={styles.noDataText}>{message}</Text>
          <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('BudgetCycle')}
          >
            <Text style={styles.actionButtonText}>Create Budget Cycle</Text>
          </TouchableOpacity>
        </View>
      </View>
  );

  const renderCurrentCycleCharts = () => {
    if (!analyticsData?.current?.currentCycle) {
      return renderNoDataCard(
          'Cycle Overview',
          'No active budget cycle data available. Create a new cycle to track your spending.'
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {cycleName} ({duration}) {isCompleted ? '(Completed)' : ''}
          </Text>
          <View style={styles.card}>
            <Text style={styles.subTitle}>Overview ({currency})</Text>
            <View style={styles.chartContainer} pointerEvents="none">
              <BarChart
                  data={overviewData}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForLabels: { fontSize: 12, fontWeight: '600' },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  withCustomBarColorFromData
              />
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.subTitle}>Top Recommended Transactions ({currency})</Text>
            {topTransactions?.length ? (
                <View style={styles.chartContainer} pointerEvents="none">
                  <PieChart
                      data={pieData}
                      width={screenWidth - 80}
                      height={220}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                        propsForLabels: { fontSize: 12, fontWeight: '600' },
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
        </View>
    );
  };

  const renderOverallCharts = () => {
    if (!analyticsData?.overall) return renderNoDataCard('Overall Analytics', 'No overall analytics data available.');

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Analytics</Text>
          <View style={styles.card}>
            <Text style={styles.subTitle}>Spending Overview ({currency})</Text>
            <View style={styles.chartContainer} pointerEvents="none">
              <BarChart
                  data={overviewData}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForLabels: { fontSize: 12, fontWeight: '600' },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  withCustomBarColorFromData
              />
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.subTitle}>Top Recommended Transactions ({currency})</Text>
            {topTransactions?.length ? (
                <View style={styles.chartContainer} pointerEvents="none">
                  <PieChart
                      data={pieData}
                      width={screenWidth - 80}
                      height={220}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                        propsForLabels: { fontSize: 12, fontWeight: '600' },
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
          <View style={styles.card}>
            <Text style={styles.subTitle}>Transaction Distribution ({currency})</Text>
            <View style={styles.chartContainer} pointerEvents="none">
              <BarChart
                  data={transactionDistributionData}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForLabels: { fontSize: 12, fontWeight: '600' },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  withCustomBarColorFromData
              />
            </View>
          </View>
        </View>
    );
  };

  const renderOverallSummary = () => {
    if (!analyticsData?.overall) return renderNoDataCard('Overall Summary', 'No overall summary data available.');

    const { averages, transactionStats, predictions, trends, cycleCount, currency } = analyticsData.overall;

    if (!cycleCount && !analyticsData.overall.totalSpent) {
      return renderNoDataCard('Overall Summary', 'No analytics data available. Create a budget cycle to see insights.');
    }

    return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Summary</Text>
          <View style={styles.card}>
            <Text style={styles.subTitle}>Averages per Cycle</Text>
            <Text style={styles.summaryText}>
              Savings: {currency} {averages.savingsPerCycle.toFixed(2)}
            </Text>
            <Text style={styles.summaryText}>
              Spent: {currency} {averages.spentPerCycle.toFixed(2)}
            </Text>
            <Text style={styles.summaryText}>Transactions: {averages.txnCount.toFixed(0)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.subTitle}>Transaction Stats</Text>
            <Text style={styles.summaryText}>
              Max: {currency} {transactionStats.max.toFixed(2)}
            </Text>
            <Text style={styles.summaryText}>
              Median: {currency} {transactionStats.median.toFixed(2)}
            </Text>
            <Text style={styles.summaryText}>
              Min: {currency} {transactionStats.min.toFixed(2)}
            </Text>
            <Text style={styles.summaryText}>Most Active Day: {transactionStats.avgDay}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.subTitle}>Predictions</Text>
            <Text style={styles.summaryText}>
              Next Cycle Spending: {currency} {predictions.spendingNextCycle.toFixed(2)}
            </Text>
            <Text style={styles.summaryText}>
              Savings Goal Progress: {predictions.savingsAchievementRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.subTitle}>Trends</Text>
            <Text style={styles.summaryText}>Spending: {trends.spending}</Text>
            <Text style={styles.summaryText}>Savings: {trends.savings}</Text>
          </View>
        </View>
    );
  };

  const renderSavingsProgress = () => {
    if (view === 'current' && !analyticsData?.current?.savingsProgress) {
      return renderNoDataCard('Savings Progress', 'No savings progress data available for the current cycle.');
    }
    if (view === 'overall' && !analyticsData?.overall?.savingsProgress) {
      return renderNoDataCard('Savings Progress', 'No overall savings progress data available.');
    }

    const savingsProgress = view === 'current' ? analyticsData.current.savingsProgress : analyticsData.overall.savingsProgress;
    const currency = analyticsData?.overall?.currency || 'AUD';

    const progressData = {
      labels: ['Savings'],
      data: [Math.max(savingsProgress.percentage / 100, 0)],
      colors: [(opacity = 1) => savingsProgress.current < 0 ? `rgba(255, 107, 107, ${opacity})` : `rgba(78, 205, 196, ${opacity})`],
    };

    return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings Progress</Text>
          <View style={styles.card}>
            <Text style={styles.subTitle}>
              {view === 'current' ? 'Current Cycle' : 'Overall'} Savings
            </Text>
            <Text style={styles.summaryText}>
              Goal: {currency} {savingsProgress.goal.toFixed(2)}
            </Text>
            <Text style={[styles.summaryText, savingsProgress.current < 0 && styles.overspendingText]}>
              Current: {currency} {savingsProgress.current.toFixed(2)}
            </Text>
            <Text style={styles.summaryText}>Status: {savingsProgress.status}</Text>
            <View style={styles.chartContainer} pointerEvents="none">
              <ProgressChart
                  data={progressData}
                  width={screenWidth - 80}
                  height={220}
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
        </View>
    );
  };

  const renderSpendingByCategory = () => {
    const spendingByCategory =
        view === 'current' ? analyticsData?.current?.spendingByCategory : analyticsData?.overall?.spendingByCategory;

    if (!spendingByCategory?.length) {
      return renderNoDataCard(
          'Spending by Category',
          view === 'current' ? 'No spending data for the current cycle.' : 'No overall spending data.'
      );
    }

    return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.card}>
            {spendingByCategory.map((category, index) => renderCategoryBar(category, index, view === 'overall'))}
          </View>
        </View>
    );
  };

  const renderInsights = () => {
    const insights = view === 'current' ? analyticsData?.current?.insights : analyticsData?.overall?.insights;

    if (!insights?.length) {
      return renderNoDataCard(
          'Insights',
          view === 'current' ? 'No insights available for the current cycle.' : 'No overall insights available.'
      );
    }

    return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.card}>
            {insights.map((insight) => (
                <View key={insight.id} style={styles.insightItem}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
            ))}
          </View>
        </View>
    );
  };

  const renderAIInsights = () => {
    if (view !== 'overall' || !analyticsData?.overall?.mlSummary) {
      return renderNoDataCard('AI Insights', 'No AI insights available.');
    }

    const parsedInsights = parseMarkdown(analyticsData.overall.mlSummary);

    return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <View style={styles.card}>
            {parsedInsights.map((component) => (
                <Text
                    key={component.key}
                    style={[
                      styles.insightDescription,
                      component.type === 'bullet' && styles.insightBullet,
                    ]}
                >
                  {component.type === 'bullet' ? '• ' : ''}{component.content}
                </Text>
            ))}
          </View>
        </View>
    );
  };

  console.log('RENDER', { isLoading, error, analyticsData: !!analyticsData, view });

  if (isLoading) {
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        </SafeAreaView>
    );
  }

  if (!userId) {
    return (
        <SafeAreaView style={styles.container}>
          <Text style={styles.errorText}>Please sign in to view analytics.</Text>
          <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.actionButtonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </SafeAreaView>
    );
  }

  if (error || !analyticsData || (!analyticsData.current && !analyticsData.overall)) {
    return (
        <SafeAreaView style={styles.container}>
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
                Ensure the server is running at {API_BASE_URL} and your device is on the same network.
              </Text>
          )}
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
          {renderAIInsights()}
          {view === 'overall' && renderOverallSummary()}
        </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  noDataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  summaryText: {
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
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  percentage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  insightItem: {
    marginBottom: 12,
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
  },
  insightBullet: {
    marginLeft: 12,
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
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  errorHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 20,
  },
});

export default AnalyticsScreen;