import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, logout } from '../api/auth';
import { Header, Footer } from './HomeScreen';
import Icon from 'react-native-vector-icons/FontAwesome';
import ChatBox from './ChatBox';

const { width } = Dimensions.get('window');

const NutritionalGuidanceScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrimester, setSelectedTrimester] = useState('first');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Animation refs
  const headingAnim = useRef(new Animated.Value(0)).current;
  const sidebarAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const contactIconScale = useRef(new Animated.Value(1)).current;

  const nutritionData = {
    first: {
      title: 'First Trimester',
      subtitle: 'Building the Foundation (Weeks 1-12)',
      nutrients: [
        {
          name: 'Folic Acid',
          description: 'Critical for neural tube development and preventing birth defects.',
          sources: 'Leafy greens, fortified cereals, citrus fruits, legumes, asparagus',
          icon: 'cloud',
        },
        {
          name: 'Iron',
          description: 'Supports increased blood volume and prevents anemia.',
          sources: 'Lean meats, poultry, fish, dried beans, fortified cereals, spinach',
          icon: 'tint',
        },
        {
          name: 'Calcium',
          description: 'Essential for developing strong bones and teeth.',
          sources: 'Dairy products, fortified plant milks, leafy greens, canned fish with bones',
          icon: 'check-circle',
        },
        {
          name: 'Protein',
          description: 'Building blocks for your baby\'s cells, especially for brain development.',
          sources: 'Lean meats, eggs, dairy, legumes, nuts, quinoa, tofu',
          icon: 'apple',
        },
      ],
      embrace: [
        'Whole grain breads and cereals',
        'Fresh fruits and vegetables',
        'Lean proteins (chicken, fish, eggs)',
        'Dairy products or fortified alternatives',
        'Prenatal vitamins with folic acid',
        'Plenty of water (8-10 glasses daily)',
      ],
      avoid: [
        'Raw or undercooked meats and eggs',
        'High-mercury fish (shark, swordfish)',
        'Unpasteurized dairy products',
        'Alcohol and smoking',
        'Excessive caffeine (limit to 200mg/day)',
        'Raw sprouts and unwashed produce',
      ],
      tips: [
        'Take prenatal vitamins daily',
        'Eat small, frequent meals to combat morning sickness',
        'Stay hydrated - dehydration can worsen nausea',
        'Choose nutrient-dense foods when appetite is limited',
        'Cook foods thoroughly to prevent foodborne illness',
        'Listen to your body and rest when needed',
      ],
    },
    second: {
      title: 'Second Trimester',
      subtitle: 'The Golden Period (Weeks 13-26)',
      nutrients: [
        {
          name: 'Iron',
          description: 'Iron needs increase as blood volume expands.',
          sources: 'Red meat, poultry, fish, fortified cereals, spinach, lentils',
          icon: 'tint',
        },
        {
          name: 'Calcium',
          description: 'Your baby\'s bones are hardening, requiring more calcium.',
          sources: 'Milk, yogurt, cheese, fortified foods, sardines, broccoli',
          icon: 'check-circle',
        },
        {
          name: 'Omega-3 Fatty Acids',
          description: 'Critical for brain and eye development.',
          sources: 'Fatty fish (salmon, sardines), walnuts, flaxseeds, chia seeds',
          icon: 'cloud',
        },
        {
          name: 'Vitamin D',
          description: 'Works with calcium for bone development and immune support.',
          sources: 'Fortified milk, fatty fish, egg yolks, sunlight exposure',
          icon: 'apple',
        },
      ],
      embrace: [
        'Colorful fruits and vegetables (5-9 servings daily)',
        'Whole grains for sustained energy',
        'Lean proteins at every meal',
        'Healthy fats (avocados, nuts, olive oil)',
        'Iron-rich foods with vitamin C',
        'Regular, balanced meals',
      ],
      avoid: [
        'High-mercury fish and raw seafood',
        'Processed and high-sodium foods',
        'Excessive sugar and refined carbs',
        'Large amounts of caffeine',
        'Alcohol and tobacco products',
        'Foods high in trans fats',
      ],
      tips: [
        'Focus on quality nutrition as appetite returns',
        'Combine iron-rich foods with vitamin C for better absorption',
        'Start gentle exercise as approved by your doctor',
        'Monitor weight gain - aim for 1-2 pounds per week',
        'Stay active but avoid overheating',
        'Continue prenatal vitamins consistently',
      ],
    },
    third: {
      title: 'Third Trimester',
      subtitle: 'Final Preparations (Weeks 27-40)',
      nutrients: [
        {
          name: 'Iron',
          description: 'Iron needs peak as baby stores iron for first 6 months.',
          sources: 'Lean red meat, poultry, fish, fortified cereals, dried fruits',
          icon: 'tint',
        },
        {
          name: 'Calcium',
          description: 'Final bone mineralization occurs.',
          sources: 'Dairy products, leafy greens, fortified foods, almonds',
          icon: 'check-circle',
        },
        {
          name: 'Fiber',
          description: 'Helps prevent constipation due to hormonal changes.',
          sources: 'Whole grains, fruits, vegetables, legumes, nuts and seeds',
          icon: 'apple',
        },
        {
          name: 'Protein',
          description: 'Supports rapid fetal growth and prepares for breastfeeding.',
          sources: 'Lean meats, fish, eggs, dairy, legumes, nuts, quinoa',
          icon: 'cloud',
        },
      ],
      embrace: [
        'Small, frequent meals to avoid heartburn',
        'High-fiber foods for digestive health',
        'Adequate protein for fetal growth',
        'Healthy snacks (fruits, nuts, yogurt)',
        'Foods rich in vitamins K and C',
        'Plenty of fluids for hydration',
      ],
      avoid: [
        'Large meals that can cause discomfort',
        'Spicy or acidic foods if experiencing heartburn',
        'Excessive sweets and empty calories',
        'Raw or undercooked foods',
        'High-sodium processed foods',
        'Lying down immediately after eating',
      ],
      tips: [
        'Eat smaller meals to manage heartburn',
        'Include fiber-rich foods to prevent constipation',
        'Stay hydrated but limit fluids before bedtime',
        'Prepare freezer meals for after baby arrives',
        'Continue moderate exercise as tolerated',
        'Get adequate rest and prepare for breastfeeding',
      ],
    },
  };

  const trimesterOptions = [
    { key: 'first', label: 'First Trimester', weeks: '1-12 weeks' },
    { key: 'second', label: 'Second Trimester', weeks: '13-26 weeks' },
    { key: 'third', label: 'Third Trimester', weeks: '27-40 weeks' },
  ];

  const currentData = nutritionData[selectedTrimester];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const response = await getCurrentUser(token);
          setUser(response.data);
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        navigation.replace('Login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();

    // Start animations
    Animated.parallel([
      Animated.timing(headingAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarAnim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [navigation]);

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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} user={user} setUser={setUser} handleLogout={handleLogout} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={[
            styles.headingSection,
            {
              opacity: headingAnim,
              transform: [{ translateY: headingAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            },
          ]}
        >
          <Text style={styles.headingTitle}>Nutritional Guidance During Pregnancy</Text>
          <Text style={styles.headingDescription}>
            Proper nutrition during pregnancy is essential for both you and your baby's health. Each trimester brings unique nutritional needs.
          </Text>
        </Animated.View>

        <View style={styles.layout}>
          <Animated.View
            style={[
              styles.sidebar,
              {
                opacity: sidebarAnim,
                transform: [{ translateY: sidebarAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            <Text style={styles.sidebarTitle}>Select Trimester</Text>
            {trimesterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.trimesterButton,
                  selectedTrimester === option.key && styles.trimesterButtonActive,
                ]}
                onPress={() => setSelectedTrimester(option.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedTrimester === option.key }}
              >
                <Text style={styles.trimesterLabel}>{option.label}</Text>
                <Text style={styles.trimesterWeeks}>{option.weeks}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.consultCard}>
              <Text style={styles.consultTitle}>Need Personalized Advice?</Text>
              <Text style={styles.consultDescription}>
                Connect with our certified nutritionists for tailored meal plans.
              </Text>
              <TouchableOpacity
                style={styles.consultButton}
                onPress={() => navigation.navigate('Consultation')}
                accessibilityRole="button"
                accessibilityLabel="Consult Expert"
              >
                <Icon name="info-circle" size={18} color="#fff" style={styles.consultIcon} />
                <Text style={styles.consultButtonText}>Consult Expert</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.mainContent,
              {
                opacity: contentAnim,
                transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            <Text style={styles.contentTitle}>{currentData.title} Nutrition Guide</Text>
            <View style={styles.highlightBox}>
              <Icon name="info-circle" size={18} color="#0D7AA5" style={styles.highlightIcon} />
              <Text style={styles.highlightText}>
                <Text style={styles.highlightSubtitle}>{currentData.subtitle}: </Text>
                {currentData.title === 'First Trimester'
                  ? 'Focus on foundational nutrients like folic acid and managing morning sickness.'
                  : currentData.title === 'Second Trimester'
                  ? 'Your energy returns - focus on balanced nutrition and steady weight gain.'
                  : 'Support rapid growth and prepare for breastfeeding with increased nutrients.'}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Key Nutrients</Text>
            {currentData.nutrients.map((nutrient, index) => (
              <View key={index} style={styles.nutrientCard}>
                <View style={styles.nutrientHeader}>
                  <Icon name={nutrient.icon} size={24} color="#0D7AA5" style={styles.nutrientIcon} />
                  <Text style={styles.nutrientName}>{nutrient.name}</Text>
                </View>
                <Text style={styles.nutrientDescription}>{nutrient.description}</Text>
                <Text style={styles.nutrientSources}>
                  <Text style={styles.nutrientSourcesLabel}>Best Sources: </Text>
                  {nutrient.sources}
                </Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Foods to Embrace</Text>
            {currentData.embrace.map((food, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="check-circle" size={18} color="#4fc86b" style={styles.listIcon} />
                <Text style={styles.listText}>{food}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Foods to Avoid</Text>
            {currentData.avoid.map((food, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="times-circle" size={18} color="#d9534f" style={styles.listIcon} />
                <Text style={styles.listText}>{food}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Helpful Tips</Text>
            {currentData.tips.map((tip, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="check" size= {18} color="#72a7db" style={styles.listIcon} />
                <Text style={styles.listText}>{tip}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
        <Footer />
      </ScrollView>

      <Animated.View style={[styles.contactIcon, { transform: [{ scale: contactIconScale }] }]}>
        <TouchableOpacity
          onPress={handleContactIconPress}
          accessibilityRole="button"
          accessibilityLabel="Open chat"
        >
          <Icon name="comments" size={24} color="#fff" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headingSection: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#1780A6',
  },
  headingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'left',
    marginBottom: 12,
    textShadowColor: 'rgba(13, 122, 165, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headingDescription: {
    fontSize: 16,
    color: '#E3EDE8',
    lineHeight: 24,
    textAlign: 'left',
    fontWeight: '500',
  },
  layout: {
    padding: 15,
  },
  sidebar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D7AA5',
    marginBottom: 15,
    textAlign: 'center',
  },
  trimesterButton: {
    backgroundColor: 'rgba(244, 244, 244, 0.6)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trimesterButtonActive: {
    backgroundColor: '#0D7AA5',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  trimesterLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#013f50',
    textAlign: 'center',
  },
  trimesterWeeks: {
    fontSize: 14,
    color: '#848785',
    textAlign: 'center',
    opacity: 0.8,
  },
  trimesterButtonActiveText: {
    color: '#fafafa',
  },
  consultCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(13, 122, 165, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  consultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D7AA5',
    marginBottom: 10,
    textAlign: 'center',
  },
  consultDescription: {
    fontSize: 14,
    color: '#848785',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 15,
  },
  consultButton: {
    backgroundColor: '#0D7AA5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  consultIcon: {
    marginRight: 8,
  },
  consultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D7AA5',
    textAlign: 'center',
    marginBottom: 20,
  },
  highlightBox: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: '#02808F',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightIcon: {
    marginRight: 10,
  },
  highlightText: {
    fontSize: 14,
    color: '#848785',
    lineHeight: 20,
    flex: 1,
  },
  highlightSubtitle: {
    fontWeight: '600',
    color: '#02808F',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D7AA5',
    marginTop: 20,
    marginBottom: 15,
  },
  nutrientCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: '#02808F',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(13, 122, 165, 0.08)',
  },
  nutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nutrientIcon: {
    marginRight: 10,
  },
  nutrientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D7AA5',
  },
  nutrientDescription: {
    fontSize: 14,
    color: '#848785',
    lineHeight: 20,
    marginBottom: 10,
  },
  nutrientSources: {
    fontSize: 14,
    color: '#848785',
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 122, 165, 0.1)',
    paddingTop: 10,
  },
  nutrientSourcesLabel: {
    fontWeight: '600',
    color: '#02808F',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  listIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  listText: {
    fontSize: 14,
    color: '#848785',
    lineHeight: 20,
    flex: 1,
  },
  contactIcon: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: '#4F94AF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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

export default NutritionalGuidanceScreen;