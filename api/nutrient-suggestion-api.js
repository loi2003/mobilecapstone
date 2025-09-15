import apiClient from "./url-api";

// GET: /api/NutrientSuggestion/GetEssentialNutritionalNeedsInOneDay
export const getEssentialNutritionalNeeds = async ({
  currentWeek,
  dateOfBirth,
  activityLevel = 1,
}) => {
  const response = await apiClient.get(
    "/api/NutrientSuggestion/GetEssentialNutritionalNeedsInOneDay",
    {
      params: {
        currentWeek,
        dateOfBirth,
        activityLevel: activityLevel ?? 1,
      },
      headers: {
        Accept: "application/json",
      },
    }
  );

  return response.data;
};

