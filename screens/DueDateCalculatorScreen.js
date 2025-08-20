import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, logout } from '../api/auth';
import { Header, Footer } from './HomeScreen';

const DueDateCalculatorScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const response = await getCurrentUser(token);
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        navigation.replace('Login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [navigation]);

  const calculateDueDate = () => {
    // Simplified due date calculation: Add 280 days to last period date
    if (lastPeriodDate) {
      const date = new Date(lastPeriodDate);
      date.setDate(date.getDate() + 280);
      setDueDate(date.toDateString());
    }
  };

  const handleLogout = async () => {
    try {
      const userId = user?.data?.id;
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        await AsyncStorage.removeItem('authToken');
        navigation.replace('Login');
        return;
      }
      await logout(userId, token);
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout failed:', error);
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Due Date Calculator</Text>
          <Text style={styles.sectionDescription}>
            Enter the first day of your last menstrual period to estimate your due date.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={lastPeriodDate}
            onChangeText={setLastPeriodDate}
            keyboardType="default"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={calculateDueDate}
          >
            <Text style={styles.buttonText}>Calculate</Text>
          </TouchableOpacity>
          {dueDate && (
            <Text style={styles.resultText}>Estimated Due Date: {dueDate}</Text>
          )}
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: '90%',
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    width: '90%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6b9fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
  },
});

export default DueDateCalculatorScreen;