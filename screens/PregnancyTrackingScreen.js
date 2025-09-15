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
import TrackingForm from './pregnacytracker/TrackingForm';
import PregnancyOverview from './pregnacytracker/PregnancyOverview';
import PregnancyProgressBar from './pregnacytracker/PregnancyProgressBar';
import JournalSection from './pregnacytracker/JournalSection';
import BabyDevelopment from './pregnacytracker/BabyDevelopment';
import UpcomingAppointments from './pregnacytracker/UpcomingAppointments';
import CheckupReminder from './pregnacytracker/CheckupReminder';
import SystemMealPlanner from './pregnacytracker/SystemMealPlanner';
import CustomMealPlanner from './pregnacytracker/CustomMealPlanner';
import RecommendedNutritionalNeeds from './pregnacytracker/RecommendedNutritionalNeeds';
import FoodWarning from './pregnacytracker/FoodWarning';
import {
  getGrowthDataFromUser,
  createGrowthDataProfile,
  getCurrentWeekGrowthData,
} from '../api/growthdata-api';
import { createBasicBioMetric } from '../api/basic-bio-metric-api';
import { getCurrentUser, logout } from '../api/auth';
import { viewAllOfflineConsultation } from '../api/offline-consultation-api';
import { getJournalByGrowthDataId } from '../api/journal-api';

