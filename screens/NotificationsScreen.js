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
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { viewNotificationsByUserId, markNotificationAsRead, deleteNotification } from '../api/notification-api';
import { getCurrentUser } from '../api/auth';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 768;

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const fetchNotifications = async () => {
    if (!userId || !token) return;
    try {
      setLoading(true);
      const response = await viewNotificationsByUserId(userId, token);
      if (response.error === 0 && Array.isArray(response.data)) {
        const notificationsWithId = response.data.map((notif, index) => ({
          ...notif,
          id: notif.notificationId || notif.id || `notif-${index}`,
        }));
        setNotifications(notificationsWithId);
        const newFadeAnims = notificationsWithId.map(() => new Animated.Value(0));
        setFadeAnims(newFadeAnims);
        notificationsWithId.forEach((_, index) => {
          Animated.timing(newFadeAnims[index], {
            toValue: 1,
            duration: 400,
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId, token]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
  };

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
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
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

  const handleMarkAllAsRead = async () => {
    Alert.alert('Mark All as Read', 'Mark all unread notifications as read?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark All',
        onPress: async () => {
          try {
            const unread = notifications.filter((n) => !n.isRead);
            await Promise.all(unread.map((n) => markNotificationAsRead(n.id, token)));
            setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
          } catch (err) {
            Alert.alert('Error', 'Failed to mark all notifications as read.');
          }
        },
      },
    ]);
  };

  const handleDeleteAll = async () => {
    Alert.alert('Delete All Notifications', 'Are you sure you want to delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          try {
            await Promise.all(notifications.map((n) => deleteNotification(n.id, token)));
            setNotifications([]);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete all notifications.');
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
        <Text style={styles.notificationTitle}>
          {item.title || 'Notification'}
        </Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTimestamp}>
          {item.createdAt
            ? new Date(item.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Just now'}
        </Text>
      </View>
      <View style={styles.actionsContainer}>
        {!item.isRead && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.markReadBtn]}
            onPress={() => handleMarkAsRead(item.id)}
            accessibilityRole="button"
            accessibilityLabel="Mark notification as read"
            accessibilityHint="Marks this notification as read"
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDeleteNotification(item.id)}
          accessibilityRole="button"
          accessibilityLabel="Delete notification"
          accessibilityHint="Removes this notification"
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={[styles.btnText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#F5F7FA', '#E6F0FF']} style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#F5F7FA', '#E6F0FF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
          >
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  if (error.includes('log in')) {
                    navigation.navigate('Login');
                  } else {
                    setError(null);
                    setLoading(true);
                    setUserId(null);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={error.includes('log in') ? 'Go to login' : 'Retry loading notifications'}
                accessibilityHint={error.includes('log in') ? 'Navigates to the login screen' : 'Retries fetching notifications'}
              >
                <Text style={styles.btnText}>{error.includes('log in') ? 'Go to Login' : 'Retry'}</Text>
              </TouchableOpacity>
            </View>
          ) : notifications.length > 0 ? (
            <>
              <View style={styles.actionBar}>
                <TouchableOpacity
                  style={[styles.actionBarBtn, unreadCount === 0 && styles.actionBarBtnDisabled]}
                  onPress={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all notifications as read"
                  accessibilityHint="Marks all unread notifications as read"
                >
                  <Text style={styles.actionBarText}>Mark All Read ({unreadCount})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBarBtn, notifications.length === 0 && styles.actionBarBtnDisabled]}
                  onPress={handleDeleteAll}
                  disabled={notifications.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Delete all notifications"
                  accessibilityHint="Deletes all notifications"
                >
                  <Text style={styles.actionBarText}>Delete All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#007AFF']}
                    tintColor="#007AFF"
                  />
                }
              />
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#8E8E93" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubText}>We'll notify you when something new arrives.</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 22 : 24,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerSpacer: {
    width: 44, // Match backButton width for symmetry
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  actionBarBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionBarBtnDisabled: {
    backgroundColor: '#C7C7CC',
    opacity: 0.6,
    shadowOpacity: 0,
  },
  actionBarText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  list: {
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  readItem: {
    backgroundColor: '#F2F2F7',
    opacity: 0.85,
    borderLeftColor: '#8E8E93',
  },
  messageContainer: {
    flex: 1,
    marginBottom: isSmallScreen ? 12 : 0,
  },
  notificationTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  notificationMessage: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#3C3C43',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  notificationTimestamp: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#8E8E93',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: isSmallScreen ? 'flex-end' : 'flex-start',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 44,
  },
  markReadBtn: {
    backgroundColor: '#34C759',
  },
  deleteBtn: {
    backgroundColor: '#FF3B30',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  deleteText: {
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#FFF0F0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorText: {
    color: '#FF3B30',
    fontSize: isSmallScreen ? 16 : 18,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyText: {
    fontSize: isSmallScreen ? 18 : 20,
    color: '#3C3C43',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptySubText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingText: {
    marginTop: 12,
    fontSize: isSmallScreen ? 16 : 18,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationsScreen;