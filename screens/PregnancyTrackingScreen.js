import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Animated,
  useWindowDimensions,
  Platform,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ChatBox from "./ChatBox"; // Adjust the import path as needed
import TrackingForm from "./pregnacytracker/TrackingForm";
import PregnancyOverview from "./pregnacytracker/PregnancyOverview";
import PregnancyProgressBar from "./pregnacytracker/PregnancyProgressBar";
import JournalSection from "./pregnacytracker/JournalSection";
import BabyDevelopment from "./pregnacytracker/BabyDevelopment";
import UpcomingAppointments from "./pregnacytracker/UpcomingAppointments";
import CheckupReminder from "./pregnacytracker/CheckupReminder";
import SystemMealPlanner from "./pregnacytracker/SystemMealPlanner";
import CustomMealPlanner from "./pregnacytracker/CustomMealPlanner";
import RecommendedNutritionalNeeds from "./pregnacytracker/RecommendedNutritionalNeeds";
import FoodWarning from "./pregnacytracker/FoodWarning";
import {
  getGrowthDataFromUser,
  createGrowthDataProfile,
  getCurrentWeekGrowthData,
} from "../api/growthdata-api";
import { createBasicBioMetric } from "../api/basic-bio-metric-api";
import { getCurrentUser, logout } from "../api/auth";
import { viewAllOfflineConsultation } from "../api/offline-consultation-api";
import { getJournalByGrowthDataId } from "../api/journal-api";
import { Header } from "./HomeScreen";

