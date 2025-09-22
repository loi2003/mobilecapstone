import apiClient from "./url-api";
import { Platform } from "react-native";

export const getAllJournals = async (token) => {
  try {
    const response = await apiClient.get("/api/journal/view-all-journals", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
    });
    return response;
  } catch (error) {
    console.error(
      "Error fetching all journals:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getJournalById = async (journalId, token) => {
  try {
    const response = await apiClient.get("/api/journal/view-journal-by-id", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
      params: {
        journalId,
      },
    });
    return response;
  } catch (error) {
    console.error(
      "Error fetching journal by ID:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getJournalDetail = async (journalId, token) => {
  try {
    const response = await apiClient.get("/api/journal/view-journal-detail", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
      params: {
        journalId,
      },
    });
    return response;
  } catch (error) {
    console.error(
      "Error fetching journal detail:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getJournalByGrowthDataId = async (growthDataId, token) => {
  try {
    const response = await apiClient.get(
      `/api/journal/view-journal-by-growthdata-id/${growthDataId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/plain",
        },
      }
    );
    return response;
  } catch (error) {
    console.error(
      "Error fetching journal by growthDataId:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const createJournalEntry = async (journalData, token) => {
  try {
    const formData = new FormData();
    formData.append("Id", journalData.Id || "");
    formData.append("UserId", journalData.UserId);
    formData.append("GrowthDataId", journalData.GrowthDataId);
    formData.append("CurrentWeek", journalData.CurrentWeek);
    formData.append("Note", journalData.Note);
    formData.append("CurrentWeight", journalData.CurrentWeight || "");

    // Optional fields — append only if they are not null or undefined
    if (journalData.SystolicBP)
      formData.append("SystolicBP", journalData.SystolicBP);
    if (journalData.DiastolicBP)
      formData.append("DiastolicBP", journalData.DiastolicBP);
    if (journalData.HeartRateBPM)
      formData.append("HeartRateBPM", journalData.HeartRateBPM);
    if (journalData.BloodSugarLevelMgDl)
      formData.append("BloodSugarLevelMgDl", journalData.BloodSugarLevelMgDl);
    if (journalData.MoodNotes)
      formData.append("MoodNotes", journalData.MoodNotes);

    journalData.SymptomNames?.forEach((name) => {
      if (name && name.trim()) formData.append("SymptomNames", name.trim());
    });

    journalData.RelatedImages?.forEach((img, index) => {
      if (img.uri) {
        formData.append("RelatedImages", {
          uri:
            Platform.OS === "android"
              ? img.uri
              : img.uri.replace("file://", ""),
          type: img.type || "image/jpeg",
          name: img.name || `related_image_${index}.jpg`,
        });
      }
    });

    journalData.UltraSoundImages?.forEach((img, index) => {
      if (img.uri) {
        formData.append("UltraSoundImages", {
          uri:
            Platform.OS === "android"
              ? img.uri
              : img.uri.replace("file://", ""),
          type: img.type || "image/jpeg",
          name: img.name || `ultrasound_image_${index}.jpg`,
        });
      }
    });

    const response = await apiClient.post(
      "/api/journal/create-new-journal-entry",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
          Accept: "text/plain",
        },
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Error creating journal entry:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const editJournalEntry = async (journalData, token) => {
  try {
    console.log("📝 Starting journal edit process...");

    const formData = new FormData();

    // Basic fields
    formData.append("Id", String(journalData.Id || ""));
    formData.append("Note", String(journalData.Note || ""));
    formData.append("CurrentWeight", String(journalData.CurrentWeight || ""));
    formData.append("UserId", String(journalData.UserId || ""));
    formData.append("GrowthDataId", String(journalData.GrowthDataId || ""));

    // Optional fields
    formData.append("SystolicBP", String(journalData.SystolicBP || ""));
    formData.append("DiastolicBP", String(journalData.DiastolicBP || ""));
    formData.append("HeartRateBPM", String(journalData.HeartRateBPM || ""));
    formData.append(
      "BloodSugarLevelMgDl",
      String(journalData.BloodSugarLevelMgDl || "")
    );
    formData.append("MoodNotes", String(journalData.MoodNotes || ""));

    // Symptoms
    journalData.SymptomNames?.forEach((name) => {
      if (name && name.trim()) formData.append("SymptomNames", name.trim());
    });

    // Process images
    const processImages = (images, fieldName) => {
      if (!images || !Array.isArray(images)) return;

      const supportedFormats = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      images.forEach((img, index) => {
        if (!img) return;

        if (typeof img === "string") {
          // Append existing URLs directly
          formData.append(fieldName, img);
          console.log(
            `✅ Added existing ${fieldName}: ${img.substring(0, 50)}...`
          );
        } else if (img.uri && typeof img.uri === "string") {
          const fileObject = {
            uri: img.uri,
            type: img.type || "image/jpeg",
            name:
              img.name ||
              `${fieldName.toLowerCase()}_${Date.now()}_${index}.${
                img.type?.split("/")[1] || "jpg"
              }`,
          };

          if (supportedFormats.includes(fileObject.type)) {
            formData.append(fieldName, fileObject);
            console.log(
              `📤 Appending ${fieldName} file: @${fileObject.name};type=${fileObject.type}`
            );
          } else {
            console.warn(
              `Unsupported image format for ${fieldName}: ${fileObject.type}`
            );
          }
        } else {
          console.warn(`Invalid image data for ${fieldName} at index ${index}`);
        }
      });
    };

    processImages(journalData.RelatedImages, "RelatedImages");
    processImages(journalData.UltraSoundImages, "UltraSoundImages");

    // Debug: Log FormData
    console.log("📋 FormData payload for editJournalEntry:");
    const formDataEntries = [];
    for (let [key, value] of formData.entries()) {
      if (typeof value === "object" && value.uri) {
        formDataEntries.push(
          `${key}=@${value.name};type=${value.type};uri=${value.uri.substring(
            0,
            50
          )}...`
        );
      } else {
        formDataEntries.push(`${key}=${value}`);
      }
    }
    console.log(formDataEntries.join("\n"));

    console.log("📤 Sending PUT request...");

    const response = await apiClient.put(
      "/api/journal/edit-journal-entry",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        timeout: 60000,
      }
    );

    console.log("✅ Edit journal entry successful");
    return response;
  } catch (error) {
    console.error("❌ Error editing journal entry:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
    throw error;
  }
};

export const deleteJournal = async (journalId, token) => {
  try {
    const response = await apiClient.delete(
      `/api/journal/delete-journal?journalId=${journalId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/plain",
        },
      }
    );
    return response;
  } catch (error) {
    console.error(
      "Error deleting journal:",
      error.response?.data?.message || error.message
    );
    throw error;
  }
};
