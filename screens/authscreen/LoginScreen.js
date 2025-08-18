import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../../api/auth';
import { Alert } from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const payload = {
        Email: email,
        PasswordHash: password,
      };
      const response = await login(payload);
      const token = response.data.data.accessToken;
      await AsyncStorage.setItem('authToken', token);
      navigation.replace('HomeTabs');
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert('Đăng nhập thất bại', 'Email hoặc mật khẩu không chính xác.');
      } else if (error.response?.status === 404) {
        Alert.alert('Đăng nhập thất bại', 'Tài khoản không tồn tại.');
      } else {
        Alert.alert(
          'Đăng nhập thất bại',
          error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title={isLoading ? 'Logging in...' : 'Login'}
          onPress={handleLogin}
          disabled={isLoading}
          color="#007AFF"
        />
        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>Create a New Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
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
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  forgotButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  forgotText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  registerButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  registerText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;