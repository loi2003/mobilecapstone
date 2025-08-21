import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { register, verifyOtp } from '../../api/auth';
import { Svg, Circle, Path } from 'react-native-svg';
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
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (showOtpForm && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowOtpForm(false);
            setErrors({ ...errors, server: 'OTP has expired. Please register again.' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpForm, timer]);

  useEffect(() => {
    if (errors.server || successMessage) {
      const timeout = setTimeout(() => {
        setErrors({ ...errors, server: '' });
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [errors.server, successMessage]);

  const validateUsername = (value) => {
    if (!value) return 'Please enter your username';
    if (value.length < 3) return 'Username must be at least 3 characters';
    return '';
  };

  const validateEmail = (value) => {
    if (!value) return 'Please enter your email';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email address';
    return '';
  };

  const validatePhoneNo = (value) => {
    if (value && !/^\d{10,15}$/.test(value)) return 'Invalid phone number';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Please enter a password';
    if (value.length < 6) return 'Password must be at least 6 characters';
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
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = async () => {
    setErrors({ ...errors, server: '' });
    setSuccessMessage('');
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
      setSuccessMessage('Registration successful! Please enter the OTP sent to your email.');
      setShowOtpForm(true);
      setTimer(120);
    } catch (error) {
      setErrors({
        ...errors,
        server: error.response?.data?.message || 'Registration failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setErrors({ ...errors, otp: '', server: '' });
    setSuccessMessage('');
    setIsLoading(true);
    if (!otp || otp.length !== 6) {
      setErrors({ ...errors, otp: 'Please enter a 6-digit OTP' });
      setIsLoading(false);
      return;
    }
    try {
      await verifyOtp({ email, otp });
      setSuccessMessage('OTP verification successful! Your account has been activated.');
      setShowOtpForm(false);
      setOtp('');
      setTimer(0);
      setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    } catch (error) {
      setErrors({
        ...errors,
        otp: error.response?.data?.message || 'Invalid OTP',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#ff9cbb', '#ffffff']}
      style={styles.section}
    >
      <View style={styles.container}>
        <View style={styles.formContainer}>
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
                <TextInput
                  style={[styles.input, errors.otp && styles.inputError]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#4b5563"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
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
                <Text style={styles.buttonText}>{isLoading ? 'Verifying...' : 'Verify OTP'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={[styles.input, errors.username && styles.inputError]}
                  placeholder="Enter your username"
                  placeholderTextColor="#4b5563"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  placeholderTextColor="#4b5563"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number (Optional)</Text>
                <TextInput
                  style={[styles.input, errors.phoneNo && styles.inputError]}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#4b5563"
                  value={phoneNo}
                  onChangeText={setPhoneNo}
                  keyboardType="phone-pad"
                />
                {errors.phoneNo && <Text style={styles.errorText}>{errors.phoneNo}</Text>}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError, { paddingRight: 40 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#4b5563"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
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
                    style={[styles.input, errors.confirmPassword && styles.inputError, { paddingRight: 40 }]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#4b5563"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
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
                <Text style={styles.buttonText}>{isLoading ? 'Registering...' : 'Sign Up'}</Text>
              </TouchableOpacity>
            </>
          )}
          {(errors.server || successMessage) && (
            <View style={[styles.notification, errors.server ? styles.notificationError : styles.notificationSuccess]}>
              <Text style={styles.notificationText}>{errors.server || successMessage}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  section: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    borderColor: '#ff7aa2',
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
    backgroundColor: '#ff9cbb',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ffb8cc',
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
  notification: {
    position: 'absolute',
    top: 10,
    right: 10,
    left: 10,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },
  notificationSuccess: {
    backgroundColor: '#fff0f5',
    borderWidth: 1,
    borderColor: '#ff9cbb',
  },
  notificationError: {
    backgroundColor: '#ffe6e6',
    borderWidth: 1,
    borderColor: '#ff7aa2',
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
    flex: 1,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#ff7aa2',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;