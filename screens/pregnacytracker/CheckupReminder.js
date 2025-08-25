import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { getAllTailoredCheckupRemindersForGrowthData } from '../../api/tailored-checkup-reminder-api';

// Placeholder for CheckupCalendar (assumed to be a separate React Native component)
const CheckupCalendar = ({ reminders, appointments }) => {
  const { width } = useWindowDimensions();
  return (
    <View style={styles(width).calendarPlaceholder}>
      <Text style={styles(width).calendarPlaceholderText}>
        CheckupCalendar Component (Placeholder)
      </Text>
    </View>
  );
};

const CheckupReminder = ({ token, userId, appointments = [] }) => {
  const { width } = useWindowDimensions(); // Use hook instead of module-level Dimensions
  const [recommendedReminders, setRecommendedReminders] = useState([]);
  const [emergencyReminders, setEmergencyReminders] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    // Set static recommended reminders
    setRecommendedReminders([
      {
        id: 1,
        title: 'Second Trimester Checkup',
        startDate: '2025-08-11',
        endDate: '2025-08-21',
        note: 'Book a general prenatal checkup for the 16th week.',
        type: 'recommended',
      },
      {
        id: 2,
        title: 'Glucose Screening',
        startDate: '2025-09-05',
        endDate: '2025-09-11',
        note: 'Check blood sugar level for gestational diabetes.',
        type: 'recommended',
      },
    ]);

    const fetchEmergencyReminders = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const growthDataId = await AsyncStorage.getItem('growthDataId');
        if (!storedToken || !growthDataId) return;

        const apiResponse = await getAllTailoredCheckupRemindersForGrowthData(
          growthDataId,
          storedToken
        );

        const remindersArray = Array.isArray(apiResponse.data)
          ? apiResponse.data
          : [];

        const lmpDateStr = await AsyncStorage.getItem('lmpDate');
        const lmpDate = lmpDateStr ? new Date(lmpDateStr) : new Date();

        const mappedEmergency = remindersArray.map((r) => {
          const startDate = getDateFromWeek(lmpDate, r.recommendedStartWeek);
          const endDate = getDateFromWeek(lmpDate, r.recommendedEndWeek);

          return {
            id: r.id,
            title: r.title,
            startDate,
            endDate,
            startWeek: r.recommendedStartWeek,
            endWeek: r.recommendedEndWeek,
            note: r.description,
            type: r.type?.toLowerCase() || 'emergency',
          };
        });

        setEmergencyReminders(mappedEmergency);
      } catch (err) {
        console.error('Failed to fetch tailored reminders:', err);
      }
    };

    fetchEmergencyReminders();
  }, [token, userId]);

  const handleBookInside = (reminder) => {
    navigation.navigate('ClinicList');
  };

  const handleBookOutside = (reminder) => {
    // In a real app, this could open a URL or external app
    console.log(`Booking outside platform for: ${reminder.title}`);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDateFromWeek = (lmpDate, weekNumber) => {
    const start = new Date(lmpDate);
    const daysToAdd = (weekNumber - 1) * 7;
    start.setDate(start.getDate() + daysToAdd);
    return start;
  };

  const getWeekNumber = (dateStr) => {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), 0, 1);
    const diff =
      date - start +
      (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  };

  const renderReminderCard = (reminder, isUrgent = false) => (
    <View
      key={reminder.id}
      style={[styles(width).reminderCard, isUrgent ? styles(width).red : styles(width).blue]}
    >
      <View style={styles(width).reminderInfo}>
        <Text style={styles(width).reminderTitle}>{reminder.title}</Text>
        <Text style={styles(width).reminderDate}>
          {reminder.type === 'emergency' ? (
            <>
              Week {reminder.startWeek} – Week {reminder.endWeek}
              {'\n'}
              {new Date(reminder.startDate).toLocaleDateString('en-GB')} –{' '}
              {new Date(reminder.endDate).toLocaleDateString('en-GB')}
            </>
          ) : (
            <>
              {formatDate(reminder.startDate)} – {formatDate(reminder.endDate)}
              {'\n'}
              Week {getWeekNumber(reminder.startDate)} – Week{' '}
              {getWeekNumber(reminder.endDate)}
            </>
          )}
        </Text>
        <Text style={styles(width).reminderNote}>{reminder.note}</Text>
      </View>
      <View style={styles(width).reminderActions}>
        <TouchableOpacity
          style={[styles(width).bookBtn, isUrgent ? styles(width).emergency : {}]}
          onPress={() => handleBookInside(reminder)}
        >
          <Text style={styles(width).bookBtnText}>
            {isUrgent ? 'Book Urgently' : 'Schedule Consultation'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles(width).outsideBtn}
          onPress={() => handleBookOutside(reminder)}
        >
          <Text style={styles(width).outsideBtnText}>Book Outside</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles(width).checkupReminder}>
      <Text style={styles(width).sectionTitle}>Checkup Reminders</Text>
      <Text style={styles(width).sectionSubtitle}>
        Setting up a reminder for your future checkup~
      </Text>

      <CheckupCalendar
        reminders={[...recommendedReminders, ...emergencyReminders]}
        appointments={appointments}
      />

      <View style={styles(width).reminderSection}>
        <Text style={styles(width).sectionSubheading}>Recommended Checkup</Text>
        {recommendedReminders.length > 0 ? (
          recommendedReminders.map((reminder) => renderReminderCard(reminder))
        ) : (
          <Text style={styles(width).emptyText}>No recommended reminders at this time.</Text>
        )}
      </View>

      <View style={[styles(width).reminderSection, styles(width).emergencySection]}>
        <Text style={[styles(width).sectionSubheading, styles(width).emergencySubheading]}>
          Emergency Checkup
        </Text>
        {emergencyReminders.length > 0 ? (
          emergencyReminders.map((reminder) => renderReminderCard(reminder, true))
        ) : (
          <Text style={styles(width).emptyText}>No emergency reminders at this time.</Text>
        )}
      </View>
    </ScrollView>
  );
};

