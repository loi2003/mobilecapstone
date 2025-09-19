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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllClinics, getClinicsByName } from '../api/clinic-api';
import { getCurrentUser, logout } from '../api/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatBox from './ChatBox';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CLINICS_PER_PAGE = 6;

const getStarRating = (feedbacks) => {
  if (!feedbacks || feedbacks.length === 0) {
    return { avg: 0, stars: 0, count: 0 };
  }
  const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
  const avg10 = sum / feedbacks.length;
  const avg5 = avg10 / 2;
  return { avg: avg5, stars: avg5, count: feedbacks.length };
};

const truncateText = (text, maxLength = 120) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

// Header Component
const Header = ({ navigation, user, setUser, handleLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: 'About', route: 'About', title: 'About Us' },
    { name: 'DueDate Calculator', route: 'DueDateCalculator', title: 'DueDate Calculator' },
    { name: 'Pregnancy', route: 'PregnancyTracking', title: 'Pregnancy Tracking' },
    { name: 'Nutrition', route: 'NutritionalGuidance', title: 'Nutritional Guidance' },
    { name: 'Consultation', route: 'Consultation', title: 'Consultation' },
    { name: 'Blog', route: 'Blog', title: 'Blog' },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.logo}>NestlyCare</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuToggle}
          onPress={toggleMenu}
          accessibilityLabel="Toggle navigation"
        >
          <Ionicons
            name={isMenuOpen ? 'close' : 'menu'}
            size={24}
            color="#FFFFFFFF"
          />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.navLinks,
            { transform: [{ translateX: slideAnim }], display: isMenuOpen ? 'flex' : 'none' },
          ]}
        >
          {navLinks.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.navLink}
              onPress={() => {
                navigation.navigate(link.route);
                setIsMenuOpen(false);
              }}
            >
              <Text style={styles.navLinkText}>{link.name}</Text>
            </TouchableOpacity>
          ))}
          {user && (
            <TouchableOpacity
              style={styles.navLink}
              onPress={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
            >
              <Text style={styles.navLinkText}>Logout</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

// Footer Component
const Footer = ({ navigation }) => {
  const footerLinks = [
    { name: 'About Us', route: 'About' },
    { name: 'Privacy Policy', route: 'Privacy' },
    { name: 'Terms of Service', route: 'Terms' },
    { name: 'Contact Us', route: 'Contact' },
  ];

  const socialLinks = [
    { name: 'Twitter', url: 'https://twitter.com', icon: 'logo-twitter' },
    { name: 'Facebook', url: 'https://facebook.com', icon: 'logo-facebook' },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: 'logo-linkedin' },
  ];

  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = () => {
    setEmail('');
  };

  return (
    <View style={styles.footer}>
      <View style={styles.footerContainer}>
        <View style={styles.footerSection}>
          <Text style={styles.footerSectionTitle}>Contact</Text>
          <Text style={styles.footerText}>Email: support@genderhealthweb.com</Text>
          <Text style={styles.footerText}>Phone: (123) 456-7890</Text>
        </View>
        <View style={styles.footerSection}>
          <Text style={styles.footerSectionTitle}>Follow Us</Text>
          <View style={styles.socialLinks}>
            {socialLinks.map((social, index) => (
              <TouchableOpacity
                key={index}
                style={styles.socialLink}
                onPress={() => Linking.openURL(social.url)}
              >
                <Ionicons name={social.icon} size={20} color="#ffffff" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.footerSection}>
          <Text style={styles.footerSectionTitle}>Stay Updated</Text>
          <View style={styles.newsletterForm}>
            <TextInput
              style={styles.newsletterInput}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.newsletterButton}
              onPress={handleNewsletterSubmit}
            >
              <Text style={styles.buttonText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Text style={styles.footerCopyright}>
        © {new Date().getFullYear()} GenderHealthWeb. All rights reserved.
      </Text>
    </View>
  );
};

const ConsultationScreen = ({ navigation }) => {
  const [clinics, setClinics] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [insuranceOnly, setInsuranceOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [token, setToken] = useState(null);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([]).current;

  useEffect(() => {
    const fetchUserAndToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (!storedToken || !navigation) {
          setError('Please log in to view clinics.');
          if (navigation) navigation.replace('Login');
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
        if (navigation) navigation.replace('Login');
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
  }, [navigation]);

  useEffect(() => {
    // Initialize animations only for new clinics
    const currentClinicCount = clinics.length;
    const visibleClinicCount = currentPage * CLINICS_PER_PAGE;
    // Add new animation values only for newly visible clinics
    while (cardAnims.length < Math.min(currentClinicCount, visibleClinicCount)) {
      cardAnims.push(new Animated.Value(0));
    }

    // Animate only the newly visible clinics
    const startIndex = (currentPage - 1) * CLINICS_PER_PAGE;
    const endIndex = Math.min(currentPage * CLINICS_PER_PAGE, currentClinicCount);
    for (let i = startIndex; i < endIndex; i++) {
      if (cardAnims[i]) {
        Animated.timing(cardAnims[i], {
          toValue: 1,
          duration: 500,
          delay: (i % CLINICS_PER_PAGE) * 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    }

    Animated.timing(filterAnim, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Debug logging

  }, [clinics, showFilters, currentPage]);

  const fetchClinics = async (authToken) => {
    try {
      const data = await getAllClinics(authToken);
      const clinicData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setClinics(clinicData);
      // Reset animations
      cardAnims.length = 0;
      clinicData.forEach(() => cardAnims.push(new Animated.Value(0)));
    } catch (err) {
      console.error('Fetch Clinics Error:', err);
      setError(`Failed to fetch clinics: ${err.message}`);
      setClinics([]);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (!search.trim() && !specialization && !insuranceOnly) {
        data = await getAllClinics(token);
      } else {
        data = await getClinicsByName({ nameOrAddress: search, specialization, insuranceOnly }, token);
      }
      const clinicData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setClinics(clinicData);
      setCurrentPage(1);
      // Reset animations
      cardAnims.length = 0;
      clinicData.forEach(() => cardAnims.push(new Animated.Value(0)));
    } catch (err) {
      console.error('Search Error:', err);
      setError(`Failed to search clinics: ${err.message}`);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const userId = user?.data?.id;
      await logout(userId, token);
      await AsyncStorage.removeItem('authToken');
      if (navigation) navigation.replace('Login');
    } catch (error) {
      console.error('Logout failed:', error);
      await AsyncStorage.removeItem('authToken');
      if (navigation) navigation.replace('Login');
    }
  };

  const clinicsToShow = clinics.slice(0, currentPage * CLINICS_PER_PAGE);
  const hasMore = clinicsToShow.length < clinics.length;

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
                color: i < filled ? '#f7b801' : i === filled && half ? '#f7b801' : '#ccc',
              },
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D7AA5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 70, minHeight: Dimensions.get('window').height }]}>
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
              Find Your Perfect <Text style={styles.heroAccent}>Healthcare Partner</Text>
            </Text>
            <Text style={styles.heroDescription}>
              Discover trusted clinics with verified ratings and comprehensive healthcare services.
            </Text>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputGroup}>
                <Icon name="search" size={20} color="#02808F" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search clinics by name or location..."
                  placeholderTextColor="#848785"
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={handleSearch}
                />
              </View>
              <TouchableOpacity
                style={styles.filterToggle}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Icon name="filter" size={16} color="#013f50" />
                <Text style={styles.filterToggleText}>Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Icon name="search" size={16} color="#fff" />
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
            {showFilters && (
              <Animated.View
                style={[
                  styles.filtersPanel,
                  {
                    opacity: filterAnim,
                    height: filterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }),
                  },
                ]}
              >
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Specialization</Text>
                  <View style={styles.filterSelect}>
                    <TextInput
                      style={styles.filterSelectInput}
                      placeholder="All Specializations"
                      value={specialization}
                      onChangeText={setSpecialization}
                    />
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <TouchableOpacity
                    style={styles.insuranceFilter}
                    onPress={() => setInsuranceOnly(!insuranceOnly)}
                  >
                    <View style={[styles.checkmark, insuranceOnly && styles.checkmarkChecked]}>
                      {insuranceOnly && <Text style={styles.checkmarkText}>✓</Text>}
                    </View>
                    <Text style={styles.insuranceFilterText}>Insurance Accepted Only</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>
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
          <View style={styles.clinicCardsGrid}>
            {clinicsToShow.length > 0 ? (
              clinicsToShow.map((clinic, index) => {
                const { avg, count } = getStarRating(clinic.feedbacks);
                const consultantCount = clinic.consultants ? clinic.consultants.length : 0;
                const doctorCount = clinic.doctors ? clinic.doctors.length : 0;

                return (
                  <Animated.View
                    key={`clinic-${clinic.id}-${index}`} // Unique key to ensure re-rendering
                    style={[
                      styles.clinicCard,
                      {
                        opacity: cardAnims[index] || 1,
                        transform: [
                          {
                            translateY: (cardAnims[index] || new Animated.Value(1)).interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0],
                            }),
                          },
                        ],
                      },
                      ]}
                    >
                    <View style={styles.clinicCardHeader}>
                      <View style={styles.clinicImageContainer}>
                        <Image
                          source={{
                            uri: clinic.imageUrl?.fileUrl || 'https://via.placeholder.com/80',
                          }}
                          style={styles.clinicImage}
                        />
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
                      <View style={styles.clinicHeaderInfo}>
                        <Text style={styles.clinicName}>{clinic.name}</Text>
                        <View style={styles.clinicRating}>
                          {renderStars(avg)}
                          <Text style={styles.ratingScore}>{avg.toFixed(1)}</Text>
                          <Text style={styles.ratingCount}>({count} reviews)</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.clinicCardBody}>
                      <Text style={styles.clinicDescription}>
                        {truncateText(clinic.description)}
                      </Text>
                      <View style={styles.clinicDetails}>
                        <View style={styles.clinicDetailItem}>
                          <Icon name="map-marker" size={16} color="#02808F" />
                          <Text
                            style={styles.clinicAddressLink}
                            onPress={() =>
                              Linking.openURL(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  clinic.address
                                )}`
                              )
                            }
                          >
                            {clinic.address}
                          </Text>
                        </View>
                        <View style={styles.clinicDetailItem}>
                          <Icon name="phone" size={16} color="#02808F" />
                          <Text>{clinic.user?.phoneNo || 'N/A'}</Text>
                        </View>
                        <View style={styles.clinicDetailItem}>
                          <Icon name="stethoscope" size={16} color="#02808F" />
                          <Text>{clinic.specializations || 'General Practice'}</Text>
                        </View>
                        <View style={styles.clinicStats}>
                          <View style={styles.statItem}>
                            <Icon name="user-md" size={14} color="#00A996" />
                            <Text style={styles.statText}>{doctorCount} Doctors</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Icon name="user-md" size={14} color="#00A996" />
                            <Text style={styles.statText}>{consultantCount} Consultants</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.clinicCardFooter}>
                      <TouchableOpacity
                        style={styles.clinicSelectBtn}
                        onPress={() => navigation?.navigate('ClinicDetail', { clinicId: clinic.id })}
                      >
                        <Text style={styles.clinicSelectBtnText}>View Details & Book</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                );
              })
            ) : (
              !loading && (
                <View style={styles.noClinicsContainer}>
                  <Icon name="stethoscope" size={60} color="#848785" />
                  <Text style={styles.noClinicsTitle}>No Clinics Found</Text>
                  <Text style={styles.noClinicsText}>
                    Try adjusting your search criteria or removing filters
                  </Text>
                </View>
              )
            )}
          </View>
          {hasMore && (
            <View style={styles.loadMoreContainer}>
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => {
                  setCurrentPage((prev) => {
                    const newPage = prev + 1;

                    return newPage;
                  });
                }}
              >
                <Text style={styles.loadMoreBtnText}>Load More Clinics</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Footer navigation={navigation} />
      </ScrollView>
      <TouchableOpacity style={styles.chatFab} onPress={() => setIsChatOpen(true)}>
        <Icon name="comment" size={24} color="#fff" />
      </TouchableOpacity>
      <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    backgroundColor: '#04668D',
    paddingHorizontal: 8,
    paddingVertical: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 70,
  },
  headerContainer: {
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: '100%',
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFFFF',
    textDecorationLine: 'none',
  },
  menuToggle: {
    padding: 6,
  },
  navLinks: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#04668D',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    zIndex: 1002,
    height: Dimensions.get('window').height - 70,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  navLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  navLinkText: {
    color: '#FFFFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#f5f7fa',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 20,
  },
  footerSection: {
    flex: 1,
    minWidth: 250,
    alignItems: 'center',
  },
  footerSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 15,
  },
  footerText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 15,
  },
  socialLink: {
    width: 40,
    height: 40,
    backgroundColor: '#6b9fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsletterForm: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    maxWidth: 300,
  },
  newsletterInput: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    width: '100%',
  },
  newsletterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6b9fff',
    borderRadius: 12,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  heroSection: {
    backgroundColor: '#0D7AA5',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 16,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fafafa',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  heroAccent: {
    color: '#f9fbcf',
  },
  heroDescription: {
    fontSize: 16,
    color: 'rgba(250, 249, 245, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    maxWidth: 300,
  },
  searchContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    elevation: 5,
    shadowColor: '#04668D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  searchInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f4f4f4',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#013f50',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#f4f4f4',
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#013f50',
    marginLeft: 8,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D7AA5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    elevation: 3,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  filtersPanel: {
    marginTop: 16,
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#f4f4f4',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#013f50',
    marginBottom: 8,
  },
  filterSelect: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#f4f4f4',
    padding: 10,
  },
  filterSelectInput: {
    fontSize: 16,
    color: '#013f50',
  },
  insuranceFilter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#f4f4f4',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkmarkChecked: {
    backgroundColor: '#0D7AA5',
    borderColor: '#0D7AA5',
  },
  checkmarkText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  insuranceFilterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#013f50',
  },
  resultsSection: {
    padding: 16,
    marginTop: -40,
  },
  resultsHeader: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#04668D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  resultsCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#04668D',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#848785',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fe6b6a',
  },
  clinicCardsGrid: {
    marginBottom: 16,
  },
  clinicCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#04668D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  clinicCardHeader: {
    padding: 16,
  },
  clinicImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  clinicImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  clinicBadges: {
    position: 'absolute',
    top: -10,
    right: -10,
    alignItems: 'flex-end',
  },
  clinicBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  badgePremium: {
    backgroundColor: '#ffd700',
    color: '#013f50',
  },
  badgeInsurance: {
    backgroundColor: '#0D7AA5',
    color: '#fff',
  },
  clinicHeaderInfo: {
    alignItems: 'center',
  },
  clinicName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#04668D',
    marginBottom: 8,
  },
  clinicRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  star: {
    fontSize: 16,
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#04668D',
  },
  ratingCount: {
    fontSize: 12,
    color: '#848785',
    marginLeft: 4,
  },
  clinicCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  clinicDescription: {
    fontSize: 14,
    color: '#848785',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  clinicDetails: {
    marginBottom: 12,
  },
  clinicDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clinicAddressLink: {
    color: '#02808F',
    fontSize: 14,
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  clinicStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f4',
    paddingTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#848785',
    marginLeft: 4,
  },
  clinicCardFooter: {
    padding: 12,
  },
  clinicSelectBtn: {
    backgroundColor: '#02808F',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 3,
  },
  clinicSelectBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  noClinicsContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    elevation: 2,
  },
  noClinicsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#04668D',
    marginTop: 12,
  },
  noClinicsText: {
    fontSize: 14,
    color: '#848785',
    textAlign: 'center',
    marginTop: 8,
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  loadMoreBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#02808F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
  },
  loadMoreBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#02808F',
  },
  chatFab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    backgroundColor: '#4F94AF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#04668D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ConsultationScreen;