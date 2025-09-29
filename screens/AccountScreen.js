import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  SafeAreaView,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { format, parse } from 'date-fns';
import { getCurrentUser, logout, uploadAvatar, editUserProfile } from '../api/auth';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const AccountScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    UserName: '',
    PhoneNumber: '',
    DateOfBirth: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scrollDay, setScrollDay] = useState(1);
  const [scrollMonth, setScrollMonth] = useState(1);
  const [scrollYear, setScrollYear] = useState(new Date().getFullYear());
  const profileCardAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          navigation.replace('Login');
          return;
        }
        const response = await getCurrentUser(token);
        console.log('User data:', response.data);
        setUser(response.data);
        setEditedProfile({
          UserName: response.data.userName || '',
          PhoneNumber: response.data.phoneNumber || '',
          DateOfBirth: response.data.dateOfBirth
            ? format(new Date(response.data.dateOfBirth), 'yyyy-MM-dd')
            : '',
        });
        if (response.data.dateOfBirth) {
          try {
            const date = new Date(response.data.dateOfBirth);
            setScrollDay(date.getDate());
            setScrollMonth(date.getMonth() + 1);
            setScrollYear(date.getFullYear());
          } catch (error) {
            console.error('Invalid date format:', error);
          }
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

  useEffect(() => {
    Animated.parallel([
      Animated.spring(profileCardAnim, {
        toValue: 0,
        stiffness: 120,
        damping: 15,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      quality: 0.8,
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

  const validateDate = () => {
    const date = new Date(scrollYear, scrollMonth - 1, scrollDay);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    if (date > new Date()) {
      return 'Date cannot be in the future';
    }
    return '';
  };

  const handleDateConfirm = () => {
    const error = validateDate();
    if (!error) {
      const date = new Date(scrollYear, scrollMonth - 1, scrollDay);
      setEditedProfile({
        ...editedProfile,
        DateOfBirth: format(date, 'yyyy-MM-dd'),
      });
      setShowDatePicker(false);
    } else {
      Alert.alert('Error', error);
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

  // Generate arrays for days, months, and years
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Animatable.Text
          animation="fadeIn"
          style={styles.loadingText}
          accessibilityLabel="Loading"
        >
          Loading...
        </Animatable.Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E5E7EB', '#F3F4F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.accountContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.accountSection, { opacity: fadeAnim }]}>
            <Animatable.Text
              animation="fadeInDown"
              style={styles.sectionTitle}
              accessibilityLabel="Your Account"
            >
              Your Account
            </Animatable.Text>
            <Text style={styles.sectionDescription}>Manage your profile and preferences</Text>
            <Animated.View
              style={[styles.profileCard, { transform: [{ translateY: profileCardAnim }] }]}
            >
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  onPress={handleImagePick}
                  accessibilityLabel="Change profile picture"
                  accessibilityHint="Select a new profile picture from your photo library"
                  activeOpacity={0.7}
                >
                  <Animatable.View
                    animation="pulse"
                    iterationCount="infinite"
                    duration={2000}
                    useNativeDriver={true}
                  >
                    {user?.data?.avatar ? (
                      <Image
                        source={{ uri: user.data.avatar.fileUrl }}
                        style={styles.profileAvatar}
                        accessibilityLabel="Profile avatar"
                      />
                    ) : (
                      <Ionicons name="person-circle-outline" size={80} color="#3B82F6" />
                    )}
                  </Animatable.View>
                </TouchableOpacity>
                <Text style={styles.profileName}>{user?.data?.userName || 'User'}</Text>
                <Text style={styles.profileRole}>{getRoleName(user?.data?.roleId)}</Text>
              </View>
              <View style={styles.profileDetails}>
                {isEditing ? (
                  <>
                    <Animatable.View animation="fadeIn" style={styles.detailRow}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#4B5563"
                        style={styles.detailIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={editedProfile.UserName}
                        onChangeText={(text) =>
                          setEditedProfile({ ...editedProfile, UserName: text })
                        }
                        placeholder="Username"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        accessibilityLabel="Username input"
                        accessibilityHint="Enter your username"
                        returnKeyType="next"
                        autoCorrect={false}
                      />
                    </Animatable.View>
                    <Animatable.View animation="fadeIn" delay={100} style={styles.detailRow}>
                      <Ionicons
                        name="call-outline"
                        size={20}
                        color="#4B5563"
                        style={styles.detailIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={editedProfile.PhoneNumber}
                        onChangeText={(text) =>
                          setEditedProfile({ ...editedProfile, PhoneNumber: text })
                        }
                        placeholder="Phone Number"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        accessibilityLabel="Phone number input"
                        accessibilityHint="Enter your phone number"
                        returnKeyType="next"
                        autoCorrect={false}
                      />
                    </Animatable.View>
                    <Animatable.View animation="fadeIn" delay={200} style={styles.detailRow}>
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color="#4B5563"
                        style={styles.detailIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={user?.data?.email || ''}
                        editable={false}
                        placeholder="Email"
                        placeholderTextColor="#9CA3AF"
                        accessibilityLabel="Email display"
                        accessibilityHint="Email cannot be edited"
                      />
                    </Animatable.View>
                    <Animatable.View animation="fadeIn" delay={300} style={styles.detailRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#4B5563"
                        style={styles.detailIcon}
                      />
                      <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowDatePicker(true)}
                        accessibilityLabel="Date of birth input"
                        accessibilityHint="Tap to select your date of birth"
                      >
                        <Text style={styles.dateText}>
                          {editedProfile.DateOfBirth || 'Select Date'}
                        </Text>
                      </TouchableOpacity>
                    </Animatable.View>
                  </>
                ) : (
                  <>
                    <Animatable.View animation="fadeIn" style={styles.detailRow}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#4B5563"
                        style={styles.detailIcon}
                      />
                      <Text
                        style={styles.detailText}
                        accessibilityLabel={`Username: ${user?.data?.userName || 'Not provided'}`}
                      >
                        Username: {user?.data?.userName || 'Not provided'}
                      </Text>
                    </Animatable.View>
                    <Animatable.View animation="fadeIn" delay={100} style={styles.detailRow}>
                      <Ionicons
                        name="call-outline"
                        size={20}
                        color="#4B5563"
                        style={styles.detailIcon}
                      />
                      <Text
                        style={styles.detailText}
                        accessibilityLabel={`Phone: ${user?.data?.phoneNumber || 'Not provided'}`}
                      >
                        Phone: {user?.data?.phoneNumber || 'Not provided'}
                      </Text>
                    </Animatable.View>
                    <Animatable.View animation="fadeIn" delay={200} style={styles.detailRow}>
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color="#4B5563"
                        style={styles.detailIcon}
                      />
                      <Text
                        style={styles.detailText}
                        accessibilityLabel={`Email: ${user?.data?.email}`}
                      >
                        Email: {user?.data?.email}
                      </Text>
                    </Animatable.View>
                    <Animatable.View animation="fadeIn" delay={300} style={styles.detailRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#4B5563"
                        style={styles.detailIcon}
                      />
                      <Text
                        style={styles.detailText}
                        accessibilityLabel={`Date of Birth: ${
                          user?.data?.dateOfBirth
                            ? format(new Date(user.data.dateOfBirth), 'yyyy-MM-dd')
                            : 'Not provided'
                        }`}
                      >
                        Date of Birth:{' '}
                        {user?.data?.dateOfBirth
                          ? format(new Date(user.data.dateOfBirth), 'yyyy-MM-dd')
                          : 'Not provided'}
                      </Text>
                    </Animatable.View>
                  </>
                )}
              </View>
              <Animatable.View animation="fadeInUp" delay={400}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                  accessibilityLabel={isEditing ? 'Save profile' : 'Edit profile'}
                  accessibilityHint={
                    isEditing ? 'Saves changes to your profile' : 'Enters edit mode to modify your profile'
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>{isEditing ? 'Save Profile' : 'Edit Profile'}</Text>
                </TouchableOpacity>
              </Animatable.View>
              {isEditing && (
                <Animatable.View animation="fadeInUp" delay={500}>
                  <TouchableOpacity
                    style={[styles.editButton, styles.cancelButton]}
                    onPress={() => {
                      setIsEditing(false);
                      setEditedProfile({
                        UserName: user?.data?.userName || '',
                        PhoneNumber: user?.data?.phoneNumber || '',
                        DateOfBirth: user?.data?.dateOfBirth
                          ? format(new Date(user.data.dateOfBirth), 'yyyy-MM-dd')
                          : '',
                      });
                      if (user?.data?.dateOfBirth) {
                        try {
                          const date = new Date(user.data.dateOfBirth);
                          setScrollDay(date.getDate());
                          setScrollMonth(date.getMonth() + 1);
                          setScrollYear(date.getFullYear());
                        } catch (error) {
                          console.error('Invalid date format on cancel:', error);
                        }
                      }
                    }}
                    accessibilityLabel="Cancel editing"
                    accessibilityHint="Discards changes and exits edit mode"
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </Animatable.View>
              )}
            </Animated.View>
            <View style={styles.actionsSection}>
              <Text style={styles.sectionSubtitle}>Account Actions</Text>
              <Animatable.View animation="fadeInUp" delay={600}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.logoutButton]}
                  onPress={handleLogout}
                  accessibilityLabel="Logout"
                  accessibilityHint="Logs out of your account"
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#EF4444', '#F87171']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoutButtonGradient}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color="#FFFFFF"
                      style={styles.actionIcon}
                    />
                    <Text style={styles.buttonText}>Logout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Custom Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContainer}>
            <Animatable.View animation="slideInUp" duration={300} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <View style={styles.pickerContainer}>
                <ScrollView
                  style={styles.picker}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.pickerItem, scrollDay === day ? styles.pickerItemSelected : null]}
                      onPress={() => setScrollDay(day)}
                    >
                      <Text style={[styles.pickerText, scrollDay === day ? styles.pickerTextSelected : null]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView
                  style={styles.picker}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                >
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[styles.pickerItem, scrollMonth === index + 1 ? styles.pickerItemSelected : null]}
                      onPress={() => setScrollMonth(index + 1)}
                    >
                      <Text style={[styles.pickerText, scrollMonth === index + 1 ? styles.pickerTextSelected : null]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView
                  style={styles.picker}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.pickerItem, scrollYear === year ? styles.pickerItemSelected : null]}
                      onPress={() => setScrollYear(year)}
                    >
                      <Text style={[styles.pickerText, scrollYear === year ? styles.pickerTextSelected : null]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDatePicker(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleDateConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  accountContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  accountSection: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: '85%',
    lineHeight: 24,
  },
  sectionSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  profileCard: {
    width: Math.min(width * 0.9, 400),
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  profileRole: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    marginTop: 6,
    opacity: 0.9,
  },
  profileDetails: {
    width: '100%',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
  },
  detailIcon: {
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#4B5563',
    flex: 1,
    lineHeight: 24,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  actionsSection: {
    width: Math.min(width * 0.9, 400),
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    justifyContent: 'center',
  },
  actionIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
    marginBottom: 20,
  },
  picker: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 18,
    color: '#333',
  },
  pickerTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#D1D5DB',
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AccountScreen;