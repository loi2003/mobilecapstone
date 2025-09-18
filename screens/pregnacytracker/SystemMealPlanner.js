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
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { viewMenuSuggestionByTrimester } from '../../api/meal-api';

const SystemMealPlanner = () => {
  const { width } = useWindowDimensions();
  const [week, setWeek] = useState('Week 1');
  const [day, setDay] = useState('');
  const [preferredFoods, setPreferredFoods] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('day');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weekViewMode, setWeekViewMode] = useState('list');
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const navigation = useNavigation();

  // Animation for error shake
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const animateShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (error) {
      animateShake();
    }
  }, [error]);

  // Reset state when mode changes
  useEffect(() => {
    if (mode === 'day') {
      setWeekViewMode('list');
      setSelectedDayDetail(null);
      setSelectedMeal(null);
      setModalVisible(false);
      setError('');
      setGeneratedPlan(null);
    }
    if (mode === 'week') {
      setDay('');
      setError('');
      setGeneratedPlan(null);
      setSelectedMeal(null);
      setModalVisible(false);
    }
  }, [mode]);

  // Clear generated plan when day changes
  useEffect(() => {
    if (day) {
      setGeneratedPlan(null);
    }
  }, [day]);

  // Reorder days to start from Monday
  const reorderDays = (days) => {
    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.sort((a, b) => order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek));
  };

  // Handle meal plan generation
  const handleGenerate = async () => {
    if (mode === 'day' && !day) {
      setError('Please select a day before submitting.');
      return;
    }
    setError('');
    setGeneratedPlan(null);
    setLoading(true);

    try {
      const weekNumber = parseInt(week.replace('Week ', ''), 10);
      const res = await viewMenuSuggestionByTrimester({ stage: weekNumber });
      const data = res?.data;

      console.log('API Response:', JSON.stringify(data, null, 2));

      if (!data?.days) {
        throw new Error('No data returned for this week.');
      }

      const orderedDays = reorderDays(data.days);

      if (mode === 'day') {
        const dayIndex = Number(day) - 1;
        const dayData = orderedDays[dayIndex];

        if (!dayData) {
          throw new Error('No meal plan available for selected day.');
        }

        const transformedDay = dayData.meals.map((meal) => ({
          type: meal.mealType,
          dishes: meal.dishes
            .sort((a, b) => b.calories - a.calories)
            .map((dish) => ({
              name: dish.dishName,
              image: dish.imageUrl || 'https://images.pexels.com/photos/30945514/pexels-photo-30945514.jpeg',
              calories: Number(dish.calories.toFixed(1)),
            })),
        }));

        console.log('Transformed Day Plan:', JSON.stringify(transformedDay, null, 2));
        setGeneratedPlan(transformedDay);
      } else {
        const transformedWeek = orderedDays.map((day) => ({
          day: day.dayOfWeek,
          meals: day.meals.map((meal) => ({
            type: meal.mealType,
            dishes: meal.dishes
              .sort((a, b) => b.calories - a.calories)
              .map((dish) => ({
                name: dish.dishName,
                image: dish.imageUrl || 'https://images.pexels.com/photos/30945514/pexels-photo-30945514.jpeg',
                calories: Number(dish.calories.toFixed(1)),
              })),
          })),
        }));

        console.log('Transformed Week Plan:', JSON.stringify(transformedWeek, null, 2));
        setGeneratedPlan(transformedWeek);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch meal suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDayDetail = (day) => {
    setSelectedMeal(null);
    setModalVisible(false);
    setSelectedDayDetail(day);
    setWeekViewMode('dayDetail');
  };

  const handleViewMealDetail = (day, meal) => {
    setSelectedMeal({ day, meal });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setSelectedMeal(null);
    setModalVisible(false);
  };

  const handleBackToWeek = () => {
    setSelectedDayDetail(null);
    setSelectedMeal(null);
    setModalVisible(false);
    setWeekViewMode('list');
  };

  // Button press animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  // Render meal item for FlatList
  const renderMealItem = ({ item, index }) => {
    console.log(`Rendering meal: ${item.type}`);
    return (
      <View key={index} style={styles(width).mealCard}>
        <View style={styles(width).mealHeader}>
          <Text style={styles(width).mealHeaderText}>{item.type || 'Unknown Meal'}</Text>
        </View>
        <View style={styles(width).mealDishes}>
          {(item?.dishes?.length > 0 ? item.dishes : [{ name: 'No dishes available', calories: 0, image: null }]).map(
            (dish, i) => (
              <View key={i} style={styles(width).dishCard}>
                {dish.image ? (
                  <Image
                    source={{ uri: dish.image }}
                    style={styles(width).dishImage}
                    resizeMode="cover"
                    accessibilityLabel={`Image of ${dish.name}`}
                    onError={() => console.log(`Failed to load image for ${dish.name}`)}
                  />
                ) : (
                  <Text style={styles(width).dishPlaceholderImage}>🍽️</Text>
                )}
                <View style={styles(width).dishInfo}>
                  <Text style={styles(width).dishName}>{dish.name}</Text>
                  <Text style={styles(width).dishCalories}>{dish.calories.toFixed(1)} kcal</Text>
                </View>
              </View>
            )
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles(width).mealplannerPageWrapper}>
      {loading && (
        <View style={styles(width).loadingOverlay}>
          <ActivityIndicator size="large" color="#02808f" />
        </View>
      )}
      <ScrollView contentContainerStyle={styles(width).mainContent}>
        <View style={styles(width).mealplannerHeading}>
          <Text style={styles(width).headingTitle}>Meal Planner</Text>
          <Text style={styles(width).headingText}>
            Plan your meals by day or week for a healthy pregnancy.
          </Text>
        </View>
        <View style={styles(width).mealplannerForm}>
          <Text style={styles(width).label}>Gestational Week</Text>
          <View style={styles(width).pickerContainer}>
            <Picker
              selectedValue={week}
              onValueChange={(value) => setWeek(value)}
              style={styles(width).mealplannerSelect}
              accessibilityLabel="Select gestational week"
            >
              {Array.from({ length: 40 }, (_, i) => (
                <Picker.Item key={i} label={`Week ${i + 1}`} value={`Week ${i + 1}`} />
              ))}
            </Picker>
          </View>

          <View style={styles(width).modeToggle}>
            <TouchableOpacity
              style={[styles(width).modeOption, mode === 'day' && styles(width).modeOptionActive]}
              onPress={() => setMode('day')}
              accessibilityLabel="Suggest meals by day"
            >
              <Text
                style={[styles(width).modeText, mode === 'day' && styles(width).modeTextActive]}
              >
                By Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles(width).modeOption, mode === 'week' && styles(width).modeOptionActive]}
              onPress={() => setMode('week')}
              accessibilityLabel="Suggest meals by week"
            >
              <Text
                style={[styles(width).modeText, mode === 'week' && styles(width).modeTextActive]}
              >
                By Week
              </Text>
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
                  accessibilityLabel="Select day"
                >
                  <Picker.Item label="-- Choose a Day --" value="" />
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                    (dayName, i) => (
                      <Picker.Item key={i + 1} label={dayName} value={`${i + 1}`} />
                    )
                  )}
                </Picker>
              </View>
            </View>
          )}

         

          <View style={styles(width).mealplannerBtnWrapper}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={styles(width).mealplannerBtn}
                onPress={handleGenerate}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
                accessibilityLabel="Generate meal plan"
              >
                <Text style={styles(width).mealplannerBtnText}>Generate Plan</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {error && (
            <Animated.View style={[styles(width).errorTextWrapper, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={styles(width).errorText}>{error}</Text>
            </Animated.View>
          )}
        </View>

        {generatedPlan && mode === 'day' && Array.isArray(generatedPlan) && generatedPlan.length > 0 && (
          <View style={styles(width).mealplannerOutput}>
            <Text style={styles(width).outputTitle}>
              Meals for {week}{day && ` - ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][Number(day) - 1]}`}
              {'\n'}
              <Text style={styles(width).totalCalories}>
                Total Calories: <Text style={styles(width).bold}>
                  {generatedPlan
                    .reduce((mealSum, meal) => mealSum + (meal?.dishes?.reduce((dishSum, dish) => dishSum + (dish?.calories || 0), 0) || 0), 0)
                    .toFixed(1)} kcal
                </Text>
              </Text>
            </Text>
            <FlatList
              data={generatedPlan}
              renderItem={renderMealItem}
              keyExtractor={(item, index) => `meal-${index}`}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        )}

        {generatedPlan && mode === 'week' && (
          <View style={styles(width).mealplannerOutput}>
            {weekViewMode === 'list' && (
              <Text style={styles(width).outputTitle}>Weekly Meal Plan</Text>
            )}
            {weekViewMode === 'list' && generatedPlan?.map((day, idx) => (
              <View key={idx} style={styles(width).weekDayCard}>
                <View style={styles(width).weekDayHeader}>
                  <Text style={styles(width).weekDayHeaderTitle}>{day.day}</Text>
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity
                      style={styles(width).mealplannerBtn}
                      onPress={() => handleViewDayDetail(day)}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      accessibilityLabel={`View details for ${day.day}`}
                    >
                      <Text style={styles(width).mealplannerBtnText}>View Day</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
                <View style={styles(width).weekMealGrid}>
                  {day?.meals?.map((m, i) => (
                    <View key={i} style={styles(width).weekMealCard}>
                      {m.dishes?.[0]?.image ? (
                        <Image
                          source={{ uri: m.dishes[0].image }}
                          style={styles(width).weekMealImage}
                          resizeMode="cover"
                          accessibilityLabel={`Image for ${m.type}`}
                        />
                      ) : (
                        <Text style={styles(width).weekMealPlaceholderImage}>🍽️</Text>
                      )}
                      <View style={styles(width).mealplannerDetailWrapper}>
                        <Text style={styles(width).weekMealType}>{m.type}</Text>
                        <TouchableOpacity
                          style={styles(width).mealplannerDetailBtn}
                          onPress={() => handleViewMealDetail(day, m)}
                          onPressIn={handlePressIn}
                          onPressOut={handlePressOut}
                          accessibilityLabel={`View details for ${m.type} on ${day.day}`}
                        >
                          <Text style={styles(width).mealplannerDetailBtnText}>Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {weekViewMode === 'dayDetail' && selectedDayDetail && (
              <View style={styles(width).mealplannerOutput}>
                <Text style={styles(width).outputTitle}>
                  Meals for {selectedDayDetail?.day || 'Unknown'}
                  {'\n'}
                  <Text style={styles(width).totalCalories}>
                    Total Calories: <Text style={styles(width).bold}>
                      {(selectedDayDetail?.meals?.reduce((mealSum, meal) => {
                        const mealCalories = meal?.dishes?.reduce((dishSum, dish) => dishSum + (dish?.calories || 0), 0) || 0;
                        return mealSum + mealCalories;
                      }, 0) || 0).toFixed(1)} kcal
                    </Text>
                  </Text>
                </Text>
                <View style={styles(width).backBtnWrapper}>
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity
                      style={styles(width).mealplannerBtn}
                      onPress={handleBackToWeek}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      accessibilityLabel="Back to weekly menu"
                    >
                      <Text style={styles(width).mealplannerBtnText}>Back to Week</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
                {selectedDayDetail?.meals?.map((meal, idx) => (
                  <View key={idx} style={styles(width).mealCard}>
                    <View style={styles(width).mealHeader}>
                      <Text style={styles(width).mealHeaderText}>{meal.type || 'Unknown Meal'}</Text>
                    </View>
                    <View style={styles(width).mealDishes}>
                      {(meal?.dishes?.length > 0 ? meal.dishes : [{ name: 'No dishes available', calories: 0, image: null }]).map(
                        (dish, i) => (
                          <View key={i} style={styles(width).dishCard}>
                            {dish.image ? (
                              <Image
                                source={{ uri: dish.image }}
                                style={styles(width).dishImage}
                                resizeMode="cover"
                                accessibilityLabel={`Image of ${dish.name}`}
                                onError={() => console.log(`Failed to load image for ${dish.name}`)}
                              />
                            ) : (
                              <Text style={styles(width).dishPlaceholderImage}>🍽️</Text>
                            )}
                            <View style={styles(width).dishInfo}>
                              <Text style={styles(width).dishName}>{dish.name}</Text>
                              <Text style={styles(width).dishCalories}>{dish.calories.toFixed(1)} kcal</Text>
                            </View>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Modal for Meal Details */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={styles(width).modalOverlay}>
            <View style={styles(width).modalContent}>
              {selectedMeal && (
                <>
                  <Text style={styles(width).modalTitle}>
                    {selectedMeal.day.day} – {selectedMeal.meal.type}
                    {'\n'}
                    <Text style={styles(width).totalCalories}>
                      Total Calories: <Text style={styles(width).bold}>
                        {selectedMeal.meal.dishes.reduce((sum, dish) => sum + dish.calories, 0).toFixed(1)} kcal
                      </Text>
                    </Text>
                  </Text>
                  <View style={styles(width).mealCard}>
                    <View style={styles(width).mealHeader}>
                      <Text style={styles(width).mealHeaderText}>{selectedMeal.meal.type || 'Unknown Meal'}</Text>
                    </View>
                    <ScrollView style={styles(width).modalScroll}>
                      <View style={styles(width).mealDishes}>
                        {(selectedMeal?.meal?.dishes?.length > 0
                          ? selectedMeal.meal.dishes
                          : [{ name: 'No dishes available', calories: 0, image: null }]).map((dish, i) => (
                            <View key={i} style={styles(width).dishCard}>
                              {dish.image ? (
                                <Image
                                  source={{ uri: dish.image }}
                                  style={styles(width).dishImage}
                                  resizeMode="cover"
                                  accessibilityLabel={`Image of ${dish.name}`}
                                  onError={() => console.log(`Failed to load image for ${dish.name}`)}
                                />
                              ) : (
                                <Text style={styles(width).dishPlaceholderImage}>🍽️</Text>
                              )}
                              <View style={styles(width).dishInfo}>
                                <Text style={styles(width).dishName}>{dish.name}</Text>
                                <Text style={styles(width).dishCalories}>{dish.calories.toFixed(1)} kcal</Text>
                              </View>
                            </View>
                          ))}
                      </View>
                    </ScrollView>
                  </View>
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity
                      style={styles(width).modalCloseBtn}
                      onPress={handleCloseModal}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      accessibilityLabel="Close meal details"
                    >
                      <Text style={styles(width).modalCloseBtnText}>Close</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = (width) => StyleSheet.create({
  mealplannerPageWrapper: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },
  mainContent: {
    paddingVertical: 24,
    paddingHorizontal: width < 768 ? 16 : 24,
  },
  mealplannerHeading: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  headingTitle: {
    fontSize: width < 768 ? 28 : 34,
    fontWeight: '700',
    color: '#013f50',
    marginBottom: 8,
  },
  headingText: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '400',
    color: '#4a606a',
    textAlign: 'center',
    lineHeight: 24,
  },
  mealplannerForm: {
    backgroundColor: '#ffffff',
    padding: width < 768 ? 20 : 28,
    borderRadius: 16,
    marginHorizontal: width < 768 ? 12 : 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: width < 768 ? 16 : 18,
    color: '#013f50',
  },
  mealplannerInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d9dd',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#f9fafb',
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '400',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d9dd',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  mealplannerSelect: {
    width: '100%',
    padding: 14,
    fontSize: width < 768 ? 16 : 18,
    color: '#1a2a33',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
    justifyContent: 'center',
  },
  modeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d9dd',
    alignItems: 'center',
  },
  modeOptionActive: {
    backgroundColor: '#e6f0f5',
    borderColor: '#02808f',
  },
  modeText: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    color: '#1a2a33',
  },
  modeTextActive: {
    color: '#02808f',
  },
  dayPicker: {
    marginVertical: 12,
  },
  mealplannerBtnWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
  mealplannerBtn: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#02808f',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  mealplannerBtnText: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    color: '#fff',
  },
  mealplannerDetailBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#02808f',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  mealplannerDetailBtnText: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    color: '#fff',
  },
  errorTextWrapper: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  mealplannerOutput: {
    marginHorizontal: width < 768 ? 12 : 20,
    paddingBottom: 20,
  },
  outputTitle: {
    textAlign: 'center',
    color: '#013f50',
    fontSize: width < 768 ? 24 : 30,
    fontWeight: '700',
    marginBottom: 16,
  },
  totalCalories: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '500',
    color: '#4a606a',
  },
  bold: {
    fontWeight: '700',
  },
  mealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  mealHeader: {
    backgroundColor: '#e6f0f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  mealHeaderText: {
    fontSize: width < 768 ? 18 : 20,
    fontWeight: '700',
    color: '#013f50',
  },
  mealDishes: {
    padding: 16,
    gap: 16,
  },
  dishCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    flexDirection: width < 768 ? 'column' : 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#e6ecef',
  },
  dishImage: {
    width: width < 768 ? 120 : 140,
    height: width < 768 ? 120 : 140,
    borderRadius: 12,
    alignSelf: 'center',
  },
  dishPlaceholderImage: {
    fontSize: width < 768 ? 48 : 56,
    alignSelf: 'center',
  },
  dishInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
    alignItems: width < 768 ? 'center' : 'flex-start',
  },
  dishName: {
    fontSize: width < 768 ? 18 : 20,
    color: '#013f50',
    fontWeight: '600',
  },
  dishCalories: {
    fontSize: width < 768 ? 16 : 18,
    color: '#4a606a',
    fontWeight: '500',
  },
  weekDayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekDayHeaderTitle: {
    fontSize: width < 768 ? 20 : 22,
    fontWeight: '700',
    color: '#013f50',
  },
  weekMealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  weekMealCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    minWidth: width < 768 ? 200 : 240,
    borderWidth: 1,
    borderColor: '#e6ecef',
  },
  weekMealImage: {
    width: width < 768 ? 120 : 140,
    height: width < 768 ? 120 : 140,
    borderRadius: 12,
    marginBottom: 12,
  },
  weekMealPlaceholderImage: {
    fontSize: width < 768 ? 56 : 64,
    marginBottom: 12,
  },
  weekMealType: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    color: '#013f50',
    marginBottom: 12,
    textAlign: 'center',
  },
  mealplannerDetailWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  backBtnWrapper: {
    alignItems: 'flex-end',
    marginVertical: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width < 768 ? 16 : 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: width < 768 ? 20 : 24,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    textAlign: 'center',
    color: '#013f50',
    fontSize: width < 768 ? 22 : 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: width < 768 ? 300 : 400,
  },
  modalCloseBtn: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  modalCloseBtnText: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SystemMealPlanner;