import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  useWindowDimensions,
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

  // Fetch token and dropdown options
  useEffect(() => {
    const fetchTokenAndOptions = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        setToken(storedToken);
        if (!storedToken) {
          setError('No authentication token found. Please log in.');
          return;
        }

        const [allergyRes, diseaseRes] = await Promise.all([
          getAllAllergies(storedToken),
          getAllDiseases(storedToken),
        ]);

        setAllergyOptions(allergyRes.data || []);
        setDiseaseOptions(diseaseRes.data || []);
      } catch (err) {
        console.error('Error fetching options:', err);
        setError('Failed to load allergy/disease options.');
      }
    };
    fetchTokenAndOptions();
  }, []);

  // Handle submit
  const handleSubmit = async () => {
    if (!token) {
      setError('Authentication token not found. Please log in.');
      return;
    }

    const payload = {
      allergyIds: selectedAllergies.map((a) => a.id),
      diseaseIds: selectedDiseases.map((d) => d.id),
    };

    if (payload.allergyIds.length === 0 && payload.diseaseIds.length === 0) {
      setError('Please select at least one allergy or disease.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await viewWarningFoods(payload);
      setFoods(response?.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch food warnings:', err);
      setError('Unable to fetch food warnings.');
    } finally {
      setLoading(false);
    }
  };

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
    >
      <Text style={styles(width).autocompleteText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderDiseaseItem = ({ item }) => (
    <TouchableOpacity
      style={styles(width).autocompleteItem}
      onPress={() => handleSelectDisease(item)}
    >
      <Text style={styles(width).autocompleteText}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Render selected tags
  const renderTag = ({ item, type }) => (
    <View style={styles(width).tag}>
      <Text style={styles(width).tagText}>{item.name}</Text>
      <TouchableOpacity onPress={() => (type === 'allergy' ? handleRemoveAllergy(item.id) : handleRemoveDisease(item.id))}>
        <Text style={styles(width).tagRemove}>✕</Text>
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
          {item.safetyNote}
        </Text>
        {item.foodAllergy?.length > 0 && (
          <View style={[styles(width).section, styles(width).allergySection]}>
            <Text style={styles(width).sectionTitle}>Allergy Risks</Text>
            {item.foodAllergy.map((a) => (
              <Text key={a.id} style={styles(width).sectionText}>
                <Text style={styles(width).bold}>{a.allergyName} Allergy: </Text>
                {a.description}
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
                {d.description}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  // Render the main content
  const renderContent = () => (
    <>
      <View style={styles(width).header}>
        <Text style={styles(width).headerTitle}>
          Food Warnings
          <Text style={styles(width).headerSubtitle}>{'\n'}Find foods unsafe for your conditions</Text>
        </Text>
      </View>

      <View style={styles(width).form}>
        {/* Allergies */}
        <Text style={styles(width).label}>Allergies</Text>
        <View style={styles(width).autocompleteWrapper} ref={allergyInputRef}>
          <TextInput
            style={styles(width).input}
            value={allergyInput}
            onChangeText={(text) => {
              setAllergyInput(text);
              setShowAllergyList(true);
            }}
            placeholder="Optional - Type allergy name e.g. Peanuts"
            onFocus={() => setShowAllergyList(true)}
            onBlur={() => setTimeout(() => setShowAllergyList(false), 200)}
          />
          {showAllergyList && allergyInput && (
            <ScrollView
              style={[styles(width).autocompleteList, { zIndex: 1000 }]}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {allergyOptions
                .filter((a) => a.name && a.name.toLowerCase().includes(allergyInput.toLowerCase()))
                .map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles(width).autocompleteItem}
                    onPress={() => handleSelectAllergy(item)}
                  >
                    <Text style={styles(width).autocompleteText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}
        </View>
        <FlatList
          data={selectedAllergies}
          renderItem={({ item }) => renderTag({ item, type: 'allergy' })}
          keyExtractor={(item) => item.id}
          horizontal
          style={styles(width).tags}
          showsHorizontalScrollIndicator={false}
        />

        {/* Diseases */}
        <Text style={styles(width).label}>Diseases</Text>
        <View style={styles(width).autocompleteWrapper} ref={diseaseInputRef}>
          <TextInput
            style={styles(width).input}
            value={diseaseInput}
            onChangeText={(text) => {
              setDiseaseInput(text);
              setShowDiseaseList(true);
            }}
            placeholder="Optional - Type disease name e.g. Diabetes"
            onFocus={() => setShowDiseaseList(true)}
            onBlur={() => setTimeout(() => setShowDiseaseList(false), 200)}
          />
          {showDiseaseList && diseaseInput && (
            <ScrollView
              style={[styles(width).autocompleteList, { zIndex: 1000 }]}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {diseaseOptions
                .filter((d) => d.name && d.name.toLowerCase().includes(diseaseInput.toLowerCase()))
                .map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles(width).autocompleteItem}
                    onPress={() => handleSelectDisease(item)}
                  >
                    <Text style={styles(width).autocompleteText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}
        </View>
        <FlatList
          data={selectedDiseases}
          renderItem={({ item }) => renderTag({ item, type: 'disease' })}
          keyExtractor={(item) => item.id}
          horizontal
          style={styles(width).tags}
          showsHorizontalScrollIndicator={false}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles(width).button, loading && styles(width).buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles(width).buttonText}>
            {loading ? 'Loading...' : 'View Food Warnings'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles(width).error}>{error}</Text>}

      {!loading && foods.length === 0 && !error && (
        <Text style={styles(width).noResults}>No foods found for your selected conditions.</Text>
      )}
    </>
  );

  // Data for the main FlatList
  const data = [
    { id: 'header', type: 'header' }, // Header and form
    ...(loading ? [{ id: 'loading', type: 'loading' }] : []),
    ...foods.map((food, index) => ({ ...food, id: `${food.id}-${index}`, type: 'food' })),
  ];

  // Render item for the main FlatList
  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return renderContent();
    }
    if (item.type === 'loading') {
      return <Text style={styles(width).noResults}>Loading...</Text>;
    }
    return renderFoodCard({ item });
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={width < 768 ? 1 : 2}
      columnWrapperStyle={width >= 768 ? styles(width).gridRow : null}
      contentContainerStyle={styles(width).container}
      showsVerticalScrollIndicator={false}
    />
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
    marginVertical: width < 768 ? 16 : 20,
  },
  headerTitle: {
    fontSize: width < 768 ? 24 : 28,
    fontWeight: '800',
    color: '#013F50',
    textAlign: 'center',
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
  form: {
    maxWidth: 800,
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
  },
  autocompleteWrapper: {
    position: 'relative',
  },
  autocompleteList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  autocompleteItem: {
    padding: width < 768 ? 8 : 10,
  },
  autocompleteText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#333',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  tag: {
    backgroundColor: '#E6F7F9',
    borderWidth: 1,
    borderColor: '#02808F',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#02808F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  tagText: {
    fontSize: width < 768 ? 12 : 14,
    color: '#02808F',
    fontWeight: '600',
  },
  tagRemove: {
    fontSize: width < 768 ? 14 : 16,
    color: '#02808F',
    marginLeft: 6,
  },
  button: {
    backgroundColor: '#02808F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
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
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  error: {
    color: '#E74C3C',
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 14,
  },
  noResults: {
    fontSize: width < 768 ? 14 : 16,
    color: '#555555',
    textAlign: 'center',
    marginVertical: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: width < 768 ? 0 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
    flex: width < 768 ? 1 : 0.48,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardInfo: {
    padding: width < 768 ? 12 : 16,
  },
  cardTitle: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '700',
    color: '#04668D',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: width < 768 ? 14 : 16,
    color: '#555555',
    marginBottom: 8,
  },
  cardText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#555555',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: '#013F50',
  },
  section: {
    marginTop: 8,
    padding: 8,
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
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '700',
    color: '#013F50',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: width < 768 ? 12 : 14,
    color: '#333333',
    marginBottom: 4,
  },
});

export default FoodWarning;