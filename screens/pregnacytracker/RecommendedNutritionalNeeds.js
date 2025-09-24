import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { editUserProfile, getCurrentUser } from '../../api/auth';
import { getEssentialNutritionalNeeds } from '../../api/nutrient-suggestion-api';
import { Ionicons } from '@expo/vector-icons';

const RecommendedNutritionalNeeds = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [week, setWeek] = useState(1);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [dob, setDob] = useState('');
  const [savedDob, setSavedDob] = useState('');
  const [activityLevel, setActivityLevel] = useState(1);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [nutrients, setNutrients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedTooltip, setExpandedTooltip] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const response = await getCurrentUser(token);
          if (response.data?.data?.dateOfBirth) {
            const formattedDob = response.data.data.dateOfBirth.split('T')[0];
            setDob(formattedDob);
            setSavedDob(formattedDob);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user DOB:', error);
        setError('Failed to fetch user data. Please try again.');
      }
    };
    fetchUser();
  }, []);

  const handleDobPress = () => {
    if (!dob) {
      navigation.navigate('Account');
    }
  };

  const tooltipTexts = {
    'Total Demanded Energy': 'From main food groups: Glucid, Protein, and Lipid',
    Protein: (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Meat from animals, Fish, and Seafood{'\n'}
        • Legumes: Peanuts, Peas, Lentils{'\n'}
        • Eggs and Products from eggs
      </Text>
    ),
    'Animal protein/ total protein ratio': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Animal Protein: Various Meat, Fish, Seafood, Eggs, and Products from eggs{'\n'}
        • Plant Protein: Peanuts, Peas, Lentils
      </Text>
    ),
    Lipid: 'From mainly Vegetable Oils and Nuts, Animal Fats',
    'Animal lipid/ total lipid ratio': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Animal Lipid: Pork Fat, Beef Fat, Fish Oil, ...{'\n'}
        • Plant Lipid: Vegetable Oils, Nuts
      </Text>
    ),
    Glucid: (
      <Text style={styles(width).tooltipList}>
        From mainly this food group:{'\n'}
        • Cereal: Rice, Wheat, Oats, Corn
      </Text>
    ),
    Calcium: (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Milk, Cheese, Yogurt, ...{'\n'}
        • Seafood like Shrimps, Crabs, and Oysters and Fish with edible bones{'\n'}
        • Dark Green Leafy Vegetables like Katuk, Morning Glory or Jute, ...
      </Text>
    ),
    Iron: (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Oysters, Egg Yolk, Field Crab, Sea Crab, Shrimps, Fish, Milk, ...
      </Text>
    ),
    Zinc: (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Seafood, Fresh-Water Fish, Various of Meat, Vegetables, Legumes
      </Text>
    ),
    'Vitamin A': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Liver, Animal Fat, and Eggs{'\n'}
        • Dark Green Leafy Vegetables like Katuk, Morning Glory or Jute, ...{'\n'}
        • Carrots, Sweet Potatoes, Pumpkin, Bell Peppers, ...
      </Text>
    ),
    'Vitamin D': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Fish Liver Oil, Animal Fat, and Eggs with substituted Vitamin D, ...
      </Text>
    ),
    'Vitamin E': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Nuts, Seeds, Vegetable Oils, Green Leafy Vegetables like Kale or Spinach, ...
      </Text>
    ),
    'Vitamin K': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Green Leafy Vegetables, Fruits, Eggs, Cereal, Soybean Oil, Sunflower Oil, Animal Liver, ...
      </Text>
    ),
    'Vitamin B1': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Whole Grains, Rice Bran
      </Text>
    ),
    'Vitamin B2': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Viscera, Milk, Vegetables, Cheese, and Eggs
      </Text>
    ),
    'Vitamin B6': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Fish (Especially Tuna), Chicken, Pork, Beef, Banana, Avocado, and Lettuce
      </Text>
    ),
    'Vitamin B9 (Folate)': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Aspagarus, Kale, Mustard Greens, ...{'\n'}
        • Oranges, Strawberries, Pear, Watermelon, ...{'\n'}
        • Legumes, Beans, ...
      </Text>
    ),
    'Vitamin C': (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Fruits and Leafy Greens
      </Text>
    ),
    Choline: (
      <Text style={styles(width).tooltipList}>
        From main food groups:{'\n'}
        • Milk, Liver, Eggs, Legumes
      </Text>
    ),
  };

  const vitaminDisplayNames = {
    folate: 'Vitamin B9 (Folate)',
    vitaminA: 'Vitamin A',
    vitaminD: 'Vitamin D',
    vitaminE: 'Vitamin E',
    vitaminK: 'Vitamin K',
    vitaminB1: 'Vitamin B1',
    vitaminB2: 'Vitamin B2',
    vitaminB6: 'Vitamin B6',
    vitaminB12: 'Vitamin B12',
    vitaminC: 'Vitamin C',
    choline: 'Choline',
  };

  const formatVitaminName = (key) => {
    if (vitaminDisplayNames[key]) return vitaminDisplayNames[key];
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  };

  const formatName = (str) => {
    if (!str) return '';
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  };

  const handleSubmit = async () => {
    setError('');
    setNutrients([]);
    setLoading(true);
    if (!week || !dob) {
      setError('Please enter both gestational week and date of birth.');
      setLoading(false);
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dob)) {
      setError('Invalid date of birth format. Please use YYYY-MM-DD.');
      setLoading(false);
      return;
    }
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    if (age < 20) {
      setError('This feature is only available for users 20 years and older.');
      setLoading(false);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      const rawData = await getEssentialNutritionalNeeds({
        currentWeek: week,
        dateOfBirth: dob,
        activityLevel: activityLevel || 1,
      });
      const formattedData = [
        {
          category: 'Energy',
          items: [
            {
              name: 'Total Demanded Energy',
              value: rawData.totalDemandedEnergy || rawData.totalDemanedEnergy,
              unit: 'kcal',
            },
          ],
        },
        {
          category: 'P:L:G Substances',
          items: Object.keys(rawData.plgSubstances || {}).map((key) => ({
            name: formatName(key),
            value: rawData.plgSubstances[key].demand,
            unit: rawData.plgSubstances[key].unit,
          })),
        },
        {
          category: 'Minerals',
          items: Object.keys(rawData.minerals || {}).map((key) => ({
            name: formatName(key),
            value: rawData.minerals[key].demand,
            unit: rawData.minerals[key].unit,
          })),
        },
        {
          category: 'Vitamins',
          items: Object.keys(rawData.vitamins || {}).map((key) => ({
            name: formatVitaminName(key),
            value: rawData.vitamins[key].demand,
            unit: rawData.vitamins[key].unit,
          })),
        },
        {
          category: 'Other Information',
          items: Object.keys(rawData.otherInformation || {}).map((key) => ({
            name: formatName(key),
            value: rawData.otherInformation[key].demand,
            unit: rawData.otherInformation[key].unit,
          })),
        },
      ];
      setNutrients(formattedData);
    } catch (err) {
      console.error('Error fetching nutritional needs:', err);
      if (err.response?.status === 400) {
        const errors = err.response.data.errors;
        if (errors?.DateOfBirth) {
          setError(`Date of Birth error: ${errors.DateOfBirth.join(', ')}`);
        } else if (errors?.Id) {
          setError(`ID error: ${errors.Id.join(', ')}`);
        } else {
          setError('Invalid input. Please check your data and try again.');
        }
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Failed to fetch nutritional needs. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTooltip = (name) => {
    setExpandedTooltip(expandedTooltip === name ? null : name);
  };

  return (
    <ScrollView contentContainerStyle={styles(width).container}>
      <View style={styles(width).heading}>
        <Text style={styles(width).headerTitle}>Nutritional Needs</Text>
        <Text style={styles(width).headerSubtitle}>
          Enter details to view your personalized pregnancy nutrition recommendations.
        </Text>
      </View>
      <View style={styles(width).formContainer}>
        <Text style={styles(width).label}>Gestational Week</Text>
        <TouchableOpacity
          style={styles(width).input}
          onPress={() => setShowWeekPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles(width).inputText}>
            {week ? `Week ${week}` : 'Select Week'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {showWeekPicker && (
          <View style={styles(width).pickerModal}>
            <Picker
              selectedValue={week}
              onValueChange={(value) => {
                setWeek(Number(value));
                setShowWeekPicker(Platform.OS !== 'ios');
              }}
              style={styles(width).picker}
            >
              <Picker.Item label="Select Week" value="" />
              {Array.from({ length: 40 }, (_, i) => (
                <Picker.Item key={i + 1} label={`Week ${i + 1}`} value={i + 1} />
              ))}
            </Picker>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles(width).pickerDoneButton}
                onPress={() => setShowWeekPicker(false)}
              >
                <Text style={styles(width).pickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <Text style={styles(width).label}>Date of Birth</Text>
        <TouchableOpacity
          style={[styles(width).input, !dob && styles(width).inputEditable]}
          onPress={handleDobPress}
          activeOpacity={0.7}
        >
          <Text style={[styles(width).inputText, !dob && styles(width).inputPlaceholder]}>
            {dob || 'Set Date of Birth in Profile'}
          </Text>
          <Ionicons name={dob ? 'lock-closed' : 'pencil'} size={20} color="#666" />
        </TouchableOpacity>
        <Text style={styles(width).label}>Activity Level</Text>
        <TouchableOpacity
          style={styles(width).input}
          onPress={() => setShowActivityPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles(width).inputText}>
            {activityLevel === 1 ? 'Light' : activityLevel === 2 ? 'Moderate' : 'Select Activity Level'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {showActivityPicker && (
          <View style={styles(width).pickerModal}>
            <Picker
              selectedValue={activityLevel}
              onValueChange={(value) => {
                setActivityLevel(Number(value));
                setShowActivityPicker(Platform.OS !== 'ios');
              }}
              style={styles(width).picker}
            >
              <Picker.Item label="Select Activity Level" value="" />
              <Picker.Item label="Light" value={1} />
              <Picker.Item label="Moderate" value={2} />
            </Picker>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles(width).pickerDoneButton}
                onPress={() => setShowActivityPicker(false)}
              >
                <Text style={styles(width).pickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <TouchableOpacity
          style={[styles(width).submitButton, loading && styles(width).disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles(width).submitButtonText}>Get Recommendations</Text>
          )}
        </TouchableOpacity>
      </View>
      {error && <Text style={styles(width).error}>{error}</Text>}
      {nutrients.length > 0 && (
        <View style={styles(width).tableWrapper}>
          <Text style={styles(width).tableTitle}>Nutrition for Week {week}</Text>
          <Text style={styles(width).tableSubtitle}>
            Daily recommendations to support your pregnancy:
          </Text>
          {nutrients.map((group, gIdx) => (
            <View key={gIdx} style={styles(width).categorySection}>
              <Text style={styles(width).categoryTitle}>{group.category}</Text>
              {group.items.map((item, iIdx) => (
                <View key={iIdx} style={styles(width).nutrientCard}>
                  <View style={styles(width).nutrientHeader}>
                    <Text style={styles(width).nutrientName}>{item.name}</Text>
                    {tooltipTexts[item.name] && (
                      <TouchableOpacity
                        onPress={() => toggleTooltip(item.name)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={expandedTooltip === item.name ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="#02808F"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles(width).nutrientDetails}>
                    <Text style={styles(width).nutrientValue}>{item.value}</Text>
                    <Text style={styles(width).nutrientUnit}>{item.unit}</Text>
                  </View>
                  {expandedTooltip === item.name && tooltipTexts[item.name] && (
                    <View style={styles(width).tooltipContainer}>
                      <Text style={styles(width).tooltipText}>{tooltipTexts[item.name]}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = (width) => StyleSheet.create({
  container: {
    padding: width < 768 ? 16 : 24,
    backgroundColor: '#F5F6F5',
    minHeight: '100%',
  },
  heading: {
    alignItems: 'center',
    marginVertical: width < 768 ? 24 : 32,
  },
  headerTitle: {
    fontSize: width < 768 ? 26 : 30,
    fontWeight: '700',
    color: '#013F50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerSubtitle: {
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '400',
    color: '#4B5E6A',
    textAlign: 'center',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    padding: width < 768 ? 20 : 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  inputEditable: {
    borderColor: '#02808F',
    backgroundColor: '#F0F6FF',
  },
  inputText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  inputPlaceholder: {
    color: '#666',
    fontStyle: 'italic',
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
  submitButton: {
    backgroundColor: '#02808F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  disabledButton: {
    backgroundColor: '#A3BFFA',
  },
  error: {
    color: '#DC2626',
    fontSize: width < 768 ? 14 : 16,
    textAlign: 'center',
    marginVertical: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tableWrapper: {
    marginHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: width < 768 ? 16 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  tableTitle: {
    fontSize: width < 768 ? 22 : 26,
    fontWeight: '700',
    color: '#013F50',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tableSubtitle: {
    fontSize: width < 768 ? 14 : 16,
    color: '#4B5E6A',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: width < 768 ? 18 : 20,
    fontWeight: '600',
    color: '#013F50',
    backgroundColor: '#F0F6FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  nutrientCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutrientName: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    color: '#013F50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  nutrientDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '700',
    color: '#013F50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  nutrientUnit: {
    fontSize: width < 768 ? 14 : 16,
    color: '#4B5E6A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tooltipContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tooltipText: {
    fontSize: width < 768 ? 13 : 14,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tooltipList: {
    fontSize: width < 768 ? 13 : 14,
    color: '#333',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default RecommendedNutritionalNeeds;