import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, logout } from '../api/auth';
import { chartData } from '../data/chartData';
import { Header, Footer } from './HomeScreen';

const PregnancyTrackingScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const pregnancyData = chartData.weeks;
  const itemWidth = 80;
  const scaleAnims = useRef(pregnancyData.map(() => new Animated.Value(1))).current;
  const scrollRef = useRef(null);
  const prevIndexRef = useRef(-1);

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pregnancy Tracker</Text>
          <Text style={styles.sectionDescription}>
            Track your pregnancy week by week with detailed insights and tips.
          </Text>
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
                <Text style={styles.bold}>Tip:</Text> {selectedWeek.tip}
              </Text>
              <TouchableOpacity
                style={styles.weekPopupButton}
                onPress={() => setSelectedWeek(null)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Footer />
      </ScrollView>
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
  section: {
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
    maxWidth: '90%',
  },
  trackerChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#feffe9',
    borderRadius: 12,
    padding: 20,
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
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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

export default PregnancyTrackingScreen;