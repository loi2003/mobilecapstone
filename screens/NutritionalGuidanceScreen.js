import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, logout } from '../api/auth';
import { Header, Footer } from './HomeScreen';

const NutritionalGuidanceScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
          <Text style={styles.sectionTitle}>Nutritional Guidance</Text>
          <Text style={styles.sectionDescription}>
            Discover healthy eating tips to support you and your baby during pregnancy.
          </Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipTitle}>First Trimester</Text>
            <Text style={styles.tipText}>• Focus on folate-rich foods like leafy greens.</Text>
            <Text style={styles.tipText}>• Stay hydrated with plenty of water.</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipTitle}>Second Trimester</Text>
            <Text style={styles.tipText}>• Increase iron intake with lean meats and beans.</Text>
            <Text style={styles.tipText}>• Include calcium-rich foods like dairy or fortified alternatives.</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipTitle}>Third Trimester</Text>
            <Text style={styles.tipText}>• Eat small, frequent meals to manage heartburn.</Text>
            <Text style={styles.tipText}>• Boost omega-3 intake with fish or walnuts.</Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Resources')}
          >
            <Text style={styles.buttonText}>Explore More Resources</Text>
          </TouchableOpacity>
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
    backgroundColor: '#e0f2f7',
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
  tipItem: {
    width: '90%',
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
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

export default NutritionalGuidanceScreen;