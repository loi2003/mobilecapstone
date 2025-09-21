import apiClient from "./url-api";

// GET: /api/Allergy/view-all-allergies
export const viewAllAllergies = async (token) => {
  try {
    const response = await apiClient.get("/api/Allergy/view-all-allergies", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
    });
    console.log("Get all allergies response:", response.data);
    return response;
  } catch (error) {
    console.error(
      "Error fetching all allergies:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// GET: /api/Allergy/view-allergy-by-id
export const viewAllergyById = async (allergyId) => {
  try {
    const response = await apiClient.get(`/api/Allergy/view-allergy-by-id`, {
      params: {
        allergyId: allergyId,
      },
      headers: {
        Accept: "application/json",
      },
    }
    );
    console.log(
      "View allergy by id response:",
      response.data
    );
    return response;
  } catch (error) {
    console.error(
      "Error fetching allergy by id:",
      error.response?.data || error.message
    );
    throw error;
  }
};
