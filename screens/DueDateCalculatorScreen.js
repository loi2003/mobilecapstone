import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, logout } from '../api/auth';
import { Header, Footer } from './HomeScreen';
import ChatBox from './ChatBox';

const DueDateCalculatorScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateError, setDateError] = useState('');
  const [isChatBoxOpen, setIsChatBoxOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Added for menu state
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contactIconScale = useRef(new Animated.Value(1)).current;

  // Date picker state
  const [scrollDay, setScrollDay] = useState(1);
  const [scrollMonth, setScrollMonth] = useState(1);
  const [scrollYear, setScrollYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const response = await getCurrentUser(token);
          setUser(response.data);
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        navigation.replace('Login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();

    Animated.timing(fadeAnim, {
      toValue: isChatBoxOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [navigation, isChatBoxOpen]);

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

  const calculateDueDate = () => {
    const error = validateDate();
    setDateError(error);
    if (!error) {
      const date = new Date(scrollYear, scrollMonth - 1, scrollDay);
      setSelectedDate(date);
      date.setDate(date.getDate() + 280); // Standard 40 weeks for pregnancy
      setDueDate(date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }));
      setShowDatePicker(false);
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

  const handleContactIconPress = useCallback(() => {
    Animated.sequence([
      Animated.spring(contactIconScale, {
        toValue: 1.2,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(contactIconScale, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
    setIsChatBoxOpen((prev) => !prev);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const formatDateForDisplay = (date) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Generate arrays for days, months, and years
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Feather name="loader" size={32} color="#6b9fff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        navigation={navigation}
        user={user}
        setUser={setUser}
        handleLogout={handleLogout}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      <View style={styles.mainContentContainer}>
        {isMenuOpen && (
          <TouchableOpacity
            style={styles.contentOverlay}
            onPress={toggleMenu}
            accessibilityLabel="Close menu"
            accessibilityHint="Closes the navigation menu"
          />
        )}
        <LinearGradient
          colors={['#f5f7fa', '#f5f7fa']}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={!isMenuOpen}
          >
            <View style={{ pointerEvents: isMenuOpen ? 'none' : 'auto' }}>
              <Animatable.View animation="fadeInUp" duration={600} style={styles.section}>
                <Text style={styles.sectionTitle}>Pregnancy Due Date Calculator</Text>
                <Text style={styles.sectionDescription}>
                  Select the first day of your last menstrual period to estimate your baby’s due date.
                </Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Feather name="calendar" size={20} color="#555" />
                  <Text style={styles.dateInputText}>
                    {selectedDate ? formatDateForDisplay(selectedDate) : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {dateError ? (
                  <Text style={styles.errorText}>{dateError}</Text>
                ) : null}
                <TouchableOpacity
                  style={[styles.button, !selectedDate && !showDatePicker ? styles.buttonDisabled : null]}
                  onPress={calculateDueDate}
                  disabled={!selectedDate && !showDatePicker}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>Calculate Due Date</Text>
                </TouchableOpacity>
                {dueDate && (
                  <Animatable.View animation="fadeIn" duration={500} style={styles.resultContainer}>
                    <Feather name="heart" size={24} color="#6b9fff" />
                    <Text style={styles.resultText}>
                      Estimated Due Date: {'\n'}
                      <Text style={styles.dueDate}>{dueDate}</Text>
                    </Text>
                  </Animatable.View>
                )}
              </Animatable.View>
              <Footer />
            </View>
          </ScrollView>
        </LinearGradient>
      </View>

      {/* Contact Icon */}
      <Animated.View style={[styles.contactIcon, { transform: [{ scale: contactIconScale }], zIndex: 900 }]}>
        <TouchableOpacity
          onPress={handleContactIconPress}
          accessibilityLabel="Open chat"
          accessibilityHint="Opens the chat support window"
        >
          <Text style={styles.contactIconText}>💬</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ChatBox Modal */}
      <Modal
        visible={isChatBoxOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsChatBoxOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, { zIndex: 950 }]}
        >
          <ChatBox isOpen={isChatBoxOpen} onClose={() => setIsChatBoxOpen(false)} navigation={navigation} />
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={[styles.modalContainer, { zIndex: 950 }]}>
          <Animatable.View animation="slideInUp" duration={300} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
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
                onPress={calculateDueDate}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  mainContentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 0, // Below header and navMenu
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark overlay for main content
    zIndex: 1000, // Above content but below navMenu
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    alignItems: 'center',
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '90%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateInputText: {
    fontSize: 16,
    color: '#222',
    marginLeft: 10,
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6b9fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#6b9fff4D',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 24,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  dueDate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b9fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#333',
    marginTop: 12,
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
    backgroundColor: '#6b9fff',
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
    backgroundColor: '#6b9fff',
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
  contactIcon: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: '#2e6da4',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 5,
      },
    }),
    zIndex: 900,
  },
  contactIconText: {
    fontSize: 24,
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
});

export default DueDateCalculatorScreen;