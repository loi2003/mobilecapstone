import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import BabyDevelopmentData from '../../data/babyDevelopmentData';

const BabyDevelopment = ({ pregnancyData, selectedWeek }) => {
  const { width } = useWindowDimensions(); // Get window width dynamically
  const weekToShow = selectedWeek || pregnancyData?.currentGestationalAgeInWeeks || 22;

  // Define styles that depend on width inside the component
  const dynamicStyles = {
    babyDevelopment: {
      padding: width < 768 ? 12 : 16,
      header: {
        fontSize: width < 768 ? 16 : 18,
      },
      developmentOverview: {
        flexDirection: width < 768 ? 'column' : 'row',
        gap: width < 768 ? 12 : 16,
      },
      babyIllustration: {
        alignSelf: width < 768 ? 'center' : 'flex-start',
      },
      sizeInfo: {
        justifyContent: width < 768 ? 'center' : 'flex-start',
      },
    },
  };

  if (weekToShow <= 4) {
    return (
      <View style={[styles.babyDevelopment, dynamicStyles.babyDevelopment]}>
        <Text style={[styles.header, dynamicStyles.header]}>
          Baby Development: Week {weekToShow}
        </Text>
        <Text style={styles.earlyText}>
          During the first few weeks of pregnancy (weeks 1–4), a baby hasn't formed yet. These early
          stages involve ovulation, fertilization, and implantation. While you may not notice much
          physically, a lot is happening at a cellular level!
        </Text>
      </View>
    );
  }

  const weekData = BabyDevelopmentData[weekToShow] || BabyDevelopmentData[22];

  return (
    <View style={[styles.babyDevelopment, dynamicStyles.babyDevelopment]}>
      <Text style={[styles.header, dynamicStyles.header]}>
        Baby Development: Week {weekToShow}
      </Text>

      <View style={[styles.developmentOverview, dynamicStyles.developmentOverview]}>
        <Text style={[styles.babyIllustration, dynamicStyles.babyIllustration]}>👶</Text>
        <View style={[styles.sizeInfo, dynamicStyles.sizeInfo]}>
          <View style={styles.measurement}>
            <Text style={styles.measurementTitle}>Length</Text>
            <Text style={styles.measurementValue}>{weekData.length}</Text>
            <Text style={styles.measurementUnit}>head to heel</Text>
          </View>
          <View style={styles.measurement}>
            <Text style={styles.measurementTitle}>Weight</Text>
            <Text style={styles.measurementValue}>{weekData.weight}</Text>
            <Text style={styles.measurementUnit}>approximate</Text>
          </View>
        </View>
      </View>

      <View style={styles.sizeComparison}>
        <Text style={styles.sizeComparisonText}>Size of a {weekData.size}</Text>
      </View>

      <View style={styles.developments}>
        <Text style={styles.developmentsTitle}>What's happening this week:</Text>
        <View style={styles.developmentsList}>
          {weekData.developments.map((development, index) => (
            <View key={index} style={styles.developmentItem}>
              <Text style={styles.developmentIcon}>✓</Text>
              <Text style={styles.developmentText}>{development}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  babyDevelopment: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    color: '#04668D',
    fontWeight: '700',
    marginBottom: 12,
  },
  earlyText: {
    fontSize: 14,
    color: '#1A8474',
    lineHeight: 20,
  },
  developmentOverview: {
    alignItems: 'center',
    marginBottom: 12,
  },
  babyIllustration: {
    fontSize: 48,
    color: '#04668D',
  },
  sizeInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  measurement: {
    alignItems: 'center',
  },
  measurementTitle: {
    color: '#1A8474',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#04668D',
    marginBottom: 2,
  },
  measurementUnit: {
    fontSize: 12,
    color: '#1A8474',
  },
  sizeComparison: {
    padding: 12,
    backgroundColor: '#F4F4F4',
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  sizeComparisonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#04668D',
  },
  developments: {
    flexDirection: 'column',
  },
  developmentsTitle: {
    color: '#04668D',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  developmentsList: {
    flexDirection: 'column',
  },
  developmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  developmentIcon: {
    fontSize: 16,
    color: '#1A8474',
    marginTop: 2,
  },
  developmentText: {
    fontSize: 14,
    color: '#1A8474',
    lineHeight: 20,
  },
});

export default BabyDevelopment;