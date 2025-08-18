import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { resetPassword } from '../../api/auth';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { emailOrPhone } = route.params;
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ otp: '', newPassword: '', confirmPassword: '' });

  const validateForm = () => {
    const newErrors = { otp: '', newPassword: '', confirmPassword: '' };
    let isValid = true;

    if (!otp.trim()) {
      newErrors.otp = 'Please enter the OTP code';
      isValid = false;
    } else if (otp.trim().length < 4) { // Adjust based on expected OTP length
      newErrors.otp = 'OTP must be at least 4 characters';
      isValid = false;
    }

    if (!newPassword) {
      newErrors.newPassword = 'Please enter a new password';
      isValid = false;
    } else {
      if (newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
        isValid = false;
      }
      if (!/[A-Z]/.test(newPassword)) {
        newErrors.newPassword = 'Password must contain at least one uppercase letter';
        isValid = false;
      }
      if (!/[@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
        newErrors.newPassword = 'Password must contain at least one special character';
        isValid = false;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    if (isLoading) {
      console.log('Request already in progress, ignoring...');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting password reset process...');
      console.log('Input OTP:', otp.trim());
      console.log('Input Email/Phone:', emailOrPhone);
      console.log('Input New Password:', newPassword);

      const payload = {
        emailOrPhoneNumber: emailOrPhone, // Adjust case if API expects different naming
        Token: otp.trim(), // Changed from 'otp' to 'Token' to match API error
        newPassword,
      };
      console.log('Sending reset password payload:', payload);

      const response = await resetPassword(payload);
      console.log('Reset password API response:', response);

      Alert.alert('Success', 'Password reset successfully. Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      console.error('Reset password error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        tokenErrors: error.response?.data?.errors?.Token, // Log specific Token errors
      });
      const errorMessage =
        error.response?.data?.errors?.Token?.join(', ') ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to reset password. Please check the OTP and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      console.log('Password reset process completed.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter the OTP sent to {emailOrPhone} and set a new password.
      </Text>
      <TextInput
        style={[styles.input, errors.otp ? styles.inputError : null]}
        placeholder="OTP Code"
        value={otp}
        onChangeText={setOtp}
        // Removed keyboardType="numeric" to allow alphanumeric input
        autoCapitalize="none" // Prevent auto-capitalization
      />
      {errors.otp ? <Text style={styles.error}>{errors.otp}</Text> : null}
      <TextInput
        style={[styles.input, errors.newPassword ? styles.inputError : null]}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      {errors.newPassword ? <Text style={styles.error}>{errors.newPassword}</Text> : null}
      <TextInput
        style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {errors.confirmPassword ? <Text style={styles.error}>{errors.confirmPassword}</Text> : null}
      <Button
        title={isLoading ? 'Processing...' : 'Reset Password'}
        onPress={handleResetPassword}
        disabled={isLoading || !otp.trim() || !newPassword || !confirmPassword}
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
    backgroundColor: '#fff',
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
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    color: '#EF4444',
    marginBottom: 10,
    textAlign: 'center',
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

export default ResetPasswordScreen;