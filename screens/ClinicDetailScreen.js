import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  Linking,
  Platform,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/FontAwesome";
import { getClinicById } from "../api/clinic-api";
import { startChatThread } from "../api/message-api";
import { createFeedback } from "../api/feedback-api";
import { getCurrentUser } from "../api/auth";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 768;

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
          accessibilityRole="button"
          accessibilityLabel={`Rate ${i + 1} star${i + 1 > 1 ? "s" : ""}`}
        >
          <Text
            style={[
              styles.star,
              {
                color: onPress
                  ? selectedRating >= i + 1
                    ? "#FF9500"
                    : "#C7C7CC"
                  : i < filled
                  ? "#FF9500"
                  : i === filled && half
                  ? "#FF9500"
                  : "#C7C7CC",
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

// Helper to validate and initiate phone call
const initiatePhoneCall = (phoneNumber) => {
  if (!phoneNumber) {
    alert("Phone number is not available.");
    return;
  }
  const cleanedPhone = phoneNumber.replace(/[^0-9+]/g, "");
  if (cleanedPhone.length < 7) {
    alert("Invalid phone number.");
    return;
  }
  const url = `tel:${cleanedPhone}`;
  Linking.openURL(url).catch((err) =>
    alert("Failed to make call: " + err.message)
  );
};

// Doctor Card Component
const DoctorCard = ({
  user,
  onImageError,
  onImageLoad,
  imageErrors,
  imageLoading,
}) => (
  <View style={styles.clinicDoctorCard}>
    <View style={styles.clinicDoctorAvatar}>
      {imageLoading[`doctor-${user.id}`] && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      <Image
        source={{
          uri:
            imageErrors[`doctor-${user.id}`] || !user?.avatar?.fileUrl
              ? "https://via.placeholder.com/120"
              : user.avatar.fileUrl,
        }}
        style={styles.clinicDoctorAvatarImage}
        onError={() => onImageError(`doctor-${user.id}`)}
        onLoad={() => onImageLoad(`doctor-${user.id}`)}
      />
      {(imageErrors[`doctor-${user.id}`] || !user?.avatar?.fileUrl) && (
        <View style={styles.placeholderOverlay}>
          <Icon name="user" size={40} color="rgba(0, 122, 255, 0.4)" />
        </View>
      )}
    </View>
    <View style={styles.clinicDoctorInfo}>
      <Text style={styles.clinicDoctorName}>{user?.userName || "Unknown"}</Text>
      <View style={styles.clinicDoctorContact}>
        <TouchableOpacity
          style={styles.clinicDoctorContactItem}
          onPress={() => initiatePhoneCall(user?.phone || user?.phoneNo)}
          accessibilityRole="button"
          accessibilityLabel={`Call ${user?.userName}`}
          accessibilityHint="Initiates a phone call to this doctor"
        >
          <Icon
            name="phone"
            size={16}
            color="#007AFF"
            style={styles.clinicDoctorContactIcon}
          />
          <Text style={styles.clinicDoctorContactText}>
            {user?.phone || user?.phoneNo || "N/A"}
          </Text>
        </TouchableOpacity>
        <View style={styles.clinicDoctorContactItem}>
          <Icon
            name="envelope"
            size={16}
            color="#8E8E93"
            style={styles.clinicDoctorContactIcon}
          />
          <Text style={styles.clinicDoctorContactText}>
            {user?.email || "N/A"}
          </Text>
        </View>
      </View>
    </View>
  </View>
);

// Consultant Card Component
const ConsultantCard = ({
  consultant,
  onSendMessage,
  chatLoading,
  onImageError,
  onImageLoad,
  imageErrors,
  imageLoading,
}) => (
  <View style={styles.clinicDoctorCard}>
    <View style={styles.clinicDoctorAvatar}>
      {imageLoading[`consultant-${consultant.user.id}`] && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      <Image
        source={{
          uri:
            imageErrors[`consultant-${consultant.user.id}`] ||
            !consultant.user?.avatar?.fileUrl
              ? "https://via.placeholder.com/120"
              : consultant.user.avatar.fileUrl,
        }}
        style={styles.clinicDoctorAvatarImage}
        onError={() => onImageError(`consultant-${consultant.user.id}`)}
        onLoad={() => onImageLoad(`consultant-${consultant.user.id}`)}
      />
      {(imageErrors[`consultant-${consultant.user.id}`] ||
        !consultant.user?.avatar?.fileUrl) && (
        <View style={styles.placeholderOverlay}>
          <Icon name="user" size={40} color="rgba(0, 122, 255, 0.4)" />
        </View>
      )}
    </View>
    <View style={styles.clinicDoctorInfo}>
      <Text style={styles.clinicDoctorName}>
        {consultant.user?.userName || "Unknown"}
      </Text>
      <View style={styles.clinicDoctorContact}>
        <TouchableOpacity
          style={styles.clinicDoctorContactItem}
          onPress={() =>
            initiatePhoneCall(
              consultant.user?.phone || consultant.user?.phoneNo
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`Call ${consultant.user?.userName}`}
          accessibilityHint="Initiates a phone call to this consultant"
        >
          <Icon
            name="phone"
            size={16}
            color="#007AFF"
            style={styles.clinicDoctorContactIcon}
          />
          <Text style={styles.clinicDoctorContactText}>
            {consultant.user?.phone || consultant.user?.phoneNo || "N/A"}
          </Text>
        </TouchableOpacity>
        <View style={styles.clinicDoctorContactItem}>
          <Icon
            name="envelope"
            size={16}
            color="#8E8E93"
            style={styles.clinicDoctorContactIcon}
          />
          <Text style={styles.clinicDoctorContactText}>
            {consultant.user?.email || "N/A"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.consultantSendMessageBtn,
          chatLoading && styles.consultantSendMessageBtnDisabled,
        ]}
        onPress={() => onSendMessage(consultant)}
        disabled={chatLoading}
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${consultant.user?.userName}`}
        accessibilityHint="Navigates to the chat screen with this consultant"
      >
        <Icon
          name="send"
          size={16}
          color="#007AFF"
          style={styles.consultantSendMessageIcon}
        />
        <Text style={styles.consultantSendMessageText}>
          {chatLoading ? "Starting..." : "Start Chat"}
        </Text>
      </TouchableOpacity>
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
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [showAllConsultants, setShowAllConsultants] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch clinic details
  useEffect(() => {
    const fetchClinicDetails = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const data = await getClinicById(clinicId, token);
        setClinic(data.data || data);
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
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          setCurrentUserId("");
          return;
        }
        const userRes = await getCurrentUser(token);
        const userId =
          userRes?.data?.data?.id || userRes?.data?.id || userRes?.id || "";
        if (!userId) {
          await AsyncStorage.removeItem("authToken");
          setCurrentUserId("");
          return;
        }
        setCurrentUserId(userId);
      } catch (err) {
        setCurrentUserId("");
        await AsyncStorage.removeItem("authToken");
      } finally {
        setAuthLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // Handle image loading and errors
  const handleImageError = (imageId) => {
    setImageErrors((prev) => ({ ...prev, [imageId]: true }));
    setImageLoading((prev) => ({ ...prev, [imageId]: false }));
  };

  const handleImageLoad = (imageId) => {
    setImageLoading((prev) => ({ ...prev, [imageId]: false }));
  };

  const handleImageLoadStart = (imageId) => {
    setImageLoading((prev) => ({ ...prev, [imageId]: true }));
  };

  // Handle sending messages to consultants
  const handleSendMessage = async (consultant) => {
    if (!currentUserId || !consultant?.user?.id) {
      setShowLoginModal(true);
      return;
    }
    setChatLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setShowLoginModal(true);
        return;
      }
      const thread = await startChatThread({
        userId: currentUserId,
        consultantId: consultant.user.id,
      });

      navigation.navigate("ConsultationChat", {
        selectedConsultant: consultant,
        currentUserId: currentUserId,
        createdThread: thread,
        clinicInfo: {
          id: clinic.id,
          name: clinic.name || clinic.user?.userName || "Unnamed Clinic",
          address: clinic.address,
        },
        clinicConsultants: clinic.consultants || [],
      });
    } catch (err) {
      alert(
        "Failed to start chat: " + (err.response?.data?.message || err.message)
      );
    }
    setChatLoading(false);
  };

  // Handle opening feedback modal
  const handleOpenFeedbackModal = async () => {
    if (currentUserId) {
      setShowFeedbackModal(true);
      setFeedbackRating(0);
      setFeedbackComment("");
      setFeedbackError("");
      setFeedbackSuccess("");
      return;
    }
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setShowLoginModal(true);
        return;
      }
      const userRes = await getCurrentUser(token);
      const userId =
        userRes?.data?.data?.id || userRes?.data?.id || userRes?.id || "";
      if (!userId) {
        await AsyncStorage.removeItem("authToken");
        setShowLoginModal(true);
        return;
      }
      setCurrentUserId(userId);
      setShowFeedbackModal(true);
      setFeedbackRating(0);
      setFeedbackComment("");
      setFeedbackError("");
      setFeedbackSuccess("");
    } catch (err) {
      await AsyncStorage.removeItem("authToken");
      setShowLoginModal(true);
    }
  };

  // Handle closing feedback modal
  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackRating(0);
    setFeedbackComment("");
    setFeedbackError("");
    setFeedbackSuccess("");
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    setFeedbackLoading(true);
    setFeedbackError("");
    setFeedbackSuccess("");
    if (!feedbackRating || feedbackRating < 1 || feedbackRating > 5) {
      setFeedbackError("Please select a rating from 1 to 5.");
      setFeedbackLoading(false);
      return;
    }
    if (!currentUserId) {
      setFeedbackError("You must be logged in to submit feedback.");
      setFeedbackLoading(false);
      setShowLoginModal(true);
      return;
    }
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setFeedbackError("Authentication token is missing.");
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
      setFeedbackSuccess("Feedback submitted successfully!");
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSuccess("");
        setFeedbackRating(0);
        setFeedbackComment("");
      }, 1200);
    } catch (err) {
      setFeedbackError(
        "Failed to submit feedback: " +
          (err.response?.data?.message || err.message)
      );
    }
    setFeedbackLoading(false);
  };

  // Open map with clinic address
  const openMap = () => {
    if (!clinic?.address) {
      alert("Clinic address is not available.");
      return;
    }
    const encodedAddress = encodeURIComponent(clinic.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(url).catch((err) =>
      alert("Failed to open map: " + err.message)
    );
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
        >
          <Ionicons name="arrow-back" size={20} color="#007AFF" />
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
        >
          <Ionicons name="arrow-back" size={20} color="#007AFF" />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { avg, count } = getStarRating(clinic.feedbacks);
  const doctorsToShow =
    clinic.doctors && !showAllDoctors
      ? clinic.doctors.slice(0, 9)
      : clinic.doctors;
  const consultantsToShow =
    clinic.consultants && !showAllConsultants
      ? clinic.consultants.slice(0, 9)
      : clinic.consultants;
  const clinicName = clinic.name || clinic.user?.userName || "Unnamed Clinic";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Consultation")} // <-- change this
          accessibilityLabel={`Go back from ${clinicName}`}
          accessibilityHint="Navigates back to the previous screen"
        >
          <Ionicons name="arrow-back" size={20} color="#007AFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Header Banner */}
        <View style={styles.clinicHeaderBanner}>
          <View style={styles.clinicHeaderLogo}>
            {imageLoading["clinic-main"] && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            )}
            <Image
              source={{
                uri:
                  imageErrors["clinic-main"] || !clinic.imageUrl?.fileUrl
                    ? "https://via.placeholder.com/150"
                    : clinic.imageUrl.fileUrl,
              }}
              style={styles.clinicHeaderLogoImage}
              onError={() => handleImageError("clinic-main")}
              onLoad={() => handleImageLoad("clinic-main")}
              onLoadStart={() => handleImageLoadStart("clinic-main")}
            />
            {(imageErrors["clinic-main"] || !clinic.imageUrl?.fileUrl) && (
              <View style={styles.placeholderOverlay}>
                <Ionicons
                  name="medkit"
                  size={40}
                  color="rgba(0, 122, 255, 0.4)"
                />
              </View>
            )}
          </View>
          <View style={styles.clinicHeaderMeta}>
            <Text style={styles.clinicHeaderTitle}>{clinicName}</Text>
            <TouchableOpacity
              style={styles.clinicHeaderAddress}
              onPress={openMap}
              accessibilityRole="button"
              accessibilityLabel="View clinic location on map"
              accessibilityHint="Opens the clinic address in Google Maps"
            >
              <Ionicons
                name="location"
                size={18}
                color="#8E8E93"
                style={styles.clinicHeaderLocationIcon}
              />
              <Text style={styles.clinicHeaderLocation}>
                {clinic.address || "Address not available"}
              </Text>
            </TouchableOpacity>
            <View style={styles.clinicHeaderContactRow}>
              <TouchableOpacity
                style={styles.clinicHeaderContactItem}
                onPress={() => initiatePhoneCall(clinic.user.phoneNo)}
                accessibilityRole="button"
                accessibilityLabel="Call clinic"
                accessibilityHint="Initiates a phone call to the clinic"
              >
                <Ionicons
                  name="call"
                  size={18}
                  color="#007AFF"
                  style={styles.clinicHeaderContactIcon}
                />
                <Text style={styles.clinicHeaderContactText}>
                  {clinic.user.phoneNo || "N/A"}
                </Text>
              </TouchableOpacity>
              <View style={styles.clinicHeaderContactItem}>
                <Ionicons
                  name="mail"
                  size={18}
                  color="#8E8E93"
                  style={styles.clinicHeaderContactIcon}
                />
                <Text style={styles.clinicHeaderContactText}>
                  {clinic.user.email || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Main Content */}
        <View style={styles.clinicMainContent}>
          <View style={styles.clinicMainLeft}>
            {/* About the Clinic */}
            <View style={styles.clinicSection}>
              <Text style={styles.clinicSectionTitle}>About the Clinic</Text>
              <Text style={styles.clinicSectionDesc}>
                {clinic.description || "No description available."}
              </Text>
              <TouchableOpacity
                style={styles.clinicMapButton}
                onPress={openMap}
                accessibilityRole="button"
                accessibilityLabel="View location on map"
                accessibilityHint="Opens the clinic address in Google Maps"
              >
                <Ionicons
                  name="map"
                  size={18}
                  color="#FFFFFF"
                  style={styles.clinicMapButtonIcon}
                />
                <Text style={styles.clinicMapButtonText}>
                  View Location on Map
                </Text>
              </TouchableOpacity>
              <View style={styles.clinicSectionInfo}>
                <Text style={styles.clinicSectionInfoText}>
                  <Text style={styles.clinicSectionInfoLabel}>
                    Insurance Accepted:{" "}
                  </Text>
                  {clinic.isInsuranceAccepted ? "Yes" : "No"}
                </Text>
                <Text style={styles.clinicSectionInfoText}>
                  <Text style={styles.clinicSectionInfoLabel}>
                    Specializations:{" "}
                  </Text>
                  {clinic.specializations || "N/A"}
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
                    <Text style={styles.clinicDoctorCardEmptyText}>
                      No doctors available
                    </Text>
                  </View>
                )}
              </View>
              {clinic.doctors &&
                clinic.doctors.length > 9 &&
                !showAllDoctors && (
                  <TouchableOpacity
                    style={styles.clinicSeeMoreBtn}
                    onPress={() => setShowAllDoctors(true)}
                    accessibilityRole="button"
                    accessibilityLabel="See more doctors"
                  >
                    <Text style={styles.clinicSeeMoreBtnText}>See More</Text>
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
                    <Text style={styles.clinicDoctorCardEmptyText}>
                      No consultants available
                    </Text>
                  </View>
                )}
              </View>
              {clinic.consultants &&
                clinic.consultants.length > 9 &&
                !showAllConsultants && (
                  <TouchableOpacity
                    style={styles.clinicSeeMoreBtn}
                    onPress={() => setShowAllConsultants(true)}
                    accessibilityRole="button"
                    accessibilityLabel="See more consultants"
                  >
                    <Text style={styles.clinicSeeMoreBtnText}>See More</Text>
                  </TouchableOpacity>
                )}
            </View>
            {/* Feedback Section */}
            <View style={styles.clinicSection}>
              <Text style={styles.clinicSectionTitle}>Feedback</Text>
              <TouchableOpacity
                style={styles.clinicDetailGiveFeedbackBtn}
                onPress={handleOpenFeedbackModal}
                accessibilityRole="button"
                accessibilityLabel="Send feedback"
                accessibilityHint="Opens a form to submit feedback for the clinic"
              >
                <Text style={styles.clinicDetailGiveFeedbackBtnText}>
                  Send Feedback
                </Text>
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
                                { color: i < stars ? "#FF9500" : "#C7C7CC" },
                              ]}
                            >
                              ★
                            </Text>
                          ))}
                        </View>
                        <Text style={styles.feedbackComment}>
                          {feedback.comment}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.clinicFeedbackEmpty}>
                    No feedback yet
                  </Text>
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
                  value={clinicName}
                  editable={false}
                />
              </View>
              <View style={styles.clinicBookingField}>
                <Text style={styles.clinicBookingLabel}>Specialization</Text>
                <TextInput
                  style={styles.clinicBookingInput}
                  value={clinic.specializations || "N/A"}
                  editable={false}
                />
              </View>
              <View style={styles.clinicBookingField}>
                <Text style={styles.clinicBookingLabel}>Doctor</Text>
                <TextInput
                  style={styles.clinicBookingInput}
                  placeholder="Select doctor"
                  placeholderTextColor="#8E8E93"
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
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseFeedbackModal}
      >
        <View style={styles.clinicFeedbackModalOverlay}>
          <View style={styles.clinicFeedbackModal}>
            <View style={styles.clinicFeedbackModalHeader}>
              <Text style={styles.clinicFeedbackModalHeaderText}>
                Send Feedback
              </Text>
              <TouchableOpacity
                onPress={handleCloseFeedbackModal}
                accessibilityRole="button"
                accessibilityLabel="Close feedback modal"
              >
                <Ionicons name="close" size={24} color="#3C3C43" />
              </TouchableOpacity>
            </View>
            <View style={styles.clinicFeedbackModalBody}>
              <View style={styles.clinicFeedbackModalGroup}>
                <Text style={styles.clinicFeedbackModalLabel}>Rating</Text>
                <View style={styles.clinicFeedbackModalStars}>
                  {renderStars(
                    feedbackRating,
                    setFeedbackRating,
                    feedbackRating
                  )}
                </View>
                <Text style={styles.clinicFeedbackModalRatingNote}>
                  Tap to rate
                </Text>
              </View>
              <View style={styles.clinicFeedbackModalGroup}>
                <Text style={styles.clinicFeedbackModalLabel}>Comment</Text>
                <TextInput
                  style={styles.clinicFeedbackModalTextarea}
                  value={feedbackComment}
                  onChangeText={setFeedbackComment}
                  placeholder="Write your feedback here..."
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={4}
                />
              </View>
              {feedbackError ? (
                <Text style={styles.clinicFeedbackModalError}>
                  {feedbackError}
                </Text>
              ) : null}
              {feedbackSuccess ? (
                <Text style={styles.clinicFeedbackModalSuccess}>
                  {feedbackSuccess}
                </Text>
              ) : null}
              <View style={styles.clinicFeedbackModalActions}>
                <TouchableOpacity
                  style={styles.clinicDetailSendFeedbackCancelBtn}
                  onPress={handleCloseFeedbackModal}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel feedback"
                >
                  <Text style={styles.clinicDetailSendFeedbackCancelBtnText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.clinicDetailSendFeedbackBtn,
                    feedbackLoading &&
                      styles.clinicDetailSendFeedbackBtnDisabled,
                  ]}
                  onPress={handleSubmitFeedback}
                  disabled={feedbackLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Submit feedback"
                >
                  <Text style={styles.clinicDetailSendFeedbackBtnText}>
                    {feedbackLoading ? "Submitting..." : "Submit"}
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
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.clinicFeedbackModalOverlay}>
          <View style={styles.clinicFeedbackModal}>
            <View style={styles.clinicFeedbackModalHeader}>
              <Text style={styles.clinicFeedbackModalHeaderText}>
                Login Required
              </Text>
              <TouchableOpacity
                onPress={() => setShowLoginModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close login modal"
              >
                <Ionicons name="close" size={24} color="#3C3C43" />
              </TouchableOpacity>
            </View>
            <View
              style={[styles.clinicFeedbackModalBody, { alignItems: "center" }]}
            >
              <Text style={styles.clinicFeedbackModalMessage}>
                You need to log in to access this feature.
              </Text>
              <TouchableOpacity
                style={styles.clinicDetailSendFeedbackBtn}
                onPress={() => {
                  setShowLoginModal(false);
                  navigation.navigate("Login", {
                    redirectTo: "ClinicDetail",
                    params: { clinicId },
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel="Go to login"
                accessibilityHint="Navigates to the login screen"
              >
                <Text style={styles.clinicDetailSendFeedbackBtnText}>
                  Go to Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 16,
    alignSelf: "flex-start",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicHeaderBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  clinicHeaderLogo: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  clinicHeaderLogoImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  clinicHeaderMeta: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  clinicHeaderTitle: {
    fontSize: isSmallScreen ? 22 : 24,
    fontWeight: "700",
    color: "#000000",
    lineHeight: 30,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicHeaderAddress: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  clinicHeaderLocationIcon: {
    marginRight: 6,
  },
  clinicHeaderLocation: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3C3C43",
    flex: 1,
    flexWrap: "wrap",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicHeaderContactRow: {
    flexDirection: "column",
    marginTop: 8,
  },
  clinicHeaderContactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  clinicHeaderContactIcon: {
    marginRight: 6,
  },
  clinicHeaderContactText: {
    fontSize: 14,
    color: "#3C3C43",
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicMainContent: {
    flexDirection: "column",
    paddingHorizontal: 16,
  },
  clinicMainLeft: {
    flex: 1,
  },
  clinicMainRight: {
    width: "100%",
    marginTop: 16,
  },
  clinicSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  clinicSectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicSectionDesc: {
    fontSize: 14,
    color: "#3C3C43",
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicMapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginBottom: 12,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  clinicMapButtonIcon: {
    marginRight: 8,
  },
  clinicMapButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicSectionInfo: {
    marginTop: 8,
  },
  clinicSectionInfoText: {
    fontSize: 14,
    color: "#3C3C43",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicSectionInfoLabel: {
    color: "#007AFF",
    fontWeight: "600",
  },
  clinicDoctorList: {
    paddingHorizontal: 4,
  },
  clinicDoctorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  clinicDoctorCardEmpty: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  clinicDoctorCardEmptyText: {
    fontSize: 14,
    color: "#8E8E93",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicDoctorAvatar: {
    marginRight: 12,
    position: "relative",
  },
  clinicDoctorAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  clinicDoctorInfo: {
    flex: 1,
  },
  clinicDoctorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicDoctorContact: {
    marginBottom: 8,
  },
  clinicDoctorContactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingVertical: 4,
  },
  clinicDoctorContactIcon: {
    marginRight: 6,
  },
  clinicDoctorContactText: {
    fontSize: 14,
    color: "#3C3C43",
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  consultantSendMessageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  consultantSendMessageBtnDisabled: {
    opacity: 0.6,
  },
  consultantSendMessageIcon: {
    marginRight: 6,
  },
  consultantSendMessageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicSeeMoreBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "center",
    marginTop: 12,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  clinicSeeMoreBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicFeedbackRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  starTouchable: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  star: {
    fontSize: 18,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginRight: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  reviewCount: {
    fontSize: 14,
    color: "#8E8E93",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicFeedbackList: {
    paddingHorizontal: 4,
  },
  clinicFeedbackCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  feedbackStars: {
    flexDirection: "row",
    marginBottom: 8,
  },
  feedbackComment: {
    fontSize: 14,
    color: "#3C3C43",
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicFeedbackEmpty: {
    fontSize: 14,
    color: "#8E8E93",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicDetailGiveFeedbackBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  clinicDetailGiveFeedbackBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicBookingWidget: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  clinicBookingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicBookingField: {
    marginBottom: 12,
  },
  clinicBookingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicBookingInput: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 10,
    backgroundColor: "#F2F2F7",
    fontSize: 14,
    color: "#3C3C43",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicBookingBtn: {
    backgroundColor: "#C7C7CC",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    minHeight: 44,
  },
  clinicBookingBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: "inherit",
  },
  placeholderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(242, 242, 247, 0.9)",
    borderRadius: "inherit",
  },
  clinicFeedbackModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  clinicFeedbackModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  clinicFeedbackModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  clinicFeedbackModalHeaderText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicFeedbackModalBody: {
    flexDirection: "column",
  },
  clinicFeedbackModalGroup: {
    marginBottom: 16,
  },
  clinicFeedbackModalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicFeedbackModalStars: {
    flexDirection: "row",
    alignItems: "center",
  },
  clinicFeedbackModalRatingNote: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicFeedbackModalTextarea: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#3C3C43",
    backgroundColor: "#F2F2F7",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicFeedbackModalError: {
    fontSize: 14,
    color: "#FF3B30",
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicFeedbackModalSuccess: {
    fontSize: 14,
    color: "#34C759",
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicFeedbackModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 12,
  },
  clinicDetailSendFeedbackCancelBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#3C3C43",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  clinicDetailSendFeedbackCancelBtnText: {
    fontSize: 14,
    color: "#3C3C43",
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicDetailSendFeedbackBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  clinicDetailSendFeedbackBtnDisabled: {
    backgroundColor: "#C7C7CC",
    opacity: 0.6,
  },
  clinicDetailSendFeedbackBtnText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  clinicFeedbackModalMessage: {
    fontSize: 16,
    color: "#3C3C43",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    fontSize: 16,
    color: "#007AFF",
    marginTop: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
});

export default ClinicDetailScreen;
