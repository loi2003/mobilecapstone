import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Animated,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TrackingForm from '../screens/pregnacytracker/TrackingForm';
import PregnancyOverview from '../screens/pregnacytracker/PregnancyOverview';
import PregnancyProgressBar from '../screens/pregnacytracker/PregnancyProgressBar';
import JournalSection from '../screens/pregnacytracker/JournalSection';
import BabyDevelopment from '../screens/pregnacytracker/BabyDevelopment';
import UpcomingAppointments from '../screens/pregnacytracker/UpcomingAppointments';
import TrimesterChecklists from '../screens/pregnacytracker/TrimesterChecklists';
import SystemMealPlanner from '../screens/pregnacytracker/SystemMealPlanner';
import CheckupReminder from '../screens/pregnacytracker/CheckupReminder';
import {
  getGrowthDataFromUser,
  createGrowthDataProfile,
  getCurrentWeekGrowthData,
} from '../api/growthdata-api';
import { createBasicBioMetric } from '../api/basic-bio-metric-api';
import { getCurrentUser, logout } from '../api/auth';
import { viewAllOfflineConsultation } from '../api/offline-consultation-api';

// Header Component
const Header = ({ navigation, user, setUser, handleLogout }) => {
  const { width } = useWindowDimensions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen, width]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: 'About', route: 'About', title: 'About Us' },
    { name: 'Due Date Calculator', route: 'DueDateCalculator', title: 'Due Date Calculator' },
    { name: 'Pregnancy', route: 'PregnancyTracking', title: 'Pregnancy Tracking' },
    { name: 'Nutrition', route: 'NutritionalGuidance', title: 'Nutritional Guidance' },
    { name: 'Consultation', route: 'Consultation', title: 'Consultation' },
    { name: 'Blog', route: 'Blog', title: 'Blog' },
  ];

  return (
    <View style={styles(width).header}>
      <View style={styles(width).headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles(width).logo}>NestlyCare</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles(width).menuToggle}
          onPress={toggleMenu}
          accessibilityLabel="Toggle navigation"
        >
          <Ionicons
            name={isMenuOpen ? 'close' : 'menu'}
            size={24}
            color="#feffe9"
          />
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[
          styles(width).navLinks,
          {
            transform: [{ translateX: slideAnim }],
            display: isMenuOpen ? 'flex' : 'none', // Ensure visibility control
          },
        ]}
      >
        {navLinks.map((link, index) => (
          <TouchableOpacity
            key={index}
            style={styles(width).navLink}
            onPress={() => {
              navigation.navigate(link.route);
              setIsMenuOpen(false);
            }}
          >
            <Text style={styles(width).navLinkText}>{link.name}</Text>
          </TouchableOpacity>
        ))}
        {user && (
          <TouchableOpacity
            style={styles(width).navLink}
            onPress={() => {
              handleLogout();
              setIsMenuOpen(false);
            }}
          >
            <Text style={styles(width).navLinkText}>Logout</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const PregnancyTrackingPage = () => {
  const { width } = useWindowDimensions();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [user, setUser] = useState(null);
  const [pregnancyData, setPregnancyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('weekly');
  const [openJournalModal, setOpenJournalModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();

  // Initialize app data
  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch token
        const storedToken = await AsyncStorage.getItem('authToken');
        if (!storedToken) {
          setError('Please sign in to access pregnancy tracking');
          if (isMounted) navigation.navigate('Login');
          return;
        }

        setToken(storedToken);

        // Fetch user data
        let userData;
        try {
          const res = await getCurrentUser(storedToken);
          userData = res?.data?.data;
        } catch (userError) {
          throw new Error('Failed to fetch user data. Please sign in again.');
        }

        if (!userData || !userData.id) {
          throw new Error('Access denied or user ID missing.');
        }

        if (userData.roleId !== 2) {
          setError('This feature is only available for specific users. Please contact support.');
          return;
        }

        if (isMounted) setUser(userData);

        // Fetch stored userId and ensure consistency
        let storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
          storedUserId = userData.id;
          await AsyncStorage.setItem('userId', userData.id);
        } else if (storedUserId !== userData.id) {
          await AsyncStorage.setItem('userId', userData.id);
        }

        if (isMounted) setUserId(storedUserId);

        // Fetch pregnancy data
        const currentDate = new Date().toISOString().split('T')[0];
        let pregRes;
        try {
          const response = await getCurrentWeekGrowthData(userData.id, currentDate, storedToken);
          pregRes = response.data;
        } catch (pregError) {
          setError('No pregnancy data found. Please create a profile to start tracking.');
          if (isMounted) setPregnancyData(null);
          return;
        }

        if (pregRes?.error === 0 && pregRes?.data) {
          if (isMounted) {
            setPregnancyData(pregRes.data);
            setSelectedWeek(pregRes.data.currentGestationalAgeInWeeks);
            await AsyncStorage.setItem('growthDataId', pregRes.data.id);
          }
        } else {
          if (isMounted) {
            setPregnancyData(null);
            setError('No pregnancy data found. Please create a profile to start tracking.');
          }
        }

        // Fetch appointments
        if (userData.id && storedToken) {
          try {
            setLoadingAppointments(true);
            const response = await viewAllOfflineConsultation(userData.id, null, storedToken);
            const consultations = Array.isArray(response.data?.data) ? response.data.data : [];
            const mappedAppointments = consultations.map((c) => ({
              id: c.id,
              name: c.checkupName || 'Unknown name',
              note: c.healthNote || 'No notes available',
              type: c.consultationType?.toLowerCase(),
              doctor: c.doctor?.fullName || 'Unknown Doctor',
              clinic: c.clinic?.name || 'Unknown Clinic',
              address: c.clinic?.address,
              start: new Date(c.startDate),
              end: new Date(c.endDate),
              status: c.status?.toLowerCase(),
            }));
            if (isMounted) setAppointments(mappedAppointments);
          } catch (err) {
            setError('Failed to fetch appointments. Please try again.');
          } finally {
            if (isMounted) setLoadingAppointments(false);
          }
        }
      } catch (err) {
        let errorMessage = err.message || 'Failed to load page. Please try again.';
        if (err.response?.data?.message === 'User does not exist!' || err.response?.status === 401) {
          await AsyncStorage.multiRemove(['authToken', 'userId', 'growthDataId']);
          errorMessage = 'User session invalid. Please sign in again.';
          if (isMounted) {
            setUserId(null);
            setToken(null);
            setUser(null);
            setPregnancyData(null);
            setAppointments([]);
            navigation.navigate('Login');
          }
        } else {
          if (isMounted) setError(errorMessage);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, [navigation]);

  const appointmentDates = appointments.map((a) => a.start.toISOString());

  useEffect(() => {
    if (activeTab === 'journal') {
      setOpenJournalModal(false);
    }
  }, [activeTab]);

  const handleCreateProfile = async (formData) => {
    setIsCreating(true);
    setError(null);

 ப

    try {
      if (!token || !userId) {
        throw new Error('Authentication data missing. Please sign in again.');
      }

      const { firstDayOfLastMenstrualPeriod, preWeight, preHeight } = formData;

      let growthDataRes;
      try {
        growthDataRes = await createGrowthDataProfile(
          {
            userId,
            firstDayOfLastMenstrualPeriod,
            preWeight,
          },
          token
        );
      } catch (growthError) {
        throw new Error('Failed to create pregnancy profile.');
      }

      if (growthDataRes?.data?.error !== 0) {
        throw new Error(growthDataRes?.data?.message || 'Failed to create pregnancy profile.');
      }

      let growthDataId = growthDataRes?.data?.data?.id;

      if (!growthDataId) {
        const currentDate = new Date().toISOString().split('T')[0];
        const { data: fallbackRes } = await getCurrentWeekGrowthData(
          userId,
          currentDate,
          token
        );
        if (fallbackRes?.error === 0 && fallbackRes?.data?.id) {
          growthDataId = fallbackRes.data.id;
        } else {
          throw new Error('Could not retrieve newly created growth data profile.');
        }
      }

      try {
        await createBasicBioMetric(
          {
            GrowthDataId: growthDataId,
            WeightKg: preWeight,
            HeightCm: preHeight,
          },
          token
        );
      } catch (bioMetricError) {
        throw new Error('Failed to save biometric data.');
      }

      const currentDate = new Date().toISOString().split('T')[0];
      let pregRes;
      try {
        const response = await getCurrentWeekGrowthData(
          userId,
          currentDate,
          token
        );
        pregRes = response.data;
      } catch (pregError) {
        throw new Error('Failed to fetch updated pregnancy data.');
      }

      if (pregRes?.error === 0 && pregRes?.data) {
        setPregnancyData(pregRes.data);
        setSelectedWeek(pregRes.data.currentGestationalAgeInWeeks);
        await AsyncStorage.setItem('growthDataId', pregRes.data.id);
      } else {
        throw new Error(pregRes?.message || 'Failed to fetch updated pregnancy data.');
      }
    } catch (err) {
      let errorMessage = err.message || 'Something went wrong. Please try again.';
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.data?.title || errorMessage;
      } else if (err.request) {
        errorMessage = 'Network error: Could not reach the server.';
      }
      setError(errorMessage);
      if (errorMessage.includes('sign in')) {
        navigation.navigate('Login');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token && userId) {
        await logout({ userId }, token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['authToken', 'userId', 'growthDataId']);
      setUserId(null);
      setToken(null);
      setUser(null);
      setPregnancyData(null);
      setAppointments([]);
      navigation.replace('Login');
    }
  };

  const handleAddJournal = () => {
    setOpenJournalModal(true);
  };

  const hasValidPregnancyData =
    pregnancyData &&
    !!pregnancyData.firstDayOfLastMenstrualPeriod &&
    !!pregnancyData.estimatedDueDate;

  if (isLoading) {
    return (
      <View style={styles(width).pregnancyTrackingPage}>
        <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
        <View style={styles(width).mainContent}>
          <View style={styles(width).loadingContainer}>
            <ActivityIndicator size="large" color="#067DAD" />
            <Text style={styles(width).loadingText}>Loading your pregnancy data...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles(width).pregnancyTrackingPage}>
        <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
        <View style={styles(width).mainContent}>
          <View style={styles(width).errorContainer}>
            <Text style={styles(width).errorIcon}>⚠️</Text>
            <Text style={styles(width).errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles(width).errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => error.includes('sign in') ? navigation.navigate('Login') : initializeApp()}
              style={styles(width).retryBtn}
            >
              <Text style={styles(width).retryBtnText}>
                {error.includes('sign in') ? 'Go to Login' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles(width).pregnancyTrackingPage}>
      <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
      <ScrollView contentContainerStyle={styles(width).mainContent}>
        <View style={styles(width).pregnancyTrackingContainer}>
          {!hasValidPregnancyData ? (
            <View style={ Mumfordstyles(width).trackingWelcomeSection}>
              <View style={styles(width).trackingWelcomeHeader}>
                <Text style={styles(width).welcomeHeaderTitle}>Welcome to Pregnancy Tracking</Text>
                <Text style={styles(width).welcomeHeaderText}>
                  Start your beautiful journey of motherhood with personalized tracking and insights
                </Text>
              </View>
              <TrackingForm
                onSubmit={handleCreateProfile}
                isLoading={isCreating}
              />
            </View>
          ) : (
            <View style={styles(width).trackingDashboard}>
              <View style={styles(width).navTabs}>
                {[
                  { key: 'weekly', label: 'Weekly Info', queryKey: 'weeklyinfo' },
                  { key: 'reminderconsultation', label: 'Checkup Reminder', queryKey: 'reminderconsultationinfo' },
                  { key: 'nutrition', label: 'Nutrition Tips', queryKey: 'nutritioninfo' },
                  { key: 'journal', label: 'Journal Entries', queryKey: 'journalinfo' },
                ].map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles(width).tab, activeTab === tab.key ? styles(width).tabActive : {}]}
                    onPress={() => {
                      setActiveTab(tab.key);
                      navigation.setParams({ [tab.queryKey]: 'true', growthDataId: pregnancyData?.id });
                    }}
                    accessibilityLabel={`Switch to ${tab.label} tab`}
                  >
                    <Text style={[styles(width).tabText, activeTab === tab.key ? styles(width).tabTextActive : {}]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {activeTab === 'weekly' && (
                <View style={styles(width).tabContent}>
                  <PregnancyOverview
                    pregnancyData={pregnancyData}
                    setPregnancyData={setPregnancyData}
                    setError={setError}
                  />
                  <PregnancyProgressBar
                    pregnancyData={pregnancyData}
                    selectedWeek={selectedWeek}
                    setSelectedWeek={setSelectedWeek}
                  />
                  <View style={styles(width).dashboardGrid}>
                    <View style={styles(width).leftColumn}>
                      <BabyDevelopment
                        pregnancyData={pregnancyData}
                        selectedWeek={selectedWeek}
                      />
                    </View>
                    <View style={styles(width).rightColumn}>
                      <UpcomingAppointments
                        growthDataId={pregnancyData?.id}
                        userId={userId}
                        token={token}
                        appointments={appointments}
                        loadingAppointments={loadingAppointments}
                      />
                      {/* <TrimesterChecklists
                        growthDataId={pregnancyData?.id}
                        token={token}
                      /> */}
                    </View>
                  </View>
                  {pregnancyData.basicBioMetric && (
                    <View style={styles(width).biometricSection}>
                      <View style={styles(width).sectionHeader}>
                        <Text style={styles(width).sectionHeaderTitle}>Health Metrics</Text>
                        <Text style={styles(width).sectionHeaderText}>Your current health measurements</Text>
                      </View>
                      <View style={styles(width).biometricCards}>
                        {pregnancyData.basicBioMetric.weightKg > 0 && (
                          <View style={styles(width).biometricCard}>
                            <View style={styles(width).metricIcon}>
                              <Text style={styles(width).placeholderIcon}>⚖️</Text>
                            </View>
                            <View style={styles(width).metricInfo}>
                              <Text style={styles(width).metricValue}>
                                {pregnancyData.basicBioMetric.weightKg} Kg
                              </Text>
                              <Text style={styles(width).metricLabel}>Current Weight</Text>
                            </View>
                          </View>
                        )}
                        {pregnancyData.basicBioMetric.bmi > 0 && (
                          <View style={styles(width).biometricCard}>
                            <View style={styles(width).metricIcon}>
                              <Text style={styles(width).placeholderIcon}>🧮</Text>
                            </View>
                            <View style={styles(width).metricInfo}>
                              <Text style={styles(width).metricValue}>
                                {pregnancyData.basicBioMetric.bmi.toFixed(1)}
                              </Text>
                              <Text style={styles(width).metricLabel}>BMI</Text>
                            </View>
                          </View>
                        )}
                        {(pregnancyData.basicBioMetric.systolicBP > 0 ||
                          pregnancyData.basicBioMetric.diastolicBP > 0) && (
                          <View style={styles(width).biometricCard}>
                            <View style={styles(width).metricIcon}>
                              <Text style={styles(width).placeholderIcon}>❤️</Text>
                            </View>
                            <View style={styles(width).metricInfo}>
                              <Text style={styles(width).metricValue}>
                                {pregnancyData.basicBioMetric.systolicBP}/
                                {pregnancyData.basicBioMetric.diastolicBP} mmHg
                              </Text>
                              <Text style={styles(width).metricLabel}>Blood Pressure</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
              {activeTab === 'reminderconsultation' && (
                <View style={styles(width).tabContent}>
                  <CheckupReminder
                    token={token}
                    userId={userId}
                    reminders={[]}
                    appointments={appointments}
                    appointmentDates={appointmentDates}
                    loadingAppointments={loadingAppointments}
                  />
                  <UpcomingAppointments
                    userId={userId}
                    token={token}
                    expanded={true}
                    appointments={appointments}
                    loadingAppointments={loadingAppointments}
                  />
                </View>
              )}
              {activeTab === 'journal' && (
                <View style={styles(width).tabContent}>
                  <JournalSection
                    journalEntries={[]}
                    growthDataId={pregnancyData?.id}
                    openModal={openJournalModal}
                    setOpenModal={setOpenJournalModal}
                  />
                </View>
              )}
              {activeTab === 'nutrition' && (
                <View style={styles(width).tabContent}>
                  <SystemMealPlanner />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (width) => StyleSheet.create({
  pregnancyTrackingPage: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  mainContent: {
    paddingVertical: 20,
    paddingTop: 90,
  },
  pregnancyTrackingContainer: {
    maxWidth: 1500,
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 10,
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    color: '#FE6B6A',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 48,
    color: '#E74C3C',
    marginBottom: 10,
  },
  errorTitle: {
    color: '#04668D',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  errorText: {
    color: '#FE6B6A',
    fontSize: 16,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#04668D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#feffe9',
    fontSize: 16,
    fontWeight: '600',
  },
  trackingWelcomeSection: {
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 800,
    padding: 20,
    alignSelf: 'center',
  },
  trackingWelcomeHeader: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeHeaderTitle: {
    color: '#04668D',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  welcomeHeaderText: {
    color: '#FE6B6A',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  trackingDashboard: {
    flexDirection: 'column',
    rowGap: 20,
  },
  navTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    padding: 8,
    overflow: 'hidden',
    justifyContent: 'space-around',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 4,
    minWidth: width < 768 ? 80 : 100,
    minHeight: 48,
    backgroundColor: '#f5f7fa',
  },
  tabActive: {
    backgroundColor: '#04668D',
    borderBottomWidth: 0,
    transform: [{ scale: 1.05 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    color: '#555555',
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#feffe9',
    fontWeight: '700',
  },
  tabContent: {
    flexDirection: 'column',
    rowGap: 20,
  },
  dashboardGrid: {
    flexDirection: 'row',
    columnGap: 20,
    flexWrap: 'wrap',
  },
  leftColumn: {
    flex: 1,
    minWidth: 300,
  },
  rightColumn: {
    flex: 1,
    minWidth: 300,
  },
  biometricSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#04668D',
  },
  sectionHeaderText: {
    fontSize: 14,
    color: '#FE6B6A',
  },
  biometricCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 15,
    marginTop: 15,
  },
  biometricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    padding: 15,
    backgroundColor: '#feffe9',
    borderRadius: 8,
    flex: 1,
    minWidth: 200,
  },
  metricIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
  },
  metricInfo: {
    flexDirection: 'column',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#04668D',
  },
  metricLabel: {
    fontSize: 12,
    color: '#FE6B6A',
  },
  header: {
    backgroundColor: '#04668D',
    paddingHorizontal: 8,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 70,
  },
  headerContainer: {
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: '100%',
    zIndex: 1001, // Ensure header content is above navLinks
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#feffe9',
    textDecorationLine: 'none',
  },
  menuToggle: {
    padding: 6,
    zIndex: 1002, // Ensure toggle button is clickable
  },
  navLinks: {
    position: 'absolute',
    top: 70, // Position below header
    left: 0,
    right: 0,
    backgroundColor: '#04668D',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    zIndex: 1000, // Lower than headerContainer to avoid overlap issues
    minHeight: width < 768 ? 'auto' : 400, // Flexible height for responsiveness
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  navLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%', // Ensure links take full width for better touch area
    alignItems: 'center',
  },
  navLinkText: {
    color: '#feffe9',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default PregnancyTrackingPage;