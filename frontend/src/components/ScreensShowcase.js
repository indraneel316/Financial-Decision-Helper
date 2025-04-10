import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenPreview from '../components/ScreenPreview';

const ScreensShowcase = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Financial Decision Helper App Screens</Text>
      
      {/* Onboarding Screen */}
      <ScreenPreview 
        title="Onboarding Screen" 
        description="Multi-step onboarding process for new users to set up their profile and financial goals."
      >
        <View style={styles.mockScreen}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.activeStep]}></View>
            <View style={styles.stepLine}></View>
            <View style={styles.stepDot}></View>
            <View style={styles.stepLine}></View>
            <View style={styles.stepDot}></View>
          </View>
          
          <Text style={styles.screenTitle}>Tell us about yourself</Text>
          
          <View style={styles.mockInput}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.textInput}></View>
          </View>
          
          <View style={styles.mockInput}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.textInput}></View>
          </View>
          
          <View style={styles.mockInput}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.textInput}></View>
          </View>
          
          <View style={styles.mockButton}>
            <Text style={styles.buttonText}>Continue</Text>
          </View>
        </View>
      </ScreenPreview>
      
      {/* Home Screen */}
      <ScreenPreview 
        title="Home Screen" 
        description="Dashboard showing budget overview, recent transactions, and quick access to main features."
      >
        <View style={styles.mockScreen}>
          <View style={styles.mockHeader}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>John</Text>
            </View>
          </View>
          
          <View style={styles.mockCard}>
            <Text style={styles.cardTitle}>Current Budget Cycle</Text>
            <Text style={styles.budgetTitle}>March 2025</Text>
            <View style={styles.budgetRow}>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetValue}>$1,500</Text>
                <Text style={styles.budgetLabel}>Total</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetValue}>$850</Text>
                <Text style={styles.budgetLabel}>Spent</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetValue}>$650</Text>
                <Text style={styles.budgetLabel}>Left</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.menuGrid}>
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}></View>
              <Text style={styles.menuText}>Transactions</Text>
            </View>
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}></View>
              <Text style={styles.menuText}>Budget</Text>
            </View>
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}></View>
              <Text style={styles.menuText}>Recommendations</Text>
            </View>
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}></View>
              <Text style={styles.menuText}>Analytics</Text>
            </View>
          </View>
          
          <View style={styles.recentTransactions}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <View style={styles.transaction}>
              <View>
                <Text style={styles.transactionName}>Grocery Shopping</Text>
                <Text style={styles.transactionCategory}>Food</Text>
              </View>
              <Text style={styles.transactionAmount}>-$45.67</Text>
            </View>
            <View style={styles.transaction}>
              <View>
                <Text style={styles.transactionName}>Gas Station</Text>
                <Text style={styles.transactionCategory}>Transportation</Text>
              </View>
              <Text style={styles.transactionAmount}>-$35.00</Text>
            </View>
          </View>
        </View>
      </ScreenPreview>
      
      {/* Budget Cycle Screen */}
      <ScreenPreview 
        title="Budget Cycle Screen" 
        description="Create and manage budget cycles with category allocations."
      >
        <View style={styles.mockScreen}>
          <Text style={styles.screenTitle}>Create Budget Cycle</Text>
          
          <View style={styles.mockSection}>
            <Text style={styles.sectionTitle}>Budget Cycle Details</Text>
            
            <View style={styles.mockInput}>
              <Text style={styles.inputLabel}>Cycle Name</Text>
              <View style={styles.textInput}></View>
            </View>
            
            <View style={styles.dateContainer}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <View style={styles.textInput}></View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>End Date</Text>
                <View style={styles.textInput}></View>
              </View>
            </View>
            
            <View style={styles.mockInput}>
              <Text style={styles.inputLabel}>Total Budget</Text>
              <View style={styles.textInput}></View>
            </View>
          </View>
          
          <View style={styles.mockSection}>
            <Text style={styles.sectionTitle}>Budget Categories</Text>
            
            <View style={styles.categoryItem}>
              <Text>Food</Text>
              <View style={styles.categoryInput}></View>
            </View>
            <View style={styles.categoryItem}>
              <Text>Transportation</Text>
              <View style={styles.categoryInput}></View>
            </View>
            <View style={styles.categoryItem}>
              <Text>Entertainment</Text>
              <View style={styles.categoryInput}></View>
            </View>
            
            <View style={styles.summaryItem}>
              <Text>Remaining:</Text>
              <Text style={styles.remainingAmount}>$500.00</Text>
            </View>
          </View>
          
          <View style={styles.mockButton}>
            <Text style={styles.buttonText}>Save Budget Cycle</Text>
          </View>
        </View>
      </ScreenPreview>
      
      {/* Transaction Screen */}
      <ScreenPreview 
        title="Transaction Screen" 
        description="Log and manage financial transactions with category tagging."
      >
        <View style={styles.mockScreen}>
          <View style={styles.mockHeader}>
            <Text style={styles.screenTitle}>Transactions</Text>
            <View style={styles.addButton}>
              <Text style={{color: '#fff'}}>+ Add</Text>
            </View>
          </View>
          
          <View style={styles.transactionList}>
            <View style={styles.transactionItem}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionTitle}>Grocery Shopping</Text>
                <Text style={styles.transactionAmount}>-$45.67</Text>
              </View>
              <View style={styles.transactionFooter}>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>Food</Text>
                </View>
                <Text style={styles.dateText}>03/10/2025</Text>
              </View>
            </View>
            
            <View style={styles.transactionItem}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionTitle}>Gas Station</Text>
                <Text style={styles.transactionAmount}>-$35.00</Text>
              </View>
              <View style={styles.transactionFooter}>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>Transportation</Text>
                </View>
                <Text style={styles.dateText}>03/09/2025</Text>
              </View>
            </View>
            
            <View style={styles.transactionItem}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionTitle}>Movie Tickets</Text>
                <Text style={styles.transactionAmount}>-$24.99</Text>
              </View>
              <View style={styles.transactionFooter}>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>Entertainment</Text>
                </View>
                <Text style={styles.dateText}>03/08/2025</Text>
              </View>
            </View>
          </View>
        </View>
      </ScreenPreview>
      
      {/* Recommendation Screen */}
      <ScreenPreview 
        title="Recommendation Screen" 
        description="AI-powered financial recommendations with reasoning and impact analysis."
      >
        <View style={styles.mockScreen}>
          <Text style={styles.screenTitle}>AI Recommendations</Text>
          
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>Reduce Food Spending</Text>
            <Text style={styles.recommendationDesc}>You've spent 30% more on food this month compared to your budget.</Text>
            
            <View style={styles.reasoningBox}>
              <Text style={styles.reasoningTitle}>Chain-of-Thought Reasoning:</Text>
              <Text style={styles.reasoningText}>Your food spending is $450 this month, which is $150 over your budget of $300. This pattern could impact your savings goal.</Text>
            </View>
            
            <View style={styles.actionBox}>
              <Text style={styles.actionTitle}>Recommended Action:</Text>
              <Text>Consider meal planning and cooking at home more often to reduce expenses.</Text>
            </View>
            
            <View style={styles.impactBox}>
              <Text style={styles.impactTitle}>Financial Impact:</Text>
              <Text>Saving $150 monthly on food would add $1,800 to your annual savings.</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <View style={styles.approveButton}>
                <Text style={{color: '#fff'}}>Approve</Text>
              </View>
              <View style={styles.delayButton}>
                <Text>Delay</Text>
              </View>
            </View>
          </View>
        </View>
      </ScreenPreview>
      
      {/* Analytics Screen */}
      <ScreenPreview 
        title="Analytics Screen" 
        description="Visual analytics and insights about spending patterns and savings progress."
      >
        <View style={styles.mockScreen}>
          <Text style={styles.screenTitle}>Analytics</Text>
          
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            
            <View style={styles.categoryBar}>
              <View style={styles.categoryLabel}>
                <Text>Food</Text>
                <Text>$450</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.bar, {width: '70%', backgroundColor: '#4CAF50'}]}></View>
              </View>
              <Text style={styles.percentage}>30%</Text>
            </View>
            
            <View style={styles.categoryBar}>
              <View style={styles.categoryLabel}>
                <Text>Transportation</Text>
                <Text>$200</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.bar, {width: '40%', backgroundColor: '#2196F3'}]}></View>
              </View>
              <Text style={styles.percentage}>13.3%</Text>
            </View>
          </View>
          
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>Savings Progress</Text>
            
            <View style={styles.savingsContainer}>
              <View style={styles.savingsHeader}>
                <Text>Savings Goal Progress</Text>
                <Text>$3,200 / $5,000</Text>
              </View>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, {width: '64%'}]}></View>
              </View>
              <Text style={styles.progressText}>64% Complete</Text>
            </View>
          </View>
          
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>Insights</Text>
            
            <View style={styles.insightItem}>
              <Text style={styles.insightTitle}>Food Spending Trend</Text>
              <Text>Your food spending has increased by 15% compared to last month.</Text>
            </View>
          </View>
        </View>
      </ScreenPreview>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  mockScreen: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
  },
  activeStep: {
    backgroundColor: '#4CAF50',
    width: 12,
    height: 12,
  },
  stepLine: {
    height: 2,
    width: 30,
    backgroundColor: '#ddd',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  mockInput: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  textInput: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  mockButton: {
    height: 25,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 12,
    color: '#666',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mockCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetItem: {
    alignItems: 'center',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  budgetLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  menuIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 5,
  },
  menuText: {
    fontSize: 12,
  },
  recentTransactions: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionName: {
    fontSize: 14,
    color: '#333',
  },
  transactionCategory: {
    fontSize: 10,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E53935',
  },
  mockSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInput: {
    width: 60,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  remainingAmount: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  transactionList: {
    marginTop: 10,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  categoryTagText: {
    fontSize: 10,
    color: '#666',
  },
  dateText: {
    fontSize: 10,
    color: '#888',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  recommendationDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  reasoningBox: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasoningTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reasoningText: {
    fontSize: 12,
    color: '#666',
  },
  actionBox: {
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  impactBox: {
    marginBottom: 15,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  delayButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  analyticsSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  categoryBar: {
    marginBottom: 10,
  },
  categoryLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  barContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
    marginTop: 2,
  },
  savingsContainer: {
    alignItems: 'center',
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  progressContainer: {
    height: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  insightItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default ScreensShowcase;
