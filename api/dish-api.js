import apiClient from "./url-api";

// GET: /api/Dish/view-all-dishes
export const viewAllDishes = async (token) => {
  try {
    const response = await apiClient.get("/api/Dish/view-all-dishes", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
    });
    console.log("Get all dishes response:", response.data);
    return response;
  } catch (error) {
    console.error(
      "Error fetching all dishes:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// GET: /api/Dish/view-dish-by-id
export const viewDishById = async (dishId) => {
  try {
    const response = await apiClient.get(`/api/Dish/view-dish-by-id`, {
      params: {
        dishId: dishId,
      },
      headers: {
        Accept: "application/json",
      },
    }
    );
    console.log(
      "View dish by id response:",
      response.data
    );
    return response;
  } catch (error) {
    console.error(
      "Error fetching dish by id:",
      error.response?.data || error.message
    );
    throw error;
  }
};
