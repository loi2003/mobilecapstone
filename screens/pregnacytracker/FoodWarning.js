import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { viewWarningFoods, getAllAllergies, getAllDiseases } from '../../api/nutriet-api';
import { Ionicons } from '@expo/vector-icons';

const FoodWarning = () => {
  const { width } = useWindowDimensions();
  const [token, setToken] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allergyOptions, setAllergyOptions] = useState([]);
  const [diseaseOptions, setDiseaseOptions] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [diseaseInput, setDiseaseInput] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [showAllergyList, setShowAllergyList] = useState(false);
  const [showDiseaseList, setShowDiseaseList] = useState(false);
  const allergyInputRef = useRef(null);
  const diseaseInputRef = useRef(null);
  const isSubmitting = useRef(false);
  const submitTimeout = useRef(null); // Timeout for debouncing

  // Fetch token and dropdown options
  useEffect(() => {
    const fetchTokenAndOptions = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (!storedToken) {
          setError('Please log in to access food warnings.');
          return;
        }
        setToken(storedToken);

        const [allergyRes, diseaseRes] = await Promise.all([
          getAllAllergies(storedToken),
          getAllDiseases(storedToken),
        ]);

        const allergies = Array.isArray(allergyRes.data)
          ? allergyRes.data
          : Array.isArray(allergyRes.data?.data)
          ? allergyRes.data.data
          : [];
        const diseases = Array.isArray(diseaseRes.data)
          ? diseaseRes.data
          : Array.isArray(diseaseRes.data?.data)
          ? diseaseRes.data.data
          : [];

        setAllergyOptions(allergies);
        setDiseaseOptions(diseases);
      } catch (err) {
        setError('Failed to load options. Please try again.');
      }
    };
    fetchTokenAndOptions();
  }, []);

  // Handle submit with enhanced debouncing
  const handleSubmit = useCallback(async () => {
    if (isSubmitting.current || loading) {
      return;
    }

    if (!token) {
      setError('Please log in to access food warnings.');
      return;
    }

    const payload = {
      allergyIds: selectedAllergies.map((a) => a.id),
      diseaseIds: selectedDiseases.map((d) => d.id),
    };

    if (payload.allergyIds.length === 0 && payload.diseaseIds.length === 0) {
      setError('Select at least one allergy or disease.');
      return;
    }

    setError('');
    setLoading(true);
    isSubmitting.current = true;

    // Clear any existing timeout
    if (submitTimeout.current) {
      clearTimeout(submitTimeout.current);
    }

    try {
      // Add a small delay to ensure no rapid successive calls
      await new Promise((resolve) => {
        submitTimeout.current = setTimeout(resolve, 500);
      });

      const response = await viewWarningFoods(payload, token);
      const foodData = Array.isArray(response)
        ? response
        : Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      if (foodData.length > 0) {
        setFoods(foodData);
      }
    } catch (err) {
      setError('Unable to fetch food warnings. Please try again.');
    } finally {
      setLoading(false);
      isSubmitting.current = false;
      submitTimeout.current = null;
    }
  }, [token, selectedAllergies, selectedDiseases, loading]);

  // Handle allergy/disease selection
  const handleSelectAllergy = (allergy) => {
    if (!selectedAllergies.some((s) => s.id === allergy.id)) {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
    setAllergyInput('');
    setShowAllergyList(false);
  };

  const handleSelectDisease = (disease) => {
    if (!selectedDiseases.some((s) => s.id === disease.id)) {
      setSelectedDiseases([...selectedDiseases, disease]);
    }
    setDiseaseInput('');
    setShowDiseaseList(false);
  };

  const handleRemoveAllergy = (id) => {
    setSelectedAllergies(selectedAllergies.filter((a) => a.id !== id));
  };

  const handleRemoveDisease = (id) => {
    setSelectedDiseases(selectedDiseases.filter((d) => d.id !== id));
  };

  // Render dropdown items
  const renderAllergyItem = ({ item }) => (
    <TouchableOpacity
      style={styles(width).autocompleteItem}
      onPress={() => handleSelectAllergy(item)}
      activeOpacity={0.7}
    >
      <Text style={styles(width).autocompleteText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderDiseaseItem = ({ item }) => (
    <TouchableOpacity
      style={styles(width).autocompleteItem}
      onPress={() => handleSelectDisease(item)}
      activeOpacity={0.7}
    >
      <Text style={styles(width).autocompleteText}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Render selected tags
  const renderTag = ({ item, type }) => (
    <View style={styles(width).tag}>
      <Text style={styles(width).tagText}>{item.name}</Text>
      <TouchableOpacity
        onPress={() => (type === 'allergy' ? handleRemoveAllergy(item.id) : handleRemoveDisease(item.id))}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={width < 768 ? 16 : 18} color="#02808F" />
      </TouchableOpacity>
    </View>
  );

  // Render food warning card
  const renderFoodCard = ({ item }) => (
    <View style={styles(width).card}>
      <Image
        source={{
          uri: item.imageUrl || 'https://images.pexels.com/photos/1128678/pexels-photo-1128678.jpeg',
        }}
        style={styles(width).cardImage}
        resizeMode="cover"
      />
      <View style={styles(width).cardInfo}>
        <Text style={styles(width).cardTitle}>{item.name}</Text>
        <Text style={styles(width).cardDescription}>{item.foodDescription}</Text>
        <Text style={styles(width).cardText}>
          <Text style={styles(width).bold}>Pregnancy Safe: </Text>
          {item.pregnancySafe ? 'Yes' : 'No'}
        </Text>
        <Text style={styles(width).cardText}>
          <Text style={styles(width).bold}>Safety Note: </Text>
          {item.safetyNote || 'None'}
        </Text>
        {item.foodAllergy?.length > 0 && (
          <View style={[styles(width).section, styles(width).allergySection]}>
            <Text style={styles(width).sectionTitle}>Allergy Risks</Text>
            {item.foodAllergy.map((a) => (
              <Text key={a.id} style={styles(width).sectionText}>
                <Text style={styles(width).bold}>{a.allergyName} Allergy: </Text>
                {a.description || 'No description available'}
              </Text>
            ))}
          </View>
        )}
        {item.foodDisease?.length > 0 && (
          <View style={[styles(width).section, styles(width).diseaseSection]}>
            <Text style={styles(width).sectionTitle}>Disease Warnings</Text>
            {item.foodDisease.map((d) => (
              <Text key={d.id} style={styles(width).sectionText}>
                <Text style={styles(width).bold}>{d.diseaseName} ({d.status}): </Text>
                {d.description || 'No description available'}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <FlatList
        data={[
          { id: 'header', type: 'header' },
          ...(loading ? [{ id: 'loading', type: 'loading' }] : []),
          ...foods.map((food, index) => ({ ...food, id: `${food.id || index}-${food.name}`, type: 'food' })),
        ]}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles(width).form}>
                <View style={styles(width).header}>
                  <Text style={styles(width).headerTitle}>
                    Food Warnings
                    <Text style={styles(width).headerSubtitle}>
                      {'\n'}Find foods unsafe for your conditions
                    </Text>
                  </Text>
                </View>

                {/* Allergies */}
                <Text style={styles(width).label}>Allergies</Text>
                <View style={styles(width).autocompleteWrapper}>
                  <TextInput
                    ref={allergyInputRef}
                    style={styles(width).input}
                    value={allergyInput}
                    onChangeText={(text) => {
                      setAllergyInput(text);
                      setShowAllergyList(true);
                    }}
                    placeholder="Optional - Type allergy name (e.g., Peanuts)"
                    placeholderTextColor="#888"
                    onFocus={() => setShowAllergyList(true)}
                  />
                  {showAllergyList && allergyInput.trim() && (
                    <View style={[styles(width).autocompleteList, { zIndex: 10000 }]}>
                      <FlatList
                        data={allergyOptions.filter((a) =>
                          a.name?.toLowerCase().includes(allergyInput.trim().toLowerCase())
                        )}
                        renderItem={renderAllergyItem}
                        keyExtractor={(item) => item.id.toString()}
                        ListEmptyComponent={
                          <Text style={styles(width).autocompleteText}>No allergies found</Text>
                        }
                        style={{ maxHeight: 200 }}
                      />
                    </View>
                  )}
                </View>
                <FlatList
                  data={selectedAllergies}
                  renderItem={({ item }) => renderTag({ item, type: 'allergy' })}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  style={styles(width).tags}
                  showsHorizontalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={styles(width).noResults}></Text>
                  }
                />

                {/* Diseases */}
                <Text style={styles(width).label}>Diseases</Text>
                <View style={styles(width).autocompleteWrapper}>
                  <TextInput
                    ref={diseaseInputRef}
                    style={styles(width).input}
                    value={diseaseInput}
                    onChangeText={(text) => {
                      setDiseaseInput(text);
                      setShowDiseaseList(true);
                    }}
                    placeholder="Optional - Type disease name (e.g., Diabetes)"
                    placeholderTextColor="#888"
                    onFocus={() => setShowDiseaseList(true)}
                  />
                  {showDiseaseList && diseaseInput.trim() && (
                    <View style={[styles(width).autocompleteList, { zIndex: 10000 }]}>
                      <FlatList
                        data={diseaseOptions.filter((d) =>
                          d.name?.toLowerCase().includes(diseaseInput.trim().toLowerCase())
                        )}
                        renderItem={renderDiseaseItem}
                        keyExtractor={(item) => item.id.toString()}
                        ListEmptyComponent={
                          <Text style={styles(width).autocompleteText}>No diseases found</Text>
                        }
                        style={{ maxHeight: 200 }}
                      />
                    </View>
                  )}
                </View>
                <FlatList
                  data={selectedDiseases}
                  renderItem={({ item }) => renderTag({ item, type: 'disease' })}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  style={styles(width).tags}
                  showsHorizontalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={styles(width).noResults}></Text>
                  }
                />

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles(width).button, loading && styles(width).buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles(width).buttonText}>
                    {loading ? 'Loading...' : 'View Food Warnings'}
                  </Text>
                </TouchableOpacity>

                {error && <Text style={styles(width).error}>{error}</Text>}
                {!loading && foods.length === 0 && !error && (
                  <Text style={styles(width).noResults}>
                    No foods found for your selected conditions.
                  </Text>
                )}
              </View>
            );
          }
          if (item.type === 'loading') {
            return <Text style={styles(width).noResults}>Loading...</Text>;
          }
          return renderFoodCard({ item });
        }}
        keyExtractor={(item) => item.id}
        numColumns={width < 768 ? 1 : 2}
        columnWrapperStyle={width >= 768 ? styles(width).gridRow : null}
        contentContainerStyle={styles(width).container}
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
};

const styles = (width) => StyleSheet.create({
  container: {
    padding: width < 768 ? 16 : 20,
    backgroundColor: '#F7FBFC',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginVertical: width < 768 ? 12 : 16,
  },
  headerTitle: {
    fontSize: width < 768 ? 32 : 45,
    fontWeight: '800',
    color: '#013F50',
    textAlign: 'center',
    textShadowColor: 'rgba(1, 63, 80, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '500',
    color: '#02808F',
    textAlign: 'center',
  },
  form: {
    maxWidth: 800,
    marginHorizontal: 'auto',
    backgroundColor: '#FFFFFF',
    padding: width < 768 ? 24 : 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  label: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '700',
    color: '#04668D',
    marginTop: 24,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 10,
    padding: width < 768 ? 12 : 16,
    backgroundColor: '#F9FDFF',
    fontSize: width < 768 ? 16 : 18,
  },
  autocompleteWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  autocompleteList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10000,
    marginTop: 4,
  },
  autocompleteItem: {
    padding: width < 768 ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  autocompleteText: {
    fontSize: width < 768 ? 16 : 18,
    color: '#333',
  },
  tags: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  tag: {
    backgroundColor: '#E6F7F9',
    borderWidth: 1,
    borderColor: '#02808F',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#02808F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  tagText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#02808F',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#02808F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
    width: width < 768 ? '100%' : 230,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  error: {
    color: '#E74C3C',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 16,
  },
  noResults: {
    fontSize: width < 768 ? 16 : 18,
    color: '#555555',
    textAlign: 'center',
    marginVertical: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 24,
    marginHorizontal: width < 768 ? 0 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
    overflow: 'hidden',
    flex: width < 768 ? 1 : 0.48,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardInfo: {
    padding: width < 768 ? 16 : 24,
  },
  cardTitle: {
    fontSize: width < 768 ? 20 : 22,
    fontWeight: '700',
    color: '#04668D',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: width < 768 ? 14 : 16,
    color: '#555555',
    marginBottom: 12,
  },
  cardText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#555555',
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: '#013F50',
  },
  section: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  allergySection: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#02808F',
  },
  diseaseSection: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FBC02D',
  },
  sectionTitle: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '700',
    color: '#013F50',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#333333',
    marginBottom: 8,
  },
});

export default FoodWarning;