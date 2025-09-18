import apiClient from "./url-api";

// GET: /api/meal/view-menu-suggestion-by-trimester
export const viewMenuSuggestionByTrimester = async ({ stage }) => {
  try {
    const response = await apiClient.get(
      "/api/meal/view-menu-suggestion-by-trimester",
      {
        params: {
          stage,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching menu suggestion by trimester:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// GET: /api/meal/view-meals-suggestion
export const viewMealsSuggestion = async ({
  stage,
  dateOfBirth,
  type,
  numberOfDishes,
  allergyIds = [],   
  diseaseIds = [],
  favouriteDishId,
}) => {
  try {
    const response = await apiClient.get("/api/meal/view-meals-suggestion", {
      params: {
        stage,
        dateOfBirth,
        Type: type,
        NumberOfDishes: numberOfDishes,
        allergyIds,
        diseaseIds,
        favouriteDishId,
      },
      paramsSerializer: (params) => {
        return Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null && v !== "")
          .map(([key, value]) =>
            Array.isArray(value)
              ? value.map((val) => `${key}=${encodeURIComponent(val)}`).join("&")
              : `${key}=${encodeURIComponent(value)}`
          )
          .join("&");
      },
      headers: {
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching custom meal suggestion",
      error.response?.data || error.message
    );
    throw error;
  }
};

// POST: /api/meal/add-meal
