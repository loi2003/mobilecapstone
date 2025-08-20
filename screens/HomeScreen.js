import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, logout } from '../api/auth';
import { homepageData } from '../data/homepageData';
import { chartData } from '../data/chartData';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Header Component (Exported)
export const Header = ({ navigation, user, setUser, handleLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = new Animated.Value(-width);

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
            color="#feffe9"
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
        </Animated.View>
      </View>
    </View>
  );
};

// Footer Component (Exported)
export const Footer = ({ navigation }) => {
  const footerLinks = [
    { name: 'About Us', route: 'About' },
    { name: 'Privacy Policy', route: 'Privacy' }, // Placeholder, not in AppNavigator
    { name: 'Terms of Service', route: 'Terms' }, // Placeholder, not in AppNavigator
    { name: 'Contact Us', route: 'Contact' }, // Placeholder, to be implemented
  ];

  const socialLinks = [
    { name: 'Twitter', url: 'https://twitter.com', icon: 'logo-twitter' },
    { name: 'Facebook', url: 'https://facebook.com', icon: 'logo-facebook' },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: 'logo-linkedin' },
  ];

  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = () => {
    console.log('Newsletter subscription:', email);
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

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const scrollRef = useRef(null);
  const prevIndexRef = useRef(-1);

  const pregnancyData = chartData.weeks;
  const itemWidth = 80;
  const scaleAnims = useRef(pregnancyData.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const response = await getCurrentUser(token);
          console.log('User data:', response.data);
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        navigation.replace('Login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();

    Animated.timing(fadeAnim, {
      toValue: isContactPopupOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [navigation, isContactPopupOpen]);

  useEffect(() => {
    if (prevIndexRef.current !== -1) {
      Animated.timing(scaleAnims[prevIndexRef.current], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    if (selectedIndex !== -1) {
      Animated.timing(scaleAnims[selectedIndex], {
        toValue: 1.5,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    prevIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const handlePrevWeek = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      setSelectedWeek(pregnancyData[newIndex]);
      scrollRef.current.scrollTo({ x: newIndex * itemWidth, animated: true });
    }
  };

  const handleNextWeek = () => {
    if (selectedIndex < pregnancyData.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      setSelectedWeek(pregnancyData[newIndex]);
      scrollRef.current.scrollTo({ x: newIndex * itemWidth, animated: true });
    }
  };

  const handleLogout = async () => {
    try {
      const userId = user?.data?.id;
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        console.error('No auth token found');
        await AsyncStorage.removeItem('authToken');
        navigation.replace('Login');
        return;
      }

      await logout(userId, token);
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
      console.log('✅ Logout thành công cho userId:', userId);
    } catch (error) {
      console.error('❌ Logout failed:', error.response?.data || error);
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{homepageData.hero.title}</Text>
            <Text style={styles.heroTagline}>{homepageData.hero.tagline}</Text>
            <Text style={styles.heroSubtitle}>{homepageData.hero.subtitle}</Text>
            <Text style={styles.heroQuote}>{homepageData.hero.quote}</Text>
            <View style={styles.heroButtons}>
              <TouchableOpacity
                style={[styles.heroButton, styles.primaryButton]}
                onPress={() => navigation.navigate('Explore')}
              >
                <Text style={styles.buttonText}>{homepageData.hero.cta}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroButton, styles.secondaryButton]}
                onPress={() => navigation.navigate(homepageData.hero.secondaryCtaLink)}
              >
                <Text style={styles.buttonText}>{homepageData.hero.secondaryCta}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroButton, styles.videoButton]}
                onPress={() => navigation.navigate(homepageData.hero.videoLink)}
              >
                <Text style={styles.buttonText}>{homepageData.hero.videoText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Pregnancy Features</Text>
          <Text style={styles.sectionDescription}>Discover the tools and support we offer for your pregnancy journey.</Text>
          <View style={styles.featuresContainer}>
            {homepageData.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pregnancy Tracker Section */}
        <View style={styles.pregnancyTrackerSection}>
          <Text style={styles.sectionTitle}>{homepageData.pregnancyTracker.title}</Text>
          <Text style={styles.sectionDescription}>{homepageData.pregnancyTracker.description}</Text>
          <View style={styles.trackerChartContainer}>
            <TouchableOpacity
              style={[styles.navButton, styles.leftButton, selectedIndex === 0 && styles.disabledButton]}
              onPress={handlePrevWeek}
              disabled={selectedIndex === 0}
            >
              <Text style={styles.navButtonText}>←</Text>
            </TouchableOpacity>
            <ScrollView
              horizontal
              style={styles.chartWrapper}
              ref={scrollRef}
              showsHorizontalScrollIndicator={false}
            >
              <View style={styles.timeline}>
                <View
                  style={[
                    styles.timelineFullLine,
                    { width: (pregnancyData.length - 1) * itemWidth, left: itemWidth / 2 },
                  ]}
                />
                {pregnancyData.map((data, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.timelineItem}
                    onPress={() => {
                      setSelectedWeek(data);
                      setSelectedIndex(index);
                    }}
                  >
                    <Animated.View
                      style={[
                        styles.timelineNode,
                        selectedWeek?.week === data.week && styles.selectedNode,
                        { transform: [{ scale: scaleAnims[index] }] },
                      ]}
                    />
                    <Text style={styles.timelineWeek}>{data.week}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.rightButton,
                selectedIndex === pregnancyData.length - 1 && styles.disabledButton,
              ]}
              onPress={handleNextWeek}
              disabled={selectedIndex === pregnancyData.length - 1}
            >
              <Text style={styles.navButtonText}>→</Text>
            </TouchableOpacity>
          </View>
          {selectedWeek && (
            <View style={styles.weekPopup}>
              <Text style={styles.weekPopupTitle}>{selectedWeek.week}</Text>
              <Text style={styles.weekPopupSubtitle}>{selectedWeek.title}</Text>
              <Text style={styles.weekPopupDescription}>{selectedWeek.description}</Text>
              <Text style={styles.weekPopupTip}>
                <Text style={styles.bold}>Mẹo:</Text> {selectedWeek.tip}
              </Text>
              <TouchableOpacity
                style={styles.weekPopupButton}
                onPress={() => navigation.navigate('PregnancyTracking')}
              >
                <Text style={styles.buttonText}>Để biết thêm thông tin chi tiết, vui lòng chọn tại đây</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.weekPopupClose}
                onPress={() => {
                  setSelectedWeek(null);
                  setSelectedIndex(-1);
                }}
              >
                <Text style={styles.buttonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.trackerButton}
            onPress={() => navigation.navigate(homepageData.pregnancyTracker.ctaLink)}
          >
            <Text style={styles.buttonText}>{homepageData.pregnancyTracker.cta}</Text>
          </TouchableOpacity>
        </View>

        {/* Testimonials Section */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.sectionTitle}>What Our Community Says</Text>
          <Text style={styles.sectionDescription}>Hear from other moms about their experiences.</Text>
          <ScrollView horizontal style={styles.testimonialsContainer}>
            {homepageData.testimonials.map((testimonial, index) => (
              <View key={index} style={styles.testimonialItem}>
                <Image source={{ uri: testimonial.avatar }} style={styles.testimonialAvatar} />
                <Text style={styles.testimonialName}>{testimonial.name}</Text>
                <Text style={styles.testimonialFeedback}>{testimonial.feedback}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Community Section */}
        <View style={styles.communitySection}>
          <Text style={styles.sectionTitle}>{homepageData.community.title}</Text>
          <Text style={styles.sectionDescription}>{homepageData.community.description}</Text>
          <Text style={styles.communityHighlight}>{homepageData.community.highlight}</Text>
          <TouchableOpacity
            style={styles.communityButton}
            onPress={() => navigation.navigate(homepageData.community.ctaLink)}
          >
            <Text style={styles.buttonText}>{homepageData.community.cta}</Text>
          </TouchableOpacity>
        </View>

        {/* Resources Section */}
        <View style={styles.resourcesSection}>
          <Text style={styles.sectionTitle}>{homepageData.resources.title}</Text>
          <Text style={styles.sectionDescription}>{homepageData.resources.description}</Text>
          {homepageData.resources.items.map((resource, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resourceItem}
              onPress={() => navigation.navigate(resource.link)}
            >
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text style={styles.resourceDescription}>{resource.description}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.resourcesButton}
            onPress={() => navigation.navigate(homepageData.resources.ctaLink)}
          >
            <Text style={styles.buttonText}>{homepageData.resources.cta}</Text>
          </TouchableOpacity>
        </View>

        {/* Health Tips Section */}
        <View style={styles.healthTipsSection}>
          <Text style={styles.sectionTitle}>{homepageData.healthTips.title}</Text>
          <Text style={styles.sectionDescription}>{homepageData.healthTips.description}</Text>
          {homepageData.healthTips.items.map((tip, index) => (
            <View key={index} style={styles.healthTipItem}>
              <Text style={styles.healthTipTitle}>{tip.trimester}</Text>
              {tip.tips.map((item, idx) => (
                <Text key={idx} style={styles.healthTipText}>• {item}</Text>
              ))}
            </View>
          ))}
          <TouchableOpacity
            style={styles.healthTipsButton}
            onPress={() => navigation.navigate(homepageData.healthTips.ctaLink)}
          >
            <Text style={styles.buttonText}>{homepageData.healthTips.cta}</Text>
          </TouchableOpacity>
        </View>

        {/* Partners Section */}
        <View style={styles.partnersSection}>
          <Text style={styles.sectionTitle}>{homepageData.partners.title}</Text>
          <Text style={styles.sectionDescription}>{homepageData.partners.description}</Text>
          <View style={styles.partnersContainer}>
            {homepageData.partners.items.map((partner, index) => (
              <TouchableOpacity
                key={index}
                style={styles.partnerItem}
                onPress={() => Linking.openURL(partner.link)}
              >
                <Image source={{ uri: partner.logo }} style={styles.partnerLogo} />
                <Text style={styles.partnerName}>{partner.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Footer navigation={navigation} />
      </ScrollView>

      {/* Contact Icon */}
      <TouchableOpacity
        style={styles.contactIcon}
        onPress={() => setIsContactPopupOpen(!isContactPopupOpen)}
      >
        <Text style={styles.contactIconText}>💬</Text>
      </TouchableOpacity>

      {/* Contact Popup */}
      {isContactPopupOpen && (
        <Animated.View style={[styles.contactPopup, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.popupButton}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={styles.buttonText}>Liên Hệ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.popupButton}
            onPress={() => navigation.navigate('Assessment')}
          >
            <Text style={styles.buttonText}>Kiểm Tra Sức Khỏe</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

// Styles (unchanged)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    paddingBottom: 20,
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
    color: '#feffe9',
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
    color: '#feffe9',
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
  footerLinks: {
    flexDirection: 'column',
    gap: 12,
  },
  footerLink: {
    fontSize: 14,
    color: '#555',
    textDecorationLine: 'none',
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
    padding: 20,
    paddingTop: 90,
    backgroundColor: '#e0f2f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroTagline: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1e3a5f',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#1e3a5f',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#1e3a5f',
    marginBottom: 20,
    textAlign: 'center',
  },
  heroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  heroButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    margin: 5,
  },
  primaryButton: {
    backgroundColor: '#04668D',
    borderWidth: 2,
    borderColor: '#2e6da4',
  },
  secondaryButton: {
    backgroundColor: '#04668D',
    borderWidth: 2,
    borderColor: '#2e6da4',
  },
  videoButton: {
    backgroundColor: '#04668D',
    borderWidth: 2,
    borderColor: '#2e6da4',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  featuresSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  featureItem: {
    width: width * 0.4,
    padding: 15,
    backgroundColor: '#feffe9',
    borderRadius: 12,
    alignItems: 'center',
    margin: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  featureIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  pregnancyTrackerSection: {
    padding: 20,
    backgroundColor: '#feffe9',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: width * 0.9,
  },
  trackerChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#feffe9',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  chartWrapper: {
    flex: 1,
    paddingHorizontal: 10,
  },
  timeline: {
    flexDirection: 'row',
    position: 'relative',
  },
  timelineFullLine: {
    position: 'absolute',
    top: 10,
    height: 4,
    backgroundColor: '#6b9fff',
  },
  timelineItem: {
    width: 80,
    alignItems: 'center',
  },
  timelineNode: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6b9fff',
  },
  selectedNode: {
    backgroundColor: '#ff6b6b',
  },
  timelineWeek: {
    marginTop: 5,
    fontSize: 12,
    color: '#333',
  },
  navButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftButton: {
    marginRight: 10,
  },
  rightButton: {
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#6b9fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  weekPopup: {
    backgroundColor: '#feffe9',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    width: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  weekPopupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b9fff',
    marginBottom: 10,
  },
  weekPopupSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  weekPopupDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  weekPopupTip: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  bold: {
    fontWeight: '600',
  },
  weekPopupButton: {
    backgroundColor: '#6b9fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    minWidth: 250,
    alignItems: 'center',
  },
  weekPopupClose: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 250,
    alignItems: 'center',
  },
  trackerButton: {
    backgroundColor: '#6b9fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
  },
  testimonialsSection: {
    padding: 20,
    backgroundColor: '#e0f2f7',
    alignItems: 'center',
  },
  testimonialsContainer: {
    marginTop: 20,
  },
  testimonialItem: {
    width: width * 0.7,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 10,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  testimonialAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  testimonialFeedback: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  communitySection: {
    padding: 20,
    backgroundColor: '#feffe9',
    alignItems: 'center',
  },
  communityHighlight: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  communityButton: {
    backgroundColor: '#2e6da4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  resourcesSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  resourceItem: {
    width: '90%',
    padding: 15,
    backgroundColor: '#feffe9',
    borderRadius: 12,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#555',
  },
  resourcesButton: {
    backgroundColor: '#2e6da4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 10,
  },
  healthTipsSection: {
    padding: 20,
    backgroundColor: '#e0f2f7',
    alignItems: 'center',
  },
  healthTipItem: {
    width: '90%',
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  healthTipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  healthTipText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  healthTipsButton: {
    backgroundColor: '#2e6da4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 10,
  },
  partnersSection: {
    padding: 20,
    backgroundColor: '#feffe9',
    alignItems: 'center',
  },
  partnersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  partnerItem: {
    width: width * 0.4,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    margin: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  partnerLogo: {
    width: 100,
    height: 50,
    marginBottom: 10,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  contactIcon: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    backgroundColor: '#2e6da4',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  contactIconText: {
    fontSize: 24,
    color: '#ffffff',
  },
  contactPopup: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
      },
      android: {
        elevation: 5,
      },
    }),
    width: 220,
  },
  popupButton: {
    backgroundColor: '#2e6da4',
    padding: 14,
    marginVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
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
  },
});

export default HomeScreen;