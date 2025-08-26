import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  getJournalByGrowthDataId,
  deleteJournal,
  getJournalDetail,
} from '../../api/journal-api';
import { getCurrentWeekGrowthData } from '../../api/growthdata-api';

const JournalSection = ({ journalEntries = [], growthDataId, growthData, onError }) => {
  const { width } = useWindowDimensions();
  const [currentWeek, setCurrentWeek] = useState(null);
  const [entries, setEntries] = useState(journalEntries);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem('token');
      if (growthDataId && token) {
        fetchJournals(token);
        fetchCurrentWeek(token);
      }
    };
    fetchData();
  }, [growthDataId]);

  const fetchJournals = async (token) => {
    try {
      const response = await getJournalByGrowthDataId(growthDataId, token);
      if (response.data?.error === 0 && response.data?.data) {
        setEntries(response.data.data);
      } else {
        setEntries([]);
        setErrors({ submit: response.data?.message || 'Failed to fetch journals' });
        onError?.(response.data?.message || 'Failed to fetch journals');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch journals';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    }
  };

  const fetchCurrentWeek = async (token) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const today = new Date().toISOString().split('T')[0];
      const response = await getCurrentWeekGrowthData(userId, today, token);
      const week = response?.data?.data?.currentGestationalAgeInWeeks || null;
      setCurrentWeek(week);
    } catch (error) {
      console.error('Failed to fetch current gestational week:', error);
    }
  };

  const getUndocumentedWeeks = () => {
    const documentedWeeks = entries.map((e) => e.currentWeek);
    const allWeeks = Array.from({ length: currentWeek || 0 }, (_, i) => i + 1);
    return allWeeks.filter((w) => !documentedWeeks.includes(w));
  };

  const undocumentedWeeks = currentWeek ? getUndocumentedWeeks() : [];

  const handleDelete = async (journalId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await deleteJournal(journalId, token);
      setEntries(entries.filter((entry) => entry.id !== journalId));
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete journal';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    }
  };

  const handleViewDetails = async (journalId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await getJournalDetail(journalId, token);
      if (response.data?.error === 0 && response.data?.data) {
        navigation.navigate('JournalEntryDetail', { 
          journal: response.data,
          search: `growthDataId=${growthDataId}`
        });
      } else {
        const errorMessage = response.data?.message || 'Failed to fetch journal details';
        setErrors({ submit: errorMessage });
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch journal details';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    }
  };

  const handleAddOrEditEntry = (entryId = null) => {
    navigation.navigate('JournalEntryDetail', { 
      growthDataId,
      entryId,
      journalinfo: true
    });
  };

  const token = AsyncStorage.getItem('token');

  if (!entries || entries.length === 0) {
    return (
      <View style={styles(width).journalSection}>
        <View style={styles(width).sectionHeader}>
          <View style={styles(width).headerContent}>
            <Text style={styles(width).headerTitle}>Pregnancy Journal</Text>
            <Text style={styles(width).headerText}>Your pregnancy journey documented week by week</Text>
          </View>
          {undocumentedWeeks.length > 0 ? (
            <TouchableOpacity
              style={[styles(width).addEntryBtn, !token ? styles(width).disabledBtn : {}]}
              onPress={() => handleAddOrEditEntry()}
              disabled={!token}
            >
              <Text style={styles(width).addEntryBtnText}>Add Entry</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles(width).infoMessage}>
              You've already documented all weeks up to Week {currentWeek}.
            </Text>
          )}
        </View>

        <View style={styles(width).emptyState}>
          <Text style={styles(width).emptyIcon}>📓</Text>
          <Text style={styles(width).emptyTitle}>No journal entries yet</Text>
          <Text style={styles(width).emptyText}>
            Start documenting your pregnancy journey by adding your first entry!
          </Text>
          <TouchableOpacity
            style={[styles(width).addEntryBtn, !token ? styles(width).disabledBtn : {}]}
            onPress={() => handleAddOrEditEntry()}
            disabled={!token}
          >
            <Text style={styles(width).addEntryBtnText}>Add Entry</Text>
          </TouchableOpacity>
        </View>
        {errors.submit && <Text style={styles(width).errorMessage}>{errors.submit}</Text>}
      </View>
    );
  }

  return (
    <View style={styles(width).journalSection}>
      <View style={styles(width).sectionHeader}>
        <View style={styles(width).headerContent}>
          <Text style={styles(width).headerTitle}>Pregnancy Journal</Text>
          <Text style={styles(width).headerText}>Your pregnancy journey documented week by week</Text>
        </View>
        {undocumentedWeeks.length > 0 ? (
          <TouchableOpacity
            style={[styles(width).addEntryBtn, !token ? styles(width).disabledBtn : {}]}
            onPress={() => handleAddOrEditEntry()}
            disabled={!token}
          >
            <Text style={styles(width).addEntryBtnText}>Add Entry</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles(width).infoMessage}>
            All Journals are up to date up to Week {currentWeek}.
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles(width).journalEntries}>
        {entries.map((entry) => (
          <View key={entry.id || Math.random()} style={styles(width).journalEntry}>
            <View style={styles(width).entryHeader}>
              <View style={styles(width).entryInfo}>
                <View style={styles(width).weekBadge}>
                  <Text style={styles(width).weekBadgeText}>Week {entry.currentWeek || 'N/A'}</Text>
                </View>
                <Text style={styles(width).entryDate}>
                  {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </Text>
              </View>
              <View style={styles(width).entryActions}>
                <TouchableOpacity
                  style={[styles(width).actionBtn, !token ? styles(width).disabledBtn : {}]}
                  onPress={() => handleAddOrEditEntry(entry.id)}
                  disabled={!token}
                >
                  <Text style={styles(width).actionIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles(width).actionBtn, !token ? styles(width).disabledBtn : {}]}
                  onPress={() => handleDelete(entry.id)}
                  disabled={!token}
                >
                  <Text style={styles(width).actionIcon}>🗑️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles(width).actionBtn, !token ? styles(width).disabledBtn : {}]}
                  onPress={() => handleViewDetails(entry.id)}
                  disabled={!token}
                >
                  <Text style={styles(width).actionIcon}>👁️</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles(width).entryContent}>
              {entry.note && (
                <View style={styles(width).entryField}>
                  <Text style={styles(width).entryFieldTitle}>Notes</Text>
                  <Text style={styles(width).entryText}>{entry.note}</Text>
                </View>
              )}
              <View style={styles(width).entryMetrics}>
                {entry.currentWeight > 0 && (
                  <View style={styles(width).metric}>
                    <Text style={styles(width).metricIcon}>⚖️</Text>
                    <View style={styles(width).metricContent}>
                      <Text style={styles(width).metricValue}>{entry.currentWeight} kg</Text>
                      <Text style={styles(width).metricLabel}>Current Weight</Text>
                    </View>
                  </View>
                )}
                {entry.mood && (
                  <View style={styles(width).metric}>
                    <Text style={styles(width).metricIcon}>😊</Text>
                    <View style={styles(width).metricContent}>
                      <Text style={styles(width).metricValue}>{entry.mood}</Text>
                      <Text style={styles(width).metricLabel}>Mood</Text>
                    </View>
                  </View>
                )}
                {entry.symptomNames?.length > 0 && (
                  <View style={styles(width).entryField}>
                    <Text style={styles(width).entryFieldTitle}>Symptoms</Text>
                    <Text style={styles(width).entryText}>{entry.symptomNames.join(', ') || 'No symptoms'}</Text>
                  </View>
                )}
                {(entry.relatedImages?.length > 0 || entry.ultraSoundImages?.length > 0) && (
                  <View style={styles(width).entryField}>
                    <Text style={styles(width).entryFieldTitle}>Images</Text>
                    <View style={styles(width).imageGallery}>
                      {entry.relatedImages?.map((img, index) => (
                        <Text key={`related-${index}`} style={styles(width).imagePlaceholder}>
                          [Image {index + 1}]
                        </Text>
                      ))}
                      {entry.ultraSoundImages?.map((img, index) => (
                        <Text key={`ultrasound-${index}`} style={styles(width).imagePlaceholder}>
                          [Ultrasound {index + 1}]
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      {errors.submit && <Text style={styles(width).errorMessage}>{errors.submit}</Text>}
    </View>
  );
};

// Styles as a function to accept width
const styles = (width) => StyleSheet.create({
  journalSection: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: width < 768 ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: width < 768 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: width < 768 ? 'stretch' : 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  headerContent: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: width < 768 ? 20 : 24,
    fontWeight: '700',
    color: '#013F50',
    marginBottom: 4,
  },
  headerText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#848785',
    fontWeight: '400',
    lineHeight: 24,
  },
  addEntryBtn: {
    backgroundColor: '#02808F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: width < 768 ? '100%' : 200,
  },
  addEntryBtnText: {
    color: '#FAF9F5',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  infoMessage: {
    color: '#848785',
    fontSize: 14,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: width < 768 ? 16 : 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(6, 125, 173, 0.2)',
    borderRadius: 8,
    backgroundColor: 'rgba(6, 125, 173, 0.02)',
  },
  emptyIcon: {
    fontSize: 48,
    color: '#848785',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '600',
    color: '#013F50',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#848785',
    marginBottom: 12,
    textAlign: 'center',
    maxWidth: 400,
  },
  journalEntries: {
    flexDirection: 'column',
    gap: 16,
  },
  journalEntry: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: 'rgba(6, 125, 173, 0.1)',
    borderRadius: 8,
    padding: width < 768 ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: width < 768 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: width < 768 ? 'stretch' : 'flex-start',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#F4F4F4',
    gap: 8,
  },
  entryInfo: {
    flexDirection: 'column',
    gap: 4,
  },
  weekBadge: {
    backgroundColor: '#02808F',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  weekBadgeText: {
    color: '#FAF9F5',
    fontSize: 14,
    fontWeight: '700',
  },
  entryDate: {
    color: '#848785',
    fontSize: 12,
    fontWeight: '500',
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: width < 768 ? 'flex-end' : 'flex-start',
  },
  actionBtn: {
    width: width < 480 ? 36 : 40,
    height: width < 480 ? 36 : 40,
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: 'rgba(6, 125, 173, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 20,
    color: '#848785',
  },
  entryContent: {
    flexDirection: 'column',
    gap: 12,
  },
  entryField: {
    backgroundColor: 'rgba(6, 125, 173, 0.02)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#067DAD',
  },
  entryFieldTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#013F50',
    marginBottom: 8,
  },
  entryText: {
    fontSize: 14,
    color: '#848785',
    lineHeight: 20,
  },
  entryMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F4F8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 125, 173, 0.1)',
    flex: width < 768 ? 1 : 'auto',
    minWidth: 200,
  },
  metricIcon: {
    fontSize: 24,
    color: '#013F50',
  },
  metricContent: {
    flexDirection: 'column',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#013F50',
    lineHeight: 20,
  },
  metricLabel: {
    fontSize: 12,
    color: '#848785',
    fontWeight: '500',
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  imagePlaceholder: {
    width: width < 768 ? 100 : 120,
    height: width < 768 ? 100 : 120,
    backgroundColor: '#F4F4F4',
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: width < 768 ? 100 : 120,
    color: '#848785',
    fontSize: 12,
  },
  errorMessage: {
    backgroundColor: 'rgba(254, 107, 106, 0.1)',
    color: '#FE6B6A',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FE6B6A',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
  },
});

export default JournalSection;