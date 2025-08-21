import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import { forgotPassword } from '../../api/auth';

const ForgotPasswordScreen = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleForgotPassword = async () => {
    if (!emailOrPhone.trim()) {
      setError('Please enter your email.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await forgotPassword(emailOrPhone);
      setError('');
      Alert.alert('Success', 'OTP sent successfully. Please check your email.', [
        { text: 'OK', onPress: () => navigation.navigate('ResetPassword', { emailOrPhone }) },
      ]);
    } catch (error) {
      let errorMessage = 'An error occurred. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = 'No account found with this email.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1E40AF', '#10B981']}
      style={styles.gradientBackground}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Background Decorative Shapes */}
          <View style={[styles.shape, styles.shape1]} />
          <View style={[styles.shape, styles.shape2]} />
          <View style={[styles.shape, styles.shape3]} />

          {/* Branding Section */}
          <Animatable.View
            animation={{
              from: { opacity: 0, translateX: -30 },
              to: { opacity: 1, translateX: 0 },
            }}
            duration={800}
            easing="ease-out"
            style={styles.branding}
          >
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.description}>
              Enter your email to receive an OTP for password reset.
            </Text>
            <Text style={styles.quote}>
              "Making the journey of motherhood easier with our support!"
            </Text>
          </Animatable.View>

          {/* Form Section */}
          <Animatable.View
            animation={{
              from: { opacity: 0, scale: 0.95, translateY: 20 },
              to: { opacity: 1, scale: 1, translateY: 0 },
            }}
            duration={800}
            easing="ease-out"
            style={styles.formContainer}
          >
            <Text style={styles.formTitle}>Reset Your Password</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="Enter your email"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#4B5563"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#1E40AF', '#10B981']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            {error && (
              <Animatable.View
                animation="fadeIn"
                duration={400}
                style={styles.notificationError}
              >
                <Feather
                  name="alert-circle"
                  size={24}
                  color="#EF4444"
                  style={styles.notificationIcon}
                />
                <Text style={styles.notificationText}>{error}</Text>
              </Animatable.View>
            )}
            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 800,
    alignItems: 'center',
  },
  shape: {
    position: 'absolute',
    backgroundColor: 'rgba(30, 64, 175, 0.3)',
    borderRadius: 9999,
  },
  shape1: {
    top: -50,
    left: -50,
    width: 150,
    height: 150,
    opacity: 0.5,
  },
  shape2: {
    top: '20%',
    right: -25,
    width: 125,
    height: 125,
    opacity: 0.5,
  },
  shape3: {
    bottom: -75,
    left: 50,
    width: 100,
    height: 100,
    opacity: 0.5,
  },
  branding: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  quote: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.9,
    fontWeight: '300',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  signInButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonGradient: {
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  notificationError: {
    position: 'absolute',
    top: -80,
    right: 20,
    left: 20,
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  notificationIcon: {
    marginRight: 8,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  linksContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
    marginVertical: 5,
  },
});

export default ForgotPasswordScreen;