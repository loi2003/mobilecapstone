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
import { Header } from './HomeScreen';
import { Ionicons } from '@expo/vector-icons';

const AIAdviceScreen = ({ navigation }) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const handleQuestionSubmit = () => {
    if (!question.trim()) {
      setSubmissionStatus('Please enter a question.');
      setTimeout(() => setSubmissionStatus(null), 3000);
      return;
    }
    // Placeholder AI response (replace with actual AI integration later)
    const mockResponse = `Thank you for your question: "${question}". Our AI suggests consulting a healthcare professional for personalized advice. For general guidance, ensure a balanced diet, stay hydrated, and follow your doctor's recommendations.`;
    setResponse(mockResponse);
    setSubmissionStatus('Question submitted successfully!');
    setQuestion('');
    setTimeout(() => setSubmissionStatus(null), 3000);
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Pregnancy Advice</Text>
          <Text style={styles.sectionDescription}>
            Ask our AI for general pregnancy advice. For personalized guidance, consult your healthcare provider.
          </Text>
          <View style={styles.querySection}>
            <Text style={styles.queryTitle}>Ask a Question</Text>
            <TextInput
              style={styles.queryInput}
              placeholder="Enter your pregnancy question..."
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={4}
              placeholderTextColor="#6B7280"
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleQuestionSubmit}
              accessibilityLabel="Submit AI question"
            >
              <Text style={styles.buttonText}>Get AI Advice</Text>
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
            {response && (
              <View style={styles.responseSection}>
                <Text style={styles.responseTitle}>AI Response</Text>
                <Text style={styles.responseText}>{response}</Text>
              </View>
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
  responseSection: {
    width: '100%',
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 20,
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
  responseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  responseText: {
    fontSize: 14,
    color: '#555',
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

export default AIAdviceScreen;