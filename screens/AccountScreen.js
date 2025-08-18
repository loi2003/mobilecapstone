import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, logout } from '../../api/auth';
import { Alert } from 'react-native';


const AccountScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          throw new Error('No auth token found');
        }
        const response = await getCurrentUser(token);
        console.log('User data:', response.data);
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        navigation.replace('Login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [navigation]);


const handleLogout = async () => {
  try {
    const userId = user?.data?.id;
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      console.error('No auth token found');
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
      return;
    }

     await logout(userId, token);

    await AsyncStorage.removeItem('authToken');

    // ✅ Thông báo khi thành công
    Alert.alert('Thông báo', 'Đăng xuất thành công!');
    console.log('✅ Logout thành công cho userId:', userId);

    navigation.replace('Login');
  } catch (error) {
    console.error('❌ Logout failed:', error.response?.data || error);
    await AsyncStorage.removeItem('authToken');
    navigation.replace('Login');
  }
};

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text>Welcome, {user?.data?.userName || 'User'}!</Text>
      <Text>Email: {user?.data?.email}</Text>
      <Text>Phone: {user?.data?.phoneNumber || 'Not provided'}</Text>
      <Button title="Logout" onPress={handleLogout} />
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
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AccountScreen;