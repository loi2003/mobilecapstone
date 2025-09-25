import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import { register, verifyOtp } from '../../api/auth';
import { Svg, Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [timer, setTimer] = useState(120);
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    phoneNo: '',
    password: '',
    confirmPassword: '',
    otp: '',
    server: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef(null);
  const usernameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneNoInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const otpInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (showOtpForm && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowOtpForm(false);
            setErrors({ ...errors, server: 'OTP has expired. Please register again.' });
            Alert.alert('OTP Error', 'OTP has expired. Please register again.', [{ text: 'OK' }]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpForm, timer]);

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

  const validateUsername = (value) => {
    if (!value) return 'Please enter your username';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (/\s/.test(value)) return 'Username cannot contain spaces';
    return '';
  };

  const validateEmail = (value) => {
    if (!value) return 'Please enter your email';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email address';
    return '';
  };

  const validatePhoneNo = (value) => {
    if (value) {
      // Vietnamese phone number: starts with 0, followed by 9 digits, with valid mobile prefixes
      const vnPhoneRegex = /^0(3[2-9]|5[689]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
      if (!vnPhoneRegex.test(value)) return 'Invalid Vietnamese phone number (e.g., 09xxxxxxxx)';
    }
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Please enter a password';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must contain at least one special character';
    return '';
  };

  const validateConfirmPassword = (value, password) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return "Passwords don't match";
    return '';
  };

  const validateForm = () => {
    const newErrors = {
      username: validateUsername(username),
      email: validateEmail(email),
      phoneNo: validatePhoneNo(phoneNo),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
      otp: '',
      server: '',
    };
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

  const handleSubmit = async () => {
    setErrors({ ...errors, server: '', email: '' });
    setIsLoading(true);
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('UserName', username);
    formData.append('Email', email);
    formData.append('PhoneNo', phoneNo || '');
    formData.append('PasswordHash', password);
    try {
      await register(formData);
      Alert.alert('Success', 'Registration successful! Please enter the OTP sent to your email.', [{ text: 'OK' }]);
      setShowOtpForm(true);
      setTimer(120);
    } catch (error) {
      if (error.response?.status === 400) {
        setErrors({ ...errors, server: 'Something wrong, please check your email and input data', email: '' });
        Alert.alert('Registration Error', 'Something wrong, please check your email and input data', [{ text: 'OK' }]);
      } else if (error.response?.data?.message?.toLowerCase().includes('email already exists')) {
        setErrors({ ...errors, email: 'Email already exists', server: '' });
        Alert.alert('Registration Error', 'Email already exists', [{ text: 'OK' }]);
      } else {
        const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
        setErrors({ ...errors, server: errorMessage, email: '' });
        Alert.alert('Registration Error', errorMessage, [{ text: 'OK' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setErrors({ ...errors, otp: '', server: '' });
    setIsLoading(true);
    if (!otp || otp.length !== 6) {
      const otpError = 'Please enter a 6-digit OTP';
      setErrors({ ...errors, otp: otpError });
      Alert.alert('OTP Error', otpError, [{ text: 'OK' }]);
      setIsLoading(false);
      return;
    }
    try {
      await verifyOtp({ email, otp });
      Alert.alert('Success', 'OTP verification successful! Your account has been activated.', [{ text: 'OK' }]);
      setShowOtpForm(false);
      setOtp('');
      setTimer(0);
      setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    } catch (error) {
      if (error.response?.status === 400) {
        setErrors({ ...errors, otp: 'Something wrong, please check your email and input data', server: '' });
        Alert.alert('OTP Error', 'Something wrong, please check your email and input data', [{ text: 'OK' }]);
      } else {
        const otpError = error.response?.data?.message || 'Invalid OTP';
        setErrors({ ...errors, otp: otpError });
        Alert.alert('OTP Error', otpError, [{ text: 'OK' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = (inputRef) => {
    if (scrollViewRef.current && inputRef.current) {
      inputRef.current.measure((x, y, width, height, pageX, pageY) => {
        const keyboardGap = 10; // Small gap between keyboard and input
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
            <Animatable.View
              animation={{
                from: { opacity: 0, translateX: -30 },
                to: { opacity: 1, translateX: 0 },
              }}
              duration={800}
              easing="ease-out"
              style={styles.formContainer}
            >
              <TouchableOpacity
                style={styles.logoContainer}
                onPress={() => navigation.navigate('Home')}
              >
                <Svg width={80} height={80} viewBox="0 0 64 64">
                  <Circle cx="32" cy="32" r="30" fill="rgba(255, 255, 255, 0.1)" />
                  <Circle cx="32" cy="32" r="20" fill="#FFD6E7" stroke="#FFFFFF" strokeWidth={1.5} />
                  <Circle cx="26" cy="28" r="3" fill="#333" />
                  <Circle cx="38" cy="28" r="3" fill="#333" />
                  <Circle cx="22" cy="32" r="2.5" fill="#FFB6C1" fillOpacity={0.8} />
                  <Circle cx="42" cy="32" r="2.5" fill="#FFB6C1" fillOpacity={0.8} />
                  <Path d="M26 38 Q32 42 38 38" stroke="#333" strokeWidth={2} fill="none" strokeLinecap="round" />
                  <Path d="M32 12 Q34 8 36 12" stroke="#333" strokeWidth={1.5} fill="none" />
                </Svg>
              </TouchableOpacity>
              <Text style={styles.formTitle}>{showOtpForm ? 'Verify OTP' : 'Sign Up'}</Text>
              {showOtpForm ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>OTP</Text>
                    <TextInput
                      ref={otpInputRef}
                      style={[styles.input, errors.otp && styles.inputError]}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#4b5563"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="numeric"
                      maxLength={6}
                      onFocus={() => handleInputFocus(otpInputRef)}
                    />
                    {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
                  </View>
                  <Text style={styles.timer}>
                    Time remaining: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleOtpSubmit}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#1E40AF', '#10B981']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>{isLoading ? 'Verifying...' : 'Verify OTP'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                      ref={usernameInputRef}
                      style={[styles.input, errors.username && styles.inputError]}
                      placeholder="Enter your username"
                      placeholderTextColor="#4b5563"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      onFocus={() => handleInputFocus(usernameInputRef)}
                    />
                    {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      ref={emailInputRef}
                      style={[styles.input, errors.email && styles.inputError]}
                      placeholder="Enter your email"
                      placeholderTextColor="#4b5563"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => handleInputFocus(emailInputRef)}
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number (Optional)</Text>
                    <TextInput
                      ref={phoneNoInputRef}
                      style={[styles.input, errors.phoneNo && styles.inputError]}
                      placeholder="Enter your phone number (e.g., 09xxxxxxxx)"
                      placeholderTextColor="#4b5563"
                      value={phoneNo}
                      onChangeText={setPhoneNo}
                      keyboardType="phone-pad"
                      onFocus={() => handleInputFocus(phoneNoInputRef)}
                    />
                    {errors.phoneNo && <Text style={styles.errorText}>{errors.phoneNo}</Text>}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={passwordInputRef}
                        style={[styles.input, errors.password && styles.inputError, { paddingRight: 40 }]}
                        placeholder="Enter your password"
                        placeholderTextColor="#4b5563"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        onFocus={() => handleInputFocus(passwordInputRef)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Feather
                          name={showPassword ? 'eye' : 'eye-off'}
                          size={20}
                          color="#4b5563"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={confirmPasswordInputRef}
                        style={[styles.input, errors.confirmPassword && styles.inputError, { paddingRight: 40 }]}
                        placeholder="Confirm your password"
                        placeholderTextColor="#4b5563"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        onFocus={() => handleInputFocus(confirmPasswordInputRef)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        <Feather
                          name={showConfirmPassword ? 'eye' : 'eye-off'}
                          size={20}
                          color="#4b5563"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                  </View>
                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#1E40AF', '#10B981']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>{isLoading ? 'Registering...' : 'Sign Up'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.linkText}>Already have an account? Sign In</Text>
              </TouchableOpacity>
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
    maxWidth: 400,
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    padding: 4,
  },
  buttonGradient: {
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  timer: {
    textAlign: 'center',
    color: '#4b5563',
    fontSize: 14,
    marginVertical: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;