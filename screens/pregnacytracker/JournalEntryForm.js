import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { Ionicons } from '@expo/vector-icons';
import SymptomsAndMood from './SymptomsAndMood';
import {
  getJournalById,
  createJournalEntry,
  editJournalEntry,
  getJournalByGrowthDataId,
} from '../../api/journal-api';
import { getCurrentWeekGrowthData } from '../../api/growthdata-api';

const JournalEntryForm = ({ onError }) => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [formData, setFormData] = useState({
    Id: '',
    CurrentWeek: '',
    Note: '',
    CurrentWeight: '',
    MoodNotes: '',
    SymptomNames: [],
    SymptomIds: [],
    RelatedImages: [],
    UltraSoundImages: [],
    SystolicBP: '',
    DiastolicBP: '',
    HeartRateBPM: '',
    BloodSugarLevelMgDl: '',
  });
  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState({
    RelatedImages: [],
    UltraSoundImages: [],
  });
  const [modalImage, setModalImage] = useState(null);
  const [modalImageType, setModalImageType] = useState(null);
  const [modalImageIndex, setModalImageIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const token = AsyncStorage.getItem('authToken');
  const growthDataId = route.params?.growthDataId;
  const entryId = route.params?.entryId;
  const ultrasoundClinicWeeks = [12, 20, 28, 36];
  const bloodTestClinicWeeks = [4, 12, 24, 28];

  useEffect(() => {
    const fetchData = async () => {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (entryId && storedToken) {
        fetchJournalEntry(storedToken);
      }
      fetchAvailableWeeks(storedToken);
    };
    fetchData();
  }, [entryId, growthDataId]);

  const fetchJournalEntry = async (token) => {
    setIsLoading(true);
    try {
      const response = await getJournalById(entryId, token);
      if (response.data?.error === 0 && response.data?.data) {
        const entry = response.data.data;
        setFormData({
          Id: entry.id || '',
          CurrentWeek: entry.currentWeek || '',
          Note: entry.note || '',
          CurrentWeight: entry.currentWeight?.toString() || '',
          MoodNotes: entry.moodNotes || entry.mood || '',
          SymptomIds: entry.symptoms?.map((s) => s.id) || entry.symptomIds || [],
          SymptomNames: entry.symptoms?.map((s) => s.name) || entry.symptomNames || [],
          RelatedImages: entry.relatedImages || [],
          UltraSoundImages: entry.ultraSoundImages || [],
          SystolicBP: entry.systolicBP?.toString() || '',
          DiastolicBP: entry.diastolicBP?.toString() || '',
          HeartRateBPM: entry.heartRateBPM?.toString() || '',
          BloodSugarLevelMgDl: entry.bloodSugarLevelMgDl?.toString() || '',
        });
        setImagePreviews({
          RelatedImages: entry.relatedImages?.map((img) => (typeof img === 'string' ? img : img.uri)) || [],
          UltraSoundImages: entry.ultraSoundImages?.map((img) => (typeof img === 'string' ? img : img.uri)) || [],
        });
      } else {
        const msg = response.data?.message || 'Failed to fetch journal entry';
        setErrors({ submit: msg });
        onError?.(msg);
      }
    } catch (error) {
      console.error('Failed to fetch journal entry:', error);
      const msg = error.response?.data?.message || 'Failed to fetch journal entry';
      setErrors({ submit: msg });
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableWeeks = async (token) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const currentDate = new Date().toISOString().split('T')[0];
      const response = await getCurrentWeekGrowthData(userId, currentDate, token);
      const journalRes = await getJournalByGrowthDataId(growthDataId, token);

      const currentWeek = response?.data?.data?.currentGestationalAgeInWeeks || 1;
      setCurrentWeek(currentWeek);
      const documentedWeeks = journalRes?.data?.data?.map((entry) => entry.currentWeek) || [];
      const weeks = [];
      for (let i = 1; i <= currentWeek; i++) {
        if (!documentedWeeks.includes(i)) {
          weeks.push(i);
        }
      }
      setAvailableWeeks(weeks);
      if (!entryId) {
        setFormData((prev) => ({ ...prev, CurrentWeek: weeks.at(-1)?.toString() || '' }));
      }
    } catch (err) {
      console.error('Failed to fetch week availability:', err);
    }
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImagePick = async (type) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.7,
      });
      if (!result.didCancel && result.assets) {
        const newImages = result.assets
          .filter((asset) => asset.fileSize <= 5 * 1024 * 1024)
          .slice(0, 2 - formData[type].length)
          .map((asset) => ({ uri: asset.uri, type: asset.type, name: asset.fileName }));
        setFormData((prev) => ({
          ...prev,
          [type]: [...prev[type], ...newImages].slice(0, 2),
        }));
        setImagePreviews((prev) => ({
          ...prev,
          [type]: [...prev[type], ...newImages.map((img) => img.uri)].slice(0, 2),
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveImage = (type, index) => {
    setFormData((prev) => {
      const updated = [...prev[type]];
      updated.splice(index, 1);
      return { ...prev, [type]: updated };
    });
    setImagePreviews((prev) => {
      const updated = [...prev[type]];
      updated.splice(index, 1);
      return { ...prev, [type]: updated };
    });
    if (modalImageType === type && modalImageIndex === index) {
      closeModal();
    }
  };

  const replaceImage = async (type, index) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.7,
      });
      if (!result.didCancel && result.assets) {
        const newImage = result.assets[0];
        if (newImage.fileSize <= 5 * 1024 * 1024) {
          setFormData((prev) => {
            const updated = [...prev[type]];
            updated[index] = { uri: newImage.uri, type: newImage.type, name: newImage.fileName };
            return { ...prev, [type]: updated };
          });
          setImagePreviews((prev) => {
            const updated = [...prev[type]];
            updated[index] = newImage.uri;
            return { ...prev, [type]: updated };
          });
          setModalImage(newImage.uri);
        } else {
          Alert.alert('Error', 'Image size must be less than 5MB.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to replace image. Please try again.');
    }
  };

  const openImageModal = (imageSrc, type, index) => {
    setModalImage(imageSrc);
    setModalImageType(type);
    setModalImageIndex(index);
  };

  const closeModal = () => {
    setModalImage(null);
    setModalImageType(null);
    setModalImageIndex(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.CurrentWeek || isNaN(Number(formData.CurrentWeek)) || Number(formData.CurrentWeek) < 1 || Number(formData.CurrentWeek) > 40) {
      newErrors.CurrentWeek = 'Current week must be a number between 1 and 40';
    }
    if (!formData.Note) {
      newErrors.Note = 'Note is required';
    }
    if (formData.CurrentWeight && (isNaN(Number(formData.CurrentWeight)) || Number(formData.CurrentWeight) < 30 || Number(formData.CurrentWeight) > 200)) {
      newErrors.CurrentWeight = 'Current weight must be a number between 30 and 200 kg';
    }
    if ((formData.SystolicBP && !formData.DiastolicBP) || (!formData.SystolicBP && formData.DiastolicBP)) {
      newErrors.BloodPressure = 'Both Systolic and Diastolic BP must be entered together.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    const userId = await AsyncStorage.getItem('userId');
    const token = await AsyncStorage.getItem('authToken');
    if (!growthDataId) {
      setErrors({ submit: 'GrowthDataId is missing' });
      onError?.('GrowthDataId is missing');
      setIsLoading(false);
      return;
    }
    if (!userId) {
      setErrors({ submit: 'UserId is missing. Please log in.' });
      onError?.('UserId is missing. Please log in.');
      setIsLoading(false);
      return;
    }

    const journalData = {
      ...formData,
      UserId: userId,
      GrowthDataId: growthDataId,
    };

    try {
      const response = entryId
        ? await editJournalEntry(journalData, token)
        : await createJournalEntry(journalData, token);
      if (!response.data || response.data.error > 0) {
        throw new Error(response.data?.message || 'Failed to submit journal entry');
      }
      navigation.navigate('PregnancyTracking', { growthDataId, journalinfo: 'true' });
    } catch (error) {
      console.error('Error submitting journal entry:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit journal entry';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const ImagePreviewSection = ({ type, label }) => (
    <View style={styles(width).section}>
      <Text style={styles(width).label}>{label} (Optional)</Text>
      <TouchableOpacity
        style={styles(width).fileUpload}
        onPress={() => handleImagePick(type)}
        accessibilityLabel={`Upload ${label}`}
      >
        <Ionicons name="image-outline" size={20} color="#fff" />
        <Text style={styles(width).fileUploadText}>Upload {label}</Text>
      </TouchableOpacity>
      {imagePreviews[type].length > 0 && (
        <View style={styles(width).imagePreviewContainer}>
          {imagePreviews[type].map((preview, index) => (
            <View key={index} style={styles(width).previewWrapper}>
              <TouchableOpacity onPress={() => openImageModal(preview, type, index)}>
                <Image source={{ uri: preview }} style={styles(width).previewImage} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(width).removeImageBtn}
                onPress={() => handleRemoveImage(type, index)}
                accessibilityLabel={`Remove ${label} ${index + 1}`}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <Text style={styles(width).imageCount}>{formData[type].length} / 2 images selected</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles(width).container}>
      <View style={styles(width).header}>
        <Text style={styles(width).headerTitle}>
          {entryId ? 'Edit Journal Entry' : 'Add Journal Entry'}
        </Text>
        <TouchableOpacity
          style={styles(width).headerCancelBtn}
          onPress={() => navigation.navigate('PregnancyTracking', { growthDataId, journalinfo: 'true' })}
          accessibilityLabel="Back to pregnancy tracking"
        >
          <Text style={styles(width).headerCancelText}>Back</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={styles(width).loadingContainer}>
          <ActivityIndicator size="large" color="#04668D" />
          <Text style={styles(width).loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles(width).content}>
          <View style={styles(width).section}>
            <Text style={styles(width).label}>
              Select Week to Document <Text style={styles(width).required}>* (Required)</Text>
            </Text>
            <View style={[styles(width).pickerContainer, errors.CurrentWeek ? styles(width).errorInput : {}]}>
              <Picker
                selectedValue={formData.CurrentWeek}
                onValueChange={(value) => handleChange('CurrentWeek', value)}
                style={styles(width).picker}
              >
                <Picker.Item label="-- Select Journalised Gestation Week --" value="" />
                {availableWeeks.map((week) => (
                  <Picker.Item
                    key={week}
                    label={`Week ${week}${currentWeek === week ? ' (Current Week)' : ''}`}
                    value={week.toString()}
                  />
                ))}
              </Picker>
            </View>
            {errors.CurrentWeek && <Text style={styles(width).errorText}>{errors.CurrentWeek}</Text>}
          </View>

          <View style={styles(width).section}>
            <Text style={styles(width).label}>
              Note <Text style={styles(width).required}>* (Required)</Text>
            </Text>
            <TextInput
              style={[styles(width).textarea, errors.Note ? styles(width).errorInput : {}]}
              value={formData.Note}
              onChangeText={(text) => handleChange('Note', text)}
              placeholder="Write your thoughts, feelings, or any updates for this week"
              multiline
              numberOfLines={5}
              accessibilityLabel="Journal note"
            />
            {errors.Note && <Text style={styles(width).errorText}>{errors.Note}</Text>}
          </View>

          <View style={styles(width).section}>
            <Text style={styles(width).label}>
              Current Weight (Kg) <Text style={styles(width).required}>* (Required)</Text>
            </Text>
            <TextInput
              style={[styles(width).input, errors.CurrentWeight ? styles(width).errorInput : {}]}
              value={formData.CurrentWeight}
              onChangeText={(text) => handleChange('CurrentWeight', text)}
              placeholder="Enter the weight that you last weighed yourself!"
              keyboardType="decimal-pad"
              accessibilityLabel="Current weight"
            />
            {errors.CurrentWeight && <Text style={styles(width).errorText}>{errors.CurrentWeight}</Text>}
          </View>

          <View style={styles(width).group}>
            <Text style={styles(width).groupTitle}>Blood Pressure Tracking</Text>
            <View style={styles(width).section}>
              <Text style={styles(width).label}>
                Systolic (mmHg) <Text style={styles(width).tooltip}>ⓘ</Text>
              </Text>
              <TextInput
                style={[styles(width).input, errors.BloodPressure ? styles(width).errorInput : {}]}
                value={formData.SystolicBP}
                onChangeText={(text) => handleChange('SystolicBP', text)}
                placeholder="Optional - Enter if you want to track blood pressure"
                keyboardType="numeric"
                accessibilityLabel="Systolic blood pressure"
                accessibilityHint="Normal range is 90-140 mmHg"
              />
            </View>
            <View style={styles(width).section}>
              <Text style={styles(width).label}>
                Diastolic (mmHg) <Text style={styles(width).tooltip}>ⓘ</Text>
              </Text>
              <TextInput
                style={[styles(width).input, errors.BloodPressure ? styles(width).errorInput : {}]}
                value={formData.DiastolicBP}
                onChangeText={(text) => handleChange('DiastolicBP', text)}
                placeholder="Optional - Enter if you want to track blood pressure"
                keyboardType="numeric"
                accessibilityLabel="Diastolic blood pressure"
                accessibilityHint="Normal range is 60-90 mmHg"
              />
              {errors.BloodPressure && <Text style={styles(width).errorText}>{errors.BloodPressure}</Text>}
            </View>
            <View style={styles(width).infoNote}>
              <Text style={styles(width).infoNoteText}>
                Blood pressure tracking is optional, but it's recommended to monitor it during pregnancy. Please ensure both systolic and diastolic values are entered together for accurate tracking.
              </Text>
            </View>
          </View>

          <View style={styles(width).section}>
            <Text style={styles(width).label}>
              Heart Rate (BPM) <Text style={styles(width).tooltip}>ⓘ</Text>
            </Text>
            <TextInput
              style={styles(width).input}
              value={formData.HeartRateBPM}
              onChangeText={(text) => handleChange('HeartRateBPM', text)}
              placeholder="Optional - Can enter if you want to track heart rate"
              keyboardType="numeric"
              accessibilityLabel="Heart rate"
              accessibilityHint="Normal range is 60-100 BPM"
            />
          </View>

          {bloodTestClinicWeeks.includes(Number(formData.CurrentWeek)) && (
            <View style={styles(width).section}>
              <Text style={styles(width).label}>
                Blood Sugar Level (mg/dL) <Text style={styles(width).tooltip}>ⓘ</Text>
              </Text>
              <TextInput
                style={styles(width).input}
                value={formData.BloodSugarLevelMgDl}
                onChangeText={(text) => handleChange('BloodSugarLevelMgDl', text)}
                placeholder="Optional - Enter if you've checked recently"
                keyboardType="numeric"
                accessibilityLabel="Blood sugar level"
                accessibilityHint="Normal range is 70-130 mg/dL before meals"
              />
            </View>
          )}
          {!bloodTestClinicWeeks.includes(Number(formData.CurrentWeek)) && (
            <View style={styles(width).infoNote}>
              <Text style={styles(width).infoNoteText}>
                Blood sugar tracking is only available on clinic weeks (4, 12, 24, 28). It's highly recommended to monitor it to prevent pregnancy diabetes.
              </Text>
            </View>
          )}

          <SymptomsAndMood
            selectedMood={formData.MoodNotes}
            onMoodChange={(mood) => handleChange('MoodNotes', mood)}
            selectedSymptoms={formData.SymptomIds}
            onSymptomsChange={(ids, names) =>
              setFormData((prev) => ({
                ...prev,
                SymptomIds: ids ?? prev.SymptomIds,
                SymptomNames: names ?? prev.SymptomNames,
              }))
            }
            userId={AsyncStorage.getItem('userId')}
            token={token}
          />

          <ImagePreviewSection type="RelatedImages" label="Related Images" />
          {ultrasoundClinicWeeks.includes(Number(formData.CurrentWeek)) && (
            <ImagePreviewSection type="UltraSoundImages" label="Ultrasound Images" />
          )}
          {!ultrasoundClinicWeeks.includes(Number(formData.CurrentWeek)) && (
            <View style={styles(width).infoNote}>
              <Text style={styles(width).infoNoteText}>
                Ultrasound tracking is only available on clinic weeks (12, 20, 28, 36).
              </Text>
            </View>
          )}

          <View style={styles(width).actions}>
            <TouchableOpacity
              style={[styles(width).submitBtn, !token ? styles(width).disabledBtn : {}]}
              onPress={handleSubmit}
              disabled={!token || isLoading}
              accessibilityLabel={entryId ? 'Update journal entry' : 'Add new journal entry'}
            >
              <Text style={styles(width).submitBtnText}>
                {entryId ? 'Update' : 'Add New Entry'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles(width).cancelBtn}
              onPress={() => navigation.navigate('PregnancyTracking', { growthDataId, journalinfo: 'true' })}
              accessibilityLabel="Cancel and go back"
            >
              <Text style={styles(width).cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          {errors.submit && <Text style={styles(width).errorText}>{errors.submit}</Text>}
        </ScrollView>
      )}

      <Modal
        visible={!!modalImage}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles(width).modalOverlay}>
          <View style={styles(width).modalContent}>
            <View style={styles(width).modalHeader}>
              <Text style={styles(width).modalHeaderText}>
                {modalImageType === 'RelatedImages' ? 'Related Image' : 'Ultrasound Image'} ({modalImageIndex + 1})
              </Text>
              <TouchableOpacity style={styles(width).modalCloseBtn} onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles(width).modalBody}>
              <Image source={{ uri: modalImage }} style={styles(width).modalImage} />
            </View>
            <View style={styles(width).modalActions}>
              <TouchableOpacity
                style={styles(width).modalReplaceBtn}
                onPress={() => replaceImage(modalImageType, modalImageIndex)}
                accessibilityLabel="Replace image"
              >
                <Text style={styles(width).modalBtnText}>Replace Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(width).modalRemoveBtn}
                onPress={() => {
                  handleRemoveImage(modalImageType, modalImageIndex);
                  closeModal();
                }}
                accessibilityLabel="Remove image"
              >
                <Text style={styles(width).modalBtnText}>Remove Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = (width) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: width < 768 ? 16 : 24,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: width < 768 ? 20 : 24,
    fontWeight: '700',
    color: '#04668D',
  },
  headerCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#04668D',
    borderRadius: 8,
  },
  headerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(6, 125, 173, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  group: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(6, 125, 173, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#04668D',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 125, 173, 0.2)',
    paddingBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#04668D',
    marginBottom: 8,
  },
  required: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  tooltip: {
    fontSize: 16,
    color: '#FE6B6A',
    marginLeft: 6,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    backgroundColor: '#f9fdff',
    fontSize: 16,
  },
  textarea: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    backgroundColor: '#f9fdff',
    fontSize: 16,
    minHeight: 150,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    backgroundColor: '#f9fdff',
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  errorInput: {
    borderColor: '#E74C3C',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 4,
  },
  fileUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#04668D',
    borderRadius: 8,
    marginVertical: 8,
  },
  fileUploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    marginTop: 12,
    padding: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  previewWrapper: {
    position: 'relative',
    margin: 8,
  },
  previewImage: {
    width: width < 768 ? 80 : 100,
    height: width < 768 ? 80 : 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#04668D',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  infoNote: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 4,
    borderLeftColor: '#04668D',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  infoNoteText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  submitBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#04668D',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#04668D',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalHeaderText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  modalCloseBtn: {
    padding: 8,
    borderRadius: 20,
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
    maxHeight: '60%',
  },
  modalImage: {
    width: '100%',
    maxHeight: width < 768 ? 300 : 400,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'column',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  modalReplaceBtn: {
    padding: 12,
    backgroundColor: '#04668D',
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalRemoveBtn: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#04668D',
    borderRadius: 6,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#04668D',
    marginTop: 8,
  },
});

export default JournalEntryForm;