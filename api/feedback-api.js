import apiClient from "./url-api";

// POST: /api/feedback/create-feedba
export const createFeedback = async (feedbackData, token) => {
  try {
    const response = await apiClient.post(
      "/api/feedback/create-feedback",
      feedbackData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating feedback:", error.message);
    throw error;
  }
};