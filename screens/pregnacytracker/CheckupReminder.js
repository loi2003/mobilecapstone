import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { getAllTailoredCheckupRemindersForGrowthData } from '../../api/tailored-checkup-reminder-api';

// Mobile-Optimized CheckupCalendar Component
const CheckupCalendar = ({ reminders = [], appointments = [] }) => {
  const { width } = useWindowDimensions();
  const today = new Date();

  const [date, setDate] = useState({
    month: today.getMonth(),
    year: today.getFullYear(),
    day: today.getDate(),
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'month' or 'year'

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );
  const years = Array.from(
    { length: 21 },
    (_, i) => today.getFullYear() - 10 + i
  );

  // Build reminders and appointments maps
  const reminderDatesMap = {};
  reminders.forEach((r) => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let current = new Date(start);
    while (current <= end) {
      const key = current.toDateString();
      if (!reminderDatesMap[key]) reminderDatesMap[key] = [];
      let rangeType =
        key === start.toDateString()
          ? 'start'
          : key === end.toDateString()
          ? 'end'
          : 'middle';
      reminderDatesMap[key].push({ ...r, rangeType, itemType: 'reminder' });
      current.setDate(current.getDate() + 1);
    }
  });

  const appointmentDatesMap = {};
  appointments.forEach((a) => {
    const start = a.start || a.startDate || a.date;
    const dateKey = new Date(start).toDateString();

    if (!appointmentDatesMap[dateKey]) {
      appointmentDatesMap[dateKey] = [];
    }

    appointmentDatesMap[dateKey].push({
      ...a,
      start: new Date(start),
      end: a.end ? new Date(a.end) : null,
      itemType: 'appointment',
    });
  });

  const daysInMonth = new Date(date.year, date.month + 1, 0).getDate();
  const firstDay = new Date(date.year, date.month, 1).getDay();

  const handleDayClick = (dateObj, isCurrentMonth) => {
    if (!isCurrentMonth && viewMode === 'month') return;
    const key = dateObj.toDateString();
    if (selectedDay === key) {
      setSelectedDay(null);
      setSelectedItems([]);
    } else {
      setSelectedDay(key);
      setDate({
        month: dateObj.getMonth(),
        year: dateObj.getFullYear(),
        day: dateObj.getDate(),
      });
      const items = [
        ...(reminderDatesMap[key] || []),
        ...(appointmentDatesMap[key] || []),
      ];
      setSelectedItems(items);
    }
  };

  const goToToday = () => {
    setDate({
      month: today.getMonth(),
      year: today.getFullYear(),
      day: today.getDate(),
    });
    setSelectedDay(today.toDateString());
    setSelectedItems([
      ...(reminderDatesMap[today.toDateString()] || []),
      ...(appointmentDatesMap[today.toDateString()] || []),
    ]);
    setViewMode('month');
  };

  const goToPrev = () => {
    if (viewMode === 'month') {
      setDate(({ month, year }) => ({
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        day: 1,
      }));
    } else {
      const newDate = new Date(date.year, date.month, date.day);
      newDate.setDate(newDate.getDate() - 7);
      setDate({
        month: newDate.getMonth(),
        year: newDate.getFullYear(),
        day: newDate.getDate(),
      });
    }
    setSelectedDay(null);
    setSelectedItems([]);
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setDate(({ month, year }) => ({
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        day: 1,
      }));
    } else {
      const newDate = new Date(date.year, date.month, date.day);
      newDate.setDate(newDate.getDate() + 7);
      setDate({
        month: newDate.getMonth(),
        year: newDate.getFullYear(),
        day: newDate.getDate(),
      });
    }
    setSelectedDay(null);
    setSelectedItems([]);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'month' ? 'week' : 'month');
    setSelectedDay(null);
    setSelectedItems([]);
  };

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const renderMonthYearPicker = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles(width).modalContainer}>
        <View style={styles(width).modalContent}>
          <FlatList
            data={modalType === 'month' ? months : years}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles(width).modalItem}
                onPress={() => {
                  if (modalType === 'month') {
                    setDate({ ...date, month: index });
                  } else {
                    setDate({ ...date, year: item });
                  }
                  setModalVisible(false);
                }}
              >
                <Text style={styles(width).modalItemText}>
                  {modalType === 'month' ? item : item}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles(width).modalCloseButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles(width).modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderMonthView = () => {
    const cells = [];

    // Previous month tail
    const prevMonthDays = new Date(date.year, date.month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(
        <View key={`prev-${i}`} style={styles(width).calendarDayOutside}>
          <Text style={styles(width).calendarDayText}>{prevMonthDays - i}</Text>
        </View>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(date.year, date.month, day);
      const dateKey = dateObj.toDateString();
      const isToday = dateKey === today.toDateString();
      const isSelected = selectedDay === dateKey;
      const hasAppointment = !!appointmentDatesMap[dateKey];
      const remindersForDay = reminderDatesMap[dateKey];

      let reminderStyle = {};
      let reminderClass = '';
      if (remindersForDay?.length) {
        if (remindersForDay.some((r) => r.rangeType === 'start'))
          reminderClass = 'reminder-start';
        else if (remindersForDay.some((r) => r.rangeType === 'end'))
          reminderClass = 'reminder-end';
        else reminderClass = 'reminder-middle';

        if (remindersForDay.some((r) => r.type === 'emergency'))
          reminderClass += ' emergency';
        else if (remindersForDay.some((r) => r.type === 'recommended'))
          reminderClass += ' recommended';

        reminderStyle =
          reminderClass.includes('emergency')
            ? reminderClass.includes('reminder-start') || reminderClass.includes('reminder-end')
              ? styles(width).emergency
              : styles(width).emergencyMiddle
            : reminderClass.includes('reminder-start') || reminderClass.includes('reminder-end')
            ? styles(width).recommended
            : styles(width).recommendedMiddle;
      }

      const dayStyles = [
        styles(width).calendarDay,
        isSelected && styles(width).selected,
        isToday && styles(width).today,
        hasAppointment && styles(width).appointmentHighlight,
        reminderStyle,
      ].filter(Boolean);

      cells.push(
        <TouchableOpacity
          key={dateKey}
          style={dayStyles}
          onPress={() => handleDayClick(dateObj, true)}
        >
          <Text style={styles(width).calendarDayText}>{day}</Text>
          {(hasAppointment || remindersForDay?.length > 0) && (
            <View style={styles(width).eventDots}>
              {hasAppointment && <View style={styles(width).appointmentDot} />}
              {remindersForDay?.some((r) => r.type === 'recommended') && (
                <View style={styles(width).recommendedDot} />
              )}
              {remindersForDay?.some((r) => r.type === 'emergency') && (
                <View style={styles(width).emergencyDot} />
              )}
            </View>
          )}
          {isToday && (
            <Text style={styles(width).todayMarker}>Today</Text>
          )}
        </TouchableOpacity>
      );
    }

    // Next month leading days
    const totalCells = firstDay + daysInMonth;
    const nextMonthDays = 7 - (totalCells % 7);
    if (nextMonthDays < 7) {
      for (let i = 1; i <= nextMonthDays; i++) {
        cells.push(
          <View key={`next-${i}`} style={styles(width).calendarDayOutside}>
            <Text style={styles(width).calendarDayText}>{i}</Text>
          </View>
        );
      }
    }

    return cells;
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(date.year, date.month, date.day);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const days = [];

    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(startOfWeek);
      dateObj.setDate(startOfWeek.getDate() + i);
      const dateKey = dateObj.toDateString();
      const isToday = dateKey === today.toDateString();
      const isSelected = selectedDay === dateKey;
      const hasAppointment = !!appointmentDatesMap[dateKey];
      const remindersForDay = reminderDatesMap[dateKey];

      let reminderStyle = {};
      let reminderClass = '';
      if (remindersForDay?.length) {
        if (remindersForDay.some((r) => r.rangeType === 'start'))
          reminderClass = 'reminder-start';
        else if (remindersForDay.some((r) => r.rangeType === 'end'))
          reminderClass = 'reminder-end';
        else reminderClass = 'reminder-middle';

        if (remindersForDay.some((r) => r.type === 'emergency'))
          reminderClass += ' emergency';
        else if (remindersForDay.some((r) => r.type === 'recommended'))
          reminderClass += ' recommended';

        reminderStyle =
          reminderClass.includes('emergency')
            ? reminderClass.includes('reminder-start') || reminderClass.includes('reminder-end')
              ? styles(width).emergency
              : styles(width).emergencyMiddle
            : reminderClass.includes('reminder-start') || reminderClass.includes('reminder-end')
            ? styles(width).recommended
            : styles(width).recommendedMiddle;
      }

      const dayStyles = [
        styles(width).calendarDayWeek,
        isSelected && styles(width).selected,
        isToday && styles(width).today,
        hasAppointment && styles(width).appointmentHighlight,
        reminderStyle,
      ].filter(Boolean);

      days.push(
        <TouchableOpacity
          key={dateKey}
          style={dayStyles}
          onPress={() => handleDayClick(dateObj, true)}
        >
          <Text style={styles(width).calendarDayNameText}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()]}
          </Text>
          <Text style={styles(width).calendarDayText}>
            {dateObj.getDate()}
          </Text>
          {(hasAppointment || remindersForDay?.length > 0) && (
            <View style={styles(width).eventDots}>
              {hasAppointment && <View style={styles(width).appointmentDot} />}
              {remindersForDay?.some((r) => r.type === 'recommended') && (
                <View style={styles(width).recommendedDot} />
              )}
              {remindersForDay?.some((r) => r.type === 'emergency') && (
                <View style={styles(width).emergencyDot} />
              )}
            </View>
          )}
          {isToday && (
            <Text style={styles(width).todayMarker}>Today</Text>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles(width).calendarContainer}>
      <View style={styles(width).calendarHeader}>
        <TouchableOpacity
          style={styles(width).navButton}
          onPress={goToPrev}
        >
          <Text style={styles(width).navButtonText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles(width).monthYearContainer}
          onPress={() => openModal('month')}
        >
          <Text style={styles(width).monthYearText}>
            {months[date.month]} {date.year}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles(width).navButton}
          onPress={goToNext}
        >
          <Text style={styles(width).navButtonText}>▶</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles(width).viewToggleButton}
          onPress={toggleViewMode}
        >
          <Text style={styles(width).viewToggleButtonText}>
            {viewMode === 'month' ? 'Week' : 'Month'}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles(width).todayButton}
        onPress={goToToday}
      >
        <Text style={styles(width).todayButtonText}>Today</Text>
      </TouchableOpacity>

      <View style={styles(width).calendarGrid}>
        <View style={styles(width).calendarDayNames}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <View key={d} style={styles(width).calendarDayName}>
              <Text style={styles(width).calendarDayNameText}>{d}</Text>
            </View>
          ))}
        </View>
        <View style={viewMode === 'month' ? styles(width).calendarMonthGrid : styles(width).calendarWeekGrid}>
          {viewMode === 'month' ? renderMonthView() : renderWeekView()}
        </View>
      </View>

      <View style={styles(width).calendarInstruction}>
        <View style={styles(width).instruction}>
          <View style={[styles(width).instructionDot, styles(width).todayDot]} />
          <Text style={styles(width).instructionText}>Today</Text>
        </View>
        <View style={styles(width).instruction}>
          <View style={[styles(width).instructionDot, styles(width).appointmentDot]} />
          <Text style={styles(width).instructionText}>Appointment</Text>
        </View>
        <View style={styles(width).instruction}>
          <View style={[styles(width).instructionDot, styles(width).recommendedDot]} />
          <Text style={styles(width).instructionText}>Recommended</Text>
        </View>
        <View style={styles(width).instruction}>
          <View style={[styles(width).instructionDot, styles(width).emergencyDot]} />
          <Text style={styles(width).instructionText}>Emergency</Text>
        </View>
      </View>

      {selectedItems.length > 0 && (
        <View style={styles(width).reminderDetails}>
          {selectedItems.map((item, idx) => {
            let cardStyle = styles(width).reminderItem;
            if (item.itemType === 'reminder') {
              cardStyle = [
                styles(width).reminderItem,
                item.type === 'emergency' ? styles(width).emergency : styles(width).recommended,
              ];
            } else if (item.itemType === 'appointment') {
              cardStyle = [styles(width).reminderItem, styles(width).appointment];
            }

            return (
              <View key={idx} style={cardStyle}>
                {item.itemType === 'appointment' ? (
                  <>
                    <Text style={styles(width).reminderItemTitle}>
                      Appointment: {item.name || item.type}
                    </Text>
                    {item.start && (
                      <Text style={styles(width).reminderItemDatetime}>
                        {item.start.toLocaleDateString('en-GB')}{' '}
                        {item.start.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {item.end &&
                          ` - ${item.end.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                      </Text>
                    )}
                    {item.doctor && (
                      <Text style={styles(width).reminderItemDoctor}>
                        with Dr. {item.doctor}
                      </Text>
                    )}
                    {item.address && (
                      <Text style={styles(width).reminderItemAddress}>
                        At: {item.address}
                      </Text>
                    )}
                    {item.note && (
                      <Text style={styles(width).reminderItemNote}>
                        Notes: {item.note}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles(width).reminderItemTitle}>
                      {item.title}
                    </Text>
                    <Text style={styles(width).reminderItemDatetime}>
                      {new Date(item.startDate).toLocaleDateString('en-GB')} -{' '}
                      {new Date(item.endDate).toLocaleDateString('en-GB')}
                    </Text>
                    {item.note && (
                      <Text style={styles(width).reminderItemNote}>
                        {item.note}
                      </Text>
                    )}
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}

      {renderMonthYearPicker()}
    </View>
  );
};

const CheckupReminder = ({ token, userId, appointments = [] }) => {
  const { width } = useWindowDimensions();
  const [recommendedReminders, setRecommendedReminders] = useState([]);
  const [emergencyReminders, setEmergencyReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchReminders = async () => {
      setIsLoading(true);
      setError(null);

      try {
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

        const storedToken = await AsyncStorage.getItem('authToken');
        const growthDataId = await AsyncStorage.getItem('growthDataId');

        if (!storedToken || !growthDataId) {
          setError('Authentication data missing. Please sign in again.');
          navigation.navigate('Login');
          return;
        }

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
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            startWeek: r.recommendedStartWeek,
            endWeek: r.recommendedEndWeek,
            note: r.description || 'No description available',
            type: r.type?.toLowerCase() || 'emergency',
          };
        });

        setEmergencyReminders(mappedEmergency);
      } catch (err) {
        console.error('Failed to fetch tailored reminders:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError('Failed to load reminders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminders();
  }, [token, userId, navigation]);

  const handleBook = (reminder) => {
    navigation.navigate('Consultation');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
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
      (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
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
              {formatDate(reminder.startDate)} – {formatDate(reminder.endDate)}
            </>
          ) : (
            <>
              {formatDate(reminder.startDate)} – {formatDate(reminder.endDate)}
              {'\n'}
              Week {getWeekNumber(reminder.startDate)} – Week {getWeekNumber(reminder.endDate)}
            </>
          )}
        </Text>
        <Text style={styles(width).reminderNote}>{reminder.note}</Text>
      </View>
      <View style={styles(width).reminderActions}>
        <TouchableOpacity
          style={[styles(width).bookBtn, isUrgent ? styles(width).emergency : {}]}
          onPress={() => handleBook(reminder)}
        >
          <Text style={styles(width).bookBtnText}>
            {isUrgent ? 'Book Urgently' : 'Schedule Consultation'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles(width).checkupReminder}>
        <ActivityIndicator size="large" color="#02808f" />
        <Text style={styles(width).loadingText}>Loading reminders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles(width).checkupReminder}>
        <Text style={styles(width).errorText}>{error}</Text>
        <TouchableOpacity
          style={styles(width).retryBtn}
          onPress={() => fetchReminders()}
        >
          <Text style={styles(width).retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

const styles = (width) => StyleSheet.create({
  checkupReminder: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: width < 768 ? 16 : 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    paddingBottom: 30,
  },
  sectionTitle: {
    color: '#04668d',
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
  // Calendar styles
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: width < 768 ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  navButton: {
    backgroundColor: '#02808f',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  monthYearContainer: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    alignItems: 'center',
  },
  monthYearText: {
    color: '#02808f',
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '700',
  },
  viewToggleButton: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  viewToggleButtonText: {
    color: '#02808f',
    fontSize: 14,
    fontWeight: '600',
  },
  todayButton: {
    backgroundColor: '#02808f',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'column',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  calendarDayNames: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: width < 768 ? 4 : 6,
  },
  calendarWeekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: width < 768 ? 4 : 6,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  calendarDayName: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  calendarDayNameText: {
    color: '#02808f',
    fontSize: width < 768 ? 12 : 14,
    fontWeight: '700',
  },
  calendarDay: {
    width: (width < 768 ? width - 48 : width - 64) / 7 - (width < 768 ? 4 : 6),
    height: width < 768 ? 50 : 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calendarDayWeek: {
    width: (width < 768 ? width - 48 : width - 64) / 7 - (width < 768 ? 4 : 6),
    height: width < 768 ? 80 : 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 8,
  },
  calendarDayOutside: {
    width: (width < 768 ? width - 48 : width - 64) / 7 - (width < 768 ? 4 : 6),
    height: width < 768 ? 50 : 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    opacity: 0.3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calendarDayText: {
    fontSize: width < 768 ? 14 : 16,
    color: '#333',
    fontWeight: '600',
  },
  selected: {
    borderWidth: 2,
    borderColor: '#034b67',
    backgroundColor: 'rgba(237, 251, 255, 0.65)',
  },
  today: {
    backgroundColor: '#04668d',
    borderWidth: 2,
    borderColor: '#034b67',
  },
  todayMarker: {
    fontSize: width < 768 ? 10 : 12,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 4,
  },
  appointmentHighlight: {
    backgroundColor: '#049aa8',
  },
  recommended: {
    backgroundColor: '#038474',
    borderWidth: 2,
    borderColor: '#333',
  },
  recommendedMiddle: {
    backgroundColor: 'rgba(3, 132, 116, 0.4)',
  },
  emergency: {
    backgroundColor: '#e74c3c',
    borderWidth: 2,
    borderColor: '#333',
  },
  emergencyMiddle: {
    backgroundColor: 'rgba(231, 76, 60, 0.4)',
  },
  eventDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  appointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#049aa8',
  },
  recommendedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#038474',
  },
  emergencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e74c3c',
  },
  calendarInstruction: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todayDot: {
    backgroundColor: '#04668d',
  },
  appointmentDot: {
    backgroundColor: '#049aa8',
  },
  recommendedDot: {
    backgroundColor: '#038474',
  },
  emergencyDot: {
    backgroundColor: '#e74c3c',
  },
  instructionText: {
    fontSize: width < 768 ? 12 : 14,
    color: '#333',
    fontWeight: '600',
  },
  reminderDetails: {
    marginTop: 12,
    gap: 12,
  },
  reminderItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  reminderItemTitle: {
    fontSize: width < 768 ? 14 : 16,
    fontWeight: '700',
    color: '#04668d',
    marginBottom: 4,
  },
  reminderItemDatetime: {
    fontSize: width < 768 ? 12 : 14,
    fontWeight: '500',
    color: '#02808f',
    marginBottom: 4,
  },
  reminderItemDoctor: {
    fontSize: width < 768 ? 12 : 14,
    fontWeight: '600',
    color: '#02808f',
    marginBottom: 4,
  },
  reminderItemAddress: {
    fontSize: width < 768 ? 12 : 14,
    color: '#555',
    marginBottom: 4,
  },
  reminderItemNote: {
    fontSize: width < 768 ? 12 : 14,
    color: '#555',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxHeight: '60%',
  },
  modalItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 16,
    color: '#02808f',
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#02808f',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  reminderSection: {
    marginTop: 20,
  },
  sectionSubheading: {
    color: '#02808f',
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
    color: '#04668d',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 14,
    color: '#02808f',
    fontWeight: '500',
    marginBottom: 6,
    lineHeight: 20,
  },
  reminderNote: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  reminderActions: {
    flexDirection: width < 768 ? 'row' : 'column',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  bookBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#02808f',
    borderRadius: 8,
    alignItems: 'center',
    flex: width < 768 ? 1 : 0,
    minWidth: width < 768 ? 0 : 200,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emergency: {
    backgroundColor: '#d32f2f',
  },
  emptyText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#02808f',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#02808f',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckupReminder;