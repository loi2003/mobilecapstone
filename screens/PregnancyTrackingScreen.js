import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TrackingForm from '../screens/pregnacytracker/TrackingForm';
import PregnancyOverview from '../screens/pregnacytracker/TrackingForm';
import PregnancyProgressBar from '../screens/pregnacytracker/PregnancyProgressBar';
import JournalSection from '../screens/pregnacytracker/JournalSection';
import BabyDevelopment from '../screens/pregnacytracker/BabyDevelopment';
import UpcomingAppointments from '../screens/pregnacytracker/UpcomingAppointments';
// import SymptomsAndMood from '../components/tracking/SymptomsAndMood';
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

// Commented out image imports to reduce payload
// import weightIcon from '../assets/icons/weight-hanging-svgrepo-com.svg';
// import calculatorIcon from '../assets/icons/calculator-svgrepo-com.svg';
// import heartRateIcon from '../assets/icons/heart-pulse-2-svgrepo-com.svg';

const { width } = Dimensions.get('window');

// Header Component
const Header = ({ navigation, user, setUser, handleLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = new Animated.Value(-width);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: 'About', route: 'About', title: 'About Us' },
    { name: 'DueDate Calculator', route: 'DueDateCalculator', title: 'DueDate Calculator' },
    { name: 'Pregnancy', route: 'PregnancyTracking', title: 'Pregnancy Tracking' },
    { name: 'Nutrition', route: 'NutritionalGuidance', title: 'Nutritional Guidance' },
    { name: 'Consultation', route: 'Consultation', title: 'Consultation' },
    { name: 'Blog', route: 'Blog', title: 'Blog' },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.logo}>NestlyCare</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuToggle}
          onPress={toggleMenu}
          accessibilityLabel="Toggle navigation"
        >
          <Ionicons
            name={isMenuOpen ? 'close' : 'menu'}
            size={24}
            color="#feffe9"
          />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.navLinks,
            { transform: [{ translateX: slideAnim }], display: isMenuOpen ? 'flex' : 'none' },
          ]}
        >
          {navLinks.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.navLink}
              onPress={() => {
                navigation.navigate(link.route);
                setIsMenuOpen(false);
              }}
            >
              <Text style={styles.navLinkText}>{link.name}</Text>
            </TouchableOpacity>
          ))}
          {user && (
            <TouchableOpacity
              style={styles.navLink}
              onPress={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
            >
              <Text style={styles.navLinkText}>Logout</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

// Footer Component
const Footer = ({ navigation }) => {
  const footerLinks = [
    { name: 'About Us', route: 'About' },
    { name: 'Privacy Policy', route: 'Privacy' },
    { name: 'Terms of Service', route: 'Terms' },
    { name: 'Contact Us', route: 'Contact' },
  ];

  const socialLinks = [
    { name: 'Twitter', url: 'https://twitter.com', icon: 'logo-twitter' },
    { name: 'Facebook', url: 'https://facebook.com', icon: 'logo-facebook' },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: 'logo-linkedin' },
  ];

  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = () => {
    console.log('Newsletter subscription:', email);
    setEmail('');
  };

  return (
    <View style={styles.footer}>
      <View style={styles.footerContainer}>
        <View style={styles.footerSection}>
          <Text style={styles.footerSectionTitle}>Contact</Text>
          <Text style={styles.footerText}>Email: support@genderhealthweb.com</Text>
          <Text style={styles.footerText}>Phone: (123) 456-7890</Text>
        </View>
        <View style={styles.footerSection}>
          <Text style={styles.footerSectionTitle}>Follow Us</Text>
          <View style={styles.socialLinks}>
            {socialLinks.map((social, index) => (
              <TouchableOpacity
                key={index}
                style={styles.socialLink}
                onPress={() => Linking.openURL(social.url)}
              >
                <Ionicons name={social.icon} size={20} color="#ffffff" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.footerSection}>
          <Text style={styles.footerSectionTitle}>Stay Updated</Text>
          <View style={styles.newsletterForm}>
            <TextInput
              style={styles.newsletterInput}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.newsletterButton}
              onPress={handleNewsletterSubmit}
            >
              <Text style={styles.buttonText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Text style={styles.footerCopyright}>
        © {new Date().getFullYear()} GenderHealthWeb. All rights reserved.
      </Text>
    </View>
  );
};

const PregnancyTrackingPage = () => {
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

  const navigation = useNavigation();
  const route = useRoute();

  // Commented out static data to reduce payload
  /*
  const reminders = [
    {
      title: "Blood Pressure Check",
      startDate: "2023-05-15",
      endDate: "2023-05-15",
      note: "Recommended during week 20",
      type: "recommended",
    },
    {
      title: "Lab Work",
      startDate: "2023-05-25",
      endDate: "2023-05-25",
      note: "Urgent test results follow-up",
      type: "urgent",
    },
  ];
  */

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');

        const response = await viewAllOfflineConsultation(userId, null, token);
        const consultations = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        const mappedAppointments = consultations.map((c) => {
          const start = new Date(c.startDate);
          const end = new Date(c.endDate);
          return {
            id: c.id,
            name: c.checkupName || 'Unknown name',
            note: c.healthNote || 'No notes available',
            type: c.consultationType?.toLowerCase(),
            doctor: c.doctor?.fullName || 'Unknown Doctor',
            clinic: c.clinic?.name || 'Unknown Clinic',
            address: c.clinic?.address,
            start,
            end,
            status: c.status?.toLowerCase(),
          };
        });

        setAppointments(mappedAppointments);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, []);

  const appointmentDates = appointments.map((a) => a.start.toISOString());

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    if (activeTab === 'journal') {
      setOpenJournalModal(false);
    }
  }, [activeTab]);

  const initializePage = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Please sign in to access pregnancy tracking');
        navigation.navigate('DueDateCalculator');
        return;
      }

      const res = await getCurrentUser(token);
      const userData = res?.data?.data;

      if (!userData || userData.roleId !== 2 || !userData.id) {
        setError('Access denied or user ID missing.');
        setIsLoading(false);
        return;
      }

      setUser(userData);
      await AsyncStorage.setItem('userId', userData.id);

      const currentDate = new Date().toISOString().split('T')[0];
      const { data: pregRes } = await getCurrentWeekGrowthData(
        userData.id,
        currentDate,
        token
      );

      if (pregRes?.error === 0 && pregRes?.data) {
        setPregnancyData(pregRes.data);
        setSelectedWeek(pregRes.data.currentGestationalAgeInWeeks);
        await AsyncStorage.setItem('growthDataId', pregRes.data.id);
      } else {
        setPregnancyData(null);
      }
    } catch (err) {
      console.error('Error initializing page:', err);
      setError('Failed to load page. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async (formData) => {
    setIsCreating(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('token');
      const { userId, firstDayOfLastMenstrualPeriod, preWeight, preHeight } = formData;

      if (!userId) {
        setError('User ID is missing. Cannot create growth data profile.');
        return;
      }

      const growthDataRes = await createGrowthDataProfile(
        {
          userId,
          firstDayOfLastMenstrualPeriod,
          preWeight,
        },
        token
      );

      if (growthDataRes?.data?.error !== 0) {
        setError(growthDataRes?.data?.message || 'Failed to create pregnancy profile.');
        return;
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
          setError('Could not retrieve newly created growth data profile.');
          return;
        }
      }

      await createBasicBioMetric(
        {
          GrowthDataId: growthDataId,
          WeightKg: preWeight,
          HeightCm: preHeight,
        },
        token
      );

      const currentDate = new Date().toISOString().split('T')[0];
      const { data: pregRes } = await getCurrentWeekGrowthData(
        userId,
        currentDate,
        token
      );

      if (pregRes?.error === 0 && pregRes?.data) {
        setPregnancyData(pregRes.data);
      } else {
        setError(pregRes?.message || 'Failed to fetch updated pregnancy data');
      }
    } catch (err) {
      console.error('Error creating profile and biometric:', err);
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      const userId = user?.id;
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        console.error('No auth token found');
        await AsyncStorage.removeItem('token');
        navigation.replace('Login');
        return;
      }

      await logout(userId, token);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      navigation.replace('Login');
      console.log('✅ Logout thành công cho userId:', userId);
    } catch (error) {
      console.error('❌ Logout failed:', error.response?.data || error);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
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
      <View style={styles.pregnancyTrackingPage}>
        <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
        <View style={styles.mainContent}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#067DAD" />
            <Text style={styles.loadingText}>Loading your pregnancy data...</Text>
          </View>
        </View>
        <Footer navigation={navigation} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.pregnancyTrackingPage}>
        <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
        <View style={styles.mainContent}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={initializePage} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Footer navigation={navigation} />
      </View>
    );
  }

  return (
    <View style={styles.pregnancyTrackingPage}>
      <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.pregnancyTrackingContainer}>
          {!hasValidPregnancyData ? (
            <View style={styles.trackingWelcomeSection}>
              <View style={styles.trackingWelcomeHeader}>
                <Text style={styles.welcomeHeaderTitle}>Welcome to Pregnancy Tracking</Text>
                <Text style={styles.welcomeHeaderText}>
                  Start your beautiful journey of motherhood with personalized tracking and insights
                </Text>
              </View>
              <TrackingForm
                onSubmit={handleCreateProfile}
                isLoading={isCreating}
                user={user}
              />
            </View>
          ) : (
            <View style={styles.trackingDashboard}>
              <View style={styles.navTabs}>
                {[
                  { key: 'weekly', label: 'Weekly Info', queryKey: 'weeklyinfo' },
                  { key: 'reminderconsultation', label: 'Checkup Reminder', queryKey: 'reminderconsultationinfo' },
                  { key: 'nutrition', label: 'Nutrition Tips', queryKey: 'nutritioninfo' },
                  { key: 'journal', label: 'Journal Entries', queryKey: 'journalinfo' },
                ].map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tab, activeTab === tab.key ? styles.tabActive : {}]}
                    onPress={() => {
                      setActiveTab(tab.key);
                      navigation.setParams({ [tab.queryKey]: 'true', growthDataId: pregnancyData?.id });
                    }}
                  >
                    <Text style={[styles.tabText, activeTab === tab.key ? styles.tabTextActive : {}]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {activeTab === 'weekly' && (
                <View style={styles.tabContent}>
                  <PregnancyOverview pregnancyData={pregnancyData} />
                  <PregnancyProgressBar
                    pregnancyData={pregnancyData}
                    selectedWeek={selectedWeek}
                    setSelectedWeek={setSelectedWeek}
                  />
                  <View style={styles.dashboardGrid}>
                    <View style={styles.leftColumn}>
                      <BabyDevelopment
                        pregnancyData={pregnancyData}
                        selectedWeek={selectedWeek}
                      />
                      {/* <SymptomsAndMood pregnancyData={pregnancyData} /> */}
                    </View>
                    <View style={styles.rightColumn}>
                      <UpcomingAppointments
                        growthDataId={pregnancyData?.id}
                        userId={AsyncStorage.getItem('userId')}
                        token={AsyncStorage.getItem('token')}
                      />
                      <TrimesterChecklists
                        growthDataId={pregnancyData?.id}
                        token={AsyncStorage.getItem('token')}
                      />
                    </View>
                  </View>
                  {pregnancyData.basicBioMetric && (
                    <View style={styles.biometricSection}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderTitle}>Health Metrics</Text>
                        <Text style={styles.sectionHeaderText}>Your current health measurements</Text>
                      </View>
                      <View style={styles.biometricCards}>
                        {pregnancyData.basicBioMetric.weightKg > 0 && (
                          <View style={styles.biometricCard}>
                            <View style={styles.metricIcon}>
                              <Text style={styles.placeholderIcon}>⚖️</Text>
                            </View>
                            <View style={styles.metricInfo}>
                              <Text style={styles.metricValue}>
                                {pregnancyData.basicBioMetric.weightKg} Kg
                              </Text>
                              <Text style={styles.metricLabel}>Current Weight</Text>
                            </View>
                          </View>
                        )}
                        {pregnancyData.basicBioMetric.bmi > 0 && (
                          <View style={styles.biometricCard}>
                            <View style={styles.metricIcon}>
                              <Text style={styles.placeholderIcon}>🧮</Text>
                            </View>
                            <View style={styles.metricInfo}>
                              <Text style={styles.metricValue}>
                                {pregnancyData.basicBioMetric.bmi.toFixed(1)}
                              </Text>
                              <Text style={styles.metricLabel}>BMI</Text>
                            </View>
                          </View>
                        )}
                        {(pregnancyData.basicBioMetric.systolicBP > 0 ||
                          pregnancyData.basicBioMetric.diastolicBP > 0) && (
                          <View style={styles.biometricCard}>
                            <View style={styles.metricIcon}>
                              <Text style={styles.placeholderIcon}>❤️</Text>
                            </View>
                            <View style={styles.metricInfo}>
                              <Text style={styles.metricValue}>
                                {pregnancyData.basicBioMetric.systolicBP}/
                                {pregnancyData.basicBioMetric.diastolicBP} mmHg
                              </Text>
                              <Text style={styles.metricLabel}>Blood Pressure</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
              {activeTab === 'reminderconsultation' && (
                <View style={styles.tabContent}>
                  <CheckupReminder
                    token={AsyncStorage.getItem('token')}
                    userId={AsyncStorage.getItem('userId')}
                    reminders={[]}
                    appointments={appointments}
                    appointmentDates={appointmentDates}
                  />
                  <UpcomingAppointments
                    userId={AsyncStorage.getItem('userId')}
                    token={AsyncStorage.getItem('token')}
                    expanded={true}
                    appointments={appointments}
                  />
                </View>
              )}
              {activeTab === 'journal' && (
                <View style={styles.tabContent}>
                  <JournalSection
                    journalEntries={[]}
                    growthDataId={pregnancyData?.id}
                    openModal={openJournalModal}
                    setOpenModal={setOpenJournalModal}
                  />
                </View>
              )}
              {activeTab === 'nutrition' && (
                <View style={styles.tabContent}>
                  <SystemMealPlanner />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#04668D',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 3,
    borderBottomColor: '#04668D',
  },
  tabText: {
    color: '#feffe9',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#04668D',
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
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#feffe9',
    textDecorationLine: 'none',
  },
  menuToggle: {
    padding: 6,
  },
  navLinks: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#04668D',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    zIndex: 1002,
    height: Dimensions.get('window').height - 70,
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
  },
  navLinkText: {
    color: '#feffe9',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#f5f7fa',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 20,
  },
  footerSection: {
    flex: 1,
    minWidth: 250,
    alignItems: 'center',
  },
  footerSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 15,
  },
  footerText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 15,
  },
  socialLink: {
    width: 40,
    height: 40,
    backgroundColor: '#6b9fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsletterForm: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    maxWidth: 300,
  },
  newsletterInput: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    width: '100%',
  },
  newsletterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6b9fff',
    borderRadius: 12,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PregnancyTrackingPage;