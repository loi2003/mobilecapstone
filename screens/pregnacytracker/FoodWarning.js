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
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
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
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showDiseaseModal, setShowDiseaseModal] = useState(false);
  const allergyInputRef = useRef(null);
  const diseaseInputRef = useRef(null);
  const isSubmitting = useRef(false);
  const submitTimeout = useRef(null);

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

  // Handle submit with debouncing
  const handleSubmit = useCallback(async () => {
    if (isSubmitting.current || loading) return;

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

    if (submitTimeout.current) clearTimeout(submitTimeout.current);

    try {
      await new Promise((resolve) => {
        submitTimeout.current = setTimeout(resolve, 500);
      });

      const response = await viewWarningFoods(payload, token);
      const foodData = Array.isArray(response)
        ? response
        : Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      if (foodData.length > 0) setFoods(foodData);
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
    setShowAllergyModal(false);
  };

  const handleSelectDisease = (disease) => {
    if (!selectedDiseases.some((s) => s.id === disease.id)) {
      setSelectedDiseases([...selectedDiseases, disease]);
    }
    setDiseaseInput('');
    setShowDiseaseModal(false);
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
      style={styles(width).modalItem}
      onPress={() => handleSelectAllergy(item)}
      activeOpacity={0.7}
    >
      <Text style={styles(width).modalItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderDiseaseItem = ({ item }) => (
    <TouchableOpacity
      style={styles(width).modalItem}
      onPress={() => handleSelectDisease(item)}
      activeOpacity={0.7}
    >
      <Text style={styles(width).modalItemText}>{item.name}</Text>
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
        <Ionicons name="close" size={width < 768 ? 18 : 20} color="#02808F" />
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FBFC' }}>
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
                  <TouchableOpacity
                    style={styles(width).input}
                    onPress={() => setShowAllergyModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={allergyInput ? styles(width).inputText : styles(width).placeholderText}>
                      {allergyInput || 'Tap to select allergies (e.g., Peanuts)'}
                    </Text>
                  </TouchableOpacity>
                  <FlatList
                    data={selectedAllergies}
                    renderItem={({ item }) => renderTag({ item, type: 'allergy' })}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal
                    style={styles(width).tags}
                    showsHorizontalScrollIndicator={false}
                    ListEmptyComponent={<View />}
                  />

                  {/* Diseases */}
                  <Text style={styles(width).label}>Diseases</Text>
                  <TouchableOpacity
                    style={styles(width).input}
                    onPress={() => setShowDiseaseModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={diseaseInput ? styles(width).inputText : styles(width).placeholderText}>
                      {diseaseInput || 'Tap to select diseases (e.g., Diabetes)'}
                    </Text>
                  </TouchableOpacity>
                  <FlatList
                    data={selectedDiseases}
                    renderItem={({ item }) => renderTag({ item, type: 'disease' })}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal
                    style={styles(width).tags}
                    showsHorizontalScrollIndicator={false}
                    ListEmptyComponent={<View />}
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
          numColumns={1}
          contentContainerStyle={styles(width).container}
          showsVerticalScrollIndicator={false}
        />

        {/* Allergy Modal */}
        <Modal
          visible={showAllergyModal}
          animationType="slide"
          onRequestClose={() => setShowAllergyModal(false)}
        >
          <SafeAreaView style={styles(width).modalContainer}>
            <View style={styles(width).modalHeader}>
              <Text style={styles(width).modalTitle}>Select Allergies</Text>
              <TouchableOpacity onPress={() => setShowAllergyModal(false)}>
                <Ionicons name="close" size={24} color="#02808F" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles(width).modalInput}
              value={allergyInput}
              onChangeText={setAllergyInput}
              placeholder="Search allergies"
              placeholderTextColor="#888"
              autoFocus
            />
            <FlatList
              data={allergyOptions.filter((a) =>
                a.name?.toLowerCase().includes(allergyInput.trim().toLowerCase())
              )}
              renderItem={renderAllergyItem}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text style={styles(width).modalItemText}>No allergies found</Text>
              }
              contentContainerStyle={styles(width).modalList}
            />
          </SafeAreaView>
        </Modal>

        {/* Disease Modal */}
        <Modal
          visible={showDiseaseModal}
          animationType="slide"
          onRequestClose={() => setShowDiseaseModal(false)}
        >
          <SafeAreaView style={styles(width).modalContainer}>
            <View style={styles(width).modalHeader}>
              <Text style={styles(width).modalTitle}>Select Diseases</Text>
              <TouchableOpacity onPress={() => setShowDiseaseModal(false)}>
                <Ionicons name="close" size={24} color="#02808F" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles(width).modalInput}
              value={diseaseInput}
              onChangeText={setDiseaseInput}
              placeholder="Search diseases"
              placeholderTextColor="#888"
              autoFocus
            />
            <FlatList
              data={diseaseOptions.filter((d) =>
                d.name?.toLowerCase().includes(diseaseInput.trim().toLowerCase())
              )}
              renderItem={renderDiseaseItem}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text style={styles(width).modalItemText}>No diseases found</Text>
              }
              contentContainerStyle={styles(width).modalList}
            />
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = (width) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F7FBFC',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginVertical: 12,
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#04668D',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#F9FDFF',
    fontSize: 16,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
  },
  tags: {
    marginVertical: 12,
  },
  tag: {
    backgroundColor: '#E6F7F9',
    borderWidth: 1,
    borderColor: '#02808F',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#02808F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  tagText: {
    fontSize: 14,
    color: '#02808F',
    fontWeight: '600',
    marginRight: 8,
  },
  button: {
    backgroundColor: '#02808F',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardInfo: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#04668D',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#013F50',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F7FBFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#013F50',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 10,
    padding: 12,
    margin: 16,
    backgroundColor: '#F9FDFF',
    fontSize: 16,
  },
  modalList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 8,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default FoodWarning;