import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllClinics, getClinicsByName } from '../api/clinic-api';
import { getCurrentUser, logout } from '../api/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from './HomeScreen';
import ChatBox from './ChatBox';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const CLINICS_PER_PAGE = 10;

const SPECIALIZATIONS = [
  'Obstetrics',
  'Gynecology',
  'Pediatrics',
  'General Practice',
  'Cardiology',
  'Dermatology',
];

const getStarRating = (feedbacks) => {
  if (!feedbacks || feedbacks.length === 0) {
    return { avg: 0, stars: 0, count: 0 };
  }
  const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
  const avg10 = sum / feedbacks.length;
  const avg5 = avg10 / 2;
  return { avg: avg5, stars: avg5, count: feedbacks.length };
};

const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

const ConsultationScreen = ({ navigation }) => {
  const [clinics, setClinics] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [insuranceOnly, setInsuranceOnly] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const filterModalAnim = useRef(new Animated.Value(0)).current;
  const contactIconScale = useRef(new Animated.Value(1)).current;
  const cardAnims = useRef(new Map()).current;
  const scrollViewRef = useRef(null);
  const scrollTimeout = useRef(null);

  const showErrorNotification = (message) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
      position: 'top',
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
      text1Style: styles.toastText1,
      text2Style: styles.toastText2,
    });
  };

  useEffect(() => {
    const fetchUserAndToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (!storedToken || !navigation) {
          setError('Please log in to view clinics.');
          showErrorNotification('Please log in to view clinics.');
          navigation.replace('Login');
          return;
        }
        setToken(storedToken);
        const response = await getCurrentUser(storedToken);
        if (!response?.data) {
          throw new Error('Invalid user data');
        }
        setUser(response.data);
        await fetchClinics(storedToken);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError('Failed to fetch user data. Please log in again.');
        showErrorNotification('Failed to fetch user data. Please log in again.');
        navigation.replace('Login');
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndToken();

    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    return () => {
      cardAnims.clear();
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [navigation]);

  useEffect(() => {
    const visibleClinicCount = Math.min(clinics.length, currentPage * CLINICS_PER_PAGE);
    for (let i = 0; i < visibleClinicCount; i++) {
      const clinicId = clinics[i]?.id;
      if (clinicId && !cardAnims.has(clinicId)) {
        cardAnims.set(clinicId, new Animated.Value(1));
      }
    }
    const startIndex = (currentPage - 1) * CLINICS_PER_PAGE;
    const endIndex = Math.min(currentPage * CLINICS_PER_PAGE, clinics.length);
    for (let i = startIndex; i < endIndex; i++) {
      const clinicId = clinics[i]?.id;
      if (clinicId && cardAnims.has(clinicId)) {
        Animated.timing(cardAnims.get(clinicId), {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    }

    Animated.spring(filterModalAnim, {
      toValue: showFilterModal ? 1 : 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [clinics, showFilterModal, currentPage]);

  const fetchClinics = async (authToken) => {
    try {
      setLoading(true);
      const data = await getAllClinics(authToken);
      const clinicData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setClinics(clinicData);
      cardAnims.clear();
      clinicData.forEach((clinic) => cardAnims.set(clinic.id, new Animated.Value(1)));
    } catch (err) {
      console.error('Fetch Clinics Error:', err);
      setError(`Failed to fetch clinics: ${err.message}`);
      showErrorNotification(`Failed to fetch clinics: ${err.message}`);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) {
        params.name = search.trim();
      }
      if (selectedSpecializations.length > 0) {
        params.specialization = selectedSpecializations.join(',');
      }
      if (insuranceOnly) {
        params.isInsuranceAccepted = insuranceOnly.toString();
      }

      console.log('Search params:', params);

      let data;
      if (Object.keys(params).length === 0) {
        data = await getAllClinics(token);
      } else if (params.name) {
        data = await getClinicsByName(params, token);
      } else {
        data = await getAllClinics(token);
        let clinicData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        if (params.specialization) {
          const specs = params.specialization.split(',');
          clinicData = clinicData.filter((clinic) =>
            specs.some((spec) =>
              clinic.specializations?.toLowerCase().includes(spec.toLowerCase())
            )
          );
        }
        if (params.isInsuranceAccepted === 'true') {
          clinicData = clinicData.filter((clinic) => clinic.isInsuranceAccepted);
        }
        data = clinicData;
      }
      const clinicData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setClinics(clinicData);
      setCurrentPage(1);
      cardAnims.clear();
      clinicData.forEach((clinic) => cardAnims.set(clinic.id, new Animated.Value(1)));
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      if (clinicData.length === 0) {
        showErrorNotification('No clinics found matching the criteria.');
      }
    } catch (err) {
      console.error('Search Error:', err.response?.data || err);
      const errorMessage =
        err.response?.status === 400
          ? err.response?.data?.errors?.name?.[0] ||
            err.response?.data?.message ||
            'Invalid search criteria. Please check your inputs.'
          : 'Failed to search clinics. Please try again.';
      setError(errorMessage);
      showErrorNotification(errorMessage);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedSpecializations([]);
    setInsuranceOnly(false);
    setShowFilterModal(false);
    fetchClinics(token);
  };

  const toggleSpecialization = (spec) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec)
        ? prev.filter((item) => item !== spec)
        : [...prev, spec]
    );
  };

  const handleLogout = async () => {
    try {
      const userId = user?.data?.id;
      await logout(userId, token);
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout failed:', error);
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    }
  };

  const handleContactIconPress = () => {
    Animated.sequence([
      Animated.spring(contactIconScale, {
        toValue: 1.2,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(contactIconScale, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
    setIsChatOpen((prev) => !prev);
  };

  const handleScroll = (event) => {
    if (isLoadingMore) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isCloseToBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 150;
    if (isCloseToBottom && clinics.length > currentPage * CLINICS_PER_PAGE && !loading) {
      setIsLoadingMore(true);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setIsLoadingMore(false);
      }, 500);
    }
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber || phoneNumber === 'N/A') {
      Alert.alert('No Phone Number', 'This clinic does not have a phone number available.');
      return;
    }
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot make calls on this device.');
        }
      })
      .catch((err) => {
        console.error('Error checking call support:', err);
        Alert.alert('Error', 'Unable to initiate call.');
      });
  };

  const renderStars = (stars) => {
    const filled = Math.floor(stars);
    const half = stars - filled >= 0.5;
    return (
      <View style={styles.starsContainer}>
        {[...Array(5)].map((_, i) => (
          <Text
            key={i}
            style={[
              styles.star,
              {
                color: i < filled ? '#FF9500' : i === filled && half ? '#FF9500' : '#D1D5DB',
              },
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  if (loading && clinics.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#04668D" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: clinics.length <= currentPage * CLINICS_PER_PAGE ? 20 : 40 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ref={scrollViewRef}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: heroAnim,
                transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
              },
            ]}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>
                Find Your <Text style={styles.heroAccent}>Healthcare Partner</Text>
              </Text>
              <Text style={styles.heroDescription}>
                Discover trusted clinics for your pregnancy journey.
              </Text>
              <View style={styles.searchContainer}>
                <View style={styles.searchInputGroup}>
                  <Icon name="search" size={18} color="#04668D" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search clinics by name"
                    placeholderTextColor="#6B7280"
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={handleSearch}
                    accessibilityLabel="Search clinics by name"
                    accessibilityHint="Enter clinic name to search"
                  />
                </View>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowFilterModal(true)}
                  accessibilityLabel="Open filters"
                  accessibilityHint="Opens the filter options for clinic search"
                >
                  <Ionicons name="filter" size={20} color="#04668D" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSearch}
                  accessibilityLabel="Search clinics"
                  accessibilityHint="Performs the clinic search with current criteria"
                >
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
              </View>
              {(search || selectedSpecializations.length > 0 || insuranceOnly) && (
                <View style={styles.activeFilters}>
                  {search && (
                    <Text style={styles.activeFilterTag}>Name: {truncateText(search, 20)}</Text>
                  )}
                  {selectedSpecializations.length > 0 && (
                    <Text style={styles.activeFilterTag}>
                      Specialization: {truncateText(selectedSpecializations.join(', '), 20)}
                    </Text>
                  )}
                  {insuranceOnly && (
                    <Text style={styles.activeFilterTag}>Insurance Accepted</Text>
                  )}
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={handleClearFilters}
                    accessibilityLabel="Clear all filters"
                    accessibilityHint="Resets all search and filter criteria"
                  >
                    <Text style={styles.clearFiltersButtonText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>

          <Modal
            visible={showFilterModal}
            transparent
            animationType="none"
            onRequestClose={() => setShowFilterModal(false)}
          >
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKeyboardAvoiding}
              >
                <Animated.View
                  style={[
                    styles.filterModal,
                    {
                      transform: [
                        {
                          translateY: filterModalAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [height, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.filterModalHeader}>
                    <Text style={styles.filterModalTitle}>Filter Clinics</Text>
                    <TouchableOpacity
                      onPress={() => setShowFilterModal(false)}
                      accessibilityLabel="Close filter modal"
                      accessibilityHint="Closes the filter options"
                    >
                      <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>Specializations</Text>
                    <ScrollView
                      style={styles.specializationList}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {SPECIALIZATIONS.map((spec) => (
                        <TouchableOpacity
                          key={spec}
                          style={styles.specializationFilter}
                          onPress={() => toggleSpecialization(spec)}
                          accessibilityLabel={`Toggle ${spec} specialization`}
                          accessibilityHint={`Selects or deselects ${spec} for filtering clinics`}
                        >
                          <View
                            style={[
                              styles.checkmark,
                              selectedSpecializations.includes(spec) && styles.checkmarkChecked,
                            ]}
                          >
                            {selectedSpecializations.includes(spec) && (
                              <Text style={styles.checkmarkText}>✓</Text>
                            )}
                          </View>
                          <Text style={styles.specializationText}>{spec}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.filterGroup}>
                    <TouchableOpacity
                      style={styles.insuranceFilter}
                      onPress={() => setInsuranceOnly(!insuranceOnly)}
                      accessibilityLabel="Toggle insurance filter"
                      accessibilityHint="Filters clinics that accept insurance"
                    >
                      <View style={[styles.checkmark, insuranceOnly && styles.checkmarkChecked]}>
                        {insuranceOnly && <Text style={styles.checkmarkText}>✓</Text>}
                      </View>
                      <Text style={styles.insuranceFilterText}>Insurance Accepted Only</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.filterModalButtons}>
                    <TouchableOpacity
                      style={[styles.applyFilterButton, styles.clearFilterButton]}
                      onPress={handleClearFilters}
                      accessibilityLabel="Clear filters"
                      accessibilityHint="Resets all filter criteria and fetches all clinics"
                    >
                      <Text style={styles.clearFilterButtonText}>Clear Filters</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.applyFilterButton}
                      onPress={() => {
                        handleSearch();
                        setShowFilterModal(false);
                      }}
                      accessibilityLabel="Apply filters"
                      accessibilityHint="Applies the selected filters and searches clinics"
                    >
                      <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </KeyboardAvoidingView>
            </View>
          </Modal>

          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {clinics.length} {clinics.length === 1 ? 'Clinic' : 'Clinics'} Found
              </Text>
              <Text style={styles.resultsSubtitle}>Choose the best healthcare provider for you</Text>
            </View>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <View
              style={[
                styles.clinicCardsGrid,
                { minHeight: clinics.length > 0 ? Math.ceil(clinics.length / CLINICS_PER_PAGE) * 200 : 0 },
              ]}
            >
              {clinics.length > 0 ? (
                clinics.slice(0, currentPage * CLINICS_PER_PAGE).map((clinic, index) => {
                  const { avg, count } = getStarRating(clinic.feedbacks);
                  const anim = cardAnims.get(clinic.id) || new Animated.Value(1);
                  return (
                    <Animated.View
                      key={`clinic-${clinic.id}-${index}`}
                      style={[
                        styles.clinicCard,
                        {
                          opacity: anim,
                          transform: [
                            {
                              translateY: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.clinicCardContent}
                        onPress={() => navigation.navigate('ClinicDetail', { clinicId: clinic.id })}
                        accessibilityLabel={`View details for ${clinic.name || clinic.user?.userName || 'Unnamed Clinic'}`}
                        accessibilityHint="Navigates to the clinic details screen"
                      >
                        <Image
                          source={{
                            uri: clinic.imageUrl?.fileUrl || 'https://via.placeholder.com/100',
                          }}
                          style={styles.clinicImage}
                        />
                        <View style={styles.clinicInfo}>
                          <Text style={styles.clinicName}>
                            {clinic.name || clinic.user?.userName || 'Unnamed Clinic'}
                          </Text>
                          <View style={styles.clinicRating}>
                            {renderStars(avg)}
                            <Text style={styles.ratingScore}>{avg.toFixed(1)}</Text>
                            <Text style={styles.ratingCount}>({count} reviews)</Text>
                          </View>
                          <Text style={styles.clinicDescription}>
                            {truncateText(clinic.description)}
                          </Text>
                          <View style={styles.clinicDetails}>
                            <View style={styles.clinicDetailItem}>
                              <Icon name="map-marker" size={16} color="#04668D" />
                              <Text style={styles.clinicAddressLink}>
                                {truncateText(clinic.address, 50)}
                              </Text>
                            </View>
                            <View style={styles.clinicDetailItem}>
                              <Icon name="phone" size={16} color="#04668D" />
                              <TouchableOpacity
                                onPress={() => handleCall(clinic.user?.phoneNo)}
                                accessibilityLabel={`Call ${clinic.user?.phoneNo || 'Unnamed Clinic'}`}
                                accessibilityHint="Initiates a phone call to the clinic"
                                style={styles.phoneTouchable}
                              >
                                <Text style={styles.phoneText}>{clinic.user?.phoneNo || 'N/A'}</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={styles.clinicDetailItem}>
                              <Icon name="stethoscope" size={16} color="#04668D" />
                              <Text>{clinic.specializations || 'General Practice'}</Text>
                            </View>
                          </View>
                          <View style={styles.clinicBadges}>
                            {avg > 4 && (
                              <Text style={[styles.clinicBadge, styles.badgePremium]}>
                                ⭐ Top Rated
                              </Text>
                            )}
                            {clinic.isInsuranceAccepted && (
                              <Text style={[styles.clinicBadge, styles.badgeInsurance]}>
                                ✓ Insurance
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })
              ) : (
                <View style={styles.noClinicsContainer}>
                  <Icon name="stethoscope" size={60} color="#6B7280" />
                  <Text style={styles.noClinicsTitle}>No Clinics Found</Text>
                  <Text style={styles.noClinicsText}>
                    Try adjusting your search criteria or removing filters
                  </Text>
                </View>
              )}
            </View>
            {clinics.length > 0 && clinics.length <= currentPage * CLINICS_PER_PAGE && !isLoadingMore && (
              <View style={styles.noMoreClinicsContainer}>
                <Text style={styles.noMoreClinicsText}>No more clinics available</Text>
              </View>
            )}
            {isLoadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#04668D" />
                <Text style={styles.loadingMoreText}>Loading more clinics...</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Animated.View style={[styles.contactIcon, { transform: [{ scale: contactIconScale }] }]}>
        <TouchableOpacity
          onPress={handleContactIconPress}
          accessibilityLabel="Open chat"
          accessibilityHint="Opens the chat support window"
        >
          <Text style={styles.contactIconText}>💬</Text>
        </TouchableOpacity>
      </Animated.View>
      <Modal
        visible={isChatOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsChatOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} navigation={navigation} />
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    minHeight: '100%',
  },
  heroSection: {
    backgroundColor: '#04668D',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 32,
  },
  heroAccent: {
    color: '#E6F0FA',
  },
  heroDescription: {
    fontSize: 16,
    color: '#E6F0FA',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 24,
    maxWidth: 320,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1E3A5F',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  filterButton: {
    padding: 10,
    marginHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  searchButton: {
    backgroundColor: '#02808F',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  activeFilterTag: {
    backgroundColor: '#E6F0FA',
    color: '#02808F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  clearFiltersButton: {
    backgroundColor: '#FFF1F1',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardAvoiding: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  specializationList: {
    maxHeight: 150,
  },
  specializationFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  specializationText: {
    fontSize: 16,
    color: '#1E3A5F',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkmarkChecked: {
    backgroundColor: '#02808F',
    borderColor: '#02808F',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  insuranceFilter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insuranceFilterText: {
    fontSize: 16,
    color: '#1E3A5F',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  filterModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  applyFilterButton: {
    backgroundColor: '#02808F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  clearFilterButton: {
    backgroundColor: '#FFF1F1',
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  applyFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  clearFilterButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  resultsSection: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  resultsCount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A5F',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF1F1',
    borderRadius: 10,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  clinicCardsGrid: {
    marginBottom: 0,
  },
  clinicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  clinicCardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  clinicImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  clinicRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  star: {
    fontSize: 14,
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  ratingCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  clinicDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  clinicDetails: {
    marginBottom: 4,
  },
  clinicDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clinicAddressLink: {
    color: '#02808F',
    fontSize: 14,
    marginLeft: 8,
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  phoneTouchable: {
    marginLeft: 8,
  },
  phoneText: {
    fontSize: 14,
    color: '#02808F',
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  clinicBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  clinicBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  badgePremium: {
    backgroundColor: '#FFF8E1',
    color: '#1E3A5F',
  },
  badgeInsurance: {
    backgroundColor: '#E6F0FA',
    color: '#02808F',
  },
  noClinicsContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noClinicsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  noClinicsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  noMoreClinicsContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noMoreClinicsText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingMoreContainer: {
    alignItems: 'center',
    padding: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  contactIcon: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: '#2e6da4',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  contactIconText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#1E3A5F',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  toastText1: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  toastText2: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default ConsultationScreen;