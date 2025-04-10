import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

const OnboardingScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    income: '',
    savingsGoal: '',
  });

  const handleChange = (field, value) => {
    setUserData({ ...userData, [field]: value });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigation.navigate('Home');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Welcome to Financial Decision Helper</Text>
              <Text style={styles.stepDescription}>
                Let's get started by setting up your profile.
              </Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    value={userData.name}
                    onChangeText={(text) => handleChange('name', text)}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    value={userData.email}
                    onChangeText={(text) => handleChange('email', text)}
                />
              </View>
            </View>
        );
      case 2:
        return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Financial Information</Text>
              <Text style={styles.stepDescription}>
                Now, let's understand your financial situation.
              </Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Monthly Income</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                    value={userData.income}
                    onChangeText={(text) => handleChange('income', text)}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Monthly Savings Goal</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                    value={userData.savingsGoal}
                    onChangeText={(text) => handleChange('savingsGoal', text)}
                />
              </View>
            </View>
        );
      case 3:
        return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>You're All Set!</Text>
              <Text style={styles.stepDescription}>
                Thank you for providing your information.
              </Text>
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Your Profile Summary</Text>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Name:</Text>
                  <Text style={styles.summaryValue}>{userData.name}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Email:</Text>
                  <Text style={styles.summaryValue}>{userData.email}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Monthly Income:</Text>
                  <Text style={styles.summaryValue}>${userData.income}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Savings Goal:</Text>
                  <Text style={styles.summaryValue}>${userData.savingsGoal}</Text>
                </View>
              </View>
            </View>
        );
      default:
        return null;
    }
  };

  return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((item) => (
                <View
                    key={item}
                    style={[
                      styles.progressDot,
                      { backgroundColor: step >= item ? '#4CAF50' : '#E0E0E0' },
                    ]}
                />
            ))}
          </View>
          {renderStep()}
          <View style={styles.buttonContainer}>
            {step > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {step === 3 ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContainer: { flexGrow: 1, padding: 20 },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 20 },
  progressDot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 5 },
  stepContainer: { flex: 1, marginBottom: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  stepDescription: { fontSize: 16, color: '#666', marginBottom: 20, lineHeight: 22 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, color: '#333' },
  input: { backgroundColor: '#FFF', borderRadius: 8, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#DDD' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  backButton: { backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', flex: 1, marginRight: 10, alignItems: 'center' },
  backButtonText: { color: '#333', fontSize: 16, fontWeight: '600' },
  nextButton: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, flex: 1, marginLeft: 10, alignItems: 'center' },
  nextButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  summaryContainer: { backgroundColor: '#FFF', borderRadius: 8, padding: 20, marginVertical: 20, borderWidth: 1, borderColor: '#DDD' },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  summaryItem: { flexDirection: 'row', marginBottom: 10 },
  summaryLabel: { fontSize: 16, color: '#666', width: 150 },
  summaryValue: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1 },
});

export default OnboardingScreen;