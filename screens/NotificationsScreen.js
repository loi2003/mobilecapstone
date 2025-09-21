import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient'; // Use 'react-native-linear-gradient' for bare RN
import { viewNotificationsByUserId, markNotificationAsRead, deleteNotification } from '../api/notification-api';
import { getCurrentUser } from '../api/auth';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [fadeAnims, setFadeAnims] = useState([]);

  // Fetch token and user ID
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (!storedToken) {
          setError('Authentication token missing. Please log in.');
          setLoading(false);
          return;
        }
        setToken(storedToken);

        const response = await getCurrentUser(storedToken);
        const fetchedUserId = response.data?.data?.id;
        if (fetchedUserId) {
          setUserId(fetchedUserId);
        } else {
          setError('Unable to fetch user ID. Please log in again.');
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to fetch user data. Please log in again.');
        setLoading(false);
      }
    };
    fetchAuth();
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!userId || !token) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await viewNotificationsByUserId(userId, token);
        if (response.error === 0 && Array.isArray(response.data)) {
          const notificationsWithId = response.data.map((notif, index) => ({
            ...notif,
            id: notif.notificationId || notif.id || `notif-${index}`,
          }));
          setNotifications(notificationsWithId);
          // Initialize animations
          const newFadeAnims = notificationsWithId.map(() => new Animated.Value(0));
          setFadeAnims(newFadeAnims);
          notificationsWithId.forEach((_, index) => {
            Animated.timing(newFadeAnims[index], {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }).start();
          });
          setError(null);
        } else {
          setNotifications([]);
          setError('No notifications found.');
        }
      } catch (err) {
        setError('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId, token]);

  // Update badge count
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    navigation.setParams({ unreadCount });
    navigation.setOptions({
      tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount.toString()) : null,
    });
  }, [notifications, navigation]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId, token);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, isRead: true } : notif))
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to mark as read.');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert('Delete Notification', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteNotification(notificationId, token);
            setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete notification.');
          }
        },
      },
    ]);
  };

  const handleClearAll = async () => {
    Alert.alert('Clear All', 'Mark all unread as read?', [
      { text: 'Cancel' },
      {
        text: 'Clear',
        onPress: async () => {
          try {
            const unread = notifications.filter((n) => !n.isRead);
            await Promise.all(unread.map((n) => markNotificationAsRead(n.id, token)));
            setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
          } catch (err) {
            Alert.alert('Error', 'Failed to clear notifications.');
          }
        },
      },
    ]);
  };

  const renderNotification = ({ item, index }) => (
    <Animated.View
      style={[styles.notificationItem, item.isRead && styles.readItem, { opacity: fadeAnims[index] }]}
    >
      <View style={styles.messageContainer}>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
      <View style={styles.actionsContainer}>
        {!item.isRead && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleMarkAsRead(item.id)}
            accessibilityRole="button"
            accessibilityLabel="Mark as read"
          >
            <Text style={styles.btnText}>Mark as Read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDeleteNotification(item.id)}
          accessibilityRole="button"
          accessibilityLabel="Delete notification"
        >
          <Text style={[styles.btnText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <LinearGradient colors={['#E6F0FA', '#F5F9FF']} style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0057D8" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#E6F0FA', '#F5F9FF']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Notifications</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Notifications</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            {error.includes('log in') && (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.btnText}>Go to Login</Text>
              </TouchableOpacity>
            )}
            {!error.includes('log in') && (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setError(null);
                  setLoading(true);
                  setUserId(null); // Trigger refetch
                }}
              >
                <Text style={styles.btnText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : notifications.length > 0 ? (
          <>
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
                <Text style={styles.clearText}>Clear All ({unreadCount})</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#B0BEC5" />
            <Text style={styles.emptyText}>No new notifications</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 24 : 32,
    fontWeight: '700',
    color: '#0057D8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '600',
    color: '#0073E6',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: '#E6F0FA',
    padding: 16,
    borderRadius: 12,
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isSmallScreen ? 'flex-start' : 'center',
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#0073E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  readItem: {
    backgroundColor: '#F0F4FF',
    opacity: 0.9,
  },
  messageContainer: {
    flex: 1,
    marginBottom: isSmallScreen ? 12 : 0,
  },
  notificationMessage: {
    fontSize: 16,
    color: '#002B6B',
    fontWeight: '500',
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    width: isSmallScreen ? '100%' : 'auto',
    justifyContent: isSmallScreen ? 'flex-end' : 'flex-start',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0057D8',
    borderRadius: 6,
    minHeight: 44,
  },
  deleteBtn: {
    backgroundColor: '#D81B60',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteText: {
    color: '#FFFFFF',
  },
  clearBtn: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#0073E6',
    borderRadius: 6,
    alignItems: 'center',
  },
  clearText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFF0F0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#D81B60',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0057D8',
    borderRadius: 6,
    minHeight: 44,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F0FA',
    borderRadius: 12,
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#002B6B',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B6A9B',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationsScreen;