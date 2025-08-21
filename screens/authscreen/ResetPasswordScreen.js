import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import { resetPassword } from '../../api/auth';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { emailOrPhone } = route.params;
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ otp: '', newPassword: '', confirmPassword: '', server: '' });

  const validateForm = () => {
    const newErrors = { otp: '', newPassword: '', confirmPassword: '', server: '' };
    let isValid = true;

    if (!otp.trim()) {
      newErrors.otp = 'Please enter the OTP code';
      isValid = false;
    } else if (otp.trim().length < 4) {
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
      return;
    }

    setIsLoading(true);
    setErrors({ ...errors, server: '' });
    try {
      const payload = {
        emailOrPhoneNumber: emailOrPhone,
        Token: otp.trim(),
        newPassword,
      };
      const response = await resetPassword(payload);
      Alert.alert('Success', 'Password reset successfully. Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.Token?.join(', ') ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to reset password. Please check the OTP and try again.';
      setErrors({ ...errors, server: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.description}>
              Enter the OTP sent to {emailOrPhone} and set a new password.
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
            <Text style={styles.formTitle}>Set New Password</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>OTP Code</Text>
              <TextInput
                style={[styles.input, errors.otp ? styles.inputError : null]}
                placeholder="Enter OTP code"
                value={otp}
                onChangeText={setOtp}
                autoCapitalize="none"
                placeholderTextColor="#4B5563"
              />
              {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, errors.newPassword ? styles.inputError : null]}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#4B5563"
                />
                <TouchableOpacity onPress={toggleShowPassword} style={styles.passwordToggle}>
                  <Feather
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#4B5563"
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#4B5563"
                />
                <TouchableOpacity onPress={toggleShowConfirmPassword} style={styles.passwordToggle}>
                  <Feather
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#4B5563"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#1E40AF', '#10B981']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Processing...' : 'Reset Password'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            {errors.server && (
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
                <Text style={styles.notificationText}>{errors.server}</Text>
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
  passwordWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
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

export default ResetPasswordScreen;