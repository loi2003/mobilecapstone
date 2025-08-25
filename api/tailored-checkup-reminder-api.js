import apiClient from './url-api';

// GET: /api/tailored-checkup-reminder/view-all-tailored-checkup-reminders-by-growthdata
export const getAllTailoredCheckupRemindersForGrowthData = async (growthDataId, token) => {
  try {
    const response = await apiClient.get(`/api/tailored-checkup-reminder/view-all-tailored-checkup-reminders-by-growthdata?growthDataId=${growthDataId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch tailored checkup reminders:", error);
    throw error;
  }
};
// POST: /api/tailored-checkup-reminder/create-new-tailored-checkup-reminder
export const createTailoredCheckupReminder = async (reminderData, token) => {
  try {
    const formData = new FormData();
    formData.append("GrowthDataId", reminderData.GrowthDataId);
    formData.append("Title", reminderData.Title);
    formData.append("Description", reminderData.Description);
    if (reminderData.RecommendedStartWeek != null)
      formData.append("RecommendedStartWeek", reminderData.RecommendedStartWeek);
    if (reminderData.RecommendedEndWeek != null)
      formData.append("RecommendedEndWeek", reminderData.RecommendedEndWeek);
    formData.append("Type", reminderData.Type);
    if (reminderData.Note != null)
      formData.append("Note", reminderData.Note);
    const response = await apiClient.post(
      "/api/tailored-checkup-reminder/create-new-tailored-checkup-reminder",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
          Accept: "text/plain",
        },
      }
    );

    console.log("Create tailored checkup reminder response:", response.data);
    return response;
  } catch (error) {
    console.error(
      "Error creating tailored checkup reminder:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// PUT: /api/tailored-checkup-reminder/edit-tailored-checkup-reminder
export const editTailoredCheckupReminder = async (reminderId, reminderData, token) => {
  try {
    const formData = new FormData();
    formData.append("ReminderId", reminderId);
    if (reminderData.Title != null)
      formData.append("Title", reminderData.Title);
    if (reminderData.Description != null)
      formData.append("Description", reminderData.Description);
    if (reminderData.RecommendedStartWeek != null)
      formData.append("RecommendedStartWeek", reminderData.RecommendedStartWeek);
    if (reminderData.RecommendedEndWeek != null)
      formData.append("RecommendedEndWeek", reminderData.RecommendedEndWeek);
    if (reminderData.ScheduleDate != null)
      formData.append("ScheduleDate", reminderData.ScheduleDate);
    if (reminderData.CompletedDate != null)
      formData.append("CompletedDate", reminderData.CompletedDate);
    if (reminderData.CheckupStatus != null)
      formData.append("CheckupStatus", reminderData.CheckupStatus);
    if (reminderData.Type != null)
      formData.append("Type", reminderData.Type);
    if (reminderData.Note != null)
      formData.append("Note", reminderData.Note);
    if (reminderData.IsActive != null)
      formData.append("IsActive", reminderData.IsActive);
    const response = await apiClient.put(
      `/api/tailored-checkup-reminder/edit-tailored-checkup-reminder/${reminderId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
          Accept: "text/plain",
        },
      }
    );

    console.log("Edit tailored checkup reminder response:", response.data);
    return response;
  } catch (error) {
    console.error(
      "Error editing tailored checkup reminder:",
      error.response?.data || error.message
    );
    throw error;
  }
};
//DELETE : /api/tailored-checkup-reminder/delete-tailored-checkup-reminder
export const deleteTailoredCheckupReminder = async (reminderId, token) => {
  try {
    const response = await apiClient.delete(
      `/api/tailored-checkup-reminder/delete-tailored-checkup-reminder/${reminderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Delete tailored checkup reminder response:", response.data);
    return response;
  } catch (error) {
    console.error(
      "Error deleting tailored checkup reminder:",
      error.response?.data || error.message
    );
    throw error;
  }
};