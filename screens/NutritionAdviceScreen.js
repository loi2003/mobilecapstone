import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { homepageData } from '../data/homepageData';
import { Header } from './HomeScreen';
import { Ionicons } from '@expo/vector-icons';

const NutritionAdviceScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const handleQuerySubmit = () => {
    if (!query.trim()) {
      setSubmissionStatus('Please enter a query.');
      setTimeout(() => setSubmissionStatus(null), 3000);
      return;
    }
    console.log('Nutrition query submitted:', query);
    setSubmissionStatus('Query submitted successfully!');
    setQuery('');
    setTimeout(() => setSubmissionStatus(null), 3000);
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Advice</Text>
          <Text style={styles.sectionDescription}>
            Discover healthy eating tips tailored for each trimester of your pregnancy journey.
          </Text>
          {homepageData.healthTips.items.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={styles.tipTitle}>{tip.trimester}</Text>
              {tip.tips.map((item, idx) => (
                <Text key={idx} style={styles.tipText}>• {item}</Text>
              ))}
            </View>
          ))}
          <View style={styles.querySection}>
            <Text style={styles.queryTitle}>Ask a Nutrition Question</Text>
            <TextInput
              style={styles.queryInput}
              placeholder="Enter your nutrition question..."
              value={query}
              onChangeText={setQuery}
              multiline
              numberOfLines={4}
              placeholderTextColor="#6B7280"
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleQuerySubmit}
              accessibilityLabel="Submit nutrition query"
            >
              <Text style={styles.buttonText}>Submit Query</Text>
            </TouchableOpacity>
            {submissionStatus && (
              <Text
                style={[
                  styles.submissionStatus,
                  submissionStatus.includes('successfully')
                    ? styles.submissionStatusSuccess
                    : styles.submissionStatusError,
                ]}
              >
                {submissionStatus}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back to Home"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 90,
  },
  section: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: '90%',
  },
  tipItem: {
    width: '90%',
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  querySection: {
    width: '90%',
    marginTop: 20,
    alignItems: 'center',
  },
  queryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  queryInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6b9fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  submissionStatus: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  submissionStatusSuccess: {
    color: '#10B981',
  },
  submissionStatusError: {
    color: '#EF4444',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e6da4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NutritionAdviceScreen;