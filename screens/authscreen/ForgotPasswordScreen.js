import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { forgotPassword } from '../../api/auth';

const ForgotPasswordScreen = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!emailOrPhone.trim()) {
      Alert.alert('Error', 'Please enter your email .');
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword(emailOrPhone);
      Alert.alert('Success', 'OTP sent successfully. Please check your email .');
      navigation.navigate('ResetPassword', { emailOrPhone });
    } catch (error) {
      if (error.response?.status === 404) {
        Alert.alert('Error', 'No account found with this email.');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive an OTP for password reset.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Email here"
        value={emailOrPhone}
        onChangeText={setEmailOrPhone}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        title={isLoading ? 'Sending...' : 'Send OTP'}
        onPress={handleForgotPassword}
        disabled={isLoading || !emailOrPhone.trim()}
      />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;