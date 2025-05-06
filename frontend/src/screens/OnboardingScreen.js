import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';

const OnboardingScreen = ({ navigation }) => {
  const { completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    incomeLevel: '',
    occupationLevel: '',
    maritalStatus: 'Single',
    familySize: '1',
    timeZone: 'UTC',
    currency: 'USD',
    psychologicalNotes: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.age || !formData.incomeLevel || !formData.occupationLevel) {
          Alert.alert('Error', 'Please fill in all required fields');
          return false;
        }
        if (parseInt(formData.incomeLevel) <= 0) {
          Alert.alert('Error', 'Monthly income must be greater than 0');
          return false;
        }
        break;
      case 2:
        if (!formData.familySize) {
          Alert.alert('Error', 'Please fill in all required fields');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await completeOnboarding({
        ...formData,
        age: parseInt(formData.age),
        familySize: parseInt(formData.familySize)
      });
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personal Information</Text>
            <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={formData.age}
                onChangeText={(value) => handleChange('age', value)}
                placeholder="Enter your age"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly Income</Text>
              <TextInput
                style={styles.input}
                value={formData.incomeLevel}
                onChangeText={(value) => handleChange('incomeLevel', value)}
                placeholder="Enter your monthly income"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occupation</Text>
              <TextInput
                style={styles.input}
                value={formData.occupationLevel}
                onChangeText={(value) => handleChange('occupationLevel', value)}
                placeholder="Enter your occupation"
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Family Information</Text>
            <Text style={styles.stepSubtitle}>Tell us about your family</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Marital Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.maritalStatus}
                  onValueChange={(value) => handleChange('maritalStatus', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Single" value="Single" />
                  <Picker.Item label="Married" value="Married" />
                  <Picker.Item label="Divorced" value="Divorced" />
                  <Picker.Item label="Widowed" value="Widowed" />
                  <Picker.Item label="Separated" value="Separated" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Family Size</Text>
              <TextInput
                style={styles.input}
                value={formData.familySize}
                onChangeText={(value) => handleChange('familySize', value)}
                placeholder="Number of family members"
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Preferences</Text>
            <Text style={styles.stepSubtitle}>Set your preferences</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Currency</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.currency}
                  onValueChange={(value) => handleChange('currency', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="USD - US Dollar" value="USD" />
                  <Picker.Item label="EUR - Euro" value="EUR" />
                  <Picker.Item label="GBP - British Pound" value="GBP" />
                  <Picker.Item label="INR - Indian Rupee" value="INR" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time Zone</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.timeZone}
                  onValueChange={(value) => handleChange('timeZone', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="UTC - Coordinated Universal Time" value="UTC" />
                  <Picker.Item label="EST - Eastern Standard Time" value="EST" />
                  <Picker.Item label="PST - Pacific Standard Time" value="PST" />
                  <Picker.Item label="IST - Indian Standard Time" value="IST" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.psychologicalNotes}
                onChangeText={(value) => handleChange('psychologicalNotes', value)}
                placeholder="Any financial habits or preferences you'd like to share"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.reviewContainer}>
              <Text style={styles.reviewTitle}>Review Your Information</Text>
              <Text style={styles.reviewText}>Age: {formData.age}</Text>
              <Text style={styles.reviewText}>Monthly Income: {formData.incomeLevel}</Text>
              <Text style={styles.reviewText}>Occupation: {formData.occupationLevel}</Text>
              <Text style={styles.reviewText}>Marital Status: {formData.maritalStatus}</Text>
              <Text style={styles.reviewText}>Family Size: {formData.familySize}</Text>
              <Text style={styles.reviewText}>Currency: {formData.currency}</Text>
              <Text style={styles.reviewText}>Time Zone: {formData.timeZone}</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(currentStep / 3) * 100}%` }]} />
        </View>
        {renderStep()}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < 3 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.nextButton, loading && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextButtonText}>Complete Setup</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContainer: { flexGrow: 1, padding: 20 },
  progressContainer: { height: 4, backgroundColor: '#E0E0E0', marginBottom: 20 },
  progressBar: { height: '100%', backgroundColor: '#4CAF50' },
  stepContainer: { flex: 1, marginBottom: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  stepSubtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff' },
  picker: { height: 50 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 40 },
  backButton: { padding: 15, borderRadius: 8, backgroundColor: '#f0f0f0', minWidth: 100, alignItems: 'center' },
  backButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  nextButton: { padding: 15, borderRadius: 8, backgroundColor: '#4CAF50', minWidth: 100, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.7 },
  reviewContainer: { marginTop: 20, padding: 15, backgroundColor: '#f8f8f8', borderRadius: 8 },
  reviewTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  reviewText: { fontSize: 14, color: '#666', marginBottom: 5 },
});

export default OnboardingScreen;