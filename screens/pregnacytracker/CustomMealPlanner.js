import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { viewMealsSuggestion } from '../../api/meal-api';
import { getCurrentUser } from '../../api/auth';
import { viewAllDiseases } from '../../api/disease-api';
import { viewAllAllergies } from '../../api/allergy-api';
import { viewAllDishes } from '../../api/dish-api';

const { width } = Dimensions.get('window');

const CustomMealPlanner = () => {
  const [token, setToken] = useState('');
  const [stage, setStage] = useState(1);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [type, setType] = useState('');
  const [numberOfDishes, setNumberOfDishes] = useState(1);
  const [allergies, setAllergies] = useState('');
  const [diseases, setDiseases] = useState('');
  const [preferredFoodInput, setPreferredFoodInput] = useState('');
  const [selectedPreferredFoodId, setSelectedPreferredFoodId] = useState(null);
  const [selectedAllergyId, setSelectedAllergyId] = useState(null); // Added
  const [selectedDiseaseId, setSelectedDiseaseId] = useState(null); // Added
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [allergyOptions, setAllergyOptions] = useState([]);
  const [diseaseOptions, setDiseaseOptions] = useState([]);
  const [preferredFoodOptions, setPreferredFoodOptions] = useState([]);
  const [showAllergyList, setShowAllergyList] = useState(false);
  const [showDiseaseList, setShowDiseaseList] = useState(false);
  const [showPreferredFoodList, setShowPreferredFoodList] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [diseaseInput, setDiseaseInput] = useState('');
  const [generatedMenus, setGeneratedMenus] = useState([]);
  const [savedDob, setSavedDob] = useState('');
  const [activeImageIndices, setActiveImageIndices] = useState({});
  const [selectedMenu, setSelectedMenu] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken || '');
    };
    fetchToken();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allergyRes = await viewAllAllergies(token);
        setAllergyOptions(allergyRes.data.data || []);
        const diseaseRes = await viewAllDiseases(token);
        setDiseaseOptions(diseaseRes.data.data || []);
        const res = await viewAllDishes(token);
        setPreferredFoodOptions(res.data.data || []);
      } catch (err) {
        console.error('Error fetching allergies/diseases/preferred foods:', err);
      }
    };
    if (token) fetchData();
  }, [token]);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await getCurrentUser(token);
          if (response.data?.data?.dateOfBirth) {
            const formattedDob = response.data.data.dateOfBirth.split('T')[0];
            setDateOfBirth(formattedDob);
            setSavedDob(formattedDob);
          }
        } catch (error) {
          console.error('Failed to fetch user DOB:', error);
        }
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    const initialIndices = {};
    generatedMenus.forEach((_, menuIndex) => {
      initialIndices[menuIndex] = 0;
    });
    setActiveImageIndices(initialIndices);
  }, [generatedMenus]);

  const getMaxDishes = (mealType) => {
    switch (mealType) {
      case 'Breakfast':
        return 2;
      case 'Lunch':
      case 'Dinner':
        return 3;
      case 'Snack1':
      case 'Snack2':
        return 1;
      default:
        return 1;
    }
  };

  useEffect(() => {
    if (type) {
      const max = getMaxDishes(type);
      if (numberOfDishes > max) {
        setNumberOfDishes(max);
      }
    }
  }, [type]);

  const handleSubmit = async () => {
    if (!type) {
      setError('Please select a meal type.');
      return;
    }
    setError('');
    setLoading(true);

    const payload = {
      stage,
      dateOfBirth: savedDob || dateOfBirth || null,
      type,
      numberOfDishes,
      allergyIds: allergies ? [allergies] : [],
      diseaseIds: diseases ? [diseases] : [],
      favouriteDishId: selectedPreferredFoodId || null,
    };

    try {
      const [menu1, menu2] = await Promise.all([
        viewMealsSuggestion(payload),
        viewMealsSuggestion(payload),
      ]);

      const menus = [menu1, menu2].map((menu) => ({
        dishes: menu.data.dishes.map((d) => ({
          name: d.dishName,
          image:
            d.imageUrl ||
            'https://images.pexels.com/photos/30945514/pexels-photo-30945514.jpeg',
          calories: d.calories,
          description: d.description,
        })),
      }));

      setGeneratedMenus(menus);
    } catch (err) {
      console.error('Error generating menus', err);
      setError('Failed to generate menus.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMore = async () => {
    if (generatedMenus.length >= 4) return;
    setLoading(true);

    try {
      const response = await viewMealsSuggestion({
        stage,
        dateOfBirth,
        type,
        numberOfDishes,
        allergyIds: allergies ? [allergies] : [],
        diseaseIds: diseases ? [diseases] : [],
        favouriteDishId: selectedPreferredFoodId || null,
      });

      const newMenu = {
        dishes: response.data.dishes.map((d) => ({
          name: d.dishName,
          image:
            d.imageUrl ||
            'https://images.pexels.com/photos/30945514/pexels-photo-30945514.jpeg',
          calories: d.calories,
          description: d.description,
        })),
      };

      setGeneratedMenus((prev) => [...prev, newMenu]);
    } catch (err) {
      console.error('Error fetching more menus:', err);
      setError('Could not fetch more menus.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMenu = () => {
    setGeneratedMenus([]);
  };

  const handleSetActiveImage = (menuIndex, imageIndex) => {
    setActiveImageIndices((prev) => ({
      ...prev,
      [menuIndex]: imageIndex,
    }));
  };

  const renderAutocompleteModal = (
    visible,
    setVisible,
    options,
    inputValue,
    setInputValue,
    setSelectedId,
    setStateValue,
    placeholder,
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TextInput
            style={styles.modalInput}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={placeholder}
          />
          <FlatList
            data={options.filter((item) =>
              item.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
              item.dishName?.toLowerCase().includes(inputValue.toLowerCase())
            )}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setInputValue(item.name || item.dishName);
                  setSelectedId(item.id);
                  setStateValue(item.id);
                  setVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.name || item.dishName}</Text>
              </TouchableOpacity>
            )}
            style={styles.modalList}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.pageWrapper}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#02808f" />
        </View>
      )}
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>Custom Meal Planner</Text>
        <Text style={styles.headingSubtitle}>
          Create and manage your own custom meal plans here.
        </Text>
      </View>

      <View style={styles.form}>
        {/* Stage */}
        <Text style={styles.label}>Gestational Week (Stage)</Text>
        <View style={styles.selectWrapper}>
          <Picker
            selectedValue={stage}
            onValueChange={(value) => setStage(Number(value))}
            style={styles.select}
          >
            {Array.from({ length: 40 }, (_, i) => (
              <Picker.Item key={i + 1} label={`Week ${i + 1}`} value={i + 1} />
            ))}
          </Picker>
        </View>

        {/* DOB */}
        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
        />

        {/* Meal Type */}
        <Text style={styles.label}>Meal Type</Text>
        <View style={styles.selectWrapper}>
          <Picker
            selectedValue={type}
            onValueChange={setType}
            style={styles.select}
          >
            <Picker.Item label="-- Select a Type --" value="" />
            <Picker.Item label="Breakfast" value="Breakfast" />
            <Picker.Item label="Lunch" value="Lunch" />
            <Picker.Item label="Dinner" value="Dinner" />
            <Picker.Item label="Snack 1" value="Snack1" />
            <Picker.Item label="Snack 2" value="Snack2" />
          </Picker>
        </View>

        {/* Number of Dishes */}
        <Text style={styles.label}>Number of Dishes</Text>
        <View style={styles.selectWrapper}>
          <Picker
            selectedValue={numberOfDishes}
            onValueChange={(value) => setNumberOfDishes(Number(value))}
            style={styles.select}
            enabled={!!type}
          >
            <Picker.Item label="-- Select number of dishes --" value="" />
            {Array.from({ length: getMaxDishes(type) }, (_, i) => (
              <Picker.Item key={i + 1} label={`${i + 1}`} value={i + 1} />
            ))}
          </Picker>
        </View>

        {/* Allergies */}
        <Text style={styles.label}>Allergies</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowAllergyList(true)}
        >
          <Text style={styles.inputText}>
            {allergyInput || 'Optional - Tap to select allergy'}
          </Text>
        </TouchableOpacity>
        {renderAutocompleteModal(
          showAllergyList,
          setShowAllergyList,
          allergyOptions,
          allergyInput,
          setAllergyInput,
          setSelectedAllergyId, // Updated
          setAllergies,
          'Search allergies',
        )}

        {/* Diseases */}
        <Text style={styles.label}>Chronic Diseases</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDiseaseList(true)}
        >
          <Text style={styles.inputText}>
            {diseaseInput || 'Optional - Tap to select disease'}
          </Text>
        </TouchableOpacity>
        {renderAutocompleteModal(
          showDiseaseList,
          setShowDiseaseList,
          diseaseOptions,
          diseaseInput,
          setDiseaseInput,
          setSelectedDiseaseId, // Updated
          setDiseases,
          'Search diseases',
        )}

        {/* Preferred Foods */}
        <Text style={styles.label}>Choose your Favorite Dish!</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowPreferredFoodList(true)}
        >
          <Text style={styles.inputText}>
            {preferredFoodInput || 'Optional - Tap to search e.g. Rice, Beef'}
          </Text>
        </TouchableOpacity>
        {renderAutocompleteModal(
          showPreferredFoodList,
          setShowPreferredFoodList,
          preferredFoodOptions,
          preferredFoodInput,
          setPreferredFoodInput,
          setSelectedPreferredFoodId,
          setPreferredFoodInput,
          'Search favorite dish',
        )}

        {/* Submit Button */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Custom Plan</Text>
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {generatedMenus.length > 0 && (
        <View style={styles.output}>
          {selectedMenu ? (
            <View style={styles.mealPlannerOutput}>
              <Text style={styles.mealPlannerTitle}>
                Menu Details{'\n'}
                <Text style={styles.mealPlannerSubtitle}>
                  Total Calories: <Text style={styles.bold}>
                    {selectedMenu.dishes
                      ?.reduce((sum, dish) => sum + (dish?.calories || 0), 0)
                      .toFixed(1)} kcal
                  </Text>
                </Text>
              </Text>
              <View style={styles.mealCard}>
                {selectedMenu.dishes?.map((dish, i) => (
                  <View key={i} style={styles.dishCard}>
                    <Image
                      source={{ uri: dish.image }}
                      style={styles.dishImage}
                    />
                    <View style={styles.dishInfo}>
                      <Text style={styles.dishName}>{dish.name}</Text>
                      <Text style={styles.dishCalories}>
                        {dish.calories.toFixed(1)} kcal
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setSelectedMenu(null)}
              >
                <Text style={styles.secondaryButtonText}>Back to Menus</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={generatedMenus}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item: menu, index: menuIndex }) => {
                  const activeIdx = activeImageIndices[menuIndex] || 0;
                  return (
                    <View style={styles.menuCard}>
                      <View style={styles.menuHeader}>
                        <Text style={styles.menuLabel}>Menu {menuIndex + 1}</Text>
                        <Text style={styles.menuCounter}>
                          {numberOfDishes} dishes
                        </Text>
                      </View>
                      <View style={styles.menuImageContainer}>
                        <Image
                          source={{ uri: menu.dishes[activeIdx]?.image }}
                          style={styles.menuMainImage}
                        />
                        <View style={styles.carouselDots}>
                          {menu.dishes
                            .slice(0, numberOfDishes)
                            .map((_, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.dot,
                                  index === activeIdx && styles.activeDot,
                                ]}
                                onPress={() => handleSetActiveImage(menuIndex, index)}
                              />
                            ))}
                        </View>
                      </View>
                      <Text style={styles.menuTitle}>
                        {menu.dishes[activeIdx]?.name}
                      </Text>
                      <View style={styles.thumbnails}>
                        {menu.dishes
                          .slice(0, numberOfDishes)
                          .map((dish, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.thumbnailItem}
                              onPress={() => handleSetActiveImage(menuIndex, index)}
                            >
                              <Image
                                source={{ uri: dish.image }}
                                style={[
                                  styles.thumbnail,
                                  index === activeIdx && styles.activeThumbnail,
                                ]}
                              />
                            </TouchableOpacity>
                          ))}
                      </View>
                      <TouchableOpacity
                        style={styles.detailButton}
                        onPress={() => setSelectedMenu(menu)}
                      >
                        <Text style={styles.detailButtonText}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
                contentContainerStyle={styles.menuGrid}
              />
              <View style={styles.menuActions}>
                {generatedMenus.length < 4 && (
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={handleGenerateMore}
                  >
                    <Text style={styles.secondaryButtonText}>See More Menus</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleNewMenu}
                >
                  <Text style={styles.buttonText}>Generate New Custom Menus</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: '#f7fbfc',
    paddingBottom: 20,
  },
  heading: {
    alignItems: 'center',
    marginVertical: 30,
    paddingHorizontal: 20,
  },
  headingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#013f50',
    textShadowColor: 'rgba(1, 63, 80, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headingSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#02808f',
    marginTop: 8,
  },
  form: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#04668d',
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f9fdff',
    fontSize: 16,
    height: 50,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  selectWrapper: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 10,
    backgroundColor: '#f9fdff',
    overflow: 'hidden',
  },
  select: {
    fontSize: 16,
    color: '#333',
    height: 50,
  },
  button: {
    backgroundColor: '#02808f',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#02808f',
  },
  secondaryButtonText: {
    color: '#02808f',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '90%',
    maxHeight: '60%',
    borderRadius: 10,
    padding: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  modalList: {
    maxHeight: 200,
  },
  modalItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 10,
    alignItems: 'center',
    padding: 10,
  },
  modalCloseText: {
    color: '#02808f',
    fontSize: 16,
    fontWeight: '600',
  },
  output: {
    marginHorizontal: 15,
    marginTop: 20,
  },
  mealPlannerOutput: {
    alignItems: 'center',
  },
  mealPlannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#013f50',
    textAlign: 'center',
    marginBottom: 20,
  },
  mealPlannerSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#02808f',
  },
  bold: {
    fontWeight: '700',
  },
  mealCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 5,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(249,253,255,0.8)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(4,102,141,0.08)',
  },
  dishImage: {
    width: 120,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#04668d',
    marginBottom: 5,
  },
  dishCalories: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  menuGrid: {
    paddingBottom: 20,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 5,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6c757d',
    textTransform: 'uppercase',
  },
  menuCounter: {
    backgroundColor: '#343a40',
    color: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: '600',
  },
  menuImageContainer: {
    height: 200,
    position: 'relative',
  },
  menuMainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselDots: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#ffffff',
    transform: [{ scale: 1.2 }],
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    padding: 15,
  },
  thumbnails: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  thumbnailItem: {
    marginRight: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#02808f',
    transform: [{ scale: 1.1 }],
  },
  detailButton: {
    backgroundColor: '#02808f',
    padding: 15,
    alignItems: 'center',
  },
  detailButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  menuActions: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20,
    gap: 15,
  },
});

export default CustomMealPlanner;