const PregnancyTrackingPage = () => {
  const { width } = useWindowDimensions();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [user, setUser] = useState(null);
  const [pregnancyData, setPregnancyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("weekly");
  const [nutritionSubTab, setNutritionSubTab] = useState("recommendations");
  const [mealPlannerSubTab, setMealPlannerSubTab] = useState("system");
  const [openJournalModal, setOpenJournalModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [journals, setJournals] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const chatIconScale = useRef(new Animated.Value(1)).current;

  // Handle route params to set active tab
  useEffect(() => {
    const {
      journalinfo,
      weeklyinfo,
      reminderconsultationinfo,
      nutritionalguidance,
      mealplanner,
    } = route.params || {};
    const tabParams = {
      journalinfo: "journal",
      weeklyinfo: "weekly",
      reminderconsultationinfo: "reminderconsultation",
      nutritionalguidance: "nutritional-guidance",
      mealplanner: "mealplanner",
    };

    const activeTabKey = Object.keys(tabParams).find(
      (key) => route.params?.[key] === "true"
    );

    if (activeTabKey) {
      setActiveTab(tabParams[activeTabKey]);
    }
  }, [route.params]);

  // Reset params on focus to ensure clean state
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      const {
        journalinfo,
        weeklyinfo,
        reminderconsultationinfo,
        nutritionalguidance,
        mealplanner,
      } = route.params || {};
      const tabParams = {
        journalinfo: "journal",
        weeklyinfo: "weekly",
        reminderconsultationinfo: "reminderconsultation",
        nutritionalguidance: "nutritional-guidance",
        mealplanner: "mealplanner",
      };

      const activeTabKey = Object.keys(tabParams).find(
        (key) => route.params?.[key] === "true"
      );

      if (activeTabKey) {
        setActiveTab(tabParams[activeTabKey]);
      } else {
        setActiveTab("weekly");
      }

      navigation.setParams({
        ...route.params,
        growthDataId: pregnancyData?.id,
      });
    });

    return unsubscribe;
  }, [navigation, pregnancyData?.id, route.params]);

  // Fade animation for content transitions
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [activeTab, nutritionSubTab, mealPlannerSubTab]);

  // Check abnormal biometric status
  const getAbnormalStatus = (bio) => {
    const results = {};

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
          message: `BMI ${bmi.toFixed(
            1
          )}: obesity (≥30) increases pregnancy risks`,
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

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const growthDataId = await AsyncStorage.getItem("growthDataId");
        if (growthDataId && token) {
          const { data } = await getJournalByGrowthDataId(growthDataId, token);
          if (data?.error === 0 && Array.isArray(data?.data)) {
            setJournals(data.data);
          } else {
            setJournals([]);
          }
        }
      } catch (err) {
        console.error("Error fetching journals:", err);
        setJournals([]);
      }
    };
    if (pregnancyData?.id) {
      fetchJournals();
    }
  }, [pregnancyData?.id]);

  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          setError("Please sign in to access pregnancy tracking");
          if (isMounted) navigation.navigate("Login");
          return;
        }
        setToken(storedToken);
        let userData;
        try {
          const res = await getCurrentUser(storedToken);
          userData = res?.data?.data;
        } catch (userError) {
          throw new Error("Failed to fetch user data. Please sign in again.");
        }
        if (!userData || !userData.id) {
          throw new Error("Access denied or user ID missing.");
        }
        if (userData.roleId !== 2) {
          setError(
            "This feature is only available for specific users. Please contact support."
          );
          return;
        }
        if (isMounted) setUser(userData);
        let storedUserId = await AsyncStorage.getItem("userId");
        if (!storedUserId) {
          storedUserId = userData.id;
          await AsyncStorage.setItem("userId", userData.id);
        } else if (storedUserId !== userData.id) {
          await AsyncStorage.setItem("userId", userData.id);
        }
        if (isMounted) setUserId(storedUserId);
        const currentDate = new Date().toISOString().split("T")[0];
        let pregRes;
        try {
          const response = await getCurrentWeekGrowthData(
            userData.id,
            currentDate,
            storedToken
          );
          pregRes = response.data;
        } catch (pregError) {
          setError(
            "No pregnancy data found. Please create a profile to start tracking."
          );
          if (isMounted) setPregnancyData(null);
          return;
        }
        if (pregRes?.error === 0 && pregRes?.data) {
          if (isMounted) {
            setPregnancyData(pregRes.data);
            setSelectedWeek(pregRes.data.currentGestationalAgeInWeeks);
            await AsyncStorage.setItem("growthDataId", pregRes.data.id);
          }
        } else {
          if (isMounted) {
            setPregnancyData(null);
            setError(
              "No pregnancy data found. Please create a profile to start tracking."
            );
          }
        }
        if (userData.id && storedToken) {
          try {
            setLoadingAppointments(true);
            const response = await viewAllOfflineConsultation(
              userData.id,
              null,
              storedToken
            );
            const consultations = Array.isArray(response.data?.data)
              ? response.data.data
              : [];
            const mappedAppointments = consultations.map((c) => ({
              id: c.id,
              name: c.checkupName || "Unknown name",
              note: c.healthNote || "No notes available",
              type: c.consultationType?.toLowerCase(),
              doctor: c.doctor?.fullName || "Unknown Doctor",
              clinic: c.clinic?.name || "Unknown Clinic",
              address: c.clinic?.address,
              start: new Date(c.startDate),
              end: new Date(c.endDate),
              status: c.status?.toLowerCase(),
            }));
            if (isMounted) setAppointments(mappedAppointments);
          } catch (err) {
            setError("Failed to fetch appointments. Please try again.");
          } finally {
            if (isMounted) setLoadingAppointments(false);
          }
        }
      } catch (err) {
        let errorMessage =
          err.message || "Failed to load page. Please try again.";
        if (
          err.response?.data?.message === "User does not exist!" ||
          err.response?.status === 401
        ) {
          await AsyncStorage.multiRemove([
            "authToken",
            "userId",
            "growthDataId",
          ]);
          errorMessage = "User session invalid. Please sign in again.";
          if (isMounted) {
            setUserId(null);
            setToken(null);
            setUser(null);
            setPregnancyData(null);
            setAppointments([]);
            navigation.navigate("Login");
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
    if (activeTab === "journal") {
      setOpenJournalModal(false);
    }
  }, [activeTab]);

  const handleCreateProfile = async (formData) => {
    setIsCreating(true);
    setError(null);
    try {
      if (!token || !userId) {
        throw new Error("Authentication data missing. Please sign in again.");
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
        throw new Error("Failed to create pregnancy profile.");
      }
      if (growthDataRes?.data?.error !== 0) {
        throw new Error(
          growthDataRes?.data?.message || "Failed to create pregnancy profile."
        );
      }
      let growthDataId = growthDataRes?.data?.data?.id;
      if (!growthDataId) {
        const currentDate = new Date().toISOString().split("T")[0];
        const { data: fallbackRes } = await getCurrentWeekGrowthData(
          userId,
          currentDate,
          token
        );
        if (fallbackRes?.error === 0 && fallbackRes?.data?.id) {
          growthDataId = fallbackRes.data.id;
        } else {
          throw new Error(
            "Could not retrieve newly created growth data profile."
          );
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
        throw new Error("Failed to save biometric data.");
      }
      const currentDate = new Date().toISOString().split("T")[0];
      let pregRes;
      try {
        const response = await getCurrentWeekGrowthData(
          userId,
          currentDate,
          token
        );
        pregRes = response.data;
      } catch (pregError) {
        throw new Error("Failed to fetch updated pregnancy data.");
      }
      if (pregRes?.error === 0 && pregRes?.data) {
        setPregnancyData(pregRes.data);
        setSelectedWeek(pregRes.data.currentGestationalAgeInWeeks);
        await AsyncStorage.setItem("growthDataId", pregRes.data.id);
      } else {
        throw new Error(
          pregRes?.message || "Failed to fetch updated pregnancy data."
        );
      }
    } catch (err) {
      let errorMessage =
        err.message || "Something went wrong. Please try again.";
      if (err.response) {
        errorMessage =
          err.response.data?.message ||
          err.response.data?.title ||
          errorMessage;
      } else if (err.request) {
        errorMessage = "Network error: Could not reach the server.";
      }
      setError(errorMessage);
      if (errorMessage.includes("sign in")) {
        navigation.navigate("Login");
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
      console.error("Logout error:", error);
    } finally {
      await AsyncStorage.multiRemove(["authToken", "userId", "growthDataId"]);
      setUserId(null);
      setToken(null);
      setUser(null);
      setPregnancyData(null);
      setAppointments([]);
      navigation.replace("Login");
    }
  };

  const handleContactIconPress = () => {
    Animated.sequence([
      Animated.spring(chatIconScale, {
        toValue: 1.2,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(chatIconScale, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
    setIsChatOpen((prev) => !prev);
  };

  const hasValidPregnancyData =
    pregnancyData &&
    !!pregnancyData.firstDayOfLastMenstrualPeriod &&
    !!pregnancyData.estimatedDueDate;

  const tabs = [
    { key: "weekly", label: "Weekly", queryKey: "weeklyinfo" },
    {
      key: "reminderconsultation",
      label: "Reminders",
      queryKey: "reminderconsultationinfo",
    },
    { key: "journal", label: "Journal", queryKey: "journalinfo" },
    {
      key: "nutritional-guidance",
      label: "Nutrition",
      queryKey: "nutritionalguidance",
    },
    { key: "mealplanner", label: "Meals", queryKey: "mealplanner" },
  ];

  const nutritionSubTabs = [
    { key: "recommendations", label: "Nutritional Needs" },
    { key: "foodwarnings", label: "Food Warnings" },
  ];

  const mealPlannerSubTabs = [
    { key: "system", label: "System Planner" },
    { key: "custom", label: "Custom Planner" },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles(width).mainContent}>
          <Header
            navigation={navigation}
            user={user}
            setUser={setUser}
            handleLogout={handleLogout}
          />
          <View style={styles(width).loadingContainer}>
            <ActivityIndicator size="large" color="#067DAD" />
            <Text style={styles(width).loadingText}>
              Loading your journey...
            </Text>
          </View>
        </View>
      );
    }

    if (
      error &&
      error ===
        "No pregnancy data found. Please create a profile to start tracking."
    ) {
      return (
        <View style={styles(width).mainContent}>
          <Header
            navigation={navigation}
            user={user}
            setUser={setUser}
            handleLogout={handleLogout}
          />
          <View style={styles(width).pregnancyTrackingContainer}>
            <View style={styles(width).trackingWelcomeSection}>
              <View style={styles(width).trackingWelcomeHeader}>
                <Text style={styles(width).welcomeHeaderTitle}>
                  Welcome to Your Pregnancy Journey
                </Text>
                <Text style={styles(width).welcomeHeaderText}>
                  Begin tracking your pregnancy with personalized insights and
                  support
                </Text>
              </View>
              <TrackingForm
                onSubmit={handleCreateProfile}
                isLoading={isCreating}
              />
            </View>
          </View>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles(width).mainContent}>
          <Header
            navigation={navigation}
            user={user}
            setUser={setUser}
            handleLogout={handleLogout}
          />
          <View style={styles(width).errorContainer}>
            <Text style={styles(width).errorIcon}>⚠️</Text>
            <Text style={styles(width).errorTitle}>Something Went Wrong</Text>
            <Text style={styles(width).errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() =>
                error.includes("sign in")
                  ? navigation.navigate("Login")
                  : initializeApp()
              }
              style={styles(width).retryBtn}
            >
              <Text style={styles(width).retryBtnText}>
                {error.includes("sign in") ? "Go to Login" : "Try Again"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <Animated.View style={[styles(width).mainContent, { opacity: fadeAnim }]}>
        <Header
          navigation={navigation}
          user={user}
          setUser={setUser}
          handleLogout={handleLogout}
        />
        <View style={styles(width).pregnancyTrackingContainer}>
          {!hasValidPregnancyData ? (
            <View style={styles(width).trackingWelcomeSection}>
              <View style={styles(width).trackingWelcomeHeader}>
                <Text style={styles(width).welcomeHeaderTitle}>
                  Welcome to Your Pregnancy Journey
                </Text>
                <Text style={styles(width).welcomeHeaderText}>
                  Begin tracking your pregnancy with personalized insights and
                  support
                </Text>
              </View>
              <TrackingForm
                onSubmit={handleCreateProfile}
                isLoading={isCreating}
              />
            </View>
          ) : (
            <View style={styles(width).trackingDashboard}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles(width).navTabs}
                contentContainerStyle={styles(width).navTabsContent}
                data={tabs}
                renderItem={({ item: tab }) => (
                  <TouchableOpacity
                    style={[
                      styles(width).tab,
                      activeTab === tab.key ? styles(width).tabActive : {},
                    ]}
                    onPress={() => {
                      const resetParams = tabs.reduce((acc, t) => {
                        acc[t.queryKey] = undefined;
                        return acc;
                      }, {});
                      navigation.setParams({
                        ...resetParams,
                        [tab.queryKey]: "true",
                        growthDataId: pregnancyData?.id,
                      });
                      setActiveTab(tab.key);
                    }}
                    accessibilityLabel={`Switch to ${tab.label} tab`}
                  >
                    <Text
                      style={[
                        styles(width).tabText,
                        activeTab === tab.key
                          ? styles(width).tabTextActive
                          : {},
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.key}
                key={`tabs-${activeTab}`}
              />
              {activeTab === "nutritional-guidance" && (
                <View style={styles(width).subTabs}>
                  {nutritionSubTabs.map((subTab) => (
                    <TouchableOpacity
                      key={subTab.key}
                      style={[
                        styles(width).subTab,
                        nutritionSubTab === subTab.key
                          ? styles(width).subTabActive
                          : {},
                      ]}
                      onPress={() => {
                        setNutritionSubTab(subTab.key);
                        navigation.setParams({
                          nutritionalguidance: subTab.key,
                          growthDataId: pregnancyData?.id,
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles(width).subTabText,
                          nutritionSubTab === subTab.key
                            ? styles(width).subTabTextActive
                            : {},
                        ]}
                      >
                        {subTab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {activeTab === "mealplanner" && (
                <View style={styles(width).subTabs}>
                  {mealPlannerSubTabs.map((subTab) => (
                    <TouchableOpacity
                      key={subTab.key}
                      style={[
                        styles(width).subTab,
                        mealPlannerSubTab === subTab.key
                          ? styles(width).subTabActive
                          : {},
                      ]}
                      onPress={() => {
                        setMealPlannerSubTab(subTab.key);
                        navigation.setParams({
                          mealplanner: subTab.key,
                          growthDataId: pregnancyData?.id,
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles(width).subTabText,
                          mealPlannerSubTab === subTab.key
                            ? styles(width).subTabTextActive
                            : {},
                        ]}
                      >
                        {subTab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Animated.View
                style={[styles(width).tabContent, { opacity: fadeAnim }]}
              >
                {activeTab === "weekly" && (
                  <>
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
                          <Text style={styles(width).sectionHeaderTitle}>
                            Your Health Metrics
                          </Text>
                          <Text style={styles(width).sectionHeaderText}>
                            Track your vital signs
                          </Text>
                        </View>
                        {abnormalMessages.length > 0 && (
                          <View style={styles(width).abnormalAlertBox}>
                            <Text style={styles(width).abnormalAlertTitle}>
                              Health Alert
                            </Text>
                            {abnormalMessages.map((msg, idx) => (
                              <Text
                                key={idx}
                                style={styles(width).abnormalAlertText}
                              >
                                {msg}
                              </Text>
                            ))}
                            <Text style={styles(width).abnormalAlertText}>
                              Please consult your healthcare provider.
                            </Text>
                          </View>
                        )}
                        <View style={styles(width).biometricCards}>
                          {pregnancyData.preWeight > 0 && (
                            <View style={styles(width).biometricCard}>
                              <View style={styles(width).metricIcon}>
                                <Text style={styles(width).placeholderIcon}>
                                  ⚖️
                                </Text>
                              </View>
                              <View style={styles(width).metricInfo}>
                                <Text style={styles(width).metricValue}>
                                  {pregnancyData.preWeight} Kg
                                </Text>
                                <Text style={styles(width).metricLabel}>
                                  Pre-Pregnancy Weight
                                </Text>
                              </View>
                            </View>
                          )}
                          {pregnancyData.basicBioMetric.weightKg > 0 && (
                            <View style={styles(width).biometricCard}>
                              <View style={styles(width).metricIcon}>
                                <Text style={styles(width).placeholderIcon}>
                                  ⚖️
                                </Text>
                              </View>
                              <View style={styles(width).metricInfo}>
                                <Text style={styles(width).metricValue}>
                                  {pregnancyData.basicBioMetric.weightKg} Kg
                                </Text>
                                <Text style={styles(width).metricLabel}>
                                  Current Weight
                                </Text>
                              </View>
                            </View>
                          )}
                          {pregnancyData.basicBioMetric.bmi > 0 && (
                            <View
                              style={[
                                styles(width).biometricCard,
                                abnormalStatus.bmi?.abnormal
                                  ? styles(width).biometricCardAbnormal
                                  : {},
                              ]}
                            >
                              <View style={styles(width).metricIcon}>
                                <Text style={styles(width).placeholderIcon}>
                                  🧮
                                </Text>
                              </View>
                              <View style={styles(width).metricInfo}>
                                <Text style={styles(width).metricValue}>
                                  {pregnancyData.basicBioMetric.bmi.toFixed(1)}
                                </Text>
                                <Text style={styles(width).metricLabel}>
                                  BMI{" "}
                                  {abnormalStatus.bmi?.abnormal
                                    ? `(${abnormalStatus.bmi.message})`
                                    : ""}
                                </Text>
                              </View>
                            </View>
                          )}
                          {(pregnancyData.basicBioMetric.systolicBP > 0 ||
                            pregnancyData.basicBioMetric.diastolicBP > 0) && (
                            <View
                              style={[
                                styles(width).biometricCard,
                                abnormalStatus.bloodPressure?.abnormal
                                  ? styles(width).biometricCardAbnormal
                                  : {},
                              ]}
                            >
                              <View style={styles(width).metricIcon}>
                                <Text style={styles(width).placeholderIcon}>
                                  ❤️
                                </Text>
                              </View>
                              <View style={styles(width).metricInfo}>
                                <Text style={styles(width).metricValue}>
                                  {pregnancyData.basicBioMetric.systolicBP}/
                                  {pregnancyData.basicBioMetric.diastolicBP}{" "}
                                  mmHg
                                </Text>
                                <Text style={styles(width).metricLabel}>
                                  Blood Pressure{" "}
                                  {abnormalStatus.bloodPressure?.abnormal
                                    ? `(${abnormalStatus.bloodPressure.message})`
                                    : ""}
                                </Text>
                              </View>
                            </View>
                          )}
                          {pregnancyData.basicBioMetric.heartRateBPM > 0 && (
                            <View
                              style={[
                                styles(width).biometricCard,
                                abnormalStatus.heartRateBPM?.abnormal
                                  ? styles(width).biometricCardAbnormal
                                  : {},
                              ]}
                            >
                              <View style={styles(width).metricIcon}>
                                <Text style={styles(width).placeholderIcon}>
                                  💗
                                </Text>
                              </View>
                              <View style={styles(width).metricInfo}>
                                <Text style={styles(width).metricValue}>
                                  {pregnancyData.basicBioMetric.heartRateBPM}{" "}
                                  bpm
                                </Text>
                                <Text style={styles(width).metricLabel}>
                                  Heart Rate{" "}
                                  {abnormalStatus.heartRateBPM?.abnormal
                                    ? `(${abnormalStatus.heartRateBPM.message})`
                                    : ""}
                                </Text>
                              </View>
                            </View>
                          )}
                          {pregnancyData.basicBioMetric.bloodSugarLevelMgDl >
                            0 && (
                            <View
                              style={[
                                styles(width).biometricCard,
                                abnormalStatus.bloodSugarLevelMgDl?.abnormal
                                  ? styles(width).biometricCardAbnormal
                                  : {},
                              ]}
                            >
                              <View style={styles(width).metricIcon}>
                                <Text style={styles(width).placeholderIcon}>
                                  🩺
                                </Text>
                              </View>
                              <View style={styles(width).metricInfo}>
                                <Text style={styles(width).metricValue}>
                                  {
                                    pregnancyData.basicBioMetric
                                      .bloodSugarLevelMgDl
                                  }{" "}
                                  mg/dL
                                </Text>
                                <Text style={styles(width).metricLabel}>
                                  Blood Sugar{" "}
                                  {abnormalStatus.bloodSugarLevelMgDl?.abnormal
                                    ? `(${abnormalStatus.bloodSugarLevelMgDl.message})`
                                    : ""}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </>
                )}
                {activeTab === "reminderconsultation" && (
                  <>
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
                  </>
                )}
                {activeTab === "journal" && (
                  <JournalSection
                    journalEntries={journals}
                    growthDataId={pregnancyData?.id}
                    openModal={openJournalModal}
                    setOpenModal={setOpenJournalModal}
                  />
                )}
                {activeTab === "nutritional-guidance" && (
                  <>
                    {nutritionSubTab === "recommendations" && (
                      <RecommendedNutritionalNeeds
                        pregnancyData={pregnancyData}
                      />
                    )}
                    {nutritionSubTab === "foodwarnings" && <FoodWarning />}
                  </>
                )}
                {activeTab === "mealplanner" && (
                  <>
                    {mealPlannerSubTab === "system" && <SystemMealPlanner />}
                    {mealPlannerSubTab === "custom" && <CustomMealPlanner />}
                  </>
                )}
              </Animated.View>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles(width).pregnancyTrackingPage}>
      <FlatList
        data={[{}]}
        renderItem={renderContent}
        keyExtractor={() => "main-content"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      />
      <Animated.View
        style={[
          styles(width).contactIcon,
          { transform: [{ scale: chatIconScale }] },
          isChatOpen && { display: "none" },
        ]}
      >
        <TouchableOpacity
          onPress={handleContactIconPress}
          activeOpacity={0.7}
          accessibilityLabel="Open chat"
          accessibilityHint="Opens the chat support window"
        >
          <Ionicons name="chatbubble-ellipses" size={30} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
      <Modal
        visible={isChatOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsChatOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles(width).modalOverlay}
        >
          <ChatBox
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            navigation={navigation}
          />
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = (width) =>
  StyleSheet.create({
    pregnancyTrackingPage: {
      flex: 1,
      backgroundColor: "#f5f7fa",
    },
    mainContent: {
      paddingTop: Platform.OS === "ios" ? 10 : 20,
      paddingBottom: 20,
    },
    pregnancyTrackingContainer: {
      maxWidth: 1200,
      marginVertical: 20,
      paddingHorizontal: width < 768 ? 15 : 20,
      alignSelf: "center",
      width: "100%",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 400,
    },
    loadingText: {
      color: "#FE6B6A",
      fontSize: 16,
      fontWeight: "500",
      marginTop: 12,
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 400,
      paddingHorizontal: 20,
    },
    errorIcon: {
      fontSize: 48,
      color: "#E74C3C",
      marginBottom: 16,
    },
    errorTitle: {
      color: "#04668D",
      fontSize: 24,
      fontWeight: "600",
      marginBottom: 12,
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    errorText: {
      color: "#FE6B6A",
      fontSize: 16,
      marginBottom: 20,
      textAlign: "center",
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    retryBtn: {
      backgroundColor: "#04668D",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: "center",
      minWidth: 120,
    },
    retryBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    trackingWelcomeSection: {
      justifyContent: "center",
      alignItems: "center",
      maxWidth: 600,
      padding: 20,
      alignSelf: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    trackingWelcomeHeader: {
      marginBottom: 24,
      alignItems: "center",
    },
    welcomeHeaderTitle: {
      color: "#04668D",
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 8,
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    welcomeHeaderText: {
      color: "#FE6B6A",
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    trackingDashboard: {
      flexDirection: "column",
      rowGap: 20,
    },
    navTabs: {
      marginBottom: 16,
    },
    navTabsContent: {
      flexDirection: "row",
      padding: 8,
      backgroundColor: "#f5f7fa",
      borderRadius: 12,
      justifyContent: "flex-start",
    },
    tab: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      marginHorizontal: 4,
      minWidth: width < 768 ? 90 : 110,
      minHeight: 44,
      backgroundColor: "#FFFFFF",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    tabActive: {
      backgroundColor: "#04668D",
      transform: [{ scale: 1.02 }],
    },
    tabText: {
      color: "#555555",
      fontSize: width < 768 ? 14 : 15,
      fontWeight: "600",
      textAlign: "center",
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    tabTextActive: {
      color: "#fff",
      fontWeight: "700",
    },
    subTabs: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 16,
      backgroundColor: "#f5f7fa",
      borderRadius: 12,
      padding: 8,
    },
    subTab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: "center",
      borderRadius: 10,
      marginHorizontal: 4,
      backgroundColor: "#FFFFFF",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    subTabActive: {
      backgroundColor: "#04668D",
    },
    subTabText: {
      color: "#555555",
      fontSize: 14,
      fontWeight: "600",
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    subTabTextActive: {
      color: "#fff",
      fontWeight: "700",
    },
    tabContent: {
      flexDirection: "column",
      rowGap: 20,
    },
    dashboardGrid: {
      flexDirection: "row",
      columnGap: 20,
      flexWrap: "wrap",
    },
    leftColumn: {
      flex: 1,
      minWidth: width < 768 ? 280 : 300,
    },
    rightColumn: {
      flex: 1,
      minWidth: width < 768 ? 280 : 300,
    },
    biometricSection: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 20,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    sectionHeader: {
      marginBottom: 16,
    },
    sectionHeaderTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#04668D",
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    sectionHeaderText: {
      fontSize: 14,
      color: "#FE6B6A",
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    abnormalAlertBox: {
      backgroundColor: "#ffe6e6",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    abnormalAlertTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#E74C3C",
      marginBottom: 8,
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    abnormalAlertText: {
      fontSize: 14,
      color: "#E74C3C",
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    biometricCards: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 16,
      rowGap: 16,
    },
    biometricCard: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: 12,
      padding: 16,
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      flex: 1,
      minWidth: width < 768 ? 160 : 200,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    biometricCardAbnormal: {
      borderColor: "#E74C3C",
      borderWidth: 1,
    },
    metricIcon: {
      justifyContent: "center",
      alignItems: "center",
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#f5f7fa",
    },
    placeholderIcon: {
      fontSize: 24,
    },
    metricInfo: {
      flexDirection: "column",
      flex: 1,
    },
    metricValue: {
      fontSize: 18,
      fontWeight: "700",
      color: "#04668D",
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    metricLabel: {
      fontSize: 12,
      color: "#FE6B6A",
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    },
    contactIcon: {
      position: "absolute",
      bottom: 30,
      right: 20,
      width: 56,
      height: 56,
      backgroundColor: "#04668D",
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
      zIndex: 2000,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "flex-end",
    },
  });

export default PregnancyTrackingPage;