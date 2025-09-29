import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { viewAllOfflineConsultation } from '../../api/offline-consultation-api';
import { formatDateForDisplay, formatTimeForDisplay } from '../../utils/date';

const UpcomingAppointments = ({ userId, status = null, expanded = false }) => {
  const { width } = useWindowDimensions(); // Use hook instead of module-level Dimensions
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const response = await viewAllOfflineConsultation(userId, status, token);
        const consultations = Array.isArray(response.data?.data) ? response.data.data : [];

        const mappedAppointments = consultations.map((consultation) => {
          const start = new Date(consultation.startDate);
          const end = new Date(consultation.endDate);

          return {
            id: consultation.id,
            name: consultation.checkupName || 'Unknown name',
            note: consultation.healthNote || 'No notes available',
            type: consultation.consultationType?.toLowerCase(),
            typecolor: getTypeColor(consultation.consultationType),
            doctor: consultation.doctor?.fullName || 'Unknown Doctor',
            clinic: consultation.clinic?.name || 'Unknown Clinic',
            address: consultation.clinic?.address,
            start,
            end,
            status: consultation.status?.toLowerCase(),
            color: getStatusColor(consultation.status),
          };
        });

        setAppointments(mappedAppointments);
      } catch (error) {
        console.error('Error loading offline consultations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userId, status]);

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed':
        return '#067Dad';
      case 'pending':
        return '#FFB300';
      case 'completed':
        return '#39BF7C';
      case 'cancelled':
        return '#D32F2F';
      default:
        return '#9E9E9E';
    }
  };

  const getTypeColor = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'onetime':
        return '#067DAD';
      case 'periodic':
        return '#FFB300';
      default:
        return '#9E9E9E';
    }
  };

  const displayedAppointments = expanded ? appointments : appointments.slice(0, 2);

  if (loading) {
    return <Text style={styles(width).loadingText}>Loading upcoming appointments...</Text>;
  }

  return (
    <View style={styles(width).upcomingAppointments}>
      <View style={styles(width).sectionHeader}>
        <Text style={styles(width).headerTitle}>Upcoming Appointments</Text>
        {!expanded && appointments.length > 2 && (
          <TouchableOpacity
            style={styles(width).viewAllBtn}
            onPress={() => navigation.navigate('AllAppointments')}
          >
            <Text style={styles(width).viewAllBtnText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles(width).appointmentsList}>
        {appointments.length === 0 ? (
          <Text style={styles(width).noAppointments}>No Upcoming Appointments yet!</Text>
        ) : (
          displayedAppointments.map((appointment) => (
            <View
              key={appointment.id}
              style={[styles(width).appointmentCard, { borderLeftColor: appointment.color }]}
            >
              <View style={styles(width).appointmentInfo}>
                <Text style={styles(width).appointmentName}>{appointment.name}</Text>
                <Text style={styles(width).doctorName}>Dr. {appointment.doctor}</Text>
                <View style={styles(width).appointmentDetails}>
                  <Text style={styles(width).appointmentTime}>
                    ⏰ {formatDateForDisplay(appointment.start)} {formatTimeForDisplay(appointment.start)} - {formatTimeForDisplay(appointment.end)}
                  </Text>
                  <Text style={styles(width).clinicAddress}>
                    📍 {appointment.address}
                  </Text>
                </View>
                <Text style={styles(width).notesLabel}>
                  <Text style={styles(width).notesLabelBold}>Notes:</Text> {appointment.note}
                </Text>
                <View style={styles(width).appointmentTypeSection}>
                  <Text style={[styles(width).appointmentType, { backgroundColor: appointment.typecolor }]}>
                    {appointment.type}
                  </Text>
                </View>
              </View>
              <View style={styles(width).appointmentActions}>
                <TouchableOpacity style={styles(width).appointmentViewBtn}>
                  <Text style={styles(width).actionBtnText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles(width).appointmentRescheduleBtn}>
                  <Text style={styles(width).actionBtnText}>Reschedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles(width).appointmentInstructionLegend}>
        <Text style={[styles(width).appointmentStatus, { color: '#067DAD' }]}>● Confirmed</Text>
        <Text style={[styles(width).appointmentStatus, { color: '#FFB300' }]}>● Pending</Text>
        <Text style={[styles(width).appointmentStatus, { color: '#E74C3C' }]}>● Canceled</Text>
      </View>

      {expanded && (
                                                             
        <TouchableOpacity
          style={styles(width).scheduleNewBtn}
          onPress={() => navigation.navigate('Consultation')}
        >
          <Text style={styles(width).scheduleNewBtnIcon}>➕</Text>
          <Text style={styles(width).scheduleNewBtnText}>Schedule New Appointment</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Styles as a function to accept width
const styles = (width) => StyleSheet.create({
  upcomingAppointments: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#04668D',
    fontSize: width < 768 ? 16 : 18,
    fontWeight: '700',
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  viewAllBtnText: {
    color: '#038474',
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentsList: {
    flexDirection: 'column',
    gap: 12,
  },
  noAppointments: {
    fontSize: 14,
    color: '#848785',
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: width < 768 ? 12 : 16,
    flexDirection: width < 768 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: width < 768 ? 'flex-start' : 'center',
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentName: {
    color: '#04668D',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  doctorName: {
    color: '#038474',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  appointmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#038474',
    fontWeight: '500',
  },
  clinicAddress: {
    fontSize: 14,
    color: '#038474',
    fontWeight: '500',
  },
  notesLabel: {
    fontSize: 14,
    color: '#848785',
    marginBottom: 8,
  },
  notesLabelBold: {
    fontWeight: '600',
    color: '#013F50',
  },
  appointmentTypeSection: {
    marginTop: 8,
  },
  appointmentType: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  appointmentActions: {
    flexDirection: width < 768 ? 'row' : 'column',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: width < 768 ? 'flex-start' : 'center',
  },
  appointmentViewBtn: {
    backgroundColor: '#02808F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: 120,
    alignItems: 'center',
  },
  appointmentRescheduleBtn: {
    backgroundColor: '#02808F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: 120,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentInstructionLegend: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  appointmentStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  scheduleNewBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#038474',
    borderRadius: 8,
    justifyContent: 'center',
  },
  scheduleNewBtnIcon: {
    fontSize: 16,
    color: '#038474',
  },
  scheduleNewBtnText: {
    color: '#038474',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 14,
    color: '#848785',
    textAlign: 'center',
  },
});

export default UpcomingAppointments;