import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
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

  console.log('Journal State Received:', journal); // Debug log for full state

  // Handle case where journal is not provided (e.g., adding a new entry)
  if (!journal && !journalinfo) {
    navigation.navigate('PregnancyTracking', { growthDataId, journalinfo: true });
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

  console.log('Related Images:', journalData.relatedImages); // Debug log for images
  console.log('Ultrasound Images:', journalData.ultraSoundImages); // Debug log for ultrasound images

  // Function to get image source (handles URLs directly from API)
  const getImageSrc = (image) => {
    return image || null; // API provides full URLs
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.detailHeader}>
          <Text style={styles.headerText}>
            {journal ? 'Journal Entry Details' : 'Add New Journal Entry'}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('PregnancyTracking', { growthDataId, journalinfo: true })}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.detailContent}>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#046694',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: 150,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#04668d',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  detailContent: {
    flexDirection: 'column',
    gap: 16,
  },
  detailSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(6, 125, 173, 0.1)',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#046694',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#555555',
    lineHeight: 24,
    marginVertical: 4,
  },
  listItem: {
    fontSize: 16,
    color: '#555555',
    lineHeight: 24,
    marginLeft: 16,
    marginVertical: 2,
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  detailImage: {
    width: 100,
    height: 100,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dfe4ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default JournalEntryDetail;