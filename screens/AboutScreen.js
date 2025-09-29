import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  Modal,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser, logout } from '../api/auth';
import { Header, Footer } from './HomeScreen';
import ChatBox from './ChatBox';

const { width } = Dimensions.get('window');

// Data from web version
const aboutpageData = {
  hero: {
    title: 'About NestlyCare',
    subtitle:
      'We provide comprehensive health solutions focused on gender-specific care, particularly supporting women throughout their pregnancy journey and beyond.',
    cta: 'Learn More',
    ctaLink: 'Explore',
  },
  mission: {
    title: 'Our Mission',
    description:
      'GenderHealthWeb is committed to empowering individuals through reliable medical knowledge, personalized healthcare tools, and a supportive community. We place special emphasis on providing high-quality information and services for pregnant women, helping them navigate motherhood with confidence.',
    vision:
      'To become the leading platform in gender-specific healthcare, delivering peace of mind and optimal health for every family.',
  },
  history: {
    title: 'Our Journey',
    milestones: [
      {
        year: '2018',
        event: 'Founded GenderHealthWeb with the goal of raising awareness about women’s health.',
      },
      {
        year: '2020',
        event: 'Launched a pregnancy tracking app, supporting over 10,000 mothers.',
      },
      {
        year: '2022',
        event: 'Expanded services with online courses on prenatal and postnatal care.',
      },
      {
        year: '2025',
        event: 'Partnered with international hospitals to provide remote medical consultations.',
      },
    ],
  },
  team: {
    title: 'Our Expert Team',
    members: [
      {
        name: 'Nguyen Thi Lan',
        role: 'Founder & CEO',
        avatar: 'https://via.placeholder.com/120',
        bio: 'With over 12 years of experience in women’s healthcare, Lan leads GenderHealthWeb with a passion for improving the quality of life for mothers.',
      },
      {
        name: 'Tran Van Hung',
        role: 'Obstetrician',
        avatar: 'https://via.placeholder.com/120',
        bio: 'With 18 years of experience, Dr. Hung ensures all medical content on the platform is accurate and meets international standards.',
      },
      {
        name: 'Pham Minh Anh',
        role: 'Chief Technology Officer',
        avatar: 'https://via.placeholder.com/120',
        bio: 'Anh leads the technical team, developing user-friendly technology solutions, from mobile apps to web platforms.',
      },
      {
        name: 'Le Thi Mai',
        role: 'Nutrition Specialist',
        avatar: 'https://via.placeholder.com/120',
        bio: 'Mai provides personalized nutrition plans, helping pregnant women maintain optimal health throughout their pregnancy.',
      },
    ],
  },
  values: {
    title: 'Core Values',
    items: [
      {
        icon: '🌟',
        title: 'Support',
        description: 'We are with you every step of the way, from the first moments of pregnancy to the birth of your child.',
      },
      {
        icon: '📚',
        title: 'Knowledge',
        description: 'Providing accurate, easy-to-understand medical information verified by experts.',
      },
      {
        icon: '🤝',
        title: 'Community',
        description: 'Building a connected community where mothers share experiences and support each other.',
      },
      {
        icon: '💡',
        title: 'Innovation',
        description: 'Continuously improving technology and services to deliver the best experience.',
      },
    ],
  },
  partners: {
    title: 'Our Partners',
    items: [
      {
        name: 'International Maternity Hospital',
        logo: 'https://via.placeholder.com/150',
        link: 'https://phusanquocte.vn',
      },
      {
        name: 'Vietnam Obstetrics and Gynecology Association',
        logo: 'https://via.placeholder.com/150',
        link: 'https://sanphukhoa.vn',
      },
      {
        name: 'MamaCare Nutrition Company',
        logo: 'https://via.placeholder.com/150',
        link: 'https://mamacare.vn',
      },
    ],
  },
  contact: {
    title: 'Connect With Us',
    subtitle: 'Reach out for consultations or join our community today!',
    cta: 'Send a Message',
    ctaLink: 'Contact',
  },
};

const AboutScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const fadeAnims = useRef(aboutpageData.history.milestones.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(aboutpageData.history.milestones.map(() => new Animated.Value(20))).current;
  const teamFadeAnims = useRef(aboutpageData.team.members.map(() => new Animated.Value(0))).current;
  const teamSlideAnims = useRef(aboutpageData.team.members.map(() => new Animated.Value(20))).current;
  const valueFadeAnims = useRef(aboutpageData.values.items.map(() => new Animated.Value(0))).current;
  const valueSlideAnims = useRef(aboutpageData.values.items.map(() => new Animated.Value(20))).current;
  const partnerFadeAnims = useRef(aboutpageData.partners.items.map(() => new Animated.Value(0))).current;
  const partnerSlideAnims = useRef(aboutpageData.partners.items.map(() => new Animated.Value(20))).current;
  const contactIconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const response = await getCurrentUser(token);
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
  }, [navigation]);

  useEffect(() => {
    // Animate history milestones
    aboutpageData.history.milestones.forEach((_, index) => {
      Animated.parallel([
        Animated.timing(fadeAnims[index], {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[index], {
          toValue: 0,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
    // Animate team members
    aboutpageData.team.members.forEach((_, index) => {
      Animated.parallel([
        Animated.timing(teamFadeAnims[index], {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(teamSlideAnims[index], {
          toValue: 0,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
    // Animate values
    aboutpageData.values.items.forEach((_, index) => {
      Animated.parallel([
        Animated.timing(valueFadeAnims[index], {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(valueSlideAnims[index], {
          toValue: 0,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
    // Animate partners
    aboutpageData.partners.items.forEach((_, index) => {
      Animated.parallel([
        Animated.timing(partnerFadeAnims[index], {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(partnerSlideAnims[index], {
          toValue: 0,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const handleLogout = async () => {
    try {
      const userId = user?.data?.id;
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        await AsyncStorage.removeItem('authToken');
        navigation.replace('Login');
        return;
      }
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Section */}
          <LinearGradient colors={['#0d7aa5', '#0d7aa5']} style={styles.heroSection}>
            <Animated.View
              style={[
                styles.heroText,
                { opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] },
              ]}
            >
              <Text style={styles.heroTitle}>{aboutpageData.hero.title}</Text>
              <Text style={styles.heroSubtitle}>{aboutpageData.hero.subtitle}</Text>
              <TouchableOpacity
                style={styles.heroButton}
                onPress={() => navigation.navigate(aboutpageData.hero.ctaLink)}
                activeOpacity={0.7}
                accessibilityLabel="Learn more about NestlyCare"
                accessibilityHint="Navigates to the Explore screen"
              >
                <Text style={styles.buttonText}>{aboutpageData.hero.cta}</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View
              style={[
                styles.heroGraphic,
                { opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] },
              ]}
            >
              <Image
                source={{ uri: 'https://via.placeholder.com/320' }}
                style={styles.heroGraphicImage}
                accessibilityLabel="Hero graphic"
              />
            </Animated.View>
          </LinearGradient>

          {/* Mission Section */}
          <Animated.View
            style={[
              styles.missionSection,
              { opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] },
            ]}
          >
            <Text style={styles.sectionTitle}>{aboutpageData.mission.title}</Text>
            <Text style={styles.sectionDescription}>{aboutpageData.mission.description}</Text>
            <Text style={styles.sectionVision}>{aboutpageData.mission.vision}</Text>
          </Animated.View>

          {/* History Section */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>{aboutpageData.history.title}</Text>
            {aboutpageData.history.milestones.map((milestone, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.historyMilestone,
                  {
                    opacity: fadeAnims[index],
                    transform: [{ translateY: slideAnims[index] }],
                  },
                ]}
              >
                <View style={styles.historyMilestoneContent}>
                  <Text style={styles.historyYear}>{milestone.year}</Text>
                  <Text style={styles.historyEvent}>{milestone.event}</Text>
                </View>
                <View style={styles.historyDot} />
              </Animated.View>
            ))}
          </View>

          {/* Team Section */}
          <View style={styles.teamSection}>
            <Text style={styles.sectionTitle}>{aboutpageData.team.title}</Text>
            <View style={styles.teamGrid}>
              {aboutpageData.team.members.map((member, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.teamCard,
                    {
                      opacity: teamFadeAnims[index],
                      transform: [{ translateY: teamSlideAnims[index] }],
                    },
                  ]}
                >
                  <Image
                    source={{ uri: member.avatar }}
                    style={styles.teamAvatar}
                    onError={() => console.log(`Failed to load avatar for ${member.name}`)}
                    accessibilityLabel={`${member.name}'s avatar`}
                  />
                  <Text style={styles.teamName}>{member.name}</Text>
                  <Text style={styles.teamRole}>{member.role}</Text>
                  <Text style={styles.teamBio}>{member.bio}</Text>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Values Section */}
          <View style={styles.valuesSection}>
            <Text style={styles.sectionTitle}>{aboutpageData.values.title}</Text>
            <View style={styles.valuesGrid}>
              {aboutpageData.values.items.map((value, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.valueCard,
                    {
                      opacity: valueFadeAnims[index],
                      transform: [{ translateY: valueSlideAnims[index] }],
                    },
                  ]}
                >
                  <Text style={styles.valueIcon}>{value.icon}</Text>
                  <Text style={styles.valueTitle}>{value.title}</Text>
                  <Text style={styles.valueDescription}>{value.description}</Text>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Partners Section */}
          <View style={styles.partnersSection}>
            <Text style={styles.sectionTitle}>{aboutpageData.partners.title}</Text>
            <View style={styles.partnersGrid}>
              {aboutpageData.partners.items.map((partner, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.partnerCard,
                    {
                      opacity: partnerFadeAnims[index],
                      transform: [{ translateY: partnerSlideAnims[index] }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => Linking.openURL(partner.link)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Visit ${partner.name}`}
                    accessibilityHint={`Opens ${partner.name} website in browser`}
                  >
                    <Image
                      source={{ uri: partner.logo }}
                      style={styles.partnerLogo}
                      onError={() => console.log(`Failed to load logo for ${partner.name}`)}
                      accessibilityLabel={`${partner.name} logo`}
                    />
                  </TouchableOpacity>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Contact CTA Section */}
          <LinearGradient colors={['#e0f2f7', '#a3c9e0']} style={styles.contactSection}>
            <Animated.View
              style={[
                styles.contactContent,
                { opacity: fadeAnims[3], transform: [{ translateY: slideAnims[3] }] },
              ]}
            >
              <Text style={styles.sectionTitle}>{aboutpageData.contact.title}</Text>
              <Text style={styles.sectionDescription}>{aboutpageData.contact.subtitle}</Text>
              <TouchableOpacity
                style={styles.communityButton}
                onPress={() => navigation.navigate(aboutpageData.contact.ctaLink)}
                activeOpacity={0.7}
                accessibilityLabel="Send a message"
                accessibilityHint="Navigates to the Contact screen"
              >
                <Text style={styles.buttonText}>{aboutpageData.contact.cta}</Text>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>

          <Footer navigation={navigation} />
        </ScrollView>

        {/* Contact Icon */}
        <Animated.View style={[styles.contactIcon, { transform: [{ scale: contactIconScale }] }]}>
          <TouchableOpacity
            onPress={handleContactIconPress}
            activeOpacity={0.7}
            accessibilityLabel="Open chat"
            accessibilityHint="Opens the chat support window"
          >
            <Text style={styles.contactIconText}>💬</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ChatBox Modal */}
        <Modal
          visible={isChatOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsChatOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} navigation={navigation} />
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  // Hero Section
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  heroText: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: Math.min(32, width * 0.08),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: Math.min(16, width * 0.045),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  heroButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  heroGraphic: {
    width: Math.min(300, width * 0.75),
  },
  heroGraphicImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
  },
  // Mission Section
  missionSection: {
    padding: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0f2f7',
  },
  sectionTitle: {
    fontSize: Math.min(24, width * 0.06),
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: Math.min(16, width * 0.045),
    color: '#475569',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  sectionVision: {
    fontSize: Math.min(16, width * 0.045),
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  // History Section
  historySection: {
    padding: 40,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  historyMilestone: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
    position: 'relative',
  },
  historyMilestoneContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: '#2e6da4',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
    width: Math.min(340, width * 0.85),
  },
  historyYear: {
    fontSize: Math.min(22, width * 0.055),
    fontWeight: '800',
    color: '#2e6da4',
    marginBottom: 10,
  },
  historyEvent: {
    fontSize: Math.min(15, width * 0.04),
    color: '#1e3a5f',
    lineHeight: 22,
  },
  historyDot: {
    width: 14,
    height: 14,
    backgroundColor: '#2e6da4',
    borderRadius: 7,
    position: 'absolute',
    bottom: -22,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  // Team Section
  teamSection: {
    padding: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  teamGrid: {
    width: '100%',
    alignItems: 'center',
  },
  teamCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2f7',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
    marginBottom: 20,
    width: Math.min(340, width * 0.85),
  },
  teamAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2e6da4',
    marginBottom: 15,
  },
  teamName: {
    fontSize: Math.min(18, width * 0.045),
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 10,
    textAlign: 'center',
  },
  teamRole: {
    fontSize: Math.min(15, width * 0.04),
    color: '#2e6da4',
    marginBottom: 10,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  teamBio: {
    fontSize: Math.min(14, width * 0.035),
    color: '#64748b',
    lineHeight: 20,
    textAlign: 'center',
  },
  // Values Section
  valuesSection: {
    padding: 40,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  valuesGrid: {
    width: '100%',
    alignItems: 'center',
  },
  valueCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2f7',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
    marginBottom: 20,
    width: Math.min(340, width * 0.85),
  },
  valueIcon: {
    fontSize: 36,
    marginBottom: 15,
    color: '#2e6da4',
    textAlign: 'center',
  },
  valueTitle: {
    fontSize: Math.min(16, width * 0.04),
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 10,
    textAlign: 'center',
  },
  valueDescription: {
    fontSize: Math.min(14, width * 0.035),
    color: '#64748b',
    lineHeight: 20,
    textAlign: 'center',
  },
  // Partners Section
  partnersSection: {
    padding: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  partnersGrid: {
    width: '100%',
    alignItems: 'center',
  },
  partnerCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2f7',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
    marginBottom: 20,
    width: Math.min(340, width * 0.85),
    alignItems: 'center',
  },
  partnerLogo: {
    width: 140,
    height: 70,
    resizeMode: 'contain',
    marginBottom: 15,
  },
  partnerName: {
    fontSize: Math.min(15, width * 0.04),
    fontWeight: '600',
    color: '#1e3a5f',
    textAlign: 'center',
  },
  // Contact CTA Section
  contactSection: {
    padding: 40,
    alignItems: 'center',
  },
  contactContent: {
    alignItems: 'center',
    width: '100%',
  },
  communityButton: {
    backgroundColor: '#2e6da4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#2e6da4',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Contact Icon
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  // Loading
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

export default AboutScreen;