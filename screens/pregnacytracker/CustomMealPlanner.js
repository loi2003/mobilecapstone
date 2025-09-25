import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { viewMealsSuggestion } from '../../api/meal-api';
import { getCurrentUser } from '../../api/auth';
import { viewAllDiseases } from '../../api/disease-api';
import { viewAllAllergies } from '../../api/allergy-api';
import { viewAllDishes } from '../../api/dish-api';

const { width } = Dimensions.get('window');

const CustomMealPlanner = ({ navigation }) => {
  const [token, setToken] = useState('');
  const [stage, setStage] = useState(1);
  const [showStagePicker, setShowStagePicker] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [type, setType] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [numberOfDishes, setNumberOfDishes] = useState(1);
  const [showDishesPicker, setShowDishesPicker] = useState(false);
  const [allergies, setAllergies] = useState('');
  const [diseases, setDiseases] = useState('');
  const [preferredFoodInput, setPreferredFoodInput] = useState('');
  const [selectedPreferredFoodId, setSelectedPreferredFoodId] = useState(null);
  const [selectedAllergyId, setSelectedAllergyId] = useState(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState(null);
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
  const [activeImageIndices, setActiveImageIndices] = useState({});
  const [selectedMenu, setSelectedMenu] = useState(null);

  // Show toast notifications for errors
  const showErrorNotification = (message) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
      position: 'top',
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
      text1Style: styles.toastText1,
      text2Style: styles.toastText2,
    });
  };

  // Fetch token
  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem('authToken');
      setToken(storedToken || '');
    };
    fetchToken();
  }, []);

  // Fetch allergies, diseases, and dishes
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
        const errorMessage = err.response?.data?.message || 'Failed to fetch allergies, diseases, or dishes.';
        setError(errorMessage);
        showErrorNotification(errorMessage);
      }
    };
    if (token) fetchData();
  }, [token]);

  // Fetch user date of birth
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await getCurrentUser(token);
          if (response.data?.data?.dateOfBirth) {
            const dob = response.data.data.dateOfBirth.split('T')[0];
            setDateOfBirth(dob);
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch user profile.';
          setError(errorMessage);
          showErrorNotification(errorMessage);
        }
      }
    };
    fetchUser();
  }, [token]);

  // Initialize active image indices
  useEffect(() => {
    const initialIndices = {};
    generatedMenus.forEach((_, menuIndex) => {
      initialIndices[menuIndex] = 0;
    });
    setActiveImageIndices(initialIndices);
  }, [generatedMenus]);

  // Limit number of dishes based on meal type
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

  // Input validation
  const validateInputs = () => {
    if (!type) {
      return 'Please select a meal type.';
    }
    if (allergyInput && !selectedAllergyId) {
      return 'Please select a valid allergy from the list.';
    }
    if (diseaseInput && !selectedDiseaseId) {
      return 'Please select a valid disease from the list.';
    }
    if (preferredFoodInput && !selectedPreferredFoodId) {
      return 'Please select a valid favorite dish from the list.';
    }
    return '';
  };

  // Handle form submission
  const handleSubmit = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      showErrorNotification(validationError);
      return;
    }
    setError('');
    setLoading(true);

    const payload = {
      stage,
      dateOfBirth: dateOfBirth || null,
      type,
      numberOfDishes,
      allergyIds: selectedAllergyId ? [selectedAllergyId] : [],
      diseaseIds: selectedDiseaseId ? [selectedDiseaseId] : [],
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
      const errorMessage =
        err.response?.data?.message || 'Failed to generate meal plan.';
      setError(errorMessage);
      showErrorNotification(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Generate more menus
  const handleGenerateMore = async () => {
    if (generatedMenus.length >= 4) return;
    setLoading(true);

    try {
      const response = await viewMealsSuggestion({
        stage,
        dateOfBirth,
        type,
        numberOfDishes,
        allergyIds: selectedAllergyId ? [selectedAllergyId] : [],
        diseaseIds: selectedDiseaseId ? [selectedDiseaseId] : [],
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
      const errorMessage =
        err.response?.data?.message || 'Could not fetch more menus.';
      setError(errorMessage);
      showErrorNotification(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset menus
  const handleNewMenu = () => {
    setGeneratedMenus([]);
    setError('');
  };

  // Set active image for menu carousel
  const handleSetActiveImage = (menuIndex, imageIndex) => {
    setActiveImageIndices((prev) => ({
      ...prev,
      [menuIndex]: imageIndex,
    }));
  };

  // Render autocomplete modal
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalContent}>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={(text) => {
                setInputValue(text);
                setSelectedId(null); // Reset ID when typing
                setStateValue(''); // Reset state value when typing
              }}
              placeholder={placeholder}
              placeholderTextColor="#999"
              autoFocus={true}
              accessibilityLabel={placeholder}
            />
            {inputValue ? (
              <FlatList
                data={options.filter(
                  (item) =>
                    item.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
                    item.dishName?.toLowerCase().includes(inputValue.toLowerCase()),
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
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${item.name || item.dishName}`}
                  >
                    <Text style={styles.modalItemText}>{item.name || item.dishName}</Text>
                  </TouchableOpacity>
                )}
                style={styles.modalList}
              />
            ) : null}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.pageWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#02808F" />
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
          <Text style={styles.label}>Gestational Week</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowStagePicker(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select gestational week"
          >
            <Text style={styles.inputText}>{stage ? `Week ${stage}` : 'Select Week'}</Text>
            <Icon name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {showStagePicker && (
            <View style={styles.pickerModal}>
              <Picker
                selectedValue={stage}
                onValueChange={(value) => {
                  setStage(Number(value));
                  setShowStagePicker(Platform.OS !== 'ios');
                }}
                style={styles.picker}
                accessibilityLabel="Gestational week picker"
              >
                <Picker.Item label="Select Week" value="" />
                {Array.from({ length: 40 }, (_, i) => (
                  <Picker.Item key={i + 1} label={`Week ${i + 1}`} value={i + 1} />
                ))}
              </Picker>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowStagePicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close week picker"
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* DOB */}
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={dateOfBirth}
            editable={false}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#666"
            accessibilityLabel="Date of birth (read-only)"
          />

          {/* Meal Type */}
          <Text style={styles.label}>Meal Type</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowTypePicker(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select meal type"
          >
            <Text style={styles.inputText}>{type || 'Select Meal Type'}</Text>
            <Icon name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {showTypePicker && (
            <View style={styles.pickerModal}>
              <Picker
                selectedValue={type}
                onValueChange={(value) => {
                  setType(value);
                  setShowTypePicker(Platform.OS !== 'ios');
                }}
                style={styles.picker}
                accessibilityLabel="Meal type picker"
              >
                <Picker.Item label="Select Meal Type" value="" />
                <Picker.Item label="Breakfast" value="Breakfast" />
                <Picker.Item label="Lunch" value="Lunch" />
                <Picker.Item label="Dinner" value="Dinner" />
                <Picker.Item label="Snack 1" value="Snack1" />
                <Picker.Item label="Snack 2" value="Snack2" />
              </Picker>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowTypePicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close meal type picker"
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Number of Dishes */}
          <Text style={styles.label}>Number of Dishes</Text>
          <TouchableOpacity
            style={[styles.input, !type && styles.disabledInput]}
            onPress={() => type && setShowDishesPicker(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select number of dishes"
          >
            <Text style={styles.inputText}>
              {numberOfDishes ? `${numberOfDishes}` : 'Select Number of Dishes'}
            </Text>
            <Icon name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {showDishesPicker && (
            <View style={styles.pickerModal}>
              <Picker
                selectedValue={numberOfDishes}
                onValueChange={(value) => {
                  setNumberOfDishes(Number(value));
                  setShowDishesPicker(Platform.OS !== 'ios');
                }}
                style={styles.picker}
                enabled={!!type}
                accessibilityLabel="Number of dishes picker"
              >
                <Picker.Item label="Select Number of Dishes" value="" />
                {Array.from({ length: getMaxDishes(type) }, (_, i) => (
                  <Picker.Item key={i + 1} label={`${i + 1}`} value={i + 1} />
                ))}
              </Picker>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowDishesPicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close dishes picker"
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Allergies */}
          <Text style={styles.label}>Allergies</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowAllergyList(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select allergies"
          >
            <Text style={styles.inputText}>
              {allergyInput || 'Optional - Type allergy name'}
            </Text>
            <Icon name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {renderAutocompleteModal(
            showAllergyList,
            setShowAllergyList,
            allergyOptions,
            allergyInput,
            setAllergyInput,
            setSelectedAllergyId,
            setAllergies,
            'Optional - Type allergy name',
          )}

          {/* Diseases */}
          <Text style={styles.label}>Chronic Diseases</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDiseaseList(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select chronic diseases"
          >
            <Text style={styles.inputText}>
              {diseaseInput || 'Optional - Type disease name'}
            </Text>
            <Icon name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {renderAutocompleteModal(
            showDiseaseList,
            setShowDiseaseList,
            diseaseOptions,
            diseaseInput,
            setDiseaseInput,
            setSelectedDiseaseId,
            setDiseases,
            'Optional - Type disease name',
          )}

          {/* Preferred Foods */}
          <Text style={styles.label}>Choose your Favorite Dish!</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowPreferredFoodList(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select favorite dish"
          >
            <Text style={styles.inputText}>
              {preferredFoodInput || 'Optional - Type to search e.g. Rice, Beef'}
            </Text>
            <Icon name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {renderAutocompleteModal(
            showPreferredFoodList,
            setShowPreferredFoodList,
            preferredFoodOptions,
            preferredFoodInput,
            setPreferredFoodInput,
            setSelectedPreferredFoodId,
            () => {}, // No-op to prevent unintended state changes
            'Optional - Type to search e.g. Rice, Beef',
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.errorDismissButton}
                onPress={() => setError('')}
                accessibilityRole="button"
                accessibilityLabel="Dismiss error"
              >
                <Icon name="times" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Create meal plan"
          >
            <Text style={styles.buttonText}>
              <Icon name="cutlery" size={16} color="#FFFFFF" /> Submit Custom Plan
            </Text>
          </TouchableOpacity>
        </View>

        {generatedMenus.length > 0 && (
          <View style={styles.output}>
            {selectedMenu ? (
              <View style={styles.mealPlannerOutput}>
                <Text style={styles.mealPlannerTitle}>
                  Menu Details
                  {'\n'}
                  <Text style={{ fontSize: width < 768 ? 16 : 18 }}>
                    Total:{' '}
                    {selectedMenu.dishes
                      ?.reduce((sum, dish) => sum + (dish?.calories || 0), 0)
                      .toFixed(1)}{' '}
                    kcal
                  </Text>
                </Text>
                {selectedMenu.dishes?.map((dish, i) => (
                  <View key={i} style={styles.dishCard}>
                    <Image
                      source={{ uri: dish.image }}
                      style={styles.dishImage}
                      accessibilityLabel={`Image of ${dish.name}`}
                    />
                    <View style={styles.dishInfo}>
                      <Text style={styles.dishName}>{dish.name}</Text>
                      <Text style={styles.dishCalories}>{dish.calories.toFixed(1)} kcal</Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setSelectedMenu(null)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Back to menus"
                >
                  <Text style={styles.secondaryButtonText}>
                    <Icon name="arrow-left" size={16} color="#02808F" /> Back to Menus
                  </Text>
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
                            {numberOfDishes} {numberOfDishes === 1 ? 'dish' : 'dishes'}
                          </Text>
                        </View>
                        <View style={styles.menuImageContainer}>
                          <Image
                            source={{ uri: menu.dishes[activeIdx]?.image }}
                            style={styles.menuMainImage}
                            accessibilityLabel={`Main image of ${menu.dishes[activeIdx]?.name}`}
                          />
                          <View style={styles.carouselDots}>
                            {menu.dishes.slice(0, numberOfDishes).map((_, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[styles.dot, index === activeIdx && styles.activeDot]}
                                onPress={() => handleSetActiveImage(menuIndex, index)}
                                accessibilityRole="button"
                                accessibilityLabel={`Select dish ${index + 1}`}
                              />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.menuTitle}>{menu.dishes[activeIdx]?.name}</Text>
                        <View style={styles.thumbnails}>
                          {menu.dishes.slice(0, numberOfDishes).map((dish, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.thumbnailItem}
                              onPress={() => handleSetActiveImage(menuIndex, index)}
                              accessibilityRole="button"
                              accessibilityLabel={`Select thumbnail for ${dish.name}`}
                            >
                              <Image
                                source={{ uri: dish.image }}
                                style={[styles.thumbnail, index === activeIdx && styles.activeThumbnail]}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity
                          style={styles.detailButton}
                          onPress={() => setSelectedMenu(menu)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`View details for Menu ${menuIndex + 1}`}
                        >
                          <Text style={styles.detailButtonText}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                  contentContainerStyle={styles.menuGrid}
                />
                <View style={styles.stickyFooter}>
                  {generatedMenus.length < 4 && (
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton, styles.footerButton]}
                      onPress={handleGenerateMore}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Generate more menus"
                    >
                      <Text style={styles.secondaryButtonText}>
                        <Icon name="plus" size={16} color="#02808F" /> See More Menus
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.button, styles.footerButton]}
                    onPress={handleNewMenu}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Create new meal plan"
                  >
                    <Text style={styles.buttonText}>
                      <Icon name="repeat" size={16} color="#FFFFFF" /> Generate New Custom Menus
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heading: {
    alignItems: 'center',
    marginVertical: width < 768 ? 24 : 32,
    paddingHorizontal: 20,
  },
  headingTitle: {
    fontSize: width < 768 ? 28 : 32,
    fontWeight: '700',
    color: '#013F50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headingSubtitle: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '400',
    color: '#4B5E6A',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    padding: width < 768 ? 20 : 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '600',
    color: '#013F50',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: width < 768 ? 12 : 14,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  inputDisabled: {
    backgroundColor: '#F5F6F5',
    opacity: 0.6,
  },
  inputText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  disabledInput: {
    backgroundColor: '#F5F6F5',
    opacity: 0.6,
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
  },
  picker: {
    fontSize: width < 768 ? 14 : 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  pickerDoneButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  pickerDoneText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#02808F',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  button: {
    backgroundColor: '#02808F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#02808F',
  },
  secondaryButtonText: {
    color: '#02808F',
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  errorContainer: {
    backgroundColor: '#FFF1F1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#DC2626',
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    flex: 1,
  },
  errorDismissButton: {
    padding: 8,
  },
  toastText1: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  toastText2: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width < 768 ? 16 : 24,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 600,
    maxHeight: '60%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#02808F',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    color: '#013F50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalList: {
    maxHeight: 200,
  },
  modalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalItemText: {
    fontSize: 16,
    color: '#013F50',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalCloseButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#02808F',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  output: {
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  mealPlannerOutput: {
    alignItems: 'center',
  },
  mealPlannerTitle: {
    fontSize: width < 768 ? 24 : 28,
    fontWeight: '700',
    color: '#013F50',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dishImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 16,
  },
  dishInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  dishName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#013F50',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dishCalories: {
    fontSize: 14,
    color: '#02808F',
    fontWeight: '500',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  menuGrid: {
    paddingBottom: 20,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F0FA',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#013F50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  menuCounter: {
    backgroundColor: '#02808F',
    color: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.3 }],
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#013F50',
    padding: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  thumbnails: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  thumbnailItem: {
    marginRight: 12,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#02808F',
    transform: [{ scale: 1.1 }],
  },
  detailButton: {
    backgroundColor: '#02808F',
    padding: 12,
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  stickyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomMealPlanner;