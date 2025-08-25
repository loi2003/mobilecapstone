import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

// Header Component
const Header = ({ navigation, user, setUser, handleLogout }) => {
  const { width } = useWindowDimensions(); // Use hook for dynamic dimensions
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current; // Use ref for animation value

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
    { name: 'DueDate Calculator', route: 'DueDateCalculator', title: 'DueDate Calculator' },
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
        <Animated.View
          style={[
            styles(width).navLinks,
            { transform: [{ translateX: slideAnim }] },
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
    </View>
  );
};

// Footer Component
const Footer = ({ navigation }) => {
  const { width } = useWindowDimensions(); // Use hook for dynamic dimensions
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
    <View style={styles(width).footer}>
      <View style={styles(width).footerContainer}>
        <View style={styles(width).footerSection}>
          <Text style={styles(width).footerSectionTitle}>Contact</Text>
          <Text style={styles(width).footerText}>Email: support@genderhealthweb.com</Text>
          <Text style={styles(width).footerText}>Phone: (123) 456-7890</Text>
        </View>
        <View style={styles(width).footerSection}>
          <Text style={styles(width).footerSectionTitle}>Follow Us</Text>
          <View style={styles(width).socialLinks}>
            {socialLinks.map((social, index) => (
              <TouchableOpacity
                key={index}
                style={styles(width).socialLink}
                onPress={() => Linking.openURL(social.url)}
              >
                <Ionicons name={social.icon} size={20} color="#ffffff" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles(width).footerSection}>
          <Text style={styles(width).footerSectionTitle}>Stay Updated</Text>
          <View style={styles(width).newsletterForm}>
            <TextInput
              style={styles(width).newsletterInput}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles(width).newsletterButton}
              onPress={handleNewsletterSubmit}
            >
              <Text style={styles(width).buttonText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Text style={styles(width).footerCopyright}>
        © {new Date().getFullYear()} GenderHealthWeb. All rights reserved.
      </Text>
    </View>
  );
};

const SystemMealPlanner = () => {
  const { width } = useWindowDimensions(); // Use hook for dynamic dimensions
  const [week, setWeek] = useState('Week 1');
  const [day, setDay] = useState('');
  const [allergies, setAllergies] = useState('');
  const [diseases, setDiseases] = useState('');
  const [preferredFoods, setPreferredFoods] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('day');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [showAllergyList, setShowAllergyList] = useState(false);
  const [showDiseaseList, setShowDiseaseList] = useState(false);
  const [showPreferredFoodList, setShowPreferredFoodList] = useState(false);
  const [weekViewMode, setWeekViewMode] = useState('list');
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [selectedMealDetail, setSelectedMealDetail] = useState(null);
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  const allergyRef = useRef(null);
  const diseaseRef = useRef(null);
  const preferredFoodRef = useRef(null);

  const allergyOptions = ['Peanuts', 'Dairy', 'Shellfish', 'Gluten', 'Soy'];
  const diseaseOptions = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Thyroid Disorder'];
  const preferredFoodOptions = [
    'Salmon', 'Spinach', 'Chicken', 'Avocado', 'Broccoli', 'Oats', 'Eggs', 'Tofu', 'Blueberries', 'Quinoa',
  ];

  const staticMealsDay = [
    {
      type: 'Breakfast',
      dishes: [
        { name: 'Grilled Cheese Sandwich', image: 'placeholder', calories: 250 },
        { name: 'Avocado', image: 'placeholder', calories: 120 },
        { name: 'Milk', image: 'placeholder', calories: 150 },
      ],
    },
    {
      type: 'Lunch',
      dishes: [
        { name: 'Grilled Salmon', image: 'placeholder', calories: 350 },
        { name: 'Brown Rice', image: 'placeholder', calories: 200 },
      ],
    },
    {
      type: 'Dinner',
      dishes: [
        { name: 'Chicken Soup', image: 'placeholder', calories: 300 },
        { name: 'Spinach Salad', image: 'placeholder', calories: 100 },
      ],
    },
    {
      type: 'Snack',
      dishes: [{ name: 'Greek Yogurt', image: 'placeholder', calories: 180 }],
    },
  ];

  const staticMealsWeek = [
    {
      day: 'Monday',
      meals: [
        {
          type: 'Breakfast',
          dishes: [
            { name: 'Grilled Cheese Sandwich', image: 'placeholder', calories: 250 },
            { name: 'Avocado', image: 'placeholder', calories: 120 },
          ],
        },
        {
          type: 'Lunch',
          dishes: [
            { name: 'Grilled Salmon', image: 'placeholder', calories: 350 },
            { name: 'Brown Rice', image: 'placeholder', calories: 200 },
          ],
        },
        {
          type: 'Dinner',
          dishes: [
            { name: 'Chicken Soup', image: 'placeholder', calories: 300 },
            { name: 'Spinach Salad', image: 'placeholder', calories: 100 },
          ],
        },
        {
          type: 'Snack',
          dishes: [{ name: 'Greek Yogurt', image: 'placeholder', calories: 180 }],
        },
      ],
    },
    {
      day: 'Tuesday',
      meals: [
        {
          type: 'Breakfast',
          dishes: [
            { name: 'Oatmeal', image: 'placeholder', calories: 200 },
            { name: 'Banana', image: 'placeholder', calories: 100 },
          ],
        },
        {
          type: 'Lunch',
          dishes: [
            { name: 'Grilled Chicken', image: 'placeholder', calories: 300 },
            { name: 'Quinoa Salad', image: 'placeholder', calories: 220 },
          ],
        },
        {
          type: 'Dinner',
          dishes: [{ name: 'Beef Stir Fry', image: 'placeholder', calories: 400 }],
        },
        {
          type: 'Snack',
          dishes: [{ name: 'Apple Slices', image: 'placeholder', calories: 80 }],
        },
      ],
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const res = await getCurrentUser(token); // Assume getCurrentUser is defined elsewhere
          setUser(res?.data?.data || null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const userId = user?.id;
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        await AsyncStorage.removeItem('token');
        navigation.replace('Login');
        return;
      }
      await logout(userId, token); // Assume logout is defined elsewhere
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      navigation.replace('Login');
    } catch (error) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      navigation.replace('Login');
    }
  };

  const handleClickOutside = (ref, setShowList) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const { pageX, pageY } = gestureState;
        const node = ref.current;
        if (node) {
          node.measure((x, y, w, h, px, py) => {
            const isOutside = pageX < px || pageX > px + w || pageY < py || pageY > py + h;
            if (isOutside) {
              setShowList(false);
            }
          });
        }
        return false;
      },
    });
  };

  const allergyPanResponder = useRef(
    handleClickOutside(allergyRef, setShowAllergyList)
  ).current;
  const diseasePanResponder = useRef(
    handleClickOutside(diseaseRef, setShowDiseaseList)
  ).current;
  const preferredFoodPanResponder = useRef(
    handleClickOutside(preferredFoodRef, setShowPreferredFoodList)
  ).current;

  useEffect(() => {
    if (mode === 'day') {
      setWeekViewMode('list');
      setSelectedDayDetail(null);
      setSelectedMealDetail(null);
      setError('');
      setGeneratedPlan(null);
    }
    if (mode === 'week') {
      setDay('');
      setError('');
      setGeneratedPlan(null);
    }
  }, [mode]);

  const handleAllergySelect = (a) => {
    setAllergies(a);
    setShowAllergyList(false);
  };

  const handleDiseaseSelect = (d) => {
    setDiseases(d);
    setShowDiseaseList(false);
  };

  const handlePreferredFoodSelect = (food) => {
    setPreferredFoods(food);
    setShowPreferredFoodList(false);
  };

  const handleGenerate = () => {
    if (mode === 'day' && !day) {
      setError('Please select a day before submitting.');
      return;
    }
    setError('');
    setGeneratedPlan(mode === 'day' ? staticMealsDay : staticMealsWeek);
  };

  const handleViewDayDetail = (day) => {
    setSelectedMealDetail(null);
    setSelectedDayDetail(day);
    setWeekViewMode('dayDetail');
  };

  const handleViewMealDetail = (day, meal) => {
    setSelectedDayDetail(null);
    setSelectedMealDetail({ day, meal });
    setWeekViewMode('mealDetail');
  };

  const handleBackToWeek = () => {
    setSelectedDayDetail(null);
    setSelectedMealDetail(null);
    setWeekViewMode('list');
  };

  return (
    <View style={styles(width).mealplannerPageWrapper}>
      <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
      <ScrollView contentContainerStyle={styles(width).mainContent}>
        <View style={styles(width).mealplannerHeading}>
          <Text style={styles(width).headingTitle}>System Meal Planner</Text>
          <Text style={styles(width).headingText}>Enter your details and choose to generate by day or by week.</Text>
        </View>
        <View style={styles(width).mealplannerForm}>
          <Text style={styles(width).label}>Gestational Week</Text>
          <View style={styles(width).pickerContainer}>
            <Picker
              selectedValue={week}
              onValueChange={(value) => setWeek(value)}
              style={styles(width).mealplannerSelect}
            >
              {Array.from({ length: 40 }, (_, i) => (
                <Picker.Item key={i} label={`Week ${i + 1}`} value={`Week ${i + 1}`} />
              ))}
            </Picker>
          </View>

          <Text style={styles(width).label}>Allergies</Text>
          <View style={styles(width).mealplannerAutocompleteWrapper} ref={allergyRef} {...allergyPanResponder.panHandlers}>
            <TextInput
              style={styles(width).mealplannerInput}
              value={allergies}
              onChangeText={(text) => {
                setAllergies(text);
                setShowAllergyList(true);
              }}
              placeholder="Optional - Type to search for allergy e.g. peanuts"
              onFocus={() => setShowAllergyList(true)}
            />
            {showAllergyList && allergies && (
              <View style={styles(width).mealplannerAutocompleteList}>
                {allergyOptions
                  .filter((a) => a.toLowerCase().includes(allergies.toLowerCase()))
                  .map((a, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles(width).autocompleteItem}
                      onPress={() => handleAllergySelect(a)}
                    >
                      <Text style={styles(width).autocompleteText}>{a}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>

          <Text style={styles(width).label}>Chronic Diseases</Text>
          <View style={styles(width).mealplannerAutocompleteWrapper} ref={diseaseRef} {...diseasePanResponder.panHandlers}>
            <TextInput
              style={styles(width).mealplannerInput}
              value={diseases}
              onChangeText={(text) => {
                setDiseases(text);
                setShowDiseaseList(true);
              }}
              placeholder="Optional - Type to search for disease e.g. diabetes"
              onFocus={() => setShowDiseaseList(true)}
            />
            {showDiseaseList && diseases && (
              <View style={styles(width).mealplannerAutocompleteList}>
                {diseaseOptions
                  .filter((d) => d.toLowerCase().includes(diseases.toLowerCase()))
                  .map((d, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles(width).autocompleteItem}
                      onPress={() => handleDiseaseSelect(d)}
                    >
                      <Text style={styles(width).autocompleteText}>{d}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>

          <View style={styles(width).modeToggle}>
            <TouchableOpacity
              style={[styles(width).modeOption, mode === 'day' ? styles(width).modeOptionActive : {}]}
              onPress={() => setMode('day')}
            >
              <Text style={[styles(width).modeText, mode === 'day' ? styles(width).modeTextActive : {}]}>Suggest by Day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles(width).modeOption, mode === 'week' ? styles(width).modeOptionActive : {}]}
              onPress={() => setMode('week')}
            >
              <Text style={[styles(width).modeText, mode === 'week' ? styles(width).modeTextActive : {}]}>Suggest by Week</Text>
            </TouchableOpacity>
          </View>

          {mode === 'day' && (
            <View style={styles(width).dayPicker}>
              <Text style={styles(width).label}>Select Day</Text>
              <View style={styles(width).pickerContainer}>
                <Picker
                  selectedValue={day}
                  onValueChange={(value) => setDay(value)}
                  style={styles(width).mealplannerSelect}
                >
                  <Picker.Item label="-- Choose a Day --" value="" />
                  {[...Array(7)].map((_, i) => (
                    <Picker.Item key={i + 1} label={`Day ${i + 1}`} value={`${i + 1}`} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          <Text style={styles(width).label}>Preferred Foods</Text>
          <View style={styles(width).mealplannerAutocompleteWrapper} ref={preferredFoodRef} {...preferredFoodPanResponder.panHandlers}>
            <TextInput
              style={styles(width).mealplannerInput}
              value={preferredFoods}
              onChangeText={(text) => {
                setPreferredFoods(text);
                setShowPreferredFoodList(true);
              }}
              placeholder="Optional - Type to search e.g. salmon, spinach"
              onFocus={() => setShowPreferredFoodList(true)}
            />
            {showPreferredFoodList && preferredFoods && (
              <View style={styles(width).mealplannerAutocompleteList}>
                {preferredFoodOptions
                  .filter((f) => f.toLowerCase().includes(preferredFoods.toLowerCase()))
                  .map((f, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles(width).autocompleteItem}
                      onPress={() => handlePreferredFoodSelect(f)}
                    >
                      <Text style={styles(width).autocompleteText}>{f}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>

          <View style={styles(width).mealplannerBtnWrapper}>
            <TouchableOpacity style={styles(width).mealplannerBtn} onPress={handleGenerate}>
              <Text style={styles(width).mealplannerBtnText}>Suggest Meal Plan</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles(width).errorText}>{error}</Text>}
        </View>

        {generatedPlan && mode === 'day' && Array.isArray(generatedPlan) && generatedPlan[0]?.dishes && (
          <View style={styles(width).mealplannerOutput}>
            {(() => {
              const totalCalories = generatedPlan.reduce((mealSum, meal) => {
                return mealSum + (meal?.dishes?.reduce((dishSum, dish) => dishSum + (dish?.calories || 0), 0) || 0);
              }, 0);
              return (
                <Text style={styles(width).outputTitle}>
                  Suggested Meals for {week}{day && ` - Day ${day}`}{'\n'}
                  <Text style={styles(width).totalCalories}>
                    Total Calories: <Text style={styles(width).bold}>{totalCalories} kcal</Text>
                  </Text>
                </Text>
              );
            })()}
            {generatedPlan.map((meal, idx) => (
              <View key={idx} style={styles(width).mealCard}>
                <View style={styles(width).mealHeader}>
                  <Text style={styles(width).mealHeaderText}>{meal.type}</Text>
                </View>
                <View style={styles(width).mealDishes}>
                  {meal?.dishes?.map((dish, i) => (
                    <View key={i} style={styles(width).dishCard}>
                      <Text style={styles(width).dishPlaceholderImage}>🍽️</Text>
                      <View style={styles(width).dishInfo}>
                        <Text style={styles(width).dishName}>{dish.name}</Text>
                        <Text style={styles(width).dishCalories}>{dish.calories} kcal</Text>
                        <View style={styles(width).mealActions}>
                          <TouchableOpacity
                            style={styles(width).actionButton}
                            onPress={() => navigation.navigate('ChangeDish', { dish })}
                          >
                            <Text style={styles(width).actionButtonText}>🔄 Change Dish</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles(width).actionButton}
                            onPress={() => navigation.navigate('NutritionInfo', { dish })}
                          >
                            <Text style={styles(width).actionButtonText}>ℹ️ Nutrition Information</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {generatedPlan && mode === 'week' && (
          <View style={styles(width).mealplannerOutput}>
            {weekViewMode === 'list' && <Text style={styles(width).outputTitle}>Weekly Suggested Meals</Text>}
            {weekViewMode === 'list' && generatedPlan?.map((day, idx) => (
              <View key={idx} style={styles(width).weekDayCard}>
                <View style={styles(width).weekDayHeader}>
                  <Text style={styles(width).weekDayHeaderTitle}>{day.day}</Text>
                  <TouchableOpacity
                    style={styles(width).mealplannerBtn}
                    onPress={() => handleViewDayDetail(day)}
                  >
                    <Text style={styles(width).mealplannerBtnText}>View Detail</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles(width).weekMealGrid}>
                  {day?.meals?.map((m, i) => (
                    <View key={i} style={styles(width).weekMealCard}>
                      <Text style={styles(width).weekMealPlaceholderImage}>🍽️</Text>
                      <View style={styles(width).mealplannerDetailWrapper}>
                        <Text style={styles(width).weekMealType}>{m.type}</Text>
                        <TouchableOpacity
                          style={styles(width).mealplannerDetailBtn}
                          onPress={() => handleViewMealDetail(day, m)}
                        >
                          <Text style={styles(width).mealplannerDetailBtnText}>View Detail</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {weekViewMode === 'dayDetail' && selectedDayDetail && (
              <View style={styles(width).mealplannerOutput}>
                {(() => {
                  const totalCalories = selectedDayDetail?.meals?.reduce((mealSum, meal) => {
                    const mealCalories = meal?.dishes?.reduce((dishSum, dish) => dishSum + (dish?.calories || 0), 0) || 0;
                    return mealSum + mealCalories;
                  }, 0) || 0;
                  return (
                    <Text style={styles(width).outputTitle}>
                      Meals for {selectedDayDetail?.day || 'Unknown'}{'\n'}
                      <Text style={styles(width).totalCalories}>
                        Total Calories: <Text style={styles(width).bold}>{totalCalories} kcal</Text>
                      </Text>
                    </Text>
                  );
                })()}
                <View style={styles(width).backBtnWrapper}>
                  <TouchableOpacity style={styles(width).mealplannerBtn} onPress={handleBackToWeek}>
                    <Text style={styles(width).mealplannerBtnText}>Back to Weekly Menu</Text>
                  </TouchableOpacity>
                </View>
                {selectedDayDetail?.meals?.map((meal, idx) => (
                  <View key={idx} style={styles(width).mealCard}>
                    <View style={styles(width).mealHeader}>
                      <Text style={styles(width).mealHeaderText}>{meal.type}</Text>
                    </View>
                    <View style={styles(width).mealDishes}>
                      {meal?.dishes?.map((dish, i) => (
                        <View key={i} style={styles(width).dishCard}>
                          <Text style={styles(width).dishPlaceholderImage}>🍽️</Text>
                          <View style={styles(width).dishInfo}>
                            <Text style={styles(width).dishName}>{dish.name}</Text>
                            <Text style={styles(width).dishCalories}>{dish.calories} kcal</Text>
                            <View style={styles(width).mealActions}>
                              <TouchableOpacity
                                style={styles(width).actionButton}
                                onPress={() => navigation.navigate('ChangeDish', { dish })}
                              >
                                <Text style={styles(width).actionButtonText}>🔄 Change Dish</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles(width).actionButton}
                                onPress={() => navigation.navigate('NutritionInfo', { dish })}
                              >
                                <Text style={styles(width).actionButtonText}>ℹ️ Nutrition Information</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
            {weekViewMode === 'mealDetail' && selectedMealDetail && (
              <View style={styles(width).mealplannerOutput}>
                {(() => {
                  const totalCalories = selectedMealDetail.meal.dishes.reduce((sum, dish) => sum + dish.calories, 0);
                  return (
                    <Text style={styles(width).outputTitle}>
                      {selectedMealDetail.day.day} – {selectedMealDetail.meal.type}{'\n'}
                      <Text style={styles(width).totalCalories}>
                        Total Calories: <Text style={styles(width).bold}>{totalCalories} kcal</Text>
                      </Text>
                    </Text>
                  );
                })()}
                <View style={styles(width).backBtnWrapper}>
                  <TouchableOpacity style={styles(width).mealplannerBtn} onPress={handleBackToWeek}>
                    <Text style={styles(width).mealplannerBtnText}>Back to Weekly Menu</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles(width).mealCard}>
                  <View style={styles(width).mealHeader}>
                    <Text style={styles(width).mealHeaderText}>{selectedMealDetail.meal.type}</Text>
                  </View>
                  <View style={styles(width).mealDishes}>
                    {selectedMealDetail?.meal?.dishes?.map((dish, i) => (
                      <View key={i} style={styles(width).dishCard}>
                        <Text style={styles(width).dishPlaceholderImage}>🍽️</Text>
                        <View style={styles(width).dishInfo}>
                          <Text style={styles(width).dishName}>{dish.name}</Text>
                          <Text style={styles(width).dishCalories}>{dish.calories} kcal</Text>
                          <View style={styles(width).mealActions}>
                            <TouchableOpacity
                              style={styles(width).actionButton}
                              onPress={() => navigation.navigate('ChangeDish', { dish })}
                            >
                              <Text style={styles(width).actionButtonText}>🔄 Change Dish</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles(width).actionButton}
                              onPress={() => navigation.navigate('NutritionInfo', { dish })}
                            >
                              <Text style={styles(width).actionButtonText}>ℹ️ Nutrition Information</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <Footer navigation={navigation} />
    </View>
  );
};

// Styles as a function to accept width
const styles = (width) => StyleSheet.create({
  mealplannerPageWrapper: {
    flex: 1,
    backgroundColor: '#f7fbfc',
    paddingBottom: 30,
  },
  mainContent: {
    paddingVertical: 20,
    paddingTop: 90,
    paddingHorizontal: 10,
  },
  mealplannerHeading: {
    alignItems: 'center',
    marginVertical: 30,
    maxWidth: 900,
    alignSelf: 'center',
  },
  headingTitle: {
    fontSize: width < 768 ? 24 : 32,
    fontWeight: '700',
    color: '#04668d',
    marginBottom: 8,
  },
  headingText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  mealplannerForm: {
    maxWidth: 800,
    backgroundColor: '#ffffff',
    padding: width < 768 ? 16 : 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginHorizontal: 'auto',
    marginBottom: 20,
  },
  label: {
    marginVertical: 8,
    fontWeight: '600',
    fontSize: 14,
    color: '#04668d',
  },
  mealplannerInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9fdff',
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    backgroundColor: '#f9fdff',
  },
  mealplannerSelect: {
    width: '100%',
    padding: 10,
    fontSize: 14,
    color: '#333',
  },
  mealplannerAutocompleteWrapper: {
    position: 'relative',
  },
  mealplannerAutocompleteList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    position: 'absolute',
    width: '100%',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    top: 50,
  },
  autocompleteItem: {
    padding: 10,
  },
  autocompleteText: {
    fontSize: 14,
    color: '#333',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  modeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f9fdff',
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  modeOptionActive: {
    backgroundColor: '#02808F',
    borderColor: '#02808F',
  },
  modeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#fff',
  },
  dayPicker: {
    marginVertical: 12,
  },
  mealplannerBtnWrapper: {
    alignItems: 'center',
    marginTop: 12,
  },
  mealplannerBtn: {
    width: 230,
    backgroundColor: '#02808F',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  mealplannerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  mealplannerDetailBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#02808F',
    borderRadius: 8,
  },
  mealplannerDetailBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  mealplannerOutput: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    padding: 10,
  },
  outputTitle: {
    textAlign: 'center',
    color: '#013F50',
    fontSize: width < 768 ? 20 : 24,
    marginBottom: 16,
  },
  totalCalories: {
    fontSize: width < 768 ? 14 : 16,
  },
  bold: {
    fontWeight: '700',
  },
  mealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mealHeader: {
    backgroundColor: '#02808F',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  mealHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  mealDishes: {
    flexDirection: 'column',
    gap: 12,
  },
  dishCard: {
    backgroundColor: '#f9fdff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dishPlaceholderImage: {
    fontSize: 40,
  },
  dishInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  dishName: {
    fontSize: 16,
    color: '#04668d',
    fontWeight: '600',
  },
  dishCalories: {
    fontSize: 14,
    color: '#555',
  },
  mealActions: {
    flexDirection: width < 768 ? 'column' : 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#02808F',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  weekDayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekDayHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#04668d',
  },
  weekMealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  weekMealCard: {
    backgroundColor: '#fbfeff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    flex: 1,
    minWidth: 150,
  },
  weekMealPlaceholderImage: {
    fontSize: 40,
    marginBottom: 8,
  },
  weekMealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#04668d',
    marginBottom: 8,
  },
  mealplannerDetailWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backBtnWrapper: {
    alignItems: 'flex-end',
    marginVertical: 12,
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
    height: width < 768 ? '100%' : 400, // Dynamic height based on screen size
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
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footerCopyright: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SystemMealPlanner;