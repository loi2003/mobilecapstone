import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { register, verifyOtp } from '../../api/auth';

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

  // Timer effect for OTP
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

  // Clear notification after 5 seconds
  useEffect(() => {
    if (errors.server || successMessage) {
      const timeout = setTimeout(() => {
        setErrors({ ...errors, server: '' });
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [errors.server, successMessage]);

  // Validation functions
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

  // Validate entire form on submit
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

  // Form submission
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

  // OTP submission
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
    <View style={styles.container}>
      <Text style={styles.title}>{showOtpForm ? 'Verify OTP' : 'Sign Up'}</Text>
      {showOtpForm ? (
        <>
          <TextInput
            style={[styles.input, errors.otp && styles.inputError]}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
          />
          {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
          <Text style={styles.timer}>
            Time remaining: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </Text>
          <Button 
            title={isLoading ? 'Verifying...' : 'Verify OTP'} 
            onPress={handleOtpSubmit} 
            disabled={isLoading}
          />
        </>
      ) : (
        <>
          <TextInput
            style={[styles.input, errors.username && styles.inputError]}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          
          <TextInput
            style={[styles.input, errors.phoneNo && styles.inputError]}
            placeholder="Phone Number (Optional)"
            value={phoneNo}
            onChangeText={setPhoneNo}
            keyboardType="phone-pad"
          />
          {errors.phoneNo && <Text style={styles.errorText}>{errors.phoneNo}</Text>}
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, errors.password && styles.inputError, styles.passwordInput]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Text>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError, styles.passwordInput]}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Text>{showConfirmPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          
          <Button 
            title={isLoading ? 'Registering...' : 'Sign Up'} 
            onPress={handleSubmit} 
            disabled={isLoading}
          />
        </>
      )}
      {(errors.server || successMessage) && (
        <Text style={[styles.notification, errors.server ? styles.errorText : styles.successText]}>
          {errors.server || successMessage}
        </Text>
      )}
      <TouchableOpacity 
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginText}>Already have an account? Sign In</Text>
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
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 10,
    fontSize: 14,
  },
  successText: {
    color: '#34c759',
    marginBottom: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  notification: {
    marginVertical: 10,
    textAlign: 'center',
  },
  timer: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#007AFF',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    padding: 10,
  },
});

export default RegisterScreen;