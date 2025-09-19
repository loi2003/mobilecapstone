import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput, Modal, Dimensions, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getClinicById } from "../api/clinic-api";
import { startChatThread } from "../api/message-api";
import { createFeedback } from "../api/feedback-api";
import { getCurrentUser } from "../api/auth";

const { width } = Dimensions.get('window');

// Helper to calculate star rating
const getStarRating = (feedbacks) => {
  if (!feedbacks || feedbacks.length === 0) {
    return { avg: 0, stars: 0, count: 0 };
  }
  const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
  const avg10 = sum / feedbacks.length;
  const avg5 = avg10 / 2;
  return { avg: avg5, stars: avg5, count: feedbacks.length };
};

// Helper to render stars
const renderStars = (stars, onPress = null, selectedRating = 0) => {
  const filled = Math.floor(stars);
  const half = stars - filled >= 0.5;
  return (
    <View style={styles.starsContainer}>
      {[...Array(5)].map((_, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onPress && onPress(i + 1)}
          disabled={!onPress}
          style={styles.starTouchable}
        >
          <Text
            style={[
              styles.star,
              {
                color: onPress
                  ? selectedRating >= i + 1 ? '#f7b801' : '#ccc'
                  : i < filled ? '#f7b801' : i === filled && half ? '#f7b801' : '#ccc',
              },
            ]}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Doctor Card Component
const DoctorCard = ({ user, onImageError, onImageLoad, imageErrors, imageLoading }) => (
  <View style={styles.clinicDoctorCard}>
    <View style={styles.clinicDoctorAvatar}>
      {imageLoading[`doctor-${user.id}`] && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color="#0D7AA5" />
        </View>
      )}
      <Image
        source={{
          uri: imageErrors[`doctor-${user.id}`] || !user?.avatar?.fileUrl
            ? 'https://via.placeholder.com/120'
            : user.avatar.fileUrl,
        }}
        style={styles.clinicDoctorAvatarImage}
        onError={() => onImageError(`doctor-${user.id}`)}
        onLoad={() => onImageLoad(`doctor-${user.id}`)}
      />
      {(imageErrors[`doctor-${user.id}`] || !user?.avatar?.fileUrl) && (
        <View style={styles.placeholderOverlay}>
          <Icon name="user" size={40} color="rgba(13, 122, 165, 0.4)" />
        </View>
      )}
    </View>
    <View style={styles.clinicDoctorInfo}>
      <Text style={styles.clinicDoctorName}>{user?.userName}</Text>
      <View style={styles.clinicDoctorContact}>
        <Text style={styles.clinicDoctorContactText}>
          <Text style={styles.clinicDoctorContactLabel}>Phone: </Text>
          {user?.phone || user?.phoneNo}
        </Text>
        <Text style={styles.clinicDoctorContactText}>
          <Text style={styles.clinicDoctorContactLabel}>Email: </Text>
          {user?.email}
        </Text>
      </View>
    </View>
  </View>
);

// Consultant Card Component
const ConsultantCard = ({ consultant, onSendMessage, chatLoading, onImageError, onImageLoad, imageErrors, imageLoading }) => (
  <View style={styles.clinicDoctorCard}>
    <View style={styles.clinicDoctorAvatar}>
      {imageLoading[`consultant-${consultant.user.id}`] && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color="#0D7AA5" />
        </View>
      )}
      <Image
        source={{
          uri: imageErrors[`consultant-${consultant.user.id}`] || !consultant.user?.avatar?.fileUrl
            ? 'https://via.placeholder.com/120'
            : consultant.user.avatar.fileUrl,
        }}
        style={styles.clinicDoctorAvatarImage}
        onError={() => onImageError(`consultant-${consultant.user.id}`)}
        onLoad={() => onImageLoad(`consultant-${consultant.user.id}`)}
      />
      {(imageErrors[`consultant-${consultant.user.id}`] || !consultant.user?.avatar?.fileUrl) && (
        <View style={styles.placeholderOverlay}>
          <Icon name="user" size={40} color="rgba(13, 122, 165, 0.4)" />
        </View>
      )}
    </View>
    <View style={styles.clinicDoctorInfo}>
      <Text style={styles.clinicDoctorName}>{consultant.user?.userName}</Text>
      <View style={styles.clinicDoctorContact}>
        <Text style={styles.clinicDoctorContactText}>
          <Text style={styles.clinicDoctorContactLabel}>Phone: </Text>
          {consultant.user?.phone || consultant.user?.phoneNo}
        </Text>
        <Text style={styles.clinicDoctorContactText}>
          <Text style={styles.clinicDoctorContactLabel}>Email: </Text>
          {consultant.user?.email}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.consultantSendMessageBtn, chatLoading && styles.consultantSendMessageBtnDisabled]}
        onPress={() => onSendMessage(consultant)}
        disabled={chatLoading}
      >
        <Icon name="send" size={18} color="#1976d2" style={styles.consultantSendMessageIcon} />
        <Text style={styles.consultantSendMessageText}>
          {chatLoading ? 'Starting...' : 'Send Message'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Chat Box Component
const ChatBox = ({ consultant, onClose, userId, chatThread, onImageError, onImageLoad, imageErrors, imageLoading }) => (
  <View style={styles.floatingChatboxContainer}>
    <View style={styles.floatingChatboxWindow}>
      <View style={styles.floatingChatboxHeader}>
        <View style={styles.floatingChatboxHeaderLeft}>
          <View style={styles.floatingChatboxAvatarContainer}>
            {imageLoading[`chat-${consultant.user.id}`] && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#0D7AA5" />
              </View>
            )}
            <Image
              source={{
                uri: imageErrors[`chat-${consultant.user.id}`] || !consultant.user.avatar?.fileUrl
                  ? 'https://via.placeholder.com/40'
                  : consultant.user.avatar.fileUrl,
              }}
              style={styles.floatingChatboxAvatar}
              onError={() => onImageError(`chat-${consultant.user.id}`)}
              onLoad={() => onImageLoad(`chat-${consultant.user.id}`)}
            />
            {(imageErrors[`chat-${consultant.user.id}`] || !consultant.user.avatar?.fileUrl) && (
              <View style={styles.placeholderOverlay}>
                <Icon name="user" size={20} color="rgba(13, 122, 165, 0.4)" />
              </View>
            )}
          </View>
          <Text style={styles.floatingChatboxUsername}>{consultant.user.userName}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.floatingChatboxActionBtn}>
          <Icon name="times" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.floatingChatboxBody}>
        <View style={styles.floatingChatboxLoading}>
          <ActivityIndicator size="large" color="#0D7AA5" />
        </View>
      </View>
      <View style={styles.floatingChatboxFooter}>
        <TouchableOpacity style={styles.floatingChatboxFooterBtn}>
          <Icon name="image" size={22} color="#2196f3" />
        </TouchableOpacity>
        <TextInput
          style={styles.floatingChatboxInput}
          placeholder="Aa"
          placeholderTextColor="#848785"
        />
        <TouchableOpacity style={styles.floatingChatboxSendBtn}>
          <Icon name="send" size={22} color="#2196f3" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const ClinicDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { clinicId } = route.params;
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [showAllConsultants, setShowAllConsultants] = useState(false);
  const [chatConsultant, setChatConsultant] = useState(null);
  const [chatThread, setChatThread] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check token on mount for debugging
  useEffect(() => {
    const checkStoredToken = async () => {
      const token = await AsyncStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
    };
    checkStoredToken();
  }, []);

  // Fetch clinic details
  useEffect(() => {
    const fetchClinicDetails = async () => {
      try {
        const data = await getClinicById(clinicId);
        setClinic(data.data || data);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      } catch (err) {
        setError(`Failed to fetch clinic details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchClinicDetails();
  }, [clinicId]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setAuthLoading(true);
        const token = await AsyncStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
        if (!token) {
          setCurrentUserId('');
          return;
        }
        const userRes = await getCurrentUser(token);
        const userId =
          userRes?.data?.data?.id ||
          userRes?.data?.id ||
          userRes?.id ||
          '';
        if (!userId) {
          console.warn('User ID not found in response');
          await AsyncStorage.removeItem('authToken'); // Changed from 'token' to 'authToken'
          setCurrentUserId('');
          return;
        }
        setCurrentUserId(userId);
      } catch (err) {
        console.error('Error fetching current user:', err.response?.data || err.message);
        setCurrentUserId('');
        await AsyncStorage.removeItem('authToken'); // Changed from 'token' to 'authToken'
      } finally {
        setAuthLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // Handle image loading and errors
  const handleImageError = (imageId) => {
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
    setImageLoading(prev => ({ ...prev, [imageId]: false }));
  };

  const handleImageLoad = (imageId) => {
    setImageLoading(prev => ({ ...prev, [imageId]: false }));
  };

  const handleImageLoadStart = (imageId) => {
    setImageLoading(prev => ({ ...prev, [imageId]: true }));
  };

  // Handle sending messages to consultants
  const handleSendMessage = async (consultant) => {
    if (!currentUserId || !consultant?.user?.id) {
      setShowLoginModal(true); // Show login modal if user is not authenticated
      return;
    }
    setChatLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
      if (!token) {
        setShowLoginModal(true);
        setChatLoading(false);
        return;
      }
      const thread = await startChatThread({
        userId: currentUserId,
        consultantId: consultant.user.id,
      });
      setChatThread(thread);
      setChatConsultant(consultant);
    } catch (err) {
      console.error('Error starting chat thread:', err.response?.data || err.message);
      alert('Failed to start chat thread: ' + (err.response?.data?.message || err.message));
    }
    setChatLoading(false);
  };

  // Handle opening feedback modal
  const handleOpenFeedbackModal = async () => {
    if (currentUserId) {
      setShowFeedbackModal(true);
      setFeedbackRating(0);
      setFeedbackComment('');
      setFeedbackError('');
      setFeedbackSuccess('');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
      if (!token) {
        setShowLoginModal(true);
        return;
      }
      const userRes = await getCurrentUser(token);
      const userId =
        userRes?.data?.data?.id ||
        userRes?.data?.id ||
        userRes?.id ||
        '';
      if (!userId) {
        await AsyncStorage.removeItem('authToken'); // Changed from 'token' to 'authToken'
        setShowLoginModal(true);
        return;
      }
      setCurrentUserId(userId);
      setShowFeedbackModal(true);
      setFeedbackRating(0);
      setFeedbackComment('');
      setFeedbackError('');
      setFeedbackSuccess('');
    } catch (err) {
      console.error('Error in handleOpenFeedbackModal:', err.response?.data || err.message);
      await AsyncStorage.removeItem('authToken'); // Changed from 'token' to 'authToken'
      setShowLoginModal(true);
    }
  };

  // Handle closing feedback modal
  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackRating(0);
    setFeedbackComment('');
    setFeedbackError('');
    setFeedbackSuccess('');
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    setFeedbackLoading(true);
    setFeedbackError('');
    setFeedbackSuccess('');
    if (!feedbackRating || feedbackRating < 1 || feedbackRating > 5) {
      setFeedbackError('Please select a rating from 1 to 5.');
      setFeedbackLoading(false);
      return;
    }
    if (!currentUserId) {
      setFeedbackError('You must be logged in to submit feedback.');
      setFeedbackLoading(false);
      setShowLoginModal(true);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
      if (!token) {
        setFeedbackError('Authentication token is missing.');
        setFeedbackLoading(false);
        setShowLoginModal(true);
        return;
      }
      const payload = {
        clinicId: clinic.id,
        userId: currentUserId,
        rating: feedbackRating * 2,
        comment: feedbackComment,
      };
      await createFeedback(payload, token);
      setFeedbackSuccess('Feedback submitted successfully!');
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSuccess('');
        setFeedbackRating(0);
        setFeedbackComment('');
      }, 1200);
    } catch (err) {
      console.error('Feedback submission error:', err.response?.data || err.message);
      setFeedbackError('Failed to submit feedback: ' + (err.response?.data?.message || err.message));
    }
    setFeedbackLoading(false);
  };

  // Open map with clinic address
  const openMap = () => {
    if (!clinic?.address) {
      alert('Clinic address is not available.');
      return;
    }
    const encodedAddress = encodeURIComponent(clinic.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(url).catch(err => alert('Failed to open map: ' + err.message));
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D7AA5" />
        <Text style={styles.loadingText}>Loading Clinic Details...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Clinic not found
  if (!clinic) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Clinic not found.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { avg, count } = getStarRating(clinic.feedbacks);
  const doctorsToShow = clinic.doctors && !showAllDoctors ? clinic.doctors.slice(0, 9) : clinic.doctors;
  const consultantsToShow = clinic.consultants && !showAllConsultants ? clinic.consultants.slice(0, 9) : clinic.consultants;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#0D7AA5" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Header Banner */}
        <Animated.View
          style={[
            styles.clinicHeaderBanner,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.clinicHeaderLogo}>
            {imageLoading['clinic-main'] && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#0D7AA5" />
              </View>
            )}
            <Image
              source={{
                uri: imageErrors['clinic-main'] || !clinic.imageUrl?.fileUrl
                  ? 'https://via.placeholder.com/150'
                  : clinic.imageUrl.fileUrl,
              }}
              style={styles.clinicHeaderLogoImage}
              onError={() => handleImageError('clinic-main')}
              onLoad={() => handleImageLoad('clinic-main')}
              onLoadStart={() => handleImageLoadStart('clinic-main')}
            />
            {(imageErrors['clinic-main'] || !clinic.imageUrl?.fileUrl) && (
              <View style={styles.placeholderOverlay}>
                <Icon name="hospital-o" size={40} color="rgba(13, 122, 165, 0.4)" />
              </View>
            )}
          </View>
          <View style={styles.clinicHeaderMeta}>
            <Text style={styles.clinicHeaderTitle}>{clinic.name}</Text>
            <View style={styles.clinicHeaderAddress}>
              <Icon name="map-marker" size={18} color="#757575" style={styles.clinicHeaderLocationIcon} />
              <Text style={styles.clinicHeaderLocation}>{clinic.address}</Text>
            </View>
            <View style={styles.clinicHeaderContactRow}>
              <View style={styles.clinicHeaderContactItem}>
                <Icon name="phone" size={18} color="#757575" style={styles.clinicHeaderContactIcon} />
                <Text style={styles.clinicHeaderContactText}>{clinic.user.phoneNo}</Text>
              </View>
              <View style={styles.clinicHeaderContactItem}>
                <Icon name="envelope" size={18} color="#757575" style={styles.clinicHeaderContactIcon} />
                <Text style={styles.clinicHeaderContactText}>{clinic.user.email}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Main Content */}
        <View style={styles.clinicMainContent}>
          <View style={styles.clinicMainLeft}>
            {/* About the Clinic */}
            <View style={styles.clinicSection}>
              <Text style={styles.clinicSectionTitle}>About the Clinic</Text>
              <Text style={styles.clinicSectionDesc}>{clinic.description}</Text>
              <TouchableOpacity style={styles.clinicMapButton} onPress={openMap}>
                <Icon name="map" size={18} color="#fff" style={styles.clinicMapButtonIcon} />
                <Text style={styles.clinicMapButtonText}>View Location on Map</Text>
              </TouchableOpacity>
              <View style={styles.clinicSectionInfo}>
                <Text style={styles.clinicSectionInfoText}>
                  <Text style={styles.clinicSectionInfoLabel}>Insurance Accepted: </Text>
                  {clinic.isInsuranceAccepted ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.clinicSectionInfoText}>
                  <Text style={styles.clinicSectionInfoLabel}>Specializations: </Text>
                  {clinic.specializations}
                </Text>
              </View>
            </View>

            {/* Doctors Section */}
            <View style={styles.clinicSection}>
              <Text style={styles.clinicSectionTitle}>Our Doctors</Text>
              <View style={styles.clinicDoctorList}>
                {doctorsToShow && doctorsToShow.length > 0 ? (
                  doctorsToShow.map((doctor) => (
                    <DoctorCard
                      key={doctor.id}
                      user={doctor.user}
                      onImageError={handleImageError}
                      onImageLoad={handleImageLoad}
                      imageErrors={imageErrors}
                      imageLoading={imageLoading}
                    />
                  ))
                ) : (
                  <View style={styles.clinicDoctorCardEmpty}>
                    <Text style={styles.clinicDoctorCardEmptyText}>No doctors</Text>
                  </View>
                )}
              </View>
              {clinic.doctors && clinic.doctors.length > 9 && !showAllDoctors && (
                <TouchableOpacity
                  style={styles.clinicSeeMoreBtn}
                  onPress={() => setShowAllDoctors(true)}
                >
                  <Text style={styles.clinicSeeMoreBtnText}>See more</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Consultants Section */}
            <View style={styles.clinicSection}>
              <Text style={styles.clinicSectionTitle}>Our Consultants</Text>
              <View style={styles.clinicDoctorList}>
                {consultantsToShow && consultantsToShow.length > 0 ? (
                  consultantsToShow.map((consultant) => (
                    <ConsultantCard
                      key={consultant.id}
                      consultant={consultant}
                      onSendMessage={handleSendMessage}
                      chatLoading={chatLoading}
                      onImageError={handleImageError}
                      onImageLoad={handleImageLoad}
                      imageErrors={imageErrors}
                      imageLoading={imageLoading}
                    />
                  ))
                ) : (
                  <View style={styles.clinicDoctorCardEmpty}>
                    <Text style={styles.clinicDoctorCardEmptyText}>No consultants</Text>
                  </View>
                )}
              </View>
              {clinic.consultants && clinic.consultants.length > 9 && !showAllConsultants && (
                <TouchableOpacity
                  style={styles.clinicSeeMoreBtn}
                  onPress={() => setShowAllConsultants(true)}
                >
                  <Text style={styles.clinicSeeMoreBtnText}>See more</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Feedback Section */}
            <View style={styles.clinicSection}>
              <Text style={styles.clinicSectionTitle}>Feedback</Text>
              <TouchableOpacity
                style={styles.clinicDetailGiveFeedbackBtn}
                onPress={handleOpenFeedbackModal}
              >
                <Text style={styles.clinicDetailGiveFeedbackBtnText}>Send Feedback</Text>
              </TouchableOpacity>
              <View style={styles.clinicFeedbackRating}>
                {renderStars(avg)}
                <Text style={styles.ratingValue}>{avg.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({count} reviews)</Text>
              </View>
              <View style={styles.clinicFeedbackList}>
                {clinic.feedbacks && clinic.feedbacks.length > 0 ? (
                  clinic.feedbacks.map((feedback) => {
                    const stars = Math.round(feedback.rating / 2);
                    return (
                      <View key={feedback.id} style={styles.clinicFeedbackCard}>
                        <View style={styles.feedbackStars}>
                          {[...Array(5)].map((_, i) => (
                            <Text
                              key={i}
                              style={[
                                styles.star,
                                { color: i < stars ? '#f7b801' : '#ccc' },
                              ]}
                            >
                              ★
                            </Text>
                          ))}
                        </View>
                        <Text style={styles.feedbackComment}>{feedback.comment}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.clinicFeedbackEmpty}>No feedback yet</Text>
                )}
              </View>
            </View>
          </View>

          {/* Booking Widget */}
          <View style={styles.clinicMainRight}>
            <View style={styles.clinicBookingWidget}>
              <Text style={styles.clinicBookingTitle}>Book Appointment</Text>
              <View style={styles.clinicBookingField}>
                <Text style={styles.clinicBookingLabel}>Clinic</Text>
                <TextInput
                  style={styles.clinicBookingInput}
                  value={clinic.name}
                  editable={false}
                />
              </View>
              <View style={styles.clinicBookingField}>
                <Text style={styles.clinicBookingLabel}>Specialization</Text>
                <TextInput
                  style={styles.clinicBookingInput}
                  value={clinic.specializations}
                  editable={false}
                />
              </View>
              <View style={styles.clinicBookingField}>
                <Text style={styles.clinicBookingLabel}>Doctor</Text>
                <TextInput
                  style={styles.clinicBookingInput}
                  placeholder="Select doctor"
                  editable={false}
                />
              </View>
              <TouchableOpacity style={styles.clinicBookingBtn} disabled>
                <Text style={styles.clinicBookingBtnText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseFeedbackModal}
      >
        <View style={styles.clinicFeedbackModalOverlay}>
          <View style={styles.clinicFeedbackModal}>
            <View style={styles.clinicFeedbackModalHeader}>
              <Text style={styles.clinicFeedbackModalHeaderText}>Send Feedback</Text>
              <TouchableOpacity onPress={handleCloseFeedbackModal}>
                <Text style={styles.clinicFeedbackModalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.clinicFeedbackModalBody}>
              <View style={styles.clinicFeedbackModalGroup}>
                <Text style={styles.clinicFeedbackModalLabel}>Rating (1-5)</Text>
                <View style={styles.clinicFeedbackModalStars}>
                  {renderStars(feedbackRating, setFeedbackRating, feedbackRating)}
                </View>
                <Text style={styles.clinicFeedbackModalRatingNote}>Click to rate</Text>
              </View>
              <View style={styles.clinicFeedbackModalGroup}>
                <Text style={styles.clinicFeedbackModalLabel}>Comment</Text>
                <TextInput
                  style={styles.clinicFeedbackModalTextarea}
                  value={feedbackComment}
                  onChangeText={setFeedbackComment}
                  placeholder="Write your feedback here..."
                  multiline
                  numberOfLines={4}
                />
              </View>
              {feedbackError ? (
                <Text style={styles.clinicFeedbackModalError}>{feedbackError}</Text>
              ) : null}
              {feedbackSuccess ? (
                <Text style={styles.clinicFeedbackModalSuccess}>{feedbackSuccess}</Text>
              ) : null}
              <View style={styles.clinicFeedbackModalActions}>
                <TouchableOpacity
                  style={styles.clinicDetailSendFeedbackCancelBtn}
                  onPress={handleCloseFeedbackModal}
                >
                  <Text style={styles.clinicDetailSendFeedbackCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.clinicDetailSendFeedbackBtn,
                    feedbackLoading && styles.clinicDetailSendFeedbackBtnDisabled,
                  ]}
                  onPress={handleSubmitFeedback}
                  disabled={feedbackLoading}
                >
                  <Text style={styles.clinicDetailSendFeedbackBtnText}>
                    {feedbackLoading ? 'Submitting...' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Login Modal */}
      <Modal
        visible={showLoginModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.clinicFeedbackModalOverlay}>
          <View style={styles.clinicFeedbackModal}>
            <View style={styles.clinicFeedbackModalHeader}>
              <Text style={styles.clinicFeedbackModalHeaderText}>Login Required</Text>
              <TouchableOpacity onPress={() => setShowLoginModal(false)}>
                <Text style={styles.clinicFeedbackModalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.clinicFeedbackModalBody, { alignItems: 'center' }]}>
              <Text style={styles.clinicFeedbackModalMessage}>
                You need to log in to send feedback.
              </Text>
              <TouchableOpacity
                style={styles.clinicDetailSendFeedbackBtn}
                onPress={() => {
                  setShowLoginModal(false);
                  navigation.navigate('Login', { redirectTo: 'ClinicDetail', params: { clinicId } }); // Pass clinicId in params
                }}
              >
                <Text style={styles.clinicDetailSendFeedbackBtnText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat Box */}
      {chatConsultant && (
        <ChatBox
          consultant={chatConsultant}
          userId={currentUserId}
          chatThread={chatThread}
          onClose={() => {
            setChatConsultant(null);
            setChatThread(null);
          }}
          onImageError={handleImageError}
          onImageLoad={handleImageLoad}
          imageErrors={imageErrors}
          imageLoading={imageLoading}
        />
      )}
    </SafeAreaView>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3f7ff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0D7AA5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    margin: 20,
    alignSelf: 'flex-start',
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  backButtonText: {
    color: '#0D7AA5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  clinicHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
    backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)',
  },
  clinicHeaderLogo: {
    width: 150,
    height: 150,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: -10,
    borderWidth: 3,
    borderColor: 'rgba(13, 122, 165, 0.1)',
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
  clinicHeaderLogoImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  clinicHeaderMeta: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  clinicHeaderTitle: {
    fontSize: width < 480 ? 24 : 28,
    fontWeight: '800',
    color: '#0D7AA5',
    lineHeight: 34,
    textShadowColor: 'rgba(13, 122, 165, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  clinicHeaderAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  clinicHeaderLocationIcon: {
    marginRight: 4,
  },
  clinicHeaderLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#02808F',
  },
  clinicHeaderContactRow: {
    flexDirection: 'column',
    marginTop: 8,
  },
  clinicHeaderContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 122, 165, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  clinicHeaderContactIcon: {
    marginRight: 4,
  },
  clinicHeaderContactText: {
    fontSize: 14,
    color: '#848785',
    fontWeight: '500',
  },
  clinicMainContent: {
    flexDirection: 'column',
    paddingHorizontal: 16,
  },
  clinicMainLeft: {
    flex: 1,
  },
  clinicMainRight: {
    width: '100%',
    marginTop: 16,
  },
  clinicSection: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13, 122, 165, 0.1)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)',
  },
  clinicSectionTitle: {
    fontSize: width < 480 ? 18 : 20,
    fontWeight: '700',
    color: '#0D7AA5',
    marginBottom: 12,
    paddingLeft: 8,
  },
  clinicSectionDesc: {
    fontSize: 16,
    color: '#013f50',
    lineHeight: 24,
    marginBottom: 12,
    paddingLeft: 8,
  },
  clinicMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#02808F',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
    paddingLeft: 8,
  },
  clinicMapButtonIcon: {
    marginRight: 8,
  },
  clinicMapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  clinicSectionInfo: {
    paddingLeft: 8,
  },
  clinicSectionInfoText: {
    fontSize: 14,
    color: '#848785',
    marginBottom: 8,
  },
  clinicSectionInfoLabel: {
    color: '#0D7AA5',
    fontWeight: '600',
  },
  clinicDoctorList: {
    paddingLeft: 8,
  },
  clinicDoctorCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13, 122, 165, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: 'column',
    alignItems: 'center',
  },
  clinicDoctorCardEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 122, 165, 0.02)',
    borderWidth: 2,
    borderColor: 'rgba(13, 122, 165, 0.2)',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
  },
  clinicDoctorCardEmptyText: {
    fontSize: 16,
    color: '#848785',
  },
  clinicDoctorAvatar: {
    marginBottom: 12,
    position: 'relative',
  },
  clinicDoctorAvatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  clinicDoctorInfo: {
    width: '100%',
    alignItems: 'center',
  },
  clinicDoctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D7AA5',
    marginBottom: 8,
  },
  clinicDoctorContact: {
    marginBottom: 8,
  },
  clinicDoctorContactText: {
    fontSize: 14,
    color: '#848785',
    marginBottom: 4,
  },
  clinicDoctorContactLabel: {
    color: '#02808F',
    fontWeight: '600',
  },
  consultantSendMessageBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0D7AA5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  consultantSendMessageBtnDisabled: {
    opacity: 0.6,
  },
  consultantSendMessageIcon: {
    marginRight: 4,
  },
  consultantSendMessageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D7AA5',
  },
  clinicSeeMoreBtn: {
    backgroundColor: '#02808F',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginTop: 12,
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  clinicSeeMoreBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  clinicFeedbackRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  starTouchable: {
    padding: 4,
  },
  star: {
    fontSize: 18,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D7AA5',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#848785',
  },
  clinicFeedbackList: {
    paddingLeft: 8,
  },
  clinicFeedbackCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13, 122, 165, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  feedbackStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  feedbackComment: {
    fontSize: 14,
    color: '#1976d2',
  },
  clinicFeedbackEmpty: {
    fontSize: 14,
    color: '#848785',
    paddingLeft: 8,
  },
  clinicDetailGiveFeedbackBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  clinicDetailGiveFeedbackBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  clinicBookingWidget: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13, 122, 165, 0.1)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
    backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)',
  },
  clinicBookingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D7AA5',
    marginBottom: 16,
    textAlign: 'center',
  },
  clinicBookingField: {
    marginBottom: 12,
  },
  clinicBookingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7AA5',
    marginBottom: 8,
  },
  clinicBookingInput: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(13, 122, 165, 0.2)',
    borderRadius: 10,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#013f50',
  },
  clinicBookingBtn: {
    backgroundColor: 'rgba(13, 122, 165, 0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  clinicBookingBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  floatingChatboxContainer: {
    position: 'absolute',
    bottom: 16,
    right: 0,
    width: '100%',
    zIndex: 3000,
    alignItems: 'flex-end',
  },
  floatingChatboxWindow: {
    width: '95%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#0D7AA5',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(13, 122, 165, 0.2)',
  },
  floatingChatboxHeader: {
    backgroundColor: '#0D7AA5',
    backgroundImage: 'linear-gradient(135deg, #0D7AA5 0%, #02808F 50%, #00A996 100%)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingChatboxHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingChatboxAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    position: 'relative',
  },
  floatingChatboxAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  floatingChatboxUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  floatingChatboxActionBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  floatingChatboxBody: {
    height: 400,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingChatboxLoading: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  floatingChatboxFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 122, 165, 0.1)',
  },
  floatingChatboxFooterBtn: {
    padding: 8,
    borderRadius: 8,
  },
  floatingChatboxInput: {
    flex: 1,
    backgroundColor: 'rgba(13, 122, 165, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(13, 122, 165, 0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#013f50',
  },
  floatingChatboxSendBtn: {
    padding: 8,
    borderRadius: 8,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 122, 165, 0.05)',
    borderRadius: 'inherit',
  },
  placeholderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    borderRadius: 'inherit',
  },
  clinicFeedbackModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicFeedbackModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxWidth: 500,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  clinicFeedbackModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clinicFeedbackModalHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D7AA5',
  },
  clinicFeedbackModalClose: {
    fontSize: 24,
    color: '#222',
  },
  clinicFeedbackModalBody: {
    flexDirection: 'column',
  },
  clinicFeedbackModalGroup: {
    marginBottom: 16,
  },
  clinicFeedbackModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7AA5',
    marginBottom: 8,
  },
  clinicFeedbackModalStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicFeedbackModalRatingNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  clinicFeedbackModalTextarea: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#013f50',
  },
  clinicFeedbackModalError: {
    fontSize: 14,
    color: '#d93025',
    marginBottom: 10,
  },
  clinicFeedbackModalSuccess: {
    fontSize: 14,
    color: '#188038',
    marginBottom: 10,
  },
  clinicFeedbackModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  clinicDetailSendFeedbackCancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#222',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  clinicDetailSendFeedbackCancelBtnText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  clinicDetailSendFeedbackBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  clinicDetailSendFeedbackBtnDisabled: {
    backgroundColor: '#90caf9',
  },
  clinicDetailSendFeedbackBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  clinicFeedbackModalMessage: {
    fontSize: 16,
    color: '#013f50',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f7ff',
  },
  loadingText: {
    fontSize: 16,
    color: '#0D7AA5',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f7ff',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fe6b6a',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ClinicDetailScreen;