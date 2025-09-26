import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../api/auth';
import LoginScreen from '../screens/authscreen/LoginScreen';
import RegisterScreen from '../screens/authscreen/RegisterScreen';
import ForgotPasswordScreen from '../screens/authscreen/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/authscreen/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AccountScreen from '../screens/AccountScreen';
import AboutScreen from '../screens/AboutScreen';
import DueDateCalculatorScreen from '../screens/DueDateCalculatorScreen';
import PregnancyTrackingScreen from '../screens/PregnancyTrackingScreen';
import NutritionalGuidanceScreen from '../screens/NutritionalGuidanceScreen';
import ConsultationScreen from '../screens/ConsultationScreen';
import BlogScreen from '../screens/BlogScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import AdviceScreen from '../screens/AdviceScreen';
import JournalEntryDetail from '../screens/pregnacytracker/JournalEntryDetail';
import JournalEntryForm from '../screens/pregnacytracker/JournalEntryForm';
import RecommendedNutritionalNeeds from '../screens/pregnacytracker/RecommendedNutritionalNeeds';
import FoodWarning from '../screens/pregnacytracker/FoodWarning';
import SystemMealPlanner from '../screens/pregnacytracker/SystemMealPlanner';
import CustomMealPlanner from '../screens/pregnacytracker/CustomMealPlanner';
import ClinicDetailScreen from '../screens/ClinicDetailScreen';
import ImagePreview from '../screens/pregnacytracker/ImagePreview';
import ConsultationChat from '../screens/ConsultationChat';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="DueDateCalculator" component={DueDateCalculatorScreen} />
      <Stack.Screen name="PregnancyTracking" component={PregnancyTrackingScreen} />
      <Stack.Screen name="JournalEntryDetail" component={JournalEntryDetail} />
      <Stack.Screen name="JournalEntryForm" component={JournalEntryForm} />
      <Stack.Screen name="NutritionalGuidance" component={NutritionalGuidanceScreen} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} />
      <Stack.Screen name="ConsultationChat" component={ConsultationChat} />
      <Stack.Screen name="Blog" component={BlogScreen} />
      <Stack.Screen name="BlogPost" component={BlogDetailScreen} />
      <Stack.Screen name="AIAdvice" component={AdviceScreen} />
      <Stack.Screen name="RecommendedNutritionalNeeds" component={RecommendedNutritionalNeeds} />
      <Stack.Screen name="FoodWarning" component={FoodWarning} />
      <Stack.Screen name="SystemMealPlanner" component={SystemMealPlanner} />
      <Stack.Screen name="CustomMealPlanner" component={CustomMealPlanner} />
      <Stack.Screen name="ClinicDetail" component={ClinicDetailScreen} />
      <Stack.Screen name="ImagePreview" component={ImagePreview} />

    </Stack.Navigator>
  );
};

const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const response = await getCurrentUser(token);
          if (response.data) {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'HomeTabs' : 'Login'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;