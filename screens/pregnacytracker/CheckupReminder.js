import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  SafeAreaView,
  Platform,
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
  const scaleAnims = useRef(new Map()).current; // Animation for button presses
  const fadeAnim = useRef(new Animated.Value(1)).current; // Animation for view transitions
  const slideAnim = useRef(new Animated.Value(0)).current; // Animation for month/week navigation
  const scrollRef = useRef(null); // Ref for week view scroll

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );
  const years = Array.from(
    { length: 21 },
    (_, i) => today.getFullYear() - 10 + i
  );

  // Initialize animation for each button
  const getScaleAnim = (key) => {
    if (!scaleAnims.has(key)) {
      scaleAnims.set(key, new Animated.Value(1));
    }
    return scaleAnims.get(key);
  };

  // Handle button press animation
  const animatePress = (key, callback) => {
    const scaleAnim = getScaleAnim(key);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  // Handle view transition animation
  const animateViewTransition = (callback) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  // Handle month/week navigation animation
  const animateNavigation = (direction, callback) => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -20 : 20,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

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
    const key = dateObj.toDateString();
    animatePress(key, () => {
      if (!isCurrentMonth && viewMode === 'month') {
        setDate({
          month: dateObj.getMonth(),
          year: dateObj.getFullYear(),
          day: 1,
        });
      }
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
    });
  };

  const goToToday = () => {
    animatePress('today', () => {
      animateViewTransition(() => {
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
      });
    });
  };

  const goToPrev = () => {
    animatePress('prev', () => {
      animateNavigation('prev', () => {
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
          scrollRef.current?.scrollTo({ x: 0, animated: true });
        }
        setSelectedDay(null);
        setSelectedItems([]);
      });
    });
  };

  const goToNext = () => {
    animatePress('next', () => {
      animateNavigation('next', () => {
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
          scrollRef.current?.scrollTo({ x: 0, animated: true });
        }
        setSelectedDay(null);
        setSelectedItems([]);
      });
    });
  };

  const toggleViewMode = () => {
    animatePress('toggle', () => {
      animateViewTransition(() => {
        setViewMode(viewMode === 'month' ? 'week' : 'month');
        setSelectedDay(null);
        setSelectedItems([]);
      });
    });
  };

  const openModal = () => {
    animatePress('month-year', () => {
      setModalType('picker');
      setModalVisible(true);
    });
  };

  const getWeekRange = () => {
    const startOfWeek = new Date(date.year, date.month, date.day);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    return `${startOfWeek.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;
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
          <View style={styles(width).modalPickerContainer}>
            <FlatList
              data={months}
              keyExtractor={(item, index) => `month-${index}`}
              style={styles(width).modalColumn}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles(width).modalItem,
                    date.month === index && styles(width).modalItemSelected,
                  ]}
                  onPress={() => {
                    animatePress(`month-${index}`, () => {
                      setDate({ ...date, month: index });
                    });
                  }}
                  accessibilityLabel={`Select ${item}`}
                  accessibilityHint={`Sets the calendar month to ${item}`}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles(width).modalItemText,
                    date.month === index && styles(width).modalItemTextSelected,
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <FlatList
              data={years}
              keyExtractor={(item, index) => `year-${index}`}
              style={styles(width).modalColumn}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles(width).modalItem,
                    date.year === item && styles(width).modalItemSelected,
                  ]}
                  onPress={() => {
                    animatePress(`year-${index}`, () => {
                      setDate({ ...date, year: item });
                    });
                  }}
                  accessibilityLabel={`Select year ${item}`}
                  accessibilityHint={`Sets the calendar year to ${item}`}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles(width).modalItemText,
                    date.year === item && styles(width).modalItemTextSelected,
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
          <View style={styles(width).modalButtonContainer}>
            <TouchableOpacity
              style={[styles(width).modalCancelButton, { transform: [{ scale: getScaleAnim('modal-cancel') }] }]}
              onPress={() => animatePress('modal-cancel', () => setModalVisible(false))}
              accessibilityLabel="Cancel selection"
              accessibilityHint="Closes the month and year picker without saving"
              accessibilityRole="button"
            >
              <Text style={styles(width).modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles(width).modalCloseButton, { transform: [{ scale: getScaleAnim('modal-close') }] }]}
              onPress={() => animatePress('modal-close', () => setModalVisible(false))}
              accessibilityLabel="Done selecting"
              accessibilityHint="Closes the month and year picker"
              accessibilityRole="button"
            >
              <Text style={styles(width).modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderMonthView = () => {
    const cells = [];

    // Previous month tail
    const prevMonthDays = new Date(date.year, date.month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const dateObj = new Date(date.year, date.month - 1, prevMonthDays - i);
      cells.push(
        <TouchableOpacity
          key={`prev-${i}`}
          style={[styles(width).calendarDayOutside, { transform: [{ scale: getScaleAnim(`prev-${i}`) }] }]}
          onPress={() => handleDayClick(dateObj, false)}
          accessibilityLabel={`Day ${prevMonthDays - i}, previous month`}
          accessibilityHint={`Selects ${dateObj.toLocaleDateString('en-GB')} in previous month`}
          accessibilityRole="button"
        >
          <Text style={styles(width).calendarDayText}>{prevMonthDays - i}</Text>
        </TouchableOpacity>
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
      if (remindersForDay?.length) {
        const isEmergency = remindersForDay.some((r) => r.type === 'emergency');
        const isStart = remindersForDay.some((r) => r.rangeType === 'start');
        const isEnd = remindersForDay.some((r) => r.rangeType === 'end');
        reminderStyle = isEmergency
          ? isStart || isEnd
            ? styles(width).emergency
            : styles(width).emergencyMiddle
          : isStart || isEnd
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
          style={[dayStyles, { transform: [{ scale: getScaleAnim(dateKey) }] }]}
          onPress={() => handleDayClick(dateObj, true)}
          accessibilityLabel={`Day ${day}`}
          accessibilityHint={`Selects ${dateObj.toLocaleDateString('en-GB')} to view reminders and appointments`}
          accessibilityRole="button"
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
        const dateObj = new Date(date.year, date.month + 1, i);
        cells.push(
          <TouchableOpacity
            key={`next-${i}`}
            style={[styles(width).calendarDayOutside, { transform: [{ scale: getScaleAnim(`next-${i}`) }] }]}
            onPress={() => handleDayClick(dateObj, false)}
            accessibilityLabel={`Day ${i}, next month`}
            accessibilityHint={`Selects ${dateObj.toLocaleDateString('en-GB')} in next month`}
            accessibilityRole="button"
          >
            <Text style={styles(width).calendarDayText}>{i}</Text>
          </TouchableOpacity>
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
      if (remindersForDay?.length) {
        const isEmergency = remindersForDay.some((r) => r.type === 'emergency');
        const isStart = remindersForDay.some((r) => r.rangeType === 'start');
        const isEnd = remindersForDay.some((r) => r.rangeType === 'end');
        reminderStyle = isEmergency
          ? isStart || isEnd
            ? styles(width).emergency
            : styles(width).emergencyMiddle
          : isStart || isEnd
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
          style={[dayStyles, { transform: [{ scale: getScaleAnim(dateKey) }] }]}
          onPress={() => handleDayClick(dateObj, true)}
          accessibilityLabel={`Day ${dateObj.getDate()} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()]}`}
          accessibilityHint={`Selects ${dateObj.toLocaleDateString('en-GB')} to view reminders and appointments`}
          accessibilityRole="button"
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

    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={width - 32}
        decelerationRate="fast"
        contentContainerStyle={styles(width).weekScrollContainer}
      >
        <View style={styles(width).calendarWeekGrid}>{days}</View>
      </ScrollView>
    );
  };

  return (
    <Animated.View style={[styles(width).calendarContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <View style={styles(width).calendarHeader}>
        <TouchableOpacity
          style={[styles(width).navButton, { transform: [{ scale: getScaleAnim('prev') }] }]}
          onPress={goToPrev}
          accessibilityLabel={viewMode === 'month' ? 'Previous month' : 'Previous week'}
          accessibilityHint={viewMode === 'month' ? 'Go to previous month' : 'Go to previous week'}
          accessibilityRole="button"
        >
          <Text style={styles(width).navButtonText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles(width).monthYearContainer, { transform: [{ scale: getScaleAnim('month-year') }] }]}
          onPress={openModal}
          accessibilityLabel={`Select ${months[date.month]} ${date.year}`}
          accessibilityHint="Opens month and year picker"
          accessibilityRole="button"
        >
          <Text style={styles(width).monthYearText}>
            {viewMode === 'month' ? `${months[date.month]} ${date.year}` : getWeekRange()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles(width).navButton, { transform: [{ scale: getScaleAnim('next') }] }]}
          onPress={goToNext}
          accessibilityLabel={viewMode === 'month' ? 'Next month' : 'Next week'}
          accessibilityHint={viewMode === 'month' ? 'Go to next month' : 'Go to next week'}
          accessibilityRole="button"
        >
          <Text style={styles(width).navButtonText}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles(width).controlBar}>
        <TouchableOpacity
          style={[styles(width).todayButton, { transform: [{ scale: getScaleAnim('today') }] }]}
          onPress={goToToday}
          accessibilityLabel="Go to today"
          accessibilityHint="Sets calendar to today's date"
          accessibilityRole="button"
        >
          <Text style={styles(width).todayButtonText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles(width).viewToggleButton, { transform: [{ scale: getScaleAnim('toggle') }] }]}
          onPress={toggleViewMode}
          accessibilityLabel={`Switch to ${viewMode === 'month' ? 'week' : 'month'} view`}
          accessibilityHint={`Changes calendar to ${viewMode === 'month' ? 'week' : 'month'} view`}
          accessibilityRole="button"
        >
          <Text style={styles(width).viewToggleButtonText}>
            {viewMode === 'month' ? 'Week' : 'Month'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles(width).calendarGrid}>
        <View style={styles(width).calendarDayNames}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <View key={d} style={styles(width).calendarDayName}>
              <Text style={styles(width).calendarDayNameText}>{d}</Text>
            </View>
          ))}
        </View>
        <Animated.View style={[viewMode === 'month' ? styles(width).calendarMonthGrid : {}, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          {viewMode === 'month' ? renderMonthView() : renderWeekView()}
        </Animated.View>
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
    </Animated.View>
  );
};

const CheckupReminder = ({ token, userId, appointments = [] }) => {
  const { width } = useWindowDimensions();
  const [recommendedReminders, setRecommendedReminders] = useState([]);
  const [emergencyReminders, setEmergencyReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.navigate('Consultation'));
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
          style={[styles(width).bookBtn, isUrgent ? styles(width).emergency : {}, { transform: [{ scale: scaleAnim }] }]}
          onPress={() => handleBook(reminder)}
          accessibilityLabel={isUrgent ? `Book urgent consultation for ${reminder.title}` : `Schedule consultation for ${reminder.title}`}
          accessibilityHint="Navigates to consultation booking screen"
          accessibilityRole="button"
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
      <SafeAreaView style={styles(width).checkupReminder}>
        <View style={styles(width).loadingContainer}>
          <ActivityIndicator size="large" color="#02808f" />
          <Text style={styles(width).loadingText}>Loading your reminders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles(width).checkupReminder}>
        <View style={styles(width).errorContainer}>
          <Text style={styles(width).errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles(width).retryBtn, { transform: [{ scale: scaleAnim }] }]}
            onPress={() => {
              Animated.sequence([
                Animated.timing(scaleAnim, {
                  toValue: 0.95,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }),
              ]).start(() => fetchReminders());
            }}
            accessibilityLabel="Retry loading reminders"
            accessibilityHint="Attempts to reload checkup reminders"
            accessibilityRole="button"
          >
            <Text style={styles(width).retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles(width).checkupReminder}>
      <ScrollView contentContainerStyle={styles(width).scrollContent}>
        <Text style={styles(width).sectionTitle}>Checkup Reminders</Text>
        <Text style={styles(width).sectionSubtitle}>
          Stay on top of your prenatal care schedule
        </Text>

        <CheckupCalendar
          reminders={[...recommendedReminders, ...emergencyReminders]}
          appointments={appointments}
        />

        <View style={styles(width).reminderSection}>
          <Text style={styles(width).sectionSubheading}>Recommended Checkups</Text>
          {recommendedReminders.length > 0 ? (
            recommendedReminders.map((reminder) => renderReminderCard(reminder))
          ) : (
            <Text style={styles(width).emptyText}>No recommended checkups at this time.</Text>
          )}
        </View>

        <View style={[styles(width).reminderSection, styles(width).emergencySection]}>
          <Text style={[styles(width).sectionSubheading, styles(width).emergencySubheading]}>
            Emergency Checkups
          </Text>
          {emergencyReminders.length > 0 ? (
            emergencyReminders.map((reminder) => renderReminderCard(reminder, true))
          ) : (
            <Text style={styles(width).emptyText}>No emergency checkups at this time.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (width) => StyleSheet.create({
  checkupReminder: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: width < 768 ? 16 : 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    color: '#04668d',
    fontSize: width < 768 ? 22 : 26,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  sectionSubtitle: {
    fontSize: width < 768 ? 15 : 17,
    color: '#555',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 22,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: width < 768 ? 16 : 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  navButton: {
    backgroundColor: '#02808f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 52,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  monthYearContainer: {
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 3,
    alignItems: 'center',
    minHeight: 52,
  },
  monthYearText: {
    color: '#04668d',
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  viewToggleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#02808f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 50,
    alignItems: 'center',
    flex: 1,
  },
  viewToggleButtonText: {
    color: '#02808f',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  todayButton: {
    backgroundColor: '#02808f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 50,
    alignItems: 'center',
    flex: 1,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  calendarGrid: {
    flexDirection: 'column',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  calendarDayNames: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: width < 768 ? 8 : 10,
  },
  calendarWeekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: width < 768 ? 8 : 10,
    paddingVertical: 12,
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
  },
  weekScrollContainer: {
    paddingHorizontal: 16,
  },
  calendarDayName: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  calendarDayNameText: {
    color: '#04668d',
    fontSize: width < 768 ? 13 : 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  calendarDay: {
    width: (width < 768 ? width - 48 : width - 64) / 7 - (width < 768 ? 8 : 10),
    height: width < 768 ? 56 : 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  calendarDayWeek: {
    width: (width < 768 ? width - 48 : width - 64) / 7 - (width < 768 ? 8 : 10),
    height: width < 768 ? 70 : 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  calendarDayOutside: {
    width: (width < 768 ? width - 48 : width - 64) / 7 - (width < 768 ? 8 : 10),
    height: width < 768 ? 56 : 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    opacity: 0.3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calendarDayText: {
    fontSize: width < 768 ? 15 : 17,
    color: '#333',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selected: {
    borderWidth: 2,
    borderColor: '#034b67',
    backgroundColor: 'rgba(4, 102, 141, 0.1)',
  },
  today: {
    backgroundColor: '#04668d',
    borderWidth: 2,
    borderColor: '#034b67',
  },
  todayMarker: {
    fontSize: width < 768 ? 11 : 13,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  appointmentHighlight: {
    backgroundColor: 'rgba(4, 154, 168, 0.2)',
  },
  recommended: {
    backgroundColor: 'rgba(3, 132, 116, 0.3)',
    borderWidth: 2,
    borderColor: '#038474',
  },
  recommendedMiddle: {
    backgroundColor: 'rgba(3, 132, 116, 0.15)',
  },
  emergency: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    borderWidth: 2,
    borderColor: '#d32f2f',
  },
  emergencyMiddle: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  eventDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  appointmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#049aa8',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  recommendedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#038474',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  emergencyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d32f2f',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  calendarInstruction: {
    marginTop: 16,
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    backgroundColor: '#d32f2f',
  },
  instructionText: {
    fontSize: width < 768 ? 13 : 15,
    color: '#333',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reminderDetails: {
    marginTop: 16,
    gap: 12,
  },
  reminderItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reminderItemTitle: {
    fontSize: width < 768 ? 15 : 17,
    fontWeight: '700',
    color: '#04668d',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reminderItemDatetime: {
    fontSize: width < 768 ? 13 : 15,
    fontWeight: '500',
    color: '#02808f',
    marginBottom: 6,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reminderItemDoctor: {
    fontSize: width < 768 ? 13 : 15,
    fontWeight: '600',
    color: '#02808f',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reminderItemAddress: {
    fontSize: width < 768 ? 13 : 15,
    color: '#555',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reminderItemNote: {
    fontSize: width < 768 ? 13 : 15,
    color: '#555',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    width: '100%',
    maxHeight: '40%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  modalItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalItemSelected: {
    backgroundColor: 'rgba(4, 102, 141, 0.1)',
  },
  modalItemText: {
    fontSize: 16,
    color: '#02808f',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalItemTextSelected: {
    color: '#04668d',
    fontWeight: '700',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalCancelButton: {
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    minHeight: 50,
  },
  modalCancelButtonText: {
    color: '#02808f',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalCloseButton: {
    backgroundColor: '#02808f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    minHeight: 50,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reminderSection: {
    marginTop: 20,
  },
  sectionSubheading: {
    color: '#02808f',
    fontSize: width < 768 ? 19 : 21,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
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
    fontSize: width < 768 ? 15 : 17,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reminderDate: {
    fontSize: width < 768 ? 13 : 15,
    color: '#02808f',
    fontWeight: '500',
    marginBottom: 6,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reminderNote: {
    fontSize: width < 768 ? 13 : 15,
    color: '#555',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reminderActions: {
    flexDirection: width < 768 ? 'row' : 'column',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  bookBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#02808f',
    borderRadius: 12,
    alignItems: 'center',
    flex: width < 768 ? 1 : 0,
    minWidth: width < 768 ? 0 : 220,
    minHeight: 50,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emergency: {
    backgroundColor: '#d32f2f',
  },
  emptyText: {
    fontSize: width < 768 ? 13 : 15,
    color: '#555',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#02808f',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  retryBtn: {
    backgroundColor: '#02808f',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'center',
    minHeight: 50,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default CheckupReminder;