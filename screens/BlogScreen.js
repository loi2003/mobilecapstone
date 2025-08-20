import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, logout } from '../api/auth';
import { Header, Footer } from './HomeScreen';

const BlogScreen = ({ navigation }) => {
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

  // Placeholder blog data
  const blogs = [
    { id: 1, title: 'Preparing for Your First Trimester', excerpt: 'Learn what to expect and how to prepare for your first trimester.' },
    { id: 2, title: 'Nutrition Tips for a Healthy Pregnancy', excerpt: 'Discover key nutrients to support your baby’s growth.' },
    { id: 3, title: 'Staying Active During Pregnancy', excerpt: 'Safe exercises to keep you fit and healthy.' },
  ];

  return (
    <View style={styles.container}>
      <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blog</Text>
          <Text style={styles.sectionDescription}>
            Stay informed with our latest articles and tips for your pregnancy journey.
          </Text>
          {blogs.map((blog) => (
            <View key={blog.id} style={styles.blogItem}>
              <Text style={styles.blogTitle}>{blog.title}</Text>
              <Text style={styles.blogExcerpt}>{blog.excerpt}</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('BlogPost', { blogId: blog.id })}
              >
                <Text style={styles.buttonText}>Read More</Text>
              </TouchableOpacity>
            </View>
          ))}
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
  blogItem: {
    width: '90%',
    padding: 15,
    backgroundColor: '#feffe9',
    borderRadius: 12,
    marginBottom: 10,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  blogExcerpt: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#6b9fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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

export default BlogScreen;