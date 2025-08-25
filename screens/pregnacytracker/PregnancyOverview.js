import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

const PregnancyOverview = ({ pregnancyData }) => {
  const { width } = useWindowDimensions(); // Use hook instead of module-level Dimensions

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTrimesterInfo = (trimester) => {
    const trimesterData = {
      1: { name: 'First Trimester', weeks: '1-12 weeks', color: '#4caf50' },
      2: { name: 'Second Trimester', weeks: '13-27 weeks', color: '#2196f3' },
      3: { name: 'Third Trimester', weeks: '28-40 weeks', color: '#9c27b0' },
    };
    return trimesterData[trimester] || trimesterData[1];
  };

  const trimesterInfo = getTrimesterInfo(pregnancyData.currentTrimester);

  return (
    <View style={styles(width).pregnancyOverview}>
      <View style={styles(width).overviewHeader}>
        <Text style={styles(width).headerTitle}>Your Pregnancy Journey</Text>
        <Text style={styles(width).headerText}>Welcome back! Here's your current pregnancy status</Text>
      </View>

      <View style={styles(width).overviewCards}>
        <View style={[styles(width).overviewCard, styles(width).highlightCard]}>
          <Text style={styles(width).cardIcon}>✅</Text>
          <View style={styles(width).overviewCardContent}>
            <Text style={[styles(width).cardTitle, styles(width).highlightCardTitle]}>
              Week {pregnancyData.currentGestationalAgeInWeeks}
            </Text>
            <Text style={styles(width).cardText}>Current pregnancy week</Text>
          </View>
        </View>

        <View style={styles(width).overviewCard}>
          <Text style={[styles(width).cardIcon, { color: trimesterInfo.color }]}>🌟</Text>
          <View style={styles(width).overviewCardContent}>
            <Text style={styles(width).cardTitle}>{trimesterInfo.name}</Text>
            <Text style={styles(width).cardText}>{trimesterInfo.weeks}</Text>
          </View>
        </View>

        <View style={styles(width).overviewCard}>
          <Text style={styles(width).cardIcon}>📅</Text>
          <View style={styles(width).overviewCardContent}>
            <Text style={styles(width).cardTitle}>{formatDate(pregnancyData.estimatedDueDate)}</Text>
            <Text style={styles(width).cardText}>Estimated due date</Text>
          </View>
        </View>

        <View style={styles(width).overviewCard}>
          <Text style={styles(width).cardIcon}>❤️</Text>
          <View style={styles(width).overviewCardContent}>
            <Text style={styles(width).cardTitle}>
              {formatDate(pregnancyData.firstDayOfLastMenstrualPeriod)}
            </Text>
            <Text style={styles(width).cardText}>Last menstrual period</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Styles as a function to accept width
const styles = (width) => StyleSheet.create({
  pregnancyOverview: {
    marginBottom: 20,
  },
  overviewHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#04668D',
    fontSize: width < 768 ? 20 : 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerText: {
    color: '#038474',
    fontSize: width < 768 ? 14 : 16,
    textAlign: 'center',
  },
  overviewCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    flex: 1,
    minWidth: width < 768 ? '100%' : 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightCard: {
    backgroundColor: '#04668D',
  },
  cardIcon: {
    fontSize: 24,
    color: '#038474',
  },
  highlightCardTitle: {
    color: '#FAFAFA',
  },
  overviewCardContent: {
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#013F50',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 12,
    color: '#848785',
    opacity: 0.8,
  },
});

export default PregnancyOverview;