import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCurrentUser } from '../../api/auth.js';
import { formatDateForApi } from '../../utils/date.js';

const TrackingForm = ({ onSubmit, isLoading }) => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstDayOfLastMenstrualPeriod: '',
    preWeight: '',
    preHeight: '',
  });
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      try {
        const res = await getCurrentUser(token);
        setUser(res.data.data);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleChange('firstDayOfLastMenstrualPeriod', selectedDate.toISOString().split('T')[0]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstDayOfLastMenstrualPeriod) {
      newErrors.firstDayOfLastMenstrualPeriod = 'Please select your last menstrual period date';
    } else {
      const selectedDate = new Date(formData.firstDayOfLastMenstrualPeriod);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.firstDayOfLastMenstrualPeriod = 'Date cannot be in the future';
      }
    }
    if (!formData.preWeight || Number.parseFloat(formData.preWeight) <= 0) {
      newErrors.preWeight = 'Please enter a valid weight';
    }
    if (!formData.preHeight || Number.parseFloat(formData.preHeight) <= 0) {
      newErrors.preHeight = 'Please enter a valid height';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        userId: user?.id,
        firstDayOfLastMenstrualPeriod: formatDateForApi(formData.firstDayOfLastMenstrualPeriod),
        preWeight: Number.parseFloat(formData.preWeight),
        preHeight: Number.parseFloat(formData.preHeight),
      });
    }
  };

  return (
    <View style={styles.lmpFormContainer}>
      <View style={styles.lmpFormCard}>
        <View style={styles.trackingFormHeader}>
          <Text style={styles.formIcon}>📅</Text>
          <Text style={styles.headerTitle}>Start Your Pregnancy Journey</Text>
          <Text style={styles.headerText}>Enter your information to begin tracking your pregnancy</Text>
        </View>

        <View style={styles.lmpForm}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Menstrual Period Date *</Text>
            <TouchableOpacity
              style={[styles.input, errors.firstDayOfLastMenstrualPeriod ? styles.inputError : {}]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>
                {formData.firstDayOfLastMenstrualPeriod || 'Select date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.firstDayOfLastMenstrualPeriod ? new Date(formData.firstDayOfLastMenstrualPeriod) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
            {errors.firstDayOfLastMenstrualPeriod && (
              <Text style={styles.errorMessage}>{errors.firstDayOfLastMenstrualPeriod}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Pre-pregnancy Weight (kg) *</Text>
            <TextInput
              style={[styles.input, errors.preWeight ? styles.inputError : {}]}
              value={formData.preWeight}
              onChangeText={(value) => handleChange('preWeight', value)}
              placeholder="Enter your weight in kg"
              keyboardType="decimal-pad"
              returnKeyType="done"
              min={30}
              max={200}
            />
            {errors.preWeight && (
              <Text style={styles.errorMessage}>{errors.preWeight}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Pre-pregnancy Height (cm) *</Text>
            <TextInput
              style={[styles.input, errors.preHeight ? styles.inputError : {}]}
              value={formData.preHeight}
              onChangeText={(value) => handleChange('preHeight', value)}
              placeholder="Enter your height in cm"
              keyboardType="decimal-pad"
              returnKeyType="done"
              min={100}
              max={250}
            />
            {errors.preHeight && (
              <Text style={styles.errorMessage}>{errors.preHeight}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.trackingSubmitBtn, isLoading ? styles.disabledBtn : {}]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#feffe9" />
                <Text style={styles.submitBtnText}>Creating Profile...</Text>
              </>
            ) : (
              <Text style={styles.submitBtnText}>Start Tracking</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  lmpFormContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 600,
  },
  lmpFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 30,
    maxWidth: 500,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  trackingFormHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  formIcon: {
    fontSize: 40,
    marginBottom: 10,
    color: '#04668D',
  },
  headerTitle: {
    color: '#013F50',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerText: {
    color: '#FE6B6A',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  lmpForm: {
    flexDirection: 'column',
    rowGap: 20,
  },
  formGroup: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 16,
    color: '#013F50',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#F4F4F4',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputText: {
    color: '#013F50',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  errorMessage: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 4,
  },
  trackingSubmitBtn: {
    backgroundColor: '#02808F',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrackingForm;