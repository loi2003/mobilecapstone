import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentUser, logout, uploadAvatar, editUserProfile } from '../api/auth';
import { Header, Footer } from './HomeScreen'; // Assuming these are exported from HomeScreen
import { Ionicons } from '@expo/vector-icons';

const AccountScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    UserName: '',
    PhoneNumber: '',
    DateOfBirth: '',
  });

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
        setEditedProfile({
          UserName: response.data.userName || '',
          PhoneNumber: response.data.phoneNumber || '',
          DateOfBirth: response.data.dateOfBirth || '',
        });
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
      Alert.alert('Thông báo', 'Đăng xuất thành công!');
      console.log('✅ Logout thành công cho userId:', userId);
      navigation.replace('Login');
    } catch (error) {
      console.error('❌ Logout failed:', error.response?.data || error);
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    }
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'You need to grant permission to access the photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userId = user?.data?.id;

        const file = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `avatar-${userId}.jpg`,
        };

        const response = await uploadAvatar(userId, file, token);
        console.log('Avatar uploaded:', response.data);

        const updatedUser = await getCurrentUser(token);
        setUser(updatedUser.data);
        Alert.alert('Success', 'Avatar uploaded successfully!');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        Alert.alert('Error', 'Failed to upload avatar. Please try again.');
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const profileData = {
        Id: user?.data?.id,
        UserName: editedProfile.UserName,
        PhoneNumber: editedProfile.PhoneNumber,
        DateOfBirth: editedProfile.DateOfBirth,
      };

      const response = await editUserProfile(profileData, token);
      console.log('Profile updated:', response.data);

      const updatedUser = await getCurrentUser(token);
      setUser(updatedUser.data);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1:
        return 'Admin';
      case 2:
        return 'User';
      case 3:
        return 'Health';
      case 4:
        return 'Nutrition';
      case 5:
        return 'Clinic';
      default:
        return 'Unknown';
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
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Your Account</Text>
          <Text style={styles.sectionDescription}>Manage your profile and preferences</Text>

          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <TouchableOpacity onPress={handleImagePick}>
                {user?.data?.avatar ? (
                  <Image
                    source={{ uri: user.data.avatar }}
                    style={styles.profileAvatar}
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={60} color="#6b9fff" />
                )}
              </TouchableOpacity>
              <Text style={styles.profileName}>{user?.data?.userName || 'User'}</Text>
              <Text style={styles.profileRole}>{getRoleName(user?.data?.roleId)}</Text>
            </View>

            <View style={styles.profileDetails}>
              {isEditing ? (
                <>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={20} color="#555" style={styles.detailIcon} />
                    <TextInput
                      style={styles.input}
                      value={editedProfile.UserName}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, UserName: text })}
                      placeholder="Username"
                    />
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={20} color="#555" style={styles.detailIcon} />
                    <TextInput
                      style={styles.input}
                      value={editedProfile.PhoneNumber}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, PhoneNumber: text })}
                      placeholder="Phone Number"
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color="#555" style={styles.detailIcon} />
                    <TextInput
                      style={styles.input}
                      value={editedProfile.DateOfBirth}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, DateOfBirth: text })}
                      placeholder="Date of Birth (YYYY-MM-DD)"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={20} color="#555" style={styles.detailIcon} />
                    <Text style={styles.detailText}>Email: {user?.data?.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={20} color="#555" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      Phone: {user?.data?.phoneNumber || 'Not provided'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color="#555" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      Date of Birth: {user?.data?.dateOfBirth || 'Not provided'}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
            >
              <Text style={styles.buttonText}>{isEditing ? 'Save Profile' : 'Edit Profile'}</Text>
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setEditedProfile({
                    UserName: user?.data?.userName || '',
                    PhoneNumber: user?.data?.phoneNumber || '',
                    DateOfBirth: user?.data?.dateOfBirth || '',
                  });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionsSection}>
            <Text style={styles.sectionSubtitle}>Account Actions</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Settings')} // Placeholder route
            >
              <Ionicons name="settings-outline" size={20} color="#ffffff" style={styles.actionIcon} />
              <Text style={styles.buttonText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ffffff" style={styles.actionIcon} />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Footer navigation={navigation} />
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
    paddingTop: 90, // Account for header height
  },
  accountSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: '90%',
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 15,
    textAlign: 'center',
  },
  profileCard: {
    width: '90%',
    padding: 20,
    backgroundColor: '#feffe9',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b9fff',
    marginTop: 5,
  },
  profileDetails: {
    width: '100%',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: '#333',
  },
  editButton: {
    backgroundColor: '#6b9fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionsSection: {
    width: '90%',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e6da4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
  },
  actionIcon: {
    marginRight: 10,
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

export default AccountScreen;