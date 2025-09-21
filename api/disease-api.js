import apiClient from "./url-api";


//GET: /api/Disease/view-all-diseases
export const viewAllDiseases = async (token) => {
  try {
    const response = await apiClient.get("/api/Disease/view-all-diseases", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
    });
    console.log("Get all diseases response:", response.data);
    return response;
  } catch (error) {
    console.error(
      "Error fetching all diseases:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// GET: /api/Disease/view-disease-by-id
export const viewDiseaseById = async (diseaseId) => {
  try {
    const response = await apiClient.get(`/api/Disease/view-disease-by-id`, {
      params: {
        diseaseId: diseaseId,
      },
      headers: {
        Accept: "application/json",
      },
    }
    );
    console.log(
      "View disease by id response:",
      response.data
    );
    return response;
  } catch (error) {
    console.error(
      "Error fetching disease by id:",
      error.response?.data || error.message
    );
    throw error;
  }
};
