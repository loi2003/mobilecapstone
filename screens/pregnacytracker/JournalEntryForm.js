
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import SymptomsAndMood from "./SymptomsAndMood";
import {
  getJournalById,
  createJournalEntry,
  editJournalEntry,
  getJournalByGrowthDataId,
} from "../../api/journal-api";
import { getCurrentWeekGrowthData } from "../../api/growthdata-api";

const JournalEntryForm = ({ onError }) => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [formData, setFormData] = useState({
    Id: "",
    CurrentWeek: "",
    Note: "",
    CurrentWeight: "",
    MoodNotes: "",
    SymptomNames: [],
    SymptomIds: [],
    RelatedImages: [],
    UltraSoundImages: [],
    SystolicBP: "",
    DiastolicBP: "",
    HeartRateBPM: "",
    BloodSugarLevelMgDl: "",
  });
  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState({
    RelatedImages: [],
    UltraSoundImages: [],
  });
  const [modalImage, setModalImage] = useState(null);
  const [modalImageType, setModalImageType] = useState(null);
  const [modalImageIndex, setModalImageIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSourceModal, setImageSourceModal] = useState({
    visible: false,
    type: null,
    action: "add",
    replaceIndex: null,
  });
  const [recentlySelectedImage, setRecentlySelectedImage] = useState(null);

  const token = AsyncStorage.getItem("authToken");
  const growthDataId = route.params?.growthDataId;
  const entryId = route.params?.entryId;
  const ultrasoundClinicWeeks = [12, 20, 28, 36];
  const bloodTestClinicWeeks = [4, 12, 24, 28];
  const validMoods = ["sad", "terrible", "neutral", "normal", "happy", "anxious", "excited"];

  useEffect(() => {
    const fetchData = async () => {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (entryId && storedToken) {
        fetchJournalEntry(storedToken);
      }
      fetchAvailableWeeks(storedToken);
    };
    fetchData();
  }, [entryId, growthDataId]);

  const requestPermissions = async (source) => {
    try {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Please grant camera permission to proceed."
          );
          return false;
        }
        return true;
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Please grant photo library permission to proceed."
          );
          return false;
        }
        return true;
      }
    } catch (err) {
      console.warn(`Permission request error (${source}):`, err);
      return false;
    }
  };

  const fetchJournalEntry = async (token) => {
    setIsLoading(true);
    try {
      const response = await getJournalById(entryId, token);
      if (response.data?.error === 0 && response.data?.data) {
        const entry = response.data.data;
        setFormData({
          Id: entry.id || "",
          CurrentWeek: entry.currentWeek?.toString() || "",
          Note: entry.note || "",
          CurrentWeight: entry.currentWeight?.toString() || "",
          MoodNotes: entry.moodNotes || entry.mood || "",
          SymptomIds:
            entry.symptoms?.map((s) => s.id) || entry.symptomIds || [],
          SymptomNames:
            entry.symptoms?.map((s) => s.name) || entry.symptomNames || [],
          RelatedImages: entry.relatedImages || [],
          UltraSoundImages: entry.ultraSoundImages || [],
          SystolicBP: entry.systolicBP?.toString() || "",
          DiastolicBP: entry.diastolicBP?.toString() || "",
          HeartRateBPM: entry.heartRateBPM?.toString() || "",
          BloodSugarLevelMgDl: entry.bloodSugarLevelMgDl?.toString() || "",
        });
        setImagePreviews({
          RelatedImages:
            entry.relatedImages?.map((img) =>
              typeof img === "string" ? img : img.uri
            ) || [],
          UltraSoundImages:
            entry.ultraSoundImages?.map((img) =>
              typeof img === "string" ? img : img.uri
            ) || [],
        });
      } else {
        const msg = response.data?.message || "Failed to fetch journal entry";
        setErrors({ submit: msg });
        onError?.(msg);
      }
    } catch (error) {
      console.error("Failed to fetch journal entry:", error);
      const msg =
        error.response?.data?.message || "Failed to fetch journal entry";
      setErrors({ submit: msg });
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableWeeks = async (token) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const currentDate = new Date().toISOString().split("T")[0];
      const response = await getCurrentWeekGrowthData(
        userId,
        currentDate,
        token
      );
      const journalRes = await getJournalByGrowthDataId(growthDataId, token);

      const currentWeek =
        response?.data?.data?.currentGestationalAgeInWeeks || 1;
      setCurrentWeek(currentWeek);
      const documentedWeeks =
        journalRes?.data?.data?.map((entry) => entry.currentWeek) || [];
      const weeks = [];
      for (let i = 1; i <= currentWeek; i++) {
        if (!documentedWeeks.includes(i)) {
          weeks.push(i);
        }
      }
      setAvailableWeeks(weeks);
      if (!entryId) {
        setFormData((prev) => ({
          ...prev,
          CurrentWeek: weeks.at(-1)?.toString() || "",
        }));
      }
    } catch (err) {
      console.error("Failed to fetch week availability:", err);
    }
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const openImageSourceModal = (type, action = "add", replaceIndex = null) => {
    setImageSourceModal({
      visible: true,
      type,
      action,
      replaceIndex,
    });
  };

  const handleImagePick = async (source) => {
    try {
      const { type, action, replaceIndex } = imageSourceModal;

      console.log(
        `Picking image from ${source} for type: ${type}, action: ${action}`
      );

      const hasPermission = await requestPermissions(source);
      if (!hasPermission) {
        console.log("Permission denied");
        return;
      }

      let result;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: false,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: false,
          allowsMultipleSelection: true, // Changed to allow multiple image selection
        });
      }

      console.log("Image picker result:", result);

      if (result.canceled) {
        console.log("User cancelled image selection");
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const maxImages = action === "replace" ? 1 : 2 - formData[type].length;
        const newImages = result.assets
          .filter((asset) => {
            const fileSize = asset.fileSize || 0;
            return fileSize <= 5 * 1024 * 1024; // 5MB
          })
          .slice(0, maxImages) // Limit to maxImages (1 for replace, up to 2 for add)
          .map((asset) => ({
            uri: asset.uri,
            type: asset.type || "image/jpeg",
            name: asset.fileName || `image_${Date.now()}.jpg`,
            file: {
              uri: asset.uri,
              type: asset.type || "image/jpeg",
              name: asset.fileName || `image_${Date.now()}.jpg`,
            },
          }));

        if (newImages.length > 0) {
          if (action === "replace" && replaceIndex !== null) {
            setFormData((prev) => ({
              ...prev,
              [type]: prev[type].map((img, idx) =>
                idx === replaceIndex ? newImages[0] : img
              ),
            }));

            setImagePreviews((prev) => ({
              ...prev,
              [type]: prev[type].map((img, idx) =>
                idx === replaceIndex ? newImages[0].uri : img
              ),
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              [type]: [...prev[type], ...newImages].slice(0, 2),
            }));

            setImagePreviews((prev) => ({
              ...prev,
              [type]: [...prev[type], ...newImages.map((img) => img.uri)].slice(
                0,
                2
              ),
            }));
          }

          console.log(`Processed ${newImages.length} images for ${type}`);
          setRecentlySelectedImage(newImages[0].uri);
          setTimeout(() => setRecentlySelectedImage(null), 3000);

          // Warn if user selected more images than allowed
          if (result.assets.length > maxImages) {
            Alert.alert(
              "Image Limit",
              `Only ${maxImages} image${maxImages > 1 ? "s" : ""} can be added. The first ${maxImages} selected image${maxImages > 1 ? "s were" : " was"} processed.`,
              [{ text: "OK", style: "default" }],
              { cancelable: true }
            );
          }
        } else {
          Alert.alert(
            "Error",
            "No valid images selected or image size too large (max 5MB)"
          );
        }
      } else {
        throw new Error("No images selected");
      }
    } catch (error) {
      console.error(`Image ${source} error:`, error);
      Alert.alert(
        "Error",
        error.message ||
          `Failed to ${
            source === "camera" ? "capture" : "pick"
          } image. Please try again.`
      );
    } finally {
      setImageSourceModal({
        visible: false,
        type: null,
        action: "add",
        replaceIndex: null,
      });
    }
  };

  const handleRemoveImage = (type, index) => {
    setFormData((prev) => {
      const updated = [...prev[type]];
      updated.splice(index, 1);
      return { ...prev, [type]: updated };
    });
    setImagePreviews((prev) => {
      const updated = [...prev[type]];
      updated.splice(index, 1);
      return { ...prev, [type]: updated };
    });
    if (modalImageType === type && modalImageIndex === index) {
      closeModal();
    }
  };

  const openImageModal = (imageSrc, type, index) => {
    setModalImage(imageSrc);
    setModalImageType(type);
    setModalImageIndex(index);
  };

  const closeModal = () => {
    setModalImage(null);
    setModalImageType(null);
    setModalImageIndex(null);
  };

  const validateForm = () => {
    const newErrors = {};

    // CurrentWeek: Required, 1–40
    if (
      !formData.CurrentWeek ||
      isNaN(Number(formData.CurrentWeek)) ||
      Number(formData.CurrentWeek) < 1 ||
      Number(formData.CurrentWeek) > 40
    ) {
      newErrors.CurrentWeek = "Current week must be a number between 1 and 40";
    }

    // Note: Required, must contain meaningful content (not just whitespace)
    if (!formData.Note || /^\s*$/.test(formData.Note)) {
      newErrors.Note = "Note must contain meaningful content";
    }

    // CurrentWeight: Required, 30–200 kg
    if (
      formData.CurrentWeight &&
      (isNaN(Number(formData.CurrentWeight)) ||
        Number(formData.CurrentWeight) < 30 ||
        Number(formData.CurrentWeight) > 200)
    ) {
      newErrors.CurrentWeight =
        "Current weight must be a number between 30 and 200 kg";
    }

    // Blood Pressure: Both or neither, with range checks
    if (
      (formData.SystolicBP && !formData.DiastolicBP) ||
      (!formData.SystolicBP && formData.DiastolicBP)
    ) {
      newErrors.BloodPressure =
        "Both systolic and diastolic BP must be entered together";
    } else if (formData.SystolicBP && formData.DiastolicBP) {
      const sys = Number(formData.SystolicBP);
      const dia = Number(formData.DiastolicBP);
      if (isNaN(sys) || sys < 70 || sys > 200) {
        newErrors.SystolicBP = "Systolic BP must be a number between 70 and 200 mmHg";
      }
      if (isNaN(dia) || dia < 40 || dia > 120) {
        newErrors.DiastolicBP = "Diastolic BP must be a number between 40 and 120 mmHg";
      }
      if (sys <= dia) {
        newErrors.BloodPressure = "Systolic BP must be greater than diastolic BP";
      }
    }

    // HeartRateBPM: Optional, 40–200 BPM
    if (
      formData.HeartRateBPM &&
      (isNaN(Number(formData.HeartRateBPM)) ||
        Number(formData.HeartRateBPM) < 40 ||
        Number(formData.HeartRateBPM) > 200)
    ) {
      newErrors.HeartRateBPM = "Heart rate must be a number between 40 and 200 BPM";
    }

    // BloodSugarLevelMgDl: Optional on specific weeks, 40–300 mg/dL
    if (
      formData.BloodSugarLevelMgDl &&
      bloodTestClinicWeeks.includes(Number(formData.CurrentWeek)) &&
      (isNaN(Number(formData.BloodSugarLevelMgDl)) ||
        Number(formData.BloodSugarLevelMgDl) < 40 ||
        Number(formData.BloodSugarLevelMgDl) > 300)
    ) {
      newErrors.BloodSugarLevelMgDl =
        "Blood sugar must be a number between 40 and 300 mg/dL";
    }

 

    // SymptomNames: Optional, but if present, at least one symptom required
    if (formData.SymptomNames.length > 0 && !formData.SymptomNames.every(name => typeof name === 'string' && name.trim())) {
      newErrors.SymptomNames = "At least one valid symptom name is required if symptoms are selected";
    }

    // Images: Max 2 per type, required for UltraSoundImages on specific weeks
    if (formData.RelatedImages.length > 2) {
      newErrors.RelatedImages = "Maximum 2 related images allowed";
    }
    if (
      ultrasoundClinicWeeks.includes(Number(formData.CurrentWeek)) &&
      formData.UltraSoundImages.length > 2
    ) {
      newErrors.UltraSoundImages = "Maximum 2 ultrasound images allowed";
    }

    setErrors(newErrors);

    // Show errors as an alert
    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors).join("\n");
      Alert.alert(
        "Validation Error",
        errorMessages,
        [{ text: "OK", style: "default" }],
        { cancelable: true }
      );
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("authToken");

      if (!growthDataId) {
        throw new Error("GrowthDataId is missing");
      }
      if (!userId) {
        throw new Error("UserId is missing. Please log in.");
      }

      const prepareImagesForUpload = (images) => {
        if (!images || !Array.isArray(images)) return [];

        return images
          .map((img, index) => {
            if (typeof img === "string") {
              return img;
            }
            if (img.uri) {
              const extension = img.uri.split(".").pop().toLowerCase();
              const mimeType = getImageMimeType(extension);
              return {
                uri:
                  Platform.OS === "android"
                    ? img.uri
                    : img.uri.replace("file://", ""),
                type: mimeType,
                name: img.name || `image_${Date.now()}_${index}.${extension}`,
              };
            }
            return null;
          })
          .filter((img) => img !== null);
      };

      const getImageMimeType = (extension) => {
        const mimeTypes = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
        };
        return mimeTypes[extension] || "image/jpeg";
      };

      const journalData = {
        ...formData,
        UserId: userId,
        GrowthDataId: growthDataId,
        RelatedImages: prepareImagesForUpload(formData.RelatedImages || []),
        UltraSoundImages: prepareImagesForUpload(
          formData.UltraSoundImages || []
        ),
      };

      console.log("Submitting journal data:", {
        ...journalData,
        RelatedImages: journalData.RelatedImages.map((img) =>
          typeof img === "string" ? img : { ...img, uri: "FILE_URI" }
        ),
        UltraSoundImages: journalData.UltraSoundImages.map((img) =>
          typeof img === "string" ? img : { ...img, uri: "FILE_URI" }
        ),
      });

      const response = entryId
        ? await editJournalEntry(journalData, token)
        : await createJournalEntry(journalData, token);

      if (!response.data || response.data.error > 0) {
        throw new Error(
          response.data?.message || "Failed to submit journal entry"
        );
      }

      navigation.navigate("PregnancyTracking", {
        growthDataId,
        journalinfo: undefined,
        weeklyinfo: 'true',
      });
    } catch (error) {
      console.error("Error submitting journal entry:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit journal entry";
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
      Alert.alert(
        "Submission Error",
        errorMessage,
        [{ text: "OK", style: "default" }],
        { cancelable: true }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const ImagePreviewSection = ({ type, label }) => (
    <View style={styles(width).section}>
      <Text style={styles(width).label}>{label}</Text>
      <TouchableOpacity
        style={styles(width).fileUpload}
        onPress={() => openImageSourceModal(type)}
        accessibilityLabel={`Upload ${label}`}
        accessibilityHint={`Select up to 2 ${label.toLowerCase()}`}
      >
        <Ionicons name="image-outline" size={24} color="#fff" />
        <Text style={styles(width).fileUploadText}>Upload {label}</Text>
      </TouchableOpacity>
      {imagePreviews[type].length > 0 && (
        <View style={styles(width).imagePreviewContainer}>
          {imagePreviews[type].map((preview, index) => (
            <View key={index} style={styles(width).previewWrapper}>
              <TouchableOpacity
                onPress={() => openImageModal(preview, type, index)}
              >
                <Image
                  source={{ uri: preview }}
                  style={styles(width).previewImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(width).removeImageBtn}
                onPress={() => handleRemoveImage(type, index)}
                accessibilityLabel={`Remove ${label} ${index + 1}`}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <Text style={styles(width).imageCount}>
            {formData[type].length} / 2 images
          </Text>
        </View>
      )}
      {errors[type] && (
        <Text style={styles(width).errorText}>{errors[type]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles(width).safeArea}>
      <View style={styles(width).container}>
        <View style={styles(width).header}>
          <Text style={styles(width).headerTitle}>
            {entryId ? "Edit Journal Entry" : "Add Journal Entry"}
          </Text>
          <TouchableOpacity
            style={styles(width).headerCancelBtn}
            onPress={() =>
              navigation.navigate("PregnancyTracking", {
                growthDataId,
                journalinfo: undefined,
                weeklyinfo: 'true',
              })
            }
            accessibilityLabel="Back to pregnancy tracking"
          >
            <Text style={styles(width).headerCancelText}>Back</Text>
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <View style={styles(width).loadingContainer}>
            <ActivityIndicator size="large" color="#04668D" />
            <Text style={styles(width).loadingText}>Loading...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles(width).content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles(width).section}>
              <Text style={styles(width).label}>
                Week to Document{" "}
                <Text style={styles(width).required}>*</Text>
              </Text>
              {entryId ? (
                <Text style={[styles(width).input, styles(width).disabledInput]}>
                  Week {formData.CurrentWeek}
                </Text>
              ) : (
                <>
                  <View
                    style={[
                      styles(width).pickerContainer,
                      errors.CurrentWeek ? styles(width).errorInput : {},
                    ]}
                  >
                    <Picker
                      selectedValue={formData.CurrentWeek}
                      onValueChange={(value) =>
                        handleChange("CurrentWeek", value)
                      }
                      style={styles(width).picker}
                      enabled={!entryId}
                    >
                      <Picker.Item
                        label="Select Week"
                        value=""
                      />
                      {availableWeeks.map((week) => (
                        <Picker.Item
                          key={week}
                          label={`Week ${week}${
                            currentWeek === week ? " (Current)" : ""
                          }`}
                          value={week.toString()}
                        />
                      ))}
                    </Picker>
                  </View>
                  {errors.CurrentWeek && (
                    <Text style={styles(width).errorText}>
                      {errors.CurrentWeek}
                    </Text>
                  )}
                </>
              )}
            </View>

            <View style={styles(width).section}>
              <Text style={styles(width).label}>
                Note <Text style={styles(width).required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles(width).textarea,
                  errors.Note ? styles(width).errorInput : {},
                ]}
                value={formData.Note}
                onChangeText={(text) => handleChange("Note", text)}
                placeholder="Share your thoughts or updates for this week"
                multiline
                numberOfLines={5}
                accessibilityLabel="Journal note"
                accessibilityHint="Enter meaningful text (spaces alone are not allowed)"
              />
              {errors.Note && (
                <Text style={styles(width).errorText}>{errors.Note}</Text>
              )}
            </View>

            <View style={styles(width).section}>
              <Text style={styles(width).label}>
                Current Weight (kg) <Text style={styles(width).required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles(width).input,
                  errors.CurrentWeight ? styles(width).errorInput : {},
                ]}
                value={formData.CurrentWeight}
                onChangeText={(text) => handleChange("CurrentWeight", text)}
                placeholder="Enter your latest weight"
                keyboardType="decimal-pad"
                accessibilityLabel="Current weight"
                accessibilityHint="Enter weight in kilograms (30–200)"
              />
              {errors.CurrentWeight && (
                <Text style={styles(width).errorText}>
                  {errors.CurrentWeight}
                </Text>
              )}
            </View>

            <View style={styles(width).group}>
              <Text style={styles(width).groupTitle}>
                Blood Pressure
              </Text>
              <View style={styles(width).section}>
                <Text style={styles(width).label}>
                  Systolic (mmHg) <Text style={styles(width).tooltip}>ⓘ</Text>
                </Text>
                <TextInput
                  style={[
                    styles(width).input,
                    errors.SystolicBP || errors.BloodPressure ? styles(width).errorInput : {},
                  ]}
                  value={formData.SystolicBP}
                  onChangeText={(text) => handleChange("SystolicBP", text)}
                  placeholder="Enter systolic BP"
                  keyboardType="numeric"
                  accessibilityLabel="Systolic blood pressure"
                  accessibilityHint="Normal range: 90–140 mmHg"
                />
                {errors.SystolicBP && (
                  <Text style={styles(width).errorText}>
                    {errors.SystolicBP}
                  </Text>
                )}
              </View>
              <View style={styles(width).section}>
                <Text style={styles(width).label}>
                  Diastolic (mmHg) <Text style={styles(width).tooltip}>ⓘ</Text>
                </Text>
                <TextInput
                   style={[
                    styles(width).input,
                    errors.DiastolicBP || errors.BloodPressure ? styles(width).errorInput : {},
                  ]}
                  value={formData.DiastolicBP}
                  onChangeText={(text) => handleChange("DiastolicBP", text)}
                  placeholder="Enter diastolic BP"
                  keyboardType="numeric"
                  accessibilityLabel="Diastolic blood pressure"
                  accessibilityHint="Normal range: 60–90 mmHg"
                />
                {errors.DiastolicBP && (
                  <Text style={styles(width).errorText}>
                    {errors.DiastolicBP}
                  </Text>
                )}
                {errors.BloodPressure && (
                  <Text style={styles(width).errorText}>
                    {errors.BloodPressure}
                  </Text>
                )}
              </View>
              <View style={styles(width).infoNote}>
                <Text style={styles(width).infoNoteText}>
                  Optional, but recommended. Enter both systolic (70–200 mmHg) and diastolic (40–120 mmHg) values for accurate tracking.
                </Text>
              </View>
            </View>

            <View style={styles(width).section}>
              <Text style={styles(width).label}>
                Heart Rate (BPM) <Text style={styles(width).tooltip}>ⓘ</Text>
              </Text>
              <TextInput
                style={[
                  styles(width).input,
                  errors.HeartRateBPM ? styles(width).errorInput : {},
                ]}
                value={formData.HeartRateBPM}
                onChangeText={(text) => handleChange("HeartRateBPM", text)}
                placeholder="Enter heart rate"
                keyboardType="numeric"
                accessibilityLabel="Heart rate"
                accessibilityHint="Normal range: 60–100 BPM"
              />
              {errors.HeartRateBPM && (
                <Text style={styles(width).errorText}>
                  {errors.HeartRateBPM}
                </Text>
              )}
            </View>

            {bloodTestClinicWeeks.includes(Number(formData.CurrentWeek)) && (
              <View style={styles(width).section}>
                <Text style={styles(width).label}>
                  Blood Sugar (mg/dL) <Text style={styles(width).tooltip}>ⓘ</Text>
                </Text>
                <TextInput
                 style={[
                    styles(width).input,
                    errors.BloodSugarLevelMgDl ? styles(width).errorInput : {},
                  ]}
                  value={formData.BloodSugarLevelMgDl}
                  onChangeText={(text) =>
                    handleChange("BloodSugarLevelMgDl", text)
                  }
                  placeholder="Enter blood sugar level"
                  keyboardType="numeric"
                  accessibilityLabel="Blood sugar level"
                  accessibilityHint="Normal range: 70–130 mg/dL"
                />
                {errors.BloodSugarLevelMgDl && (
                  <Text style={styles(width).errorText}>
                    {errors.BloodSugarLevelMgDl}
                  </Text>
                )}
              </View>
            )}
            {!bloodTestClinicWeeks.includes(Number(formData.CurrentWeek)) && (
              <View style={styles(width).infoNote}>
                <Text style={styles(width).infoNoteText}>
                  Blood sugar tracking available on weeks 4, 12, 24, and 28 to
                  help monitor for gestational diabetes.
                </Text>
              </View>
            )}

            <View style={styles(width).section}>
              <Text style={styles(width).label}>
                Mood <Text style={styles(width).required}>*</Text>
              </Text>
              <SymptomsAndMood
                selectedMood={formData.MoodNotes}
                onMoodChange={(mood) => handleChange("MoodNotes", mood)}
                selectedSymptoms={formData.SymptomIds}
                onSymptomsChange={(ids, names) =>
                  setFormData((prev) => ({
                    ...prev,
                    SymptomIds: ids ?? prev.SymptomIds,
                    SymptomNames: names ?? prev.SymptomNames,
                  }))
                }
                userId={AsyncStorage.getItem("userId")}
                token={token}
              />
              {errors.MoodNotes && (
                <Text style={styles(width).errorText}>
                  {errors.MoodNotes}
                </Text>
              )}
              {errors.SymptomNames && (
                <Text style={styles(width).errorText}>
                  {errors.SymptomNames}
                </Text>
              )}
            </View>

            <ImagePreviewSection type="RelatedImages" label="Related Images" />
            {ultrasoundClinicWeeks.includes(Number(formData.CurrentWeek)) && (
              <ImagePreviewSection
                type="UltraSoundImages"
                label="Ultrasound Images"
              />
            )}
            {!ultrasoundClinicWeeks.includes(Number(formData.CurrentWeek)) && (
              <View style={styles(width).infoNote}>
                <Text style={styles(width).infoNoteText}>
                  Ultrasound tracking available on weeks 12, 20, 28, and 36.
                </Text>
              </View>
            )}

            <View style={styles(width).actions}>
              <TouchableOpacity
                style={[
                  styles(width).submitBtn,
                  !token || isLoading ? styles(width).disabledBtn : {},
                ]}
                onPress={handleSubmit}
                disabled={!token || isLoading}
                accessibilityLabel={
                  entryId ? "Update journal entry" : "Add new journal entry"
                }
              >
                <Text style={styles(width).submitBtnText}>
                  {entryId ? "Update" : "Add Entry"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(width).cancelBtn}
                onPress={() =>
                  navigation.navigate("PregnancyTracking", {
                    growthDataId,
                    journalinfo: undefined,
                    weeklyinfo: 'true',
                  })
                }
                accessibilityLabel="Cancel and go back"
              >
                <Text style={styles(width).cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {errors.submit && (
              <Text style={styles(width).errorText}>{errors.submit}</Text>
            )}
          </ScrollView>
        )}

        <Modal
          visible={!!modalImage}
          transparent
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles(width).modalOverlay}>
            <View style={styles(width).modalContent}>
              <View style={styles(width).modalHeader}>
                <Text style={styles(width).modalHeaderText}>
                  {modalImageType === "RelatedImages"
                    ? "Related Image"
                    : "Ultrasound Image"}{" "}
                  ({modalImageIndex + 1})
                </Text>
                <TouchableOpacity
                  style={styles(width).modalCloseBtn}
                  onPress={closeModal}
                >
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles(width).modalBody}>
                <Image
                  source={{ uri: modalImage }}
                  style={styles(width).modalImage}
                />
              </View>
          
            </View>
          </View>
        </Modal>

        <Modal
          visible={imageSourceModal.visible}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setImageSourceModal({
              visible: false,
              type: null,
              action: "add",
              replaceIndex: null,
            })
          }
        >
          <View style={styles(width).modalOverlay}>
            <View style={styles(width).modalContent}>
              <View style={styles(width).modalHeader}>
                <Text style={styles(width).modalHeaderText}>
                  Select Image Source
                </Text>
                <TouchableOpacity
                  style={styles(width).modalCloseBtn}
                  onPress={() =>
                    setImageSourceModal({
                      visible: false,
                      type: null,
                      action: "add",
                      replaceIndex: null,
                    })
                  }
                >
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles(width).modalBody}>
                <TouchableOpacity
                  style={styles(width).modalOptionBtn}
                  onPress={() => handleImagePick("camera")}
                  accessibilityLabel="Take photo"
                >
                  <Text style={styles(width).modalBtnText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles(width).modalOptionBtn}
                  onPress={() => handleImagePick("gallery")}
                  accessibilityLabel="Choose from gallery"
                >
                  <Text style={styles(width).modalBtnText}>Choose from Photos</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = (width) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#04668D",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#034f70",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "System",
  },
  headerCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  headerCancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
  content: {
    padding: 20,
    paddingBottom: 80,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#04668D",
    fontFamily: "System",
  },
  section: {
    marginBottom: 24,
  },
  group: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#04668D",
    marginBottom: 16,
    fontFamily: "System",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#04668D",
    marginBottom: 10,
    fontFamily: "System",
  },
  required: {
    color: "#E74C3C",
    fontSize: 14,
  },
  tooltip: {
    color: "#FE6B6A",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontFamily: "System",
  },
  textarea: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    height: 140,
    textAlignVertical: "top",
    fontFamily: "System",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 200 : 50,
    color: "#333",
    fontFamily: "System",
  },
  errorInput: {
    borderColor: "#E74C3C",
    borderWidth: 1.5,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 14,
    marginTop: 6,
    fontFamily: "System",
  },
  fileUpload: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#04668D",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    justifyContent: "center",
  },
  fileUploadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
    fontFamily: "System",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 16,
  },
  previewWrapper: {
    position: "relative",
    width: width < 768 ? 110 : 130,
    height: width < 768 ? 110 : 130,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  removeImageBtn: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#E74C3C",
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  imageCount: {
    color: "#666",
    fontSize: 14,
    marginTop: 10,
    fontFamily: "System",
  },
  infoNote: {
    backgroundColor: "#e6f4ff",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  infoNoteText: {
    color: "#04668D",
    fontSize: 14,
    fontFamily: "System",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 16,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: "#04668D",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#04668D",
  },
  cancelBtnText: {
    color: "#04668D",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
  disabledBtn: {
    backgroundColor: "#b0b0b0",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: width < 768 ? "90%" : "80%",
    maxWidth: 600,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fb",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#04668D",
    fontFamily: "System",
  },
  modalCloseBtn: {
    padding: 10,
  },
  modalBody: {
    padding: 20,
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: width < 768 ? 220 : 320,
    borderRadius: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 16,
  },
  modalReplaceBtn: {
    flex: 1,
    backgroundColor: "#04668D",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalRemoveBtn: {
    flex: 1,
    backgroundColor: "#E74C3C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalOptionBtn: {
    backgroundColor: "#04668D",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 10,
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
});

export default JournalEntryForm;