import apiClient from "./url-api";

export const getAllJournals = async (token) => {
  try {
    const response = await apiClient.get("/api/journal/view-all-journals", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
    });
    console.log("Get all journals response:", response.data);
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
    console.log("Get journal by ID response:", response.data);
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
    console.log("Get journal detail response:", response.data);
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
    console.log("Get journal by growthDataId response:", response.data);
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
    
    // if (journalData.CurrentWeight != null)
    // formData.append("CurrentWeight", journalData.CurrentWeight);
    formData.append("CurrentWeight", journalData.CurrentWeight);
    // Optional fields — append only if they are not null or undefined
    if (journalData.SystolicBP != null)
      formData.append("SystolicBP", journalData.SystolicBP);
    if (journalData.DiastolicBP != null)
      formData.append("DiastolicBP", journalData.DiastolicBP);
    if (journalData.HeartRateBPM != null)
      formData.append("HeartRateBPM", journalData.HeartRateBPM);
    if (journalData.BloodSugarLevelMgDl != null)
      formData.append("BloodSugarLevelMgDl", journalData.BloodSugarLevelMgDl);
    if (journalData.MoodNotes)
      formData.append("MoodNotes", journalData.MoodNotes);

    journalData.SymptomNames?.forEach(name => {
  if (name && name.trim()) formData.append("SymptomNames", name.trim());
});

    journalData.RelatedImages?.forEach((img) =>
      formData.append("RelatedImages", img)
    );
    journalData.UltraSoundImages?.forEach((img) =>
      formData.append("UltraSoundImages", img)
    );

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

    console.log("Create journal response:", response.data);
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
    const formData = new FormData();
    formData.append("Id", journalData.Id);
    formData.append("Note", journalData.Note);
    // if (journalData.CurrentWeight != null)
    // formData.append("CurrentWeight", journalData.CurrentWeight);
    formData.append("CurrentWeight", journalData.CurrentWeight);
    if (journalData.SystolicBP != null)
      formData.append("SystolicBP", journalData.SystolicBP);
    if (journalData.DiastolicBP != null)
      formData.append("DiastolicBP", journalData.DiastolicBP);
    if (journalData.HeartRateBPM != null)
      formData.append("HeartRateBPM", journalData.HeartRateBPM);
    if (journalData.BloodSugarLevelMgDl != null)
      formData.append("BloodSugarLevelMgDl", journalData.BloodSugarLevelMgDl);
    if (journalData.MoodNotes)
      formData.append("MoodNotes", journalData.MoodNotes);

    journalData.SymptomNames?.forEach(name => {
  if (name && name.trim()) formData.append("SymptomNames", name.trim());
});

    journalData.RelatedImages?.forEach((img) =>
      formData.append("RelatedImages", img)
    );
    journalData.UltraSoundImages?.forEach((img) =>
      formData.append("UltraSoundImages", img)
    );

    const response = await apiClient.put(
      "/api/journal/edit-journal-entry",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
          Accept: "text/plain",
        },
      }
    );

    console.log("Edit journal response:", response.data);
    return response;
  } catch (error) {
    console.error(
      "Error editing journal entry:",
      error.response?.data || error.message
    );
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
    console.log("Delete journal response:", response.data);
    return response;
  } catch (error) {
    console.error(
      "Error deleting journal:",
      error.response?.data?.message || error.message
    );
    throw error;
  }
};
