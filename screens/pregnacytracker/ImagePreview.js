import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ImagePreview = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, title, growthDataId, journalinfo, weeklyinfo, journal } = route.params || {};

  if (!imageUri) {
    console.warn('No image URI provided');
    navigation.goBack();
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('JournalEntryDetail', {
            growthDataId,
            journalinfo,
            weeklyinfo,
            journal, // Pass the journal object back
          })}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to Journal Entry Details screen"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{title || 'Image Preview'}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.fullImage}
          resizeMode="contain"
          onError={(e) => console.log('Failed to load image:', imageUri, e.nativeEvent.error)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background for full-screen image view
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width < 768 ? 16 : 20,
    paddingVertical: 12,
    backgroundColor: '#04668d',
    borderBottomWidth: 1,
    borderBottomColor: '#034f70',
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
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    maxWidth: width,
    maxHeight: height * 0.8, // Limit height to 80% of screen to leave space for header
  },
});

export default ImagePreview;