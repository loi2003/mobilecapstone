import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { format, addDays, addWeeks } from 'date-fns';

const PregnancyProgressBar = ({ pregnancyData, selectedWeek, setSelectedWeek }) => {
  const { width } = useWindowDimensions(); // Use hook instead of module-level Dimensions
  const currentWeek = pregnancyData?.currentGestationalAgeInWeeks || 0;
  const totalWeeks = 40;

  useEffect(() => {
    setSelectedWeek(currentWeek); // Reset when pregnancy data changes
  }, [currentWeek, setSelectedWeek]);

  const progressPercentage = Math.min((selectedWeek / totalWeeks) * 100, 100);
  const weeksToGo = Math.max(totalWeeks - selectedWeek, 0);

  const lmp = pregnancyData?.firstDayOfLastMenstrualPeriod
    ? new Date(pregnancyData.firstDayOfLastMenstrualPeriod)
    : null;

  let weekStart = '';
  let weekEnd = '';

  if (lmp) {
    const startOfWeek = addWeeks(lmp, selectedWeek - 1);
    weekStart = format(startOfWeek, 'MMM d');
    weekEnd = format(addDays(startOfWeek, 6), 'MMM d, yyyy');
  }

  const trimesterLabel =
    selectedWeek <= 13
      ? 'First Trimester'
      : selectedWeek <= 27
      ? 'Second Trimester'
      : 'Third Trimester';

  const generateWeekNumbers = () => {
    const weeks = [];
    const startWeek = Math.max(1, selectedWeek - 4);
    const endWeek = Math.min(totalWeeks, selectedWeek + 5);
    for (let i = startWeek; i <= endWeek; i++) {
      weeks.push(i);
    }
    return weeks;
  };

  const weekNumbers = generateWeekNumbers();

  return (
    <View style={styles(width).pregnancyProgressBar}>
      <View style={styles(width).progressHeader}>
        <View style={styles(width).progressInfo}>
          <View>
            <Text style={styles(width).currentWeek}>
              Week {selectedWeek}: {trimesterLabel}
            </Text>
            {weekStart && weekEnd && (
              <Text style={styles(width).weekRange}>
                {weekStart} – {weekEnd}
              </Text>
            )}
          </View>
          <Text style={styles(width).weeksRemaining}>{weeksToGo} weeks to go</Text>
        </View>
        {selectedWeek !== currentWeek && (
          <TouchableOpacity
            style={styles(width).backToCurrentBtn}
            onPress={() => setSelectedWeek(currentWeek)}
          >
            <Text style={styles(width).backToCurrentBtnText}>Back to Current Week</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles(width).progressSection}>
        <View style={styles(width).progressLabels}>
          <Text style={styles(width).progressLabelText}>Week 1</Text>
          <Text style={styles(width).progressLabelText}>Week {totalWeeks}</Text>
        </View>
        <View style={styles(width).progressBar}>
          <View style={[styles(width).progressFill, { width: `${progressPercentage}%` }]} />
          <View style={[styles(width).progressMarker, { left: `${progressPercentage}%` }]} />
        </View>
        <View style={styles(width).milestoneLabels}>
          <Text style={styles(width).milestoneLabelText}>First Day of Last Period</Text>
          <Text style={styles(width).milestoneLabelText}>
            Due Date:{' '}
            {pregnancyData?.estimatedDueDate
              ? format(new Date(pregnancyData.estimatedDueDate), 'MMM dd, yyyy')
              : '—'}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        style={styles(width).weekCalendar}
        showsHorizontalScrollIndicator={false}
      >
        {weekNumbers.map((week) => (
          <TouchableOpacity
            key={week}
            style={[styles(width).weekItem, week === selectedWeek ? styles(width).weekItemCurrent : {}]}
            onPress={() => setSelectedWeek(week)}
          >
            <Text style={styles(width).weekLabel}>Week</Text>
            <Text style={[styles(width).weekNumber, week === selectedWeek ? styles(width).weekItemCurrentText : {}]}>
              {week}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Styles as a function to accept width
const styles = (width) => StyleSheet.create({
  pregnancyProgressBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: width < 768 ? 12 : 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: width < 768 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: width < 768 ? 'center' : 'center',
    rowGap: 8,
  },
  currentWeek: {
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '700',
    color: '#04668D',
  },
  weekRange: {
    fontSize: width < 768 ? 12 : 13,
    color: '#038474',
    marginTop: 4,
  },
  weeksRemaining: {
    fontSize: width < 768 ? 13 : 14,
    color: '#038474',
    fontWeight: '600',
  },
  backToCurrentBtn: {
    backgroundColor: '#04668D',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  backToCurrentBtnText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabelText: {
    fontSize: width < 480 ? 11 : 12,
    color: '#038474',
  },
  progressBar: {
    position: 'relative',
    height: 8,
    backgroundColor: '#F4F4F4',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#04668D',
    borderRadius: 4,
  },
  progressMarker: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 12,
    backgroundColor: '#04668D',
    borderRadius: 6,
    transform: [{ translateX: -6 }],
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  milestoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestoneLabelText: {
    fontSize: width < 480 ? 10 : 11,
    color: '#038474',
  },
  weekCalendar: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  weekItem: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: width < 768 ? 8 : 12,
    borderRadius: 8,
    backgroundColor: '#F4F4F4',
    minWidth: width < 768 ? 50 : 60,
    marginRight: 8,
  },
  weekItemCurrent: {
    backgroundColor: '#04668D',
  },
  weekLabel: {
    fontSize: width < 768 ? 10 : 11,
    color: '#038474',
  },
  weekNumber: {
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '600',
    color: '#038474',
  },
  weekItemCurrentText: {
    color: '#FFFFFF',
  },
});

export default PregnancyProgressBar;