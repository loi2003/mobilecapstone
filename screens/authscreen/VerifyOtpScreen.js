import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { verifyOtp } from '../../api/auth';

const VerifyOtpScreen = ({ route, navigation }) => {
  const { emailOrPhone } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = { EmailOrPhoneNumber: emailOrPhone, Otp: otp };
      const response = await verifyOtp(payload);
      Alert.alert('Success', 'OTP verified successfully.');
      navigation.navigate('ResetPassword', { emailOrPhone });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter the OTP sent to {emailOrPhone}.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
      />
      <Button
        title={isLoading ? 'Verifying...' : 'Verify OTP'}
        onPress={handleVerifyOtp}
        disabled={isLoading || !otp.trim()}
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

export default VerifyOtpScreen;