import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, KeyboardAvoidingView, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import { forgotPassword } from '../../api/auth';
import { Svg, Circle, Path } from 'react-native-svg';

const ForgotPasswordScreen = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ emailOrPhone: '' });
  const scrollViewRef = useRef(null);
  const emailInputRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const validateForm = () => {
    let newErrors = { emailOrPhone: '' };

    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(emailOrPhone)) {
      newErrors.emailOrPhone = 'Invalid email format';
    }

    setErrors(newErrors);
    const errorMessages = Object.values(newErrors)
      .filter((error) => error)
      .join('\n');
    if (errorMessages) {
      Alert.alert('Validation Error', errorMessages, [{ text: 'OK' }]);
      return false;
    }
    return true;
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    setErrors({ emailOrPhone: '' });

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      await forgotPassword(emailOrPhone);
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
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = (inputRef) => {
    if (scrollViewRef.current && inputRef.current) {
      inputRef.current.measure((x, y, width, height, pageX, pageY) => {
        const keyboardGap = 10;
        const offset = pageY + height + keyboardGap - keyboardHeight / 2;
        scrollViewRef.current.scrollTo({ y: offset, animated: true });
      });
    }
  };

  return (
    <LinearGradient
      colors={['#1E40AF', '#10B981']}
      style={styles.gradientBackground}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={[styles.shape, styles.shape1]} />
            <View style={[styles.shape, styles.shape2]} />
            <View style={[styles.shape, styles.shape3]} />
            <Animatable.View
              animation={{
                from: { opacity: 0, translateX: -30 },
                to: { opacity: 1, translateX: 0 },
              }}
              duration={800}
              easing="ease-out"
              style={styles.branding}
            >
              <Svg width={80} height={80} viewBox="0 0 64 64">
                <Circle cx="32" cy="32" r="30" fill="rgba(255, 255, 255, 0.1)" />
                <Circle
                  cx="32"
                  cy="32"
                  r="20"
                  fill="#FFD6E7"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                <Circle cx="26" cy="28" r="3" fill="#333" />
                <Circle cx="38" cy="28" r="3" fill="#333" />
                <Circle
                  cx="22"
                  cy="32"
                  r="2.5"
                  fill="#FFB6C1"
                  fillOpacity={0.8}
                />
                <Circle
                  cx="42"
                  cy="32"
                  r="2.5"
                  fill="#FFB6C1"
                  fillOpacity={0.8}
                />
                <Path
                  d="M26 38 Q32 42 38 38"
                  stroke="#333"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d="M32 12 Q34 8 36 12"
                  stroke="#333"
                  strokeWidth={1.5}
                  fill="none"
                />
              </Svg>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.description}>
                Enter your email to receive an OTP for password reset.
              </Text>
              <Text style={styles.quote}>
                "Making the journey of motherhood easier with our support!"
              </Text>
            </Animatable.View>
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
                  ref={emailInputRef}
                  style={[styles.input, errors.emailOrPhone ? styles.inputError : null]}
                  placeholder="Enter your email"
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#4B5563"
                  onFocus={() => handleInputFocus(emailInputRef)}
                />
                {errors.emailOrPhone ? <Text style={styles.errorText}>{errors.emailOrPhone}</Text> : null}
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
              <View style={styles.linksContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.linkText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: '100%',
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