// Styles as a function to accept width
const styles = (width) => StyleSheet.create({
  checkupReminder: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    paddingBottom: 30,
  },
  sectionTitle: {
    color: '#04668d', // --nguyen-primary-bg
    fontSize: width < 768 ? 20 : 24,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: width < 768 ? 14 : 16,
    color: '#666',
    marginBottom: 20,
  },
  calendarPlaceholder: {
    backgroundColor: '#f9faff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    minHeight: 200,
  },
  calendarPlaceholderText: {
    fontSize: 16,
    color: '#555',
  },
  reminderSection: {
    marginTop: 20,
  },
  sectionSubheading: {
    color: '#02808f', // --nguyen-accent-color
    fontSize: width < 768 ? 18 : 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  emergencySection: {
    marginTop: 20,
  },
  emergencySubheading: {
    color: '#d32f2f',
  },
  reminderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: width < 768 ? 'column' : 'row',
    alignItems: width < 768 ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
  },
  blue: {
    borderLeftColor: '#038474',
  },
  red: {
    borderLeftColor: '#d32f2f',
  },
  reminderInfo: {
    flex: 1,
    marginRight: width < 768 ? 0 : 16,
  },
  reminderTitle: {
    color: '#04668d', // --nguyen-primary-bg
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 14,
    color: '#02808f', // --nguyen-accent-color
    fontWeight: '500',
    marginBottom: 6,
  },
  reminderNote: {
    fontSize: 14,
    color: '#555',
  },
  reminderActions: {
    flexDirection: width < 768 ? 'row' : 'column',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  bookBtn: {
    width: 200,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#02808f',
    borderRadius: 8,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emergency: {
    backgroundColor: '#d32f2f',
  },
  outsideBtn: {
    width: 200,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  outsideBtnText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default CheckupReminder;