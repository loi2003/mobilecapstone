import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const JournalEntryDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { journal, growthDataId, journalinfo } = route.params || {};

  const fadeAnim = useRef(new Animated.Value(0)).current; // Animation for content load
  const scaleAnim = useRef(new Animated.Value(1)).current; // Animation for button press

  // Handle case where journal is not provided
  if (!journal && !journalinfo) {
    navigation.navigate('PregnancyTracking', {
      growthDataId,
      journalinfo: 'true',
    });
    return null;
  }

  const journalData = journal?.data || {
    currentWeek: 'N/A',
    currentTrimester: 'N/A',
    createdAt: Date.now(),
    note: '',
    currentWeight: null,
    mood: null,
    symptoms: [],
    relatedImages: [],
    ultraSoundImages: [],
    systolicBP: null,
    diastolicBP: null,
    heartRateBPM: null,
    bloodSugarLevelMgDl: null,
  };

  // Debug logs for data validation
  console.log('Journal Data:', journalData);
  console.log('Related Images:', journalData.relatedImages);
  console.log('Ultrasound Images:', journalData.ultraSoundImages);

  // Mood configuration
  const getMoodConfig = (mood) => {
    const moodConfigs = {
      sad: {
        icon: 'sad-outline',
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        label: 'Sad Mood',
      },
      terrible: {
        icon: 'skull-outline',
        color: '#DC2626',
        bgColor: 'rgba(220, 38, 38, 0.1)',
        label: 'Terrible Mood',
      },
      neutral: {
        icon: 'remove-circle-outline',
        color: '#64748B',
        bgColor: 'rgba(100, 116, 139, 0.1)',
        label: 'Neutral Mood',
      },
      normal: {
        icon: 'happy-outline',
        color: '#059669',
        bgColor: 'rgba(5, 150, 105, 0.1)',
        label: 'Normal Mood',
      },
      happy: {
        icon: 'heart-circle-outline',
        color: '#0EA5E9',
        bgColor: 'rgba(14, 165, 233, 0.1)',
        label: 'Happy Mood',
      },
      anxious: {
        icon: 'alert-circle-outline',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        label: 'Anxious Mood',
      },
      excited: {
        icon: 'sparkles-outline',
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        label: 'Excited Mood',
      },
    };

    const moodKey = mood?.toLowerCase();
    return moodConfigs[moodKey] || moodConfigs.neutral;
  };

  // Abnormal status analysis
  const getAbnormalStatus = (bio) => {
    const results = {};

    // Blood Pressure analysis
    if (bio?.systolicBP && bio?.diastolicBP) {
      const sys = Number(bio.systolicBP);
      const dia = Number(bio.diastolicBP);
      if (sys >= 160 || dia >= 110) {
        results.bloodPressure = {
          abnormal: true,
          severity: 'severe',
          message: `BP ${sys}/${dia} mmHg (severe ≥160/110)`,
        };
      } else if (sys >= 140 || dia >= 90) {
        results.bloodPressure = {
          abnormal: true,
          message: `BP ${sys}/${dia} mmHg (elevated ≥140/90)`,
        };
      } else if (sys < 90 || dia < 60) {
        results.bloodPressure = {
          abnormal: true,
          message: `BP ${sys}/${dia} mmHg (hypotension)`,
        };
      }
    }

    // Blood sugar analysis
    if (bio?.bloodSugarLevelMgDl != null) {
      const sugar = Number(bio.bloodSugarLevelMgDl);
      if (sugar > 95) {
        results.bloodSugarLevelMgDl = {
          abnormal: true,
          message: `Blood sugar ${sugar} mg/dL (above fasting target >95)`,
        };
      } else if (sugar < 70) {
        results.bloodSugarLevelMgDl = {
          abnormal: true,
          message: `Blood sugar ${sugar} mg/dL (hypoglycemia <70)`,
        };
      }
    }

    // Heart rate analysis
    if (bio?.heartRateBPM != null) {
      const hr = Number(bio.heartRateBPM);
      if (hr > 110) {
        results.heartRateBPM = {
          abnormal: true,
          message: `Heart rate ${hr} bpm (elevated >110)`,
        };
      } else if (hr < 50) {
        results.heartRateBPM = {
          abnormal: true,
          message: `Heart rate ${hr} bpm (bradycardia <50)`,
        };
      }
    }

    return results;
  };

  const bio = {
    systolicBP: journalData.systolicBP,
    diastolicBP: journalData.diastolicBP,
    heartRateBPM: journalData.heartRateBPM,
    bloodSugarLevelMgDl: journalData.bloodSugarLevelMgDl,
  };

  const abnormal = getAbnormalStatus(bio);
  const moodConfig = getMoodConfig(journalData.mood);

  // Animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Handle button press animation
  const animatePress = (callback) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  // Image preview handler
  const openImagePreview = (img, type, index) => {
    if (!img) {
      console.warn('Invalid image URI');
      return;
    }
    try {
      // Handle both string URIs and objects with uri property
      const imageUri = typeof img === 'string' ? img : img.uri;
      if (!imageUri) {
        console.warn('Invalid image URI format');
        return;
      }
      navigation.navigate('ImagePreview', {
        imageUri,
        title: `${type} Image ${index + 1}`,
        growthDataId,
        journalinfo: 'true',
        weeklyinfo: 'true',
        journal, // Pass the journal object to ImagePreview
      });
    } catch (error) {
      console.error('Navigation to ImagePreview failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={[styles.backButton, { transform: [{ scale: scaleAnim }] }]}
          onPress={() => animatePress(() => navigation.navigate('PregnancyTracking', {
            growthDataId,
            journalinfo: 'true',
            weeklyinfo: 'true',
          }))}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to Pregnancy Tracking screen"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Journal Entry Details</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.detailContent, { opacity: fadeAnim }]}>
          {/* Summary Section */}
          <View style={styles.detailSection}>
            <View style={styles.metaTop}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Week {journalData.currentWeek || 'N/A'}</Text>
              </View>
              <View style={[styles.badge, styles.trimesterBadge]}>
                <Text style={styles.badgeText}>{journalData.currentTrimester || 'N/A'} Trimester</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={18} color="#02808f" />
              <Text style={styles.detailText}>
                {new Date(journalData.createdAt || Date.now()).toLocaleDateString('en-US', { dateStyle: 'full' })}
              </Text>
            </View>
          </View>

          {/* Notes Section */}
          {journalData.note && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={styles.notesContent}>
                <Text style={styles.detailText}>{journalData.note}</Text>
              </View>
            </View>
          )}

          {/* Health Metrics Grid */}
          <View style={styles.healthMetricsGrid}>
            {/* Weight */}
            {journalData.currentWeight && (
              <Animated.View
                style={[
                  styles.metricCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                  },
                ]}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name="scale-outline" size={20} color="#02808f" />
                  <Text style={styles.metricTitle}>Weight</Text>
                </View>
                <Text style={styles.metricValue}>
                  {journalData.currentWeight} <Text style={styles.unit}>kg</Text>
                </Text>
              </Animated.View>
            )}

            {/* Blood Pressure */}
            {(journalData.systolicBP || journalData.diastolicBP) && (
              <Animated.View
                style={[
                  styles.metricCard,
                  abnormal.bloodPressure?.abnormal ? styles.abnormalCard : styles.normalCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                  },
                ]}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name="heart-outline" size={20} color="#02808f" />
                  <Text style={styles.metricTitle}>Blood Pressure</Text>
                  {abnormal.bloodPressure?.abnormal && (
                    <Ionicons name="warning-outline" size={18} color="#ff6b6b" />
                  )}
                </View>
                <Text style={styles.metricValue}>
                  {journalData.systolicBP || 'N/A'}/{journalData.diastolicBP || 'N/A'} <Text style={styles.unit}>mmHg</Text>
                </Text>
                {abnormal.bloodPressure?.abnormal && (
                  <Text style={styles.abnormalNote}>{abnormal.bloodPressure.message}</Text>
                )}
              </Animated.View>
            )}

            {/* Heart Rate */}
            {journalData.heartRateBPM != null && (
              <Animated.View
                style={[
                  styles.metricCard,
                  abnormal.heartRateBPM?.abnormal ? styles.abnormalCard : styles.normalCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                  },
                ]}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name="pulse-outline" size={20} color="#02808f" />
                  <Text style={styles.metricTitle}>Heart Rate</Text>
                  {abnormal.heartRateBPM?.abnormal && (
                    <Ionicons name="warning-outline" size={18} color="#ff6b6b" />
                  )}
                </View>
                <Text style={styles.metricValue}>
                  {journalData.heartRateBPM} <Text style={styles.unit}>bpm</Text>
                </Text>
                {abnormal.heartRateBPM?.abnormal && (
                  <Text style={styles.abnormalNote}>{abnormal.heartRateBPM.message}</Text>
                )}
              </Animated.View>
            )}

            {/* Blood Sugar */}
            {journalData.bloodSugarLevelMgDl != null && (
              <Animated.View
               style={[
                  styles.metricCard,
                  abnormal.bloodSugarLevelMgDl?.abnormal ? styles.abnormalCard : styles.normalCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                  },
                ]}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name="water-outline" size={20} color="#02808f" />
                  <Text style={styles.metricTitle}>Blood Sugar</Text>
                  {abnormal.bloodSugarLevelMgDl?.abnormal && (
                    <Ionicons name="warning-outline" size={18} color="#ff6b6b" />
                  )}
                </View>
                <Text style={styles.metricValue}>
                  {journalData.bloodSugarLevelMgDl} <Text style={styles.unit}>mg/dL</Text>
                </Text>
                {abnormal.bloodSugarLevelMgDl?.abnormal && (
                  <Text style={styles.abnormalNote}>{abnormal.bloodSugarLevelMgDl.message}</Text>
                )}
              </Animated.View>
            )}

            {/* Mood */}
            {journalData.mood && (
              <Animated.View
          style={[
                  styles.metricCard,
                  styles.moodCard,
                  {
                    backgroundColor: moodConfig.bgColor,
                    borderColor: moodConfig.color,
                    opacity: fadeAnim,
                    transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                  },
                ]}
              >
                <View style={styles.metricHeader}>
                  <Ionicons name={moodConfig.icon} size={20} color={moodConfig.color} />
                  <Text style={[styles.metricTitle, { color: moodConfig.color }]}>Mood</Text>
                </View>
                <View style={styles.moodContent}>
                  <View style={[styles.moodIconContainer, { backgroundColor: moodConfig.bgColor }]}>
                    <Ionicons name={moodConfig.icon} size={32} color={moodConfig.color} />
                  </View>
                  <Text style={[styles.moodText, { color: moodConfig.color }]}>{moodConfig.label}</Text>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Symptoms Section */}
          {journalData.symptoms?.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Symptoms</Text>
              {journalData.symptoms.filter((symptom) => !symptom.isTemplate).length > 0 ? (
                journalData.symptoms
                  .filter((symptom) => !symptom.isTemplate)
                  .map((symptom, index) => (
                    <Text key={index} style={styles.listItem}>
                      • {symptom.symptomName || 'Unknown'}
                    </Text>
                  ))
              ) : (
                <Text style={styles.detailText}>No symptoms recorded</Text>
              )}
            </View>
          )}

          {/* Image Galleries */}
          {(journalData.relatedImages?.length > 0 || journalData.ultraSoundImages?.length > 0) && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Images</Text>
              {journalData.relatedImages?.length > 0 && (
                <View style={styles.imageCategory}>
                  <Text style={styles.categoryTitle}>Related Images</Text>
                  <View style={styles.imageGallery}>
                    {journalData.relatedImages.map((img, index) => (
                      <TouchableOpacity
                        key={`related-${index}`}
                        style={styles.imageCard}
                        onPress={() => openImagePreview(img, 'Related', index)}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: typeof img === 'string' ? img : img.uri }}
                          style={styles.detailImage}
                          resizeMode="cover"
                          onError={(e) => console.log('Failed to load related image:', img, e.nativeEvent.error)}
                        />
                        <View style={styles.imageOverlay}>
                          <Ionicons name="expand-outline" size={24} color="#ffffff" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {journalData.ultraSoundImages?.length > 0 && (
                <View style={styles.imageCategory}>
                  <Text style={styles.categoryTitle}>Ultrasound Images</Text>
                  <View style={styles.imageGallery}>
                    {journalData.ultraSoundImages.map((img, index) => (
                      <TouchableOpacity
                        key={`ultrasound-${index}`}
                        style={styles.imageCard}
                        onPress={() => openImagePreview(img, 'Ultrasound', index)}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: typeof img === 'string' ? img : img.uri }}
                          style={styles.detailImage}
                          resizeMode="cover"
                          onError={(e) => console.log('Failed to load ultrasound image:', img, e.nativeEvent.error)}
                        />
                        <View style={styles.imageOverlay}>
                          <Ionicons name="expand-outline" size={24} color="#ffffff" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: width < 768 ? 16 : 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: width < 768 ? 0 : 8,
    backgroundColor: '#04668d',
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerText: {
    fontSize: width < 768 ? 20 : 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  backButton: {
    backgroundColor: '#02808f',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerSpacer: {
    width: 48,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  detailContent: {
    flexDirection: 'column',
    gap: 24,
  },
  detailSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  metaTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#04668d',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  trimesterBadge: {
    backgroundColor: '#00a996',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: width < 768 ? 18 : 20,
    fontWeight: '700',
    color: '#04668d',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: width < 768 ? 15 : 16,
    color: '#333333',
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  listItem: {
    fontSize: width < 768 ? 15 : 16,
    color: '#333333',
    lineHeight: 26,
    marginLeft: 16,
    marginVertical: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  notesContent: {
    backgroundColor: 'rgba(4, 102, 141, 0.05)',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  healthMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: width < 768 ? '100%' : 280,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  normalCard: {
    borderColor: '#00a996',
  },
  abnormalCard: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  moodCard: {
    borderWidth: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#04668d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#04668d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#848785',
  },
  abnormalNote: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#d63384',
    fontWeight: '500',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  moodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  moodIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  moodText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  imageCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#04668d',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  imageCard: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    width: width < 768 ? 130 : 150,
    height: width < 768 ? 130 : 150,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4, 102, 141, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  imageCardActive: {
    opacity: 1,
  },
});

export default JournalEntryDetail;