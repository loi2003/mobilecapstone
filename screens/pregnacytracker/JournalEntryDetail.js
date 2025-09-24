import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const JournalEntryDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const journal = route.params?.journal;
  const growthDataId = new URLSearchParams(route.params?.search).get('growthDataId');
  const entryId = route.params?.entryId;
  const journalinfo = route.params?.journalinfo;

  const fadeAnim = useRef(new Animated.Value(0)).current; // Animation for content load
  const scaleAnim = useRef(new Animated.Value(1)).current; // Animation for button press

  // Debug logs
  console.log('Journal State Received:', journal);

  // Handle case where journal is not provided (e.g., adding a new entry)
  if (!journal && !journalinfo) {
    navigation.navigate('PregnancyTracking', { growthDataId, journalinfo: 'true' });
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
  };

  // Debug logs for images
  console.log('Related Images:', journalData.relatedImages);
  console.log('Ultrasound Images:', journalData.ultraSoundImages);

  // Function to get image source (handles URLs directly from API)
  const getImageSrc = (image) => {
    return image || null; // API provides full URLs
  };

  // Animate content fade-in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={[styles.backButton, { transform: [{ scale: scaleAnim }] }]}
          onPress={() => animatePress(() => navigation.navigate('PregnancyTracking', { 
            growthDataId, 
            journalinfo: 'true' 
          }))}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to Pregnancy Tracking screen"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {journal ? 'Journal Entry Details' : 'Add New Journal Entry'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.detailContent, { opacity: fadeAnim }]}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.detailText}>Week: {journalData.currentWeek}</Text>
            <Text style={styles.detailText}>Trimester: {journalData.currentTrimester}</Text>
            <Text style={styles.detailText}>
              Date: {new Date(journalData.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </Text>
          </View>
          {journalData.note && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.detailText}>{journalData.note}</Text>
            </View>
          )}
          {journalData.currentWeight && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Weight</Text>
              <Text style={styles.detailText}>Current Weight: {journalData.currentWeight} kg</Text>
            </View>
          )}
          {journalData.mood && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Mood</Text>
              <Text style={styles.detailText}>Mood: {journalData.mood}</Text>
            </View>
          )}
          {journalData.symptoms?.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Symptoms</Text>
              {journalData.symptoms.filter((symptom) => !symptom.isTemplate).length > 0 ? (
                journalData.symptoms
                  .filter((symptom) => !symptom.isTemplate)
                  .map((symptom, index) => (
                    <Text key={index} style={styles.listItem}>
                      • {symptom.symptomName}
                    </Text>
                  ))
              ) : (
                <Text style={styles.detailText}>N/A</Text>
              )}
            </View>
          )}
          {journalData.relatedImages?.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Related Images</Text>
              <View style={styles.imageGallery}>
                {journalData.relatedImages.map((img, index) => (
                  <Image
                    key={`related-${index}`}
                    source={{ uri: getImageSrc(img) }}
                    style={styles.detailImage}
                    resizeMode="cover"
                    onError={() => console.log('Failed to load related image:', img)}
                  />
                ))}
              </View>
            </View>
          )}
          {journalData.ultraSoundImages?.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Ultrasound Images</Text>
              <View style={styles.imageGallery}>
                {journalData.ultraSoundImages.map((img, index) => (
                  <Image
                    key={`ultrasound-${index}`}
                    source={{ uri: getImageSrc(img) }}
                    style={styles.detailImage}
                    resizeMode="cover"
                    onError={() => console.log('Failed to load ultrasound image:', img)}
                  />
                ))}
              </View>
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
    backgroundColor: '#f0f4f8',
    padding: width < 768 ? 16 : 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: width < 768 ? 0 : 8,
  },
  headerText: {
    fontSize: width < 768 ? 22 : 24,
    fontWeight: '700',
    color: '#04668d',
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
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerSpacer: {
    width: 48, // Balances the layout with the back button
  },
  scrollContent: {
    paddingBottom: 24,
  },
  detailContent: {
    flexDirection: 'column',
    gap: 20,
  },
  detailSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dfe4ea',
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
  sectionTitle: {
    fontSize: width < 768 ? 18 : 20,
    fontWeight: '700',
    color: '#04668d',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe4ea',
    paddingBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  detailText: {
    fontSize: width < 768 ? 15 : 16,
    color: '#333333',
    lineHeight: 26,
    marginVertical: 4,
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
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  detailImage: {
    width: width < 768 ? 120 : 140,
    height: width < 768 ? 120 : 140,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfe4ea',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

export default JournalEntryDetail;