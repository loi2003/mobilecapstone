import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { editUserProfile, getCurrentUser } from '../../api/auth';
import { getEssentialNutritionalNeeds } from '../../api/nutrient-suggestion-api';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const RecommendedNutritionalNeeds = () => {
  const { width } = useWindowDimensions();
  const [week, setWeek] = useState(1);
  const [dob, setDob] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activityLevel, setActivityLevel] = useState(1);
  const [savedDob, setSavedDob] = useState('');
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
            setDate(new Date(formattedDob));
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

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    const formattedDate = currentDate.toISOString().split('T')[0];
    setDob(formattedDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const tooltipTexts = {
    'Total Demanded Energy': 'From main food groups: Glucid, Protein, and Lipid',
    Protein: (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Meat from animals, Fish, and Seafood{'\n'}
          • Legumes: Peanuts, Peas, Lentils{'\n'}
          • Eggs and Products from eggs
        </Text>
      </>
    ),
    'Animal protein/ total protein ratio': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Animal Protein: Various Meat, Fish, Seafood, Eggs, and Products from eggs{'\n'}
          • Plant Protein: Peanuts, Peas, Lentils
        </Text>
      </>
    ),
    Lipid: 'From mainly Vegetable Oils and Nuts, Animal Fats',
    'Animal lipid/ total lipid ratio': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Animal Lipid: Pork Fat, Beef Fat, Fish Oil, ...{'\n'}
          • Plant Lipid: Vegetable Oils, Nuts
        </Text>
      </>
    ),
    Glucid: (
      <>
        From mainly this food group:
        <Text style={styles(width).tooltipList}>
          • Cereal: Rice, Wheat, Oats, Corn
        </Text>
      </>
    ),
    Calcium: (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Milk, Cheese, Yogurt, ...{'\n'}
          • Seafood like Shrimps, Crabs, and Oysters and Fish with edible bones{'\n'}
          • Dark Green Leafy Vegetables like Katuk, Morning Glory or Jute, ...
        </Text>
      </>
    ),
    Iron: (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Oysters, Egg Yolk, Field Crab, Sea Crab, Shrimps, Fish, Milk, ...
        </Text>
      </>
    ),
    Zinc: (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Seafood, Fresh-Water Fish, Various of Meat, Vegetables, Legumes
        </Text>
      </>
    ),
    'Vitamin A': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Liver, Animal Fat, and Eggs{'\n'}
          • Dark Green Leafy Vegetables like Katuk, Morning Glory or Jute, ...{'\n'}
          • Carrots, Sweet Potatoes, Pumpkin, Bell Peppers, ...
        </Text>
      </>
    ),
    'Vitamin D': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Fish Liver Oil, Animal Fat, and Eggs with substituted Vitamin D, ...
        </Text>
      </>
    ),
    'Vitamin E': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Nuts, Seeds, Vegetable Oils, Green Leafy Vegetables like Kale or Spinach, ...
        </Text>
      </>
    ),
    'Vitamin K': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Green Leafy Vegetables, Fruits, Eggs, Cereal, Soybean Oil, Sunflower Oil, Animal Liver, ...
        </Text>
      </>
    ),
    'Vitamin B1': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Whole Grains, Rice Bran
        </Text>
      </>
    ),
    'Vitamin B2': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Viscera, Milk, Vegetables, Cheese, and Eggs
        </Text>
      </>
    ),
    'Vitamin B6': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Fish (Especially Tuna), Chicken, Pork, Beef, Banana, Avocado, and Lettuce
        </Text>
      </>
    ),
    'Vitamin B9 (Folate)': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Aspagarus, Kale, Mustard Greens, ...{'\n'}
          • Oranges, Strawberries, Pear, Watermelon, ...{'\n'}
          • Legumes, Beans, ...
        </Text>
      </>
    ),
    'Vitamin C': (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Fruits and Leafy Greens
        </Text>
      </>
    ),
    Choline: (
      <>
        From main food groups:
        <Text style={styles(width).tooltipList}>
          • Milk, Liver, Eggs, Legumes
        </Text>
      </>
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

      if (dob && dob !== savedDob) {
        await editUserProfile({ dateOfBirth: dob }, token);
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.dateOfBirth = dob;
          await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
        }
        setSavedDob(dob);
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
        <Text style={styles(width).headerTitle}>Recommended Nutritional Needs</Text>
        <Text style={styles(width).headerSubtitle}>
          Enter your gestational week and date of birth to see your needs.
        </Text>
      </View>

      <View style={styles(width).formContainer}>
        <Text style={styles(width).label}>Gestational Week (Stage)</Text>
        <View style={styles(width).pickerWrapper}>
          <Picker
            selectedValue={week}
            onValueChange={(value) => setWeek(Number(value))}
            style={styles(width).picker}
          >
            <Picker.Item label="-- Select Week --" value="" />
            {Array.from({ length: 40 }, (_, i) => (
              <Picker.Item key={i + 1} label={`Week ${i + 1}`} value={i + 1} />
            ))}
          </Picker>
        </View>

        <Text style={styles(width).label}>Date of Birth</Text>
        <TouchableOpacity
          style={styles(width).input}
          onPress={showDatepicker}
        >
          <Text style={{ fontSize: width < 768 ? 14 : 16, color: dob ? '#333' : '#999' }}>
            {dob || 'Select Date of Birth'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <Text style={styles(width).label}>Activity Level</Text>
        <View style={styles(width).pickerWrapper}>
          <Picker
            selectedValue={activityLevel}
            onValueChange={(value) => setActivityLevel(Number(value))}
            style={styles(width).picker}
          >
            <Picker.Item label="1 (Light)" value={1} />
            <Picker.Item label="2 (Moderate)" value={2} />
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles(width).submitButton, loading && styles(width).disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles(width).submitButtonText}>
            {loading ? 'Loading...' : 'Get Nutritional Needs'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles(width).error}>{error}</Text>}

      {nutrients.length > 0 && (
        <View style={styles(width).tableWrapper}>
          <Text style={styles(width).tableTitle}>Recommended Nutritional Needs for Week {week}</Text>
          <Text style={styles(width).tableSubtitle}>
            Below is the recommended nutrition needed in a day to support your pregnancy:
          </Text>
          {nutrients.map((group, gIdx) => (
            <View key={gIdx} style={styles(width).categorySection}>
              <Text style={styles(width).categoryTitle}>{group.category}</Text>
              {group.items.map((item, iIdx) => (
                <View key={iIdx} style={styles(width).nutrientCard}>
                  <View style={styles(width).nutrientHeader}>
                    <Text style={styles(width).nutrientName}>{item.name}</Text>
                    {tooltipTexts[item.name] && (
                      <TouchableOpacity onPress={() => toggleTooltip(item.name)}>
                        <Ionicons
                          name={expandedTooltip === item.name ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="#E74C3C"
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
    padding: width < 768 ? 16 : 20,
    backgroundColor: '#F7FBFC',
    minHeight: '100%',
  },
  heading: {
    alignItems: 'center',
    marginVertical: width < 768 ? 20 : 30,
  },
  headerTitle: {
    fontSize: width < 768 ? 24 : 28,
    fontWeight: '800',
    color: '#013F50',
    marginBottom: 8,
    textShadowColor: 'rgba(1, 63, 80, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '500',
    color: '#02808F',
    textAlign: 'center',
  },
  formContainer: {
    maxWidth: 400,
    marginHorizontal: 'auto',
    backgroundColor: '#FFFFFF',
    padding: width < 768 ? 16 : 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '700',
    color: '#04668D',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 8,
    padding: width < 768 ? 10 : 12,
    backgroundColor: '#F9FDFF',
    fontSize: width < 768 ? 14 : 16,
    justifyContent: 'center',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 8,
    backgroundColor: '#F9FDFF',
    overflow: 'hidden',
  },
  picker: {
    fontSize: width < 768 ? 14 : 16,
    color: '#333',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#02808F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  error: {
    color: '#E74C3C',
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 14,
  },
  tableWrapper: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: width < 768 ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  tableTitle: {
    fontSize: width < 768 ? 20 : 24,
    fontWeight: '700',
    color: '#013F50',
    textAlign: 'center',
    marginBottom: 12,
  },
  tableSubtitle: {
    fontSize: width < 768 ? 14 : 16,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: width < 768 ? 18 : 20,
    fontWeight: '700',
    color: '#04668D',
    backgroundColor: '#F0F8FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  nutrientCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutrientName: {
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '600',
    color: '#013F50',
  },
  nutrientDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  nutrientValue: {
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '700',
    color: '#013F50',
  },
  nutrientUnit: {
    fontSize: width < 768 ? 14 : 16,
    color: '#555555',
  },
  tooltipContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#02808F',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tooltipText: {
    fontSize: width < 768 ? 12 : 14,
    color: '#333',
  },
  tooltipList: {
    fontSize: width < 768 ? 12 : 14,
    color: '#333',
    marginTop: 4,
  },
});

export default RecommendedNutritionalNeeds;