// Header Component (unchanged)
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
            display: isMenuOpen ? 'flex' : 'none',
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
  const [nutritionSubTab, setNutritionSubTab] = useState('recommendations');
  const [mealPlannerSubTab, setMealPlannerSubTab] = useState('system');
  const [openJournalModal, setOpenJournalModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [journals, setJournals] = useState([]);
  const navigation = useNavigation();
  const route = useRoute();

  // Check abnormal biometric status
  const getAbnormalStatus = (bio) => {
    const results = {};

    // Blood Pressure
    if (bio?.systolicBP && bio?.diastolicBP) {
      const sys = bio.systolicBP;
      const dia = bio.diastolicBP;
      if (sys >= 160 || dia >= 110) {
        results.bloodPressure = {
          abnormal: true,
          message: `Blood Pressure ${sys}/${dia}: severe range (≥160/110). Seek urgent care.`,
        };
      } else if (sys >= 140 || dia >= 90) {
        results.bloodPressure = {
          abnormal: true,
          message: `Blood Pressure ${sys}/${dia}: elevated range (≥140/90)`,
        };
      } else if (sys < 90 || dia < 60) {
        results.bloodPressure = {
          abnormal: true,
          message: `Blood Pressure ${sys}/${dia}: hypotension`,
        };
      }
    }

    // Blood Sugar
    if (bio?.bloodSugarLevelMgDl) {
      const sugar = bio.bloodSugarLevelMgDl;
      if (sugar > 95) {
        results.bloodSugarLevelMgDl = {
          abnormal: true,
          message: `Blood Sugar Level ${sugar}: above pregnancy target (>95)`,
        };
      } else if (sugar < 70) {
        results.bloodSugarLevelMgDl = {
          abnormal: true,
          message: `Blood Sugar Level ${sugar}: hypoglycemia (<70)`,
        };
      }
    }

    // Heart Rate
    if (bio?.heartRateBPM) {
      const hr = bio.heartRateBPM;
      if (hr > 110) {
        results.heartRateBPM = {
          abnormal: true,
          message: `Heart Rate ${hr}: elevated (>110)`,
        };
      } else if (hr < 50) {
        results.heartRateBPM = {
          abnormal: true,
          message: `Heart Rate ${hr}: bradycardia (<50)`,
        };
      }
    }

    // BMI
    if (bio?.weightKg && bio?.heightCm) {
      const bmi = bio.weightKg / Math.pow(bio.heightCm / 100, 2);
      if (bmi < 18.5) {
        results.bmi = {
          abnormal: true,
          message: `BMI ${bmi.toFixed(1)}: underweight`,
        };
      } else if (bmi >= 30) {
        results.bmi = {
          abnormal: true,
          message: `BMI ${bmi.toFixed(1)}: obesity (≥30) increases pregnancy risks`,
        };
      }
    }

    return results;
  };

  const abnormalStatus = pregnancyData?.basicBioMetric
    ? getAbnormalStatus(pregnancyData.basicBioMetric)
    : {};

  const abnormalMessages = Object.values(abnormalStatus)
    .filter((s) => s?.abnormal)
    .map((s) => s.message);

  // Fetch journals
  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const growthDataId = await AsyncStorage.getItem('growthDataId');
        if (growthDataId && token) {
          const { data } = await getJournalByGrowthDataId(growthDataId, token);
          if (data?.error === 0 && Array.isArray(data?.data)) {
            setJournals(data.data);
          } else {
            setJournals([]);
          }
        }
      } catch (err) {
        console.error('Error fetching journals:', err);
        setJournals([]);
      }
    };
    if (pregnancyData?.id) {
      fetchJournals();
    }
  }, [pregnancyData?.id]);

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

  // Handle journal modal
  useEffect(() => {
    if (activeTab === 'journal') {
      setOpenJournalModal(false);
    }
  }, [activeTab]);

  const handleCreateProfile = async (formData) => {
    setIsCreating(true);
    setError(null);
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

  // Navigation tabs
  const tabs = [
    { key: 'weekly', label: 'Weekly Info', queryKey: 'weeklyinfo' },
    { key: 'reminderconsultation', label: 'Checkup Reminder', queryKey: 'reminderconsultationinfo' },
    { key: 'journal', label: 'Journal Entries', queryKey: 'journalinfo' },
    { key: 'nutritional-guidance', label: 'Nutritional Guidance', queryKey: 'nutritional-guidance' },
    { key: 'mealplanner', label: 'Meal Planner', queryKey: 'mealplanner' },
  ];

  const nutritionSubTabs = [
    { key: 'recommendations', label: 'Recommended Needs' },
    { key: 'foodwarnings', label: 'Food Warning' },
  ];

  const mealPlannerSubTabs = [
    { key: 'system', label: 'System Meal Planner' },
    { key: 'custom', label: 'Custom Meal Planner' },
  ];

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

  if (error && error === 'No pregnancy data found. Please create a profile to start tracking.') {
    return (
      <View style={styles(width).pregnancyTrackingPage}>
        <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
        <ScrollView contentContainerStyle={styles(width).mainContent}>
          <View style={styles(width).pregnancyTrackingContainer}>
            <View style={styles(width).trackingWelcomeSection}>
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
          </View>
        </ScrollView>
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
            <View style={styles(width).trackingWelcomeSection}>
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
              {/* Main Navigation Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles(width).navTabs}
                contentContainerStyle={styles(width).navTabsContent}
              >
                {tabs.map((tab) => (
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
              </ScrollView>

              {/* Sub-tabs for Nutritional Guidance */}
              {activeTab === 'nutritional-guidance' && (
                <View style={styles(width).subTabs}>
                  {nutritionSubTabs.map((subTab) => (
                    <TouchableOpacity
                      key={subTab.key}
                      style={[styles(width).subTab, nutritionSubTab === subTab.key ? styles(width).subTabActive : {}]}
                      onPress={() => {
                        setNutritionSubTab(subTab.key);
                        navigation.setParams({
                          'nutritional-guidance': subTab.key,
                          growthDataId: pregnancyData?.id,
                        });
                      }}
                    >
                      <Text style={[styles(width).subTabText, nutritionSubTab === subTab.key ? styles(width).subTabTextActive : {}]}>
                        {subTab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Sub-tabs for Meal Planner */}
              {activeTab === 'mealplanner' && (
                <View style={styles(width).subTabs}>
                  {mealPlannerSubTabs.map((subTab) => (
                    <TouchableOpacity
                      key={subTab.key}
                      style={[styles(width).subTab, mealPlannerSubTab === subTab.key ? styles(width).subTabActive : {}]}
                      onPress={() => {
                        setMealPlannerSubTab(subTab.key);
                        navigation.setParams({
                          mealplanner: subTab.key,
                          growthDataId: pregnancyData?.id,
                        });
                      }}
                    >
                      <Text style={[styles(width).subTabText, mealPlannerSubTab === subTab.key ? styles(width).subTabTextActive : {}]}>
                        {subTab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Tab Content */}
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
                    </View>
                  </View>
                  {pregnancyData.basicBioMetric && (
                    <View style={styles(width).biometricSection}>
                      <View style={styles(width).sectionHeader}>
                        <Text style={styles(width).sectionHeaderTitle}>Health Metrics</Text>
                        <Text style={styles(width).sectionHeaderText}>Your current health measurements</Text>
                      </View>
                      {abnormalMessages.length > 0 && (
                        <View style={styles(width).abnormalAlertBox}>
                          <Text style={styles(width).abnormalAlertTitle}>Health Alert:</Text>
                          {abnormalMessages.map((msg, idx) => (
                            <Text key={idx} style={styles(width).abnormalAlertText}>{msg}</Text>
                          ))}
                          <Text style={styles(width).abnormalAlertText}>Please consult your healthcare provider.</Text>
                        </View>
                      )}
                      <View style={styles(width).biometricCards}>
                        {pregnancyData.preWeight > 0 && (
                          <View style={styles(width).biometricCard}>
                            <View style={styles(width).metricIcon}>
                              <Text style={styles(width).placeholderIcon}>⚖️</Text>
                            </View>
                            <View style={styles(width).metricInfo}>
                              <Text style={styles(width).metricValue}>
                                {pregnancyData.preWeight} Kg
                              </Text>
                              <Text style={styles(width).metricLabel}>Pre-Pregnancy Weight</Text>
                            </View>
                          </View>
                        )}
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
                          <View style={[styles(width).biometricCard, abnormalStatus.bmi?.abnormal ? styles(width).biometricCardAbnormal : {}]}>
                            <View style={styles(width).metricIcon}>
                              <Text style={styles(width).placeholderIcon}>🧮</Text>
                            </View>
                            <View style={styles(width).metricInfo}>
                              <Text style={styles(width).metricValue}>
                                {pregnancyData.basicBioMetric.bmi.toFixed(1)}
                              </Text>
                              <Text style={styles(width).metricLabel}>
                                BMI {abnormalStatus.bmi?.abnormal ? `(${abnormalStatus.bmi.message})` : ''}
                              </Text>
                            </View>
                          </View>
                        )}
                        {(pregnancyData.basicBioMetric.systolicBP > 0 || pregnancyData.basicBioMetric.diastolicBP > 0) && (
                          <View style={[styles(width).biometricCard, abnormalStatus.bloodPressure?.abnormal ? styles(width).biometricCardAbnormal : {}]}>
                            <View style={styles(width).metricIcon}>
                              <Text style={styles(width).placeholderIcon}>❤️</Text>
                            </View>
                            <View style={styles(width).metricInfo}>
                              <Text style={styles(width).metricValue}>
                                {pregnancyData.basicBioMetric.systolicBP}/{pregnancyData.basicBioMetric.diastolicBP} mmHg
                              </Text>
                              <Text style={styles(width).metricLabel}>
                                Blood Pressure {abnormalStatus.bloodPressure?.abnormal ? `(${abnormalStatus.bloodPressure.message})` : ''}
                              </Text>
                            </View>
                          </View>
                        )}
                        {pregnancyData.basicBioMetric.heartRateBPM > 0 && (
                          <View style={[styles(width).biometricCard, abnormalStatus.heartRateBPM?.abnormal ? styles(width).biometricCardAbnormal : {}]}>
                            <View style={styles(width).metricIcon}>
                              <Text style={styles(width).placeholderIcon}>💗</Text>
                            </View>
                            <View style={styles(width).metricInfo}>
                              <Text style={styles(width).metricValue}>
                                {pregnancyData.basicBioMetric.heartRateBPM} bpm
                              </Text>
                              <Text style={styles(width).metricLabel}>
                                Heart Rate {abnormalStatus.heartRateBPM?.abnormal ? `(${abnormalStatus.heartRateBPM.message})` : ''}
                              </Text>
                            </View>
                          </View>
                        )}
                        {pregnancyData.basicBioMetric.bloodSugarLevelMgDl > 0 && (
                          <View style={[styles(width).biometricCard, abnormalStatus.bloodSugarLevelMgDl?.abnormal ? styles(width).biometricCardAbnormal : {}]}>
                            <View style={styles(width).metricIcon}>
                              <Text style={styles(width).placeholderIcon}>🩺</Text>
                            </View>
                            <View style={styles(width).metricInfo}>
                              <Text style={styles(width).metricValue}>
                                {pregnancyData.basicBioMetric.bloodSugarLevelMgDl} mg/dL
                              </Text>
                              <Text style={styles(width).metricLabel}>
                                Blood Sugar {abnormalStatus.bloodSugarLevelMgDl?.abnormal ? `(${abnormalStatus.bloodSugarLevelMgDl.message})` : ''}
                              </Text>
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
                    journalEntries={journals}
                    growthDataId={pregnancyData?.id}
                    openModal={openJournalModal}
                    setOpenModal={setOpenJournalModal}
                  />
                </View>
              )}
              {activeTab === 'nutritional-guidance' && (
                <View style={styles(width).tabContent}>
                  {nutritionSubTab === 'recommendations' && (
                    <RecommendedNutritionalNeeds pregnancyData={pregnancyData} />
                  )}
                  {nutritionSubTab === 'foodwarnings' && (
                    <FoodWarning />
                  )}
                </View>
              )}
              {activeTab === 'mealplanner' && (
                <View style={styles(width).tabContent}>
                  {mealPlannerSubTab === 'system' && (
                    <SystemMealPlanner />
                  )}
                  {mealPlannerSubTab === 'custom' && (
                    <CustomMealPlanner />
                  )}
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
    marginTop: 20,
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
    marginBottom: 20,
  },
  navTabsContent: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'flex-start',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 4,
    minWidth: width < 768 ? 100 : 120,
    minHeight: 48,
    backgroundColor: '#f5f7fa',
  },
  tabActive: {
    backgroundColor: '#04668D',
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
  subTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f5f7fa',
  },
  subTabActive: {
    backgroundColor: '#04668D',
  },
  subTabText: {
    color: '#555555',
    fontSize: 14,
    fontWeight: '600',
  },
  subTabTextActive: {
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
  abnormalAlertBox: {
    backgroundColor: '#ffe6e6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  abnormalAlertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E74C3C',
    marginBottom: 5,
  },
  abnormalAlertText: {
    fontSize: 14,
    color: '#E74C3C',
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
  biometricCardAbnormal: {
    borderColor: '#E74C3C',
    borderWidth: 1,
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
    zIndex: 1001,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#feffe9',
    textDecorationLine: 'none',
  },
  menuToggle: {
    padding: 6,
    zIndex: 1002,
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
    zIndex: 1000,
    minHeight: width < 768 ? 'auto' : 400,
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
    width: '100%',
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