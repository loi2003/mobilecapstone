import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSymptomsForUser, addNewCustomSymptom } from '../../api/recorded-symptom-api';

const SymptomsAndMood = ({ selectedMood, onMoodChange, selectedSymptoms = [], onSymptomsChange, userId, token }) => {
  const { width } = useWindowDimensions();
  const [symptoms, setSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const moods = [
    {
      id: 'sad',
      emoji: (
        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z"
            fill="#007AFF"
          />
          <Path
            d="M17 9.5C17 10.3284 16.3284 11 15.5 11C14.6716 11 14 10.3284 14 9.5C14 8.67157 14.6716 8 15.5 8C16.3284 8 17 8.67157 17 9.5Z"
            fill="#007AFF"
          />
          <Path
            d="M15.1091 16.4588C15.3597 16.9443 15.9548 17.1395 16.4449 16.8944C16.9388 16.6474 17.1391 16.0468 16.8921 15.5528C16.8096 15.3884 16.7046 15.2343 16.5945 15.0875C16.4117 14.8438 16.1358 14.5299 15.7473 14.2191C14.9578 13.5875 13.7406 13 11.9977 13C10.2547 13 9.03749 13.5875 8.24796 14.2191C7.85954 14.5299 7.58359 14.8438 7.40078 15.0875C7.29028 15.2348 7.1898 15.3889 7.10376 15.5517C6.85913 16.0392 7.06265 16.6505 7.55044 16.8944C8.04053 17.1395 8.63565 16.9443 8.88619 16.4588C8.9 16.4339 9.08816 16.1082 9.49735 15.7809C9.95782 15.4125 10.7406 15 11.9977 15C13.2547 15 14.0375 15.4125 14.498 15.7809C14.9072 16.1082 15.0953 16.4339 15.1091 16.4588Z"
            fill="#007AFF"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 20.9932C7.03321 20.9932 3.00683 16.9668 3.00683 12C3.00683 7.03321 7.03321 3.00683 12 3.00683C16.9668 3.00683 20.9932 7.03321 20.9932 12C20.9932 16.9668 16.9668 20.9932 12 20.9932Z"
            fill="#007AFF"
          />
        </Svg>
      ),
      label: 'Sad',
    },
    {
      id: 'terrible',
      emoji: (
        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8 14C7.44771 14 7 14.4477 7 15C7 15.5523 7.44771 16 8 16H15.9991C16.5514 16 17 15.5523 17 15C17 14.4477 16.5523 14 16 14H8Z"
            fill="#007AFF"
          />
          <Path
            d="M10.7041 7.2924C10.3141 6.90253 9.68178 6.90253 9.29176 7.2924L8.49735 8.0865L7.70797 7.29743C7.31795 6.90756 6.68561 6.90756 6.29559 7.29743C5.90557 7.6873 5.90556 8.3194 6.29558 8.70926L7.08496 9.49833L6.29251 10.2905C5.9025 10.6803 5.90249 11.3124 6.29251 11.7023C6.68254 12.0922 7.31488 12.0922 7.7049 11.7023L8.49735 10.9102L9.2951 11.7076C9.68512 12.0975 10.3175 12.0975 10.7075 11.7076C11.0975 11.3177 11.0975 10.6856 10.7075 10.2958L9.90974 9.49833L10.7041 8.70424C11.0942 8.31437 11.0942 7.68227 10.7041 7.2924Z"
            fill="#007AFF"
          />
          <Path
            d="M16.2918 7.2924C16.6818 6.90253 17.3141 6.90253 17.7041 7.2924C18.0942 7.68227 18.0942 8.31437 17.7041 8.70424L16.9097 9.49833L17.7075 10.2958C18.0975 10.6856 18.0975 11.3177 17.7075 11.7076C17.3175 12.0975 16.6851 12.0975 16.2951 11.7076L15.4974 10.9102L14.7049 11.7023C14.3149 12.0922 13.6825 12.0922 13.2925 11.7023C12.9025 11.3124 12.9025 10.6803 13.2925 10.2905L14.085 9.49833L13.2956 8.70926C12.9056 8.3194 12.9056 7.6873 13.2956 7.29743C13.6856 6.90756 14.318 6.90756 14.708 7.29743L15.4974 8.0865L16.2918 7.2924Z"
            fill="#007AFF"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 20.9932C7.03321 20.9932 3.00683 16.9668 3.00683 12C3.00683 7.03321 7.03321 3.00683 12 3.00683C16.9668 3.00683 20.9932 7.03321 20.9932 12C20.9932 16.9668 16.9668 20.9932 12 20.9932Z"
            fill="#007AFF"
          />
        </Svg>
      ),
      label: 'Terrible',
    },
    {
      id: 'neutral',
      emoji: (
        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10 9.5C10 10.3284 9.32843 11 8.5 11C7.67157 11 7 10.3284 7 9.5C7 8.67157 7.67157 8 8.5 8C9.32843 8 10 8.67157 10 9.5Z"
            fill="#007AFF"
          />
          <Path
            d="M15.5 11C16.3284 11 17 10.3284 17 9.5C17 8.67157 16.3284 8 15.5 8C14.6716 8 14 8.67157 14 9.5C14 10.3284 14.6716 11 15.5 11Z"
            fill="#007AFF"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM3.00683 12C3.00683 16.9668 7.03321 20.9932 12 20.9932C16.9668 20.9932 20.9932 7.03321 12 3.00683C7.03321 3.00683 3.00683 7.03321 3.00683 12Z"
            fill="#007AFF"
          />
        </Svg>
      ),
      label: 'Neutral',
    },
    {
      id: 'normal',
      emoji: (
        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z"
            fill="#007AFF"
          />
          <Path
            d="M17 9.5C17 10.3284 16.3284 11 15.5 11C14.6716 11 14 10.3284 14 9.5C14 8.67157 14.6716 8 15.5 8C16.3284 8 17 8.67157 17 9.5Z"
            fill="#007AFF"
          />
          <Path
            d="M8 14C7.44772 14 7 14.4477 7 15C7 15.5523 7.44772 16 8 16H15.9991C16.5514 16 17 15.5523 17 15C17 14.4477 16.5523 14 16 14H8Z"
            fill="#007AFF"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 20.9932C7.03321 20.9932 3.00683 16.9668 3.00683 12C3.00683 7.03321 7.03321 3.00683 12 3.00683C16.9668 3.00683 20.9932 7.03321 20.9932 12C20.9932 16.9668 16.9668 20.9932 12 20.9932Z"
            fill="#007AFF"
          />
        </Svg>
      ),
      label: 'Normal',
    },
    {
      id: 'happy',
      emoji: (
        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z"
            fill="#007AFF"
          />
          <Path
            d="M17 9.5C17 10.3284 16.3284 11 15.5 11C14.6716 11 14 10.3284 14 9.5C14 8.67157 14.6716 8 15.5 8C16.3284 8 17 8.67157 17 9.5Z"
            fill="#007AFF"
          />
          <Path
            d="M8.88875 13.5414C8.63822 13.0559 8.0431 12.8607 7.55301 13.1058C7.05903 13.3528 6.8588 13.9535 7.10579 14.4474C7.18825 14.6118 7.29326 14.7659 7.40334 14.9127C7.58615 15.1565 7.8621 15.4704 8.25052 15.7811C9.04005 16.4127 10.2573 17.0002 12.0002 17.0002C13.7431 17.0002 14.9604 16.4127 15.7499 15.7811C16.1383 15.4704 16.4143 15.1565 16.5971 14.9127C16.7076 14.7654 16.8081 14.6113 16.8941 14.4485C17.1387 13.961 16.9352 13.3497 16.4474 13.1058C15.9573 12.8607 15.3622 13.0559 15.1117 13.5414C15.0979 13.5663 14.9097 13.892 14.5005 14.2194C14.0401 14.5877 13.2573 15.0002 12.0002 15.0002C10.7431 15.0002 9.96038 14.5877 9.49991 14.2194C9.09071 13.892 8.90255 13.5663 8.88875 13.5414Z"
            fill="#007AFF"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 20.9932C7.03321 20.9932 3.00683 16.9668 3.00683 12C3.00683 7.03321 7.03321 3.00683 12 3.00683C16.9668 3.00683 20.9932 7.03321 20.9932 12C20.9932 16.9668 16.9668 20.9932 12 20.9932Z"
            fill="#007AFF"
          />
        </Svg>
      ),
      label: 'Happy',
    },
    {
      id: 'anxious',
      emoji: (
        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z"
            fill="#007AFF"
          />
          <Path
            d="M17 9.5C17 10.3284 16.3284 11 15.5 11C14.6716 11 14 10.3284 14 9.5C14 8.67157 14.6716 8 15.5 8C16.3284 8 17 8.67157 17 9.5Z"
            fill="#007AFF"
          />
          <Path
            d="M6.55279 15.8944C7.03804 16.1371 7.62626 15.9481 7.88102 15.4731C8.11023 15.1132 8.60518 15 9 15C9.44724 15 9.61844 15.1141 9.94058 15.3289L9.9453 15.3321C10.3701 15.6153 10.9494 16 12 16C13.0506 16 13.6299 15.6153 14.0547 15.3321L14.0594 15.3289C14.3816 15.1141 14.5528 15 15 15C15.3948 15 15.8898 15.1132 16.119 15.4731C16.3737 15.9481 16.962 16.1371 17.4472 15.8944C17.9287 15.6537 18.1343 15.0286 17.8922 14.5484C17.8451 14.4558 17.7934 14.3704 17.6984 14.2437C17.5859 14.0938 17.4194 13.9049 17.1872 13.7191C16.7102 13.3375 15.9929 13 15 13C13.9494 13 13.3701 13.3847 12.9453 13.6679L12.9406 13.6711C12.6184 13.8859 12.4472 14 12 14C11.5528 14 11.3816 13.8859 11.0594 13.6711L11.0547 13.6679C10.6299 13.3847 10.0506 13 9 13C8.00708 13 7.28983 13.3375 6.81281 13.7191C6.58063 13.9049 6.41406 14.0938 6.30156 14.2437C6.20582 14.3714 6.15379 14.4572 6.10665 14.5506C5.86386 15.0337 6.06922 15.6526 6.55279 15.8944Z"
            fill="#007AFF"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 20.9932C7.03321 20.9932 3.00683 16.9668 3.00683 12C3.00683 7.03321 7.03321 3.00683 12 3.00683C16.9668 3.00683 20.9932 7.03321 20.9932 12C20.9932 16.9668 16.9668 20.9932 12 20.9932Z"
            fill="#007AFF"
          />
        </Svg>
      ),
      label: 'Anxious',
    },
    {
      id: 'excited',
      emoji: (
        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z"
            fill="#007AFF"
          />
          <Path
            d="M17 9.5C17 10.3284 16.3284 11 15.5 11C14.6716 11 14 10.3284 14 9.5C14 8.67157 14.6716 8 15.5 8C16.3284 8 17 8.67157 17 9.5Z"
            fill="#007AFF"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.2 13C7.56149 13 6.9436 13.5362 7.01666 14.2938C7.06054 14.7489 7.2324 15.7884 7.95483 16.7336C8.71736 17.7313 9.99938 18.5 12 18.5C14.0006 18.5 15.2826 17.7313 16.0452 16.7336C16.7676 15.7884 16.9395 14.7489 16.9833 14.2938C17.0564 13.5362 16.4385 13 15.8 13H8.2ZM9.54387 15.5191C9.41526 15.3509 9.31663 15.1731 9.2411 15H14.7589C14.6834 15.1731 14.5847 15.3509 14.4561 15.5191C14.0981 15.9876 13.4218 16.5 12 16.5C10.5782 16.5 9.90187 15.9876 9.54387 15.5191Z"
            fill="#007AFF"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 20.9932C7.03321 20.9932 3.00683 16.9668 3.00683 12C3.00683 7.03321 7.03321 3.00683 12 3.00683C16.9668 3.00683 20.9932 7.03321 20.9932 12C20.9932 16.9668 16.9668 20.9932 12 20.9932Z"
            fill="#007AFF"
          />
        </Svg>
      ),
      label: 'Excited',
    },
  ];

  useEffect(() => {
    const fetchSymptoms = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedUserId || !storedToken) {
        setErrorMessage('Authentication required. Please sign in.');
        return;
      }

      try {
        const res = await getSymptomsForUser(storedUserId, storedToken);
        const allSymptoms = (res.data?.data || []).map((s) => ({
          id: String(s.id),
          label: s.symptomName,
          isTemplate: !!s.isTemplate,
        }));
        setSymptoms(allSymptoms);
        if (selectedSymptoms?.length > 0) {
          const normalized = normalizeSelected(selectedSymptoms, allSymptoms);
          const names = getSelectedSymptomNames(normalized);
          onSymptomsChange?.(normalized, names);
        }
      } catch (err) {
        console.error('Failed to load symptoms:', err);
        setSymptoms([]);
        setErrorMessage('Failed to load symptoms. Please try again.');
        onSymptomsChange?.(['none'], ['None']);
      }
    };
    fetchSymptoms();
  }, [userId, token]);

  const normalizeSelected = (selectedSymptoms, symptoms) => {
    if (!selectedSymptoms || selectedSymptoms.length === 0) return [];
    const symptomIds = new Set(symptoms.map((s) => String(s.id)));
    return selectedSymptoms
      .map((val) => {
        const valStr = String(val);
        if (symptomIds.has(valStr)) return valStr;
        const templateMatch = symptoms.find((s) => s.label === valStr && s.isTemplate);
        if (templateMatch) return String(templateMatch.id);
        const customMatch = symptoms.find((s) => s.label === valStr && !s.isTemplate);
        if (customMatch) return String(customMatch.id);
        return null;
      })
      .filter(Boolean);
  };

  const selectedIds = normalizeSelected(selectedSymptoms, symptoms);

  const getSelectedSymptomNames = (ids) => {
    const idSet = new Set((ids || []).map(String));
    return symptoms
      .filter((sym) => idSet.has(String(sym.id)))
      .map((sym) => sym.label);
  };

  const handleSymptomToggle = (symptomId) => {
    const idStr = String(symptomId);
    let updatedIds = selectedIds.includes(idStr)
      ? selectedIds.filter((id) => id !== idStr)
      : [...selectedIds, idStr];
    if (updatedIds.length === 0) {
      updatedIds = ['none'];
    }
    const updatedNames = updatedIds[0] === 'none' ? ['None'] : getSelectedSymptomNames(updatedIds);
    onSymptomsChange?.(updatedIds, updatedNames);
  };

  const handleAddCustomSymptomClick = () => {
    setShowInput(true);
    setErrorMessage('');
  };

  const handleCancel = () => {
    setCustomSymptom('');
    setShowInput(false);
    setErrorMessage('');
    Keyboard.dismiss();
  };

  const handleCustomSymptomSubmit = async () => {
    const trimmed = customSymptom?.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a symptom name.');
      return;
    }

    const existing = symptoms.find(
      (s) => s.label.toLowerCase() === trimmed.toLowerCase() && s.isTemplate
    ) || symptoms.find((s) => s.label.toLowerCase() === trimmed.toLowerCase());

    if (existing) {
      const updatedIds = [...selectedIds.filter((id) => id !== 'none'), existing.id];
      const updatedNames = getSelectedSymptomNames(updatedIds);
      onSymptomsChange?.(Array.from(new Set(updatedIds)), updatedNames);
      setCustomSymptom('');
      setShowInput(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await addNewCustomSymptom(trimmed, token);
      const newId = String(res?.data?.data?.id);
      const newSymptom = { id: newId, label: trimmed, isTemplate: false };
      const updatedSymptoms = [...symptoms, newSymptom];
      setSymptoms(updatedSymptoms);
      const updatedIds = [...selectedIds.filter((id) => id !== 'none'), newId];
      const updatedNames = updatedSymptoms
        .filter((sym) => updatedIds.includes(String(sym.id)))
        .map((sym) => sym.label);
      onSymptomsChange?.(updatedIds, updatedNames);
      setCustomSymptom('');
      setShowInput(false);
      setErrorMessage('');
    } catch (err) {
      console.error('Failed to add custom symptom:', err);
      setErrorMessage('Failed to add symptom. Please try again.');
    }
  };

  return (
    <View style={styles(width).container}>
      <View style={styles(width).sectionHeader}>
        <Text style={styles(width).sectionTitle}>Symptoms & Mood</Text>
      </View>

      <View style={styles(width).moodSection}>
        <Text style={styles(width).sectionSubtitle}>Select your overall mood for the week (Optional)</Text>
        <View style={styles(width).moodSelector}>
          {moods.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles(width).moodBtn, selectedMood === m.id ? styles(width).moodBtnSelected : {}]}
              onPress={() => onMoodChange?.(m.id)}
              accessibilityLabel={`Select ${m.label} mood`}
              accessibilityRole="button"
            >
              <View style={styles(width).moodEmoji}>{m.emoji}</View>
              <Text style={[styles(width).moodLabel, selectedMood === m.id ? styles(width).moodLabelSelected : {}]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles(width).symptomsSection}>
        <Text style={styles(width).sectionSubtitle}>Check symptoms that fit your current state (Optional)</Text>
        <ScrollView contentContainerStyle={styles(width).symptomsGrid}>
          {symptoms.length === 0 && !errorMessage ? (
            <Text style={styles(width).noSymptomsText}>No symptoms available. Add a custom symptom below.</Text>
          ) : (
            symptoms.map((symptom) => {
              const idStr = String(symptom.id);
              return (
                <TouchableOpacity
                  key={idStr}
                  style={styles(width).symptomCheckbox}
                  onPress={() => handleSymptomToggle(idStr)}
                  accessibilityLabel={`Toggle ${symptom.label} symptom`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selectedIds.includes(idStr) }}
                >
                  <View style={[styles(width).checkmark, selectedIds.includes(idStr) ? styles(width).checkmarkSelected : {}]}>
                    {selectedIds.includes(idStr) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles(width).symptomLabel}>
                    {symptom.label}
                    {!symptom.isTemplate && <Text style={styles(width).customTag}> (Custom)</Text>}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles(width).addCustomBtn}
          onPress={handleAddCustomSymptomClick}
          accessibilityLabel="Add custom symptom"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
          <Text style={styles(width).addCustomText}>Add Custom Symptom</Text>
        </TouchableOpacity>
      </View>

      {errorMessage ? (
        <Text style={styles(width).errorText}>{errorMessage}</Text>
      ) : null}

      <Modal
        visible={showInput}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles(width).popupOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles(width).keyboardAvoidingView}
            >
              <TouchableWithoutFeedback>
                <View style={styles(width).popupContainer}>
                  <Text style={styles(width).popupTitle}>Add a Custom Symptom</Text>
                  <TextInput
                    style={[styles(width).popupInput, errorMessage ? styles(width).popupInputError : {}]}
                    value={customSymptom}
                    onChangeText={(text) => {
                      setCustomSymptom(text);
                      setErrorMessage('');
                    }}
                    placeholder="Enter symptom (e.g., Back Pain)"
                    placeholderTextColor="#8E8E93"
                    accessibilityLabel="Custom symptom input"
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleCustomSymptomSubmit}
                  />
                  {errorMessage ? (
                    <Text style={styles(width).errorText}>{errorMessage}</Text>
                  ) : null}
                  <View style={styles(width).popupButtons}>
                    <TouchableOpacity
                      style={styles(width).popupSubmitBtn}
                      onPress={handleCustomSymptomSubmit}
                      accessibilityLabel="Add custom symptom"
                      accessibilityRole="button"
                    >
                      <Text style={styles(width).popupBtnText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles(width).popupCancelBtn}
                      onPress={handleCancel}
                      accessibilityLabel="Cancel custom symptom"
                      accessibilityRole="button"
                    >
                      <Text style={styles(width).popupBtnCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = (width) => StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: width < 768 ? 10 : 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  moodSection: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3C3C43',
    opacity: 0.6,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  moodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: width < 768 ? 'space-around' : 'flex-start',
    gap: 12,
  },
  moodBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    minWidth: 80,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  moodBtnSelected: {
    backgroundColor: '#E5F0FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  moodEmoji: {
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  moodLabelSelected: {
    color: '#007AFF',
  },
  symptomsSection: {
    marginBottom: 20,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  symptomCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    minWidth: width < 768 ? '45%' : '30%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  checkmark: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkmarkSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  symptomLabel: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    flex: 1,
  },
  customTag: {
    fontSize: 12,
    color: '#3C3C43',
    opacity: 0.6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
  },
  addCustomText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  noSymptomsText: {
    fontSize: 15,
    color: '#3C3C43',
    opacity: 0.6,
    textAlign: 'center',
    marginVertical: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 8,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  popupInput: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F2F2F7',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  popupInputError: {
    borderColor: '#FF3B30',
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  popupSubmitBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  popupCancelBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    alignItems: 'center',
  },
  popupBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  popupBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default SymptomsAndMood;