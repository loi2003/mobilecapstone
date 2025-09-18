import apiClient from "./url-api";

export const getAllNutrientCategories = async () => {
  try {
    const response = await apiClient.get(`/api/NutrientCategory/GetAll`, {
      headers: {
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNutrientCategoryById = async (categoryId) => {
  try {
    const response = await apiClient.get(`/api/NutrientCategory/GetById`, {
      params: {
        categoryId: categoryId,
      },
      headers: {
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createNutrientCategory = async (categoryData) => {
  try {
    const response = await apiClient.post(
      `/api/NutrientCategory/Create`,
      {
        name: categoryData.name,
        description: categoryData.description,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateNutrientCategory = async (categoryData) => {
  try {
    const response = await apiClient.put(
      `/api/NutrientCategory/Update`,
      {
        nutrientCategoryId: categoryData.nutrientCategoryId,
        name: categoryData.name,
        description: categoryData.description,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteNutrientCategory = async (nutrientCategoryId) => {
  try {
    const response = await apiClient.delete(
      `/api/NutrientCategory/delete-nutrient-by-id?nutrientCategoryId=${nutrientCategoryId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllNutrients = async () => {
  try {
    const response = await apiClient.get(`/api/nutrient/view-all-nutrients`, {
      headers: {
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNutrientById = async (nutrientId) => {
  try {
    const response = await apiClient.get(
      `/api/nutrient/view-nutrient-by-id?nutrientId=${nutrientId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNutrientWithDetailsById = async (nutrientId) => {
  try {
    const response = await apiClient.get(
      `/api/nutrient/view-nutrient-by-id?nutrientId=${nutrientId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createNutrient = async (nutrientData) => {
  try {
    const formData = new FormData();
    formData.append("Name", nutrientData.name);
    formData.append("Description", nutrientData.description || "");
    if (nutrientData.imageUrl) {
      formData.append("ImageUrl", nutrientData.imageUrl);
    }
    formData.append("CategoryId", nutrientData.categoryId);

    const response = await apiClient.post(
      `/api/nutrient/add-new-nutrient`,
      formData,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateNutrient = async (nutrientData) => {
  try {
    const response = await apiClient.put(
      `/api/nutrient/update-nutrient`,
      {
        id: nutrientData.nutrientId,
        name: nutrientData.name,
        description: nutrientData.description || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateNutrientImage = async (nutrientId, imageUrl) => {
  try {
    const formData = new FormData();
    formData.append("Id", nutrientId);
    formData.append("ImageUrl", imageUrl);

    const response = await apiClient.put(
      `/api/nutrient/update-nutrient-image`,
      formData,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteNutrient = async (nutrientId) => {
  try {
    const response = await apiClient.delete(
      `/api/nutrient/delete-nutrient-by-id`,
      {
        params: {
          nutrientId: nutrientId,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllFoodCategories = async () => {
  try {
    const response = await apiClient.get(
      `/api/food-category/view-all-foods-category`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFoodCategoryById = async (categoryId) => {
  try {
    const response = await apiClient.get(
      `/api/food-category/view-food-category-by-id?categoryId=${categoryId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFoodCategoryWithFoodsById = async (categoryId) => {
  try {
    const response = await apiClient.get(
      `/api/food-category/view-food-category-by-id-with-foods`,
      {
        params: {
          id: categoryId,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createFoodCategory = async (categoryData) => {
  try {
    const response = await apiClient.post(
      `/api/food-category/add-food-category`,
      {
        name: categoryData.name,
        description: categoryData.description,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateFoodCategory = async (categoryData) => {
  try {
    if (!categoryData.id || categoryData.id === "") {
      throw new Error("FoodCategory Id is null or empty");
    }
    const response = await apiClient.put(
      `/api/food-category/update-food-category`,
      {
        id: categoryData.id,
        name: categoryData.name,
        description: categoryData.description,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFoodCategory = async (foodCategoryId) => {
  try {
    const response = await apiClient.delete(
      `/api/food-category/delete-food-category-by-id`,
      {
        params: {
          foodCategoryId: foodCategoryId,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllFoods = async () => {
  try {
    const response = await apiClient.get(`/api/food/view-all-foods`, {
      headers: {
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFoodById = async (foodId) => {
  try {
    const response = await apiClient.get(
      `/api/food/view-food-by-id?foodId=${foodId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createFood = async (foodData) => {
  try {
    const formData = new FormData();
    formData.append("image", foodData.image);

    const params = new URLSearchParams({
      Name: foodData.name,
      Description: foodData.description || "",
      PregnancySafe: foodData.pregnancySafe,
      FoodCategoryId: foodData.foodCategoryId,
      SafetyNote: foodData.safetyNote || "",
    });

    const response = await apiClient.post(
      `/api/food/add-food?${params.toString()}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateFood = async (foodData) => {
  try {
    if (!foodData.id || foodData.id === "") {
      throw new Error("Food Id is null or empty");
    }
    const response = await apiClient.put(
      `/api/food/update-food`,
      {
        id: foodData.id,
        name: foodData.name,
        description: foodData.description,
        pregnancySafe: foodData.pregnancySafe,
        safetyNote: foodData.safetyNote,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateFoodImage = async (foodId, image) => {
  try {
    const formData = new FormData();
    formData.append("id", foodId);
    formData.append("image", image);

    const response = await apiClient.put(
      `/api/food/update-food-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFood = async (foodId) => {
  try {
    const response = await apiClient.delete(`/api/food/delete-food-by-id`, {
      params: {
        foodId: foodId,
      },
      headers: {
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateFoodNutrient = async (nutrientData) => {
  try {
    const response = await apiClient.put(
      `/api/food/update-food-nutrient`,
      {
        foodId: nutrientData.foodId,
        nutrientId: nutrientData.nutrientId,
        nutrientEquivalent: nutrientData.nutrientEquivalent,
        unit: nutrientData.unit,
        amountPerUnit: nutrientData.amountPerUnit,
        totalWeight: nutrientData.totalWeight,
        foodEquivalent: nutrientData.foodEquivalent,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addNutrientsToFood = async (data) => {
  try {
    const response = await apiClient.put(
      `/api/food/add-nutrients-to-food`,
      {
        foodId: data.foodId,
        nutrients: data.nutrients,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFoodNutrient = async (foodId, nutrientId) => {
  try {
    const response = await apiClient.delete(
      `/api/food/delete-food-nutrient-by-foodId-nutrientId`,
      {
        params: {
          FoodId: foodId,
          NutrientId: nutrientId,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllAgeGroups = async () => {
  try {
    const response = await apiClient.get(`/api/AgeGroup/view-all-age-groups`, {
      headers: {
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAgeGroupById = async (ageGroupId) => {
  try {
    const response = await apiClient.get(
      `/api/AgeGroup/view-age-group-by-id?ageGroupId=${ageGroupId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createAgeGroup = async (ageGroupData) => {
  try {
    const response = await apiClient.post(
      `/api/AgeGroup/add-age-group`,
      {
        fromAge: ageGroupData.fromAge,
        toAge: ageGroupData.toAge,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAgeGroup = async (ageGroupData) => {
  try {
    if (!ageGroupData.ageGroupId || ageGroupData.ageGroupId === "") {
      throw new Error("AgeGroup Id is null or empty");
    }
    const response = await apiClient.post(
      `/api/AgeGroup/update-age-group`,
      {
        ageGroupId: ageGroupData.ageGroupId,
        fromAge: ageGroupData.fromAge,
        toAge: ageGroupData.toAge,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAgeGroup = async (ageGroupId) => {
  try {
    const response = await apiClient.delete(
      `/api/AgeGroup/delete-age-group-by-id?ageGroupId=${ageGroupId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllDishes = async () => {
  try {
    const response = await apiClient.get(`/api/dish/view-all-dishes`, {
      headers: {
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDishById = async (dishId) => {
  try {
    if (!dishId || dishId === "") {
      throw new Error("Dish ID is null or empty");
    }
    const response = await apiClient.get(
      `/api/dish/view-dish-by-id?dishId=${dishId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createDish = async (dishData) => {
  try {
    if (!dishData.dishName || dishData.dishName.trim() === "") {
      throw new Error("Dish name is required");
    }
    if (!dishData.foodList || dishData.foodList.length === 0) {
      throw new Error("At least one food item is required");
    }
    if (dishData.foodList.some((food) => !food.unit || food.amount <= 0)) {
      throw new Error(
        "All food items must have a valid unit and amount greater than 0"
      );
    }

    const payload = {
      dishName: dishData.dishName,
      description: dishData.description || "",
      foodList: dishData.foodList.map((food) => ({
        foodId: food.foodId,
        unit: food.unit === "grams" ? "g" : food.unit,
        amount: parseFloat(food.amount),
      })),
    };

    const response = await apiClient.post(`/api/Dish/add-dish`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addDishImage = async (dishId, image) => {
  try {
    if (!dishId || dishId === "") {
      throw new Error("Dish ID is null or empty");
    }
    if (!image) {
      throw new Error("Image is required");
    }

    const formData = new FormData();
    formData.append("dishId", dishId);
    formData.append("Image", image);

    const response = await apiClient.put(`/api/Dish/add-dish-image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDish = async (dishData) => {
  try {
    if (!dishData.dishId || dishData.dishId === "") {
      throw new Error("Dish ID is null or empty");
    }
    if (!dishData.dishName || dishData.dishName.trim() === "") {
      throw new Error("Dish name is required");
    }
    if (dishData.foodList.some((food) => !food.unit || food.amount <= 0)) {
      throw new Error(
        "All food items must have a valid unit and amount greater than 0"
      );
    }

    const payload = {
      dishID: dishData.dishId,
      dishName: dishData.dishName,
      description: dishData.description || "",
      foodList: dishData.foodList.map((food) => ({
        foodId: food.foodId,
        unit: food.unit === "grams" ? "g" : food.unit,
        amount: parseFloat(food.amount),
      })),
    };

    const response = await apiClient.put("/api/dish/update-dish", payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteDish = async (dishId) => {
  try {
    if (!dishId || dishId === "") {
      throw new Error("Dish ID is null or empty");
    }
    const response = await apiClient.delete(
      `/api/dish/delete-dish-by-id?dishId=${dishId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateFoodInDish = async (foodData) => {
  try {
    if (!foodData.dishId || foodData.dishId === "") {
      throw new Error("Dish ID is null or empty");
    }
    if (!foodData.foodId || foodData.foodId === "") {
      throw new Error("Food ID is null or empty");
    }
    if (!foodData.unit || foodData.unit === "") {
      throw new Error("Unit is required");
    }
    if (foodData.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const payload = {
      foodId: foodData.foodId,
      dishId: foodData.dishId,
      unit: foodData.unit === "grams" ? "g" : foodData.unit,
      amount: parseFloat(foodData.amount),
    };

    const response = await apiClient.put(`/api/Dish/update-food-in-dish`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFoodInDish = async (dishId, foodId) => {
  try {
    if (!dishId || dishId === "") {
      throw new Error("Dish ID is null or empty");
    }
    if (!foodId || foodId === "") {
      throw new Error("Food ID is null or empty");
    }

    const response = await apiClient.put(
      `/api/Dish/delete-food-in-dish-by-food-id`,
      null,
      {
        params: { dishId, foodId },
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllAllergyCategories = async (token) => {
  try {
    const response = await apiClient.get(
      `/api/allergy-category/view-all-allergy-category`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllergyCategoryById = async (categoryId, token) => {
  try {
    if (!categoryId || categoryId === "") {
      throw new Error("Allergy Category ID is null or empty");
    }
    const response = await apiClient.get(
      `/api/allergy-category/view-allergy-category-by-id?categoryId=${categoryId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllergyCategoryWithAllergiesById = async (categoryId) => {
  try {
    if (!categoryId || categoryId === "") {
      throw new Error("Allergy Category ID is null or empty");
    }
    const response = await apiClient.get(
      `/api/allergy-category/view-allergy-category-by-id-with-allergies?categoryId=${categoryId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createAllergyCategory = async (categoryData) => {
  try {
    const response = await apiClient.post(
      `/api/allergy-category/add-allergy-category`,
      {
        name: categoryData.name,
        description: categoryData.description,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAllergyCategory = async (categoryId) => {
  try {
    if (!categoryId || categoryId === "") {
      throw new Error("Allergy Category ID is null or empty");
    }
    const response = await apiClient.delete(
      `/api/allergy-category/delete-allergy-category-by-id`,
      {
        params: {
          allergyCategoryId: categoryId,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAllergyCategory = async (categoryData) => {
  try {
    if (!categoryData.id || categoryData.id === "") {
      throw new Error("Allergy Category ID is null or empty");
    }
    const response = await apiClient.put(
      `/api/allergy-category/update-allergy-category`,
      {
        id: categoryData.id,
        name: categoryData.name,
        description: categoryData.description || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllAllergies = async (token) => {
  try {
    const response = await apiClient.get(`/api/Allergy/view-all-allergies`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createAllergy = async (allergyData, token) => {
  try {
    const response = await apiClient.post(
      `/api/Allergy/add-allergy`,
      {
        name: allergyData.name,
        description: allergyData.description || "",
        allergyCategoryId: allergyData.allergyCategoryId || null,
        commonSymptoms: allergyData.commonSymptoms || "",
        pregnancyRisk: allergyData.pregnancyRisk || "",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAllergy = async (allergyData, token) => {
  try {
    if (!allergyData.id || allergyData.id === "") {
      throw new Error("Allergy ID is null or empty");
    }
    const response = await apiClient.put(
      `/api/Allergy/update-allergy`,
      {
        allergyId: allergyData.id,
        name: allergyData.name,
        description: allergyData.description || "",
        allergyCategoryId: allergyData.allergyCategoryId || null,
        commonSymptoms: allergyData.commonSymptoms || "",
        pregnancyRisk: allergyData.pregnancyRisk || "",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAllergy = async (allergyId, token) => {
  try {
    if (!allergyId || allergyId === "") {
      throw new Error("Allergy ID is null or empty");
    }
    const response = await apiClient.delete(
      `/api/Allergy/delete-allergy-by-id`,
      {
        params: {
          allergyId: allergyId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllDiseases = async (token) => {
  try {
    const response = await apiClient.get(`/api/Disease/view-all-diseases`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDiseaseById = async (diseaseId, token) => {
  try {
    if (!diseaseId || diseaseId === "") {
      throw new Error("Disease ID is null or empty");
    }
    const response = await apiClient.get(
      `/api/Disease/view-disease-by-id?diseaseId=${diseaseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createDisease = async (diseaseData, token) => {
  try {
    if (!diseaseData.name || diseaseData.name.trim() === "") {
      throw new Error("Disease name is required");
    }
    const response = await apiClient.post(
      `/api/Disease/add-disease`,
      {
        name: diseaseData.name,
        description: diseaseData.description || "",
        symptoms: diseaseData.symptoms || "",
        treatmentOptions: diseaseData.treatmentOptions || "",
        pregnancyRelated: diseaseData.pregnancyRelated || false,
        riskLevel: diseaseData.riskLevel || "",
        typeOfDesease: diseaseData.typeOfDesease || "",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDisease = async (diseaseData, token) => {
  try {
    if (!diseaseData.diseaseId || diseaseData.diseaseId === "") {
      throw new Error("Disease ID is null or empty");
    }
    if (!diseaseData.name || diseaseData.name.trim() === "") {
      throw new Error("Disease name is required");
    }
    const response = await apiClient.put(
      `/api/Disease/update-disease`,
      {
        diseaseId: diseaseData.diseaseId,
        name: diseaseData.name,
        description: diseaseData.description || "",
        symptoms: diseaseData.symptoms || "",
        treatmentOptions: diseaseData.treatmentOptions || "",
        pregnancyRelated: diseaseData.pregnancyRelated || false,
        riskLevel: diseaseData.riskLevel || "",
        typeOfDesease: diseaseData.typeOfDesease || "",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteDisease = async (diseaseId, token) => {
  try {
    if (!diseaseId || diseaseId === "") {
      throw new Error("Disease ID is null or empty");
    }
    const response = await apiClient.delete(
      `/api/Disease/delete-disease-by-id?diseaseId=${diseaseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createMeal = async (mealData) => {
  try {
    if (!mealData.mealType || mealData.mealType.trim() === "") {
      throw new Error("Meal type is required");
    }
    if (!mealData.dishMeals || mealData.dishMeals.length === 0) {
      throw new Error("At least one dish is required");
    }
    if (mealData.dishMeals.some((dish) => !dish.dishId || dish.dishId === "")) {
      throw new Error("All dishes must have a valid dishId");
    }

    const payload = {
      mealType: mealData.mealType,
      dishMeals: mealData.dishMeals.map((dish) => ({
        dishId: dish.dishId,
      })),
    };

    const response = await apiClient.post(`/api/meal/add-meal`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateMeal = async (mealId, mealData) => {
  try {
    if (!mealId || mealId === "") {
      throw new Error("Meal ID is null or empty");
    }
    if (!mealData.mealType || mealData.mealType.trim() === "") {
      throw new Error("Meal type is required");
    }
    if (!mealData.dishMeals || mealData.dishMeals.length === 0) {
      throw new Error("At least one dish is required");
    }
    if (mealData.dishMeals.some((dish) => !dish.dishId || dish.dishId === "")) {
      throw new Error("All dishes must have a valid dishId");
    }

    const payload = {
      mealType: mealData.mealType,
      dishMeals: mealData.dishMeals.map((dish) => ({
        dishId: dish.dishId,
      })),
    };

    const response = await apiClient.put(`/api/meal/update-meal/${mealId}`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteMeal = async (mealId) => {
  try {
    if (!mealId || mealId === "") {
      throw new Error("Meal ID is null or empty");
    }

    const response = await apiClient.delete(`/api/meal/delete-meal/${mealId}`, {
      headers: {
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMealById = async (mealId) => {
  try {
    if (!mealId || mealId === "") {
      throw new Error("Meal ID is null or empty");
    }

    const response = await apiClient.get(`/api/meal/view-meal-by-id`, {
      params: {
        mealId: mealId,
      },
      headers: {
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllMeals = async () => {
  try {
    const response = await apiClient.get(`/api/meal/view-all-meals`, {
      headers: {
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createWarningFoodForDisease = async (warningData) => {
  try {
    if (!warningData.diseaseId || warningData.diseaseId === "") {
      throw new Error("Disease ID is null or empty");
    }
    if (!warningData.warningFoodDtos || warningData.warningFoodDtos.length === 0) {
      throw new Error("At least one warning food is required");
    }
    if (warningData.warningFoodDtos.some((food) => !food.foodId || food.foodId === "")) {
      throw new Error("All warning foods must have a valid foodId");
    }
    const payload = {
      diseaseId: warningData.diseaseId,
      warningFoodDtos: warningData.warningFoodDtos.map((food) => ({
        foodId: food.foodId,
        description: food.description || "",
      })),
    };
    const response = await apiClient.put(`/api/food/create-warning-food-for-disease`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeRecommendOrWarningFoodForDisease = async (foodDiseaseData) => {
  try {
    if (!foodDiseaseData.foodId || foodDiseaseData.foodId === "") {
      throw new Error("Food ID is null or empty");
    }
    if (!foodDiseaseData.diseaseId || foodDiseaseData.diseaseId === "") {
      throw new Error("Disease ID is null or empty");
    }
    const payload = {
      foodId: foodDiseaseData.foodId,
      diseaseId: foodDiseaseData.diseaseId,
    };
    const response = await apiClient.put(`/api/food/remove-recommend-or-warning-food-for-disease`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeRecommendOrWarningFoodForAllergy = async (foodAllergyData) => {
  try {
    if (!foodAllergyData.foodId || foodAllergyData.foodId === "") {
      throw new Error("Food ID is null or empty");
    }
    if (!foodAllergyData.allergyId || foodAllergyData.allergyId === "") {
      throw new Error("Allergy ID is null or empty");
    }
    const payload = {
      foodId: foodAllergyData.foodId,
      allergyId: foodAllergyData.allergyId,
    };
    const response = await apiClient.put(`/api/food/remove-recommend-or-warning-food-for-allergy`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createWarningFoodForAllergy = async (warningData) => {
  try {
    if (!warningData.allergyId || warningData.allergyId === "") {
      throw new Error("Allergy ID is null or empty");
    }
    if (!warningData.warningFoodDtos || warningData.warningFoodDtos.length === 0) {
      throw new Error("At least one warning food is required");
    }
    if (warningData.warningFoodDtos.some((food) => !food.foodId || food.foodId === "")) {
      throw new Error("All warning foods must have a valid foodId");
    }
    const payload = {
      allergyId: warningData.allergyId,
      warningFoodDtos: warningData.warningFoodDtos.map((food) => ({
        foodId: food.foodId,
        description: food.description || "",
      })),
    };
    const response = await apiClient.put(`/api/food/create-warning-food-for-allergy`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const viewWarningFoods = async (filterData, token) => {
  try {
    const payload = {
      allergyIds: filterData.allergyIds || [],
      diseaseIds: filterData.diseaseIds || [],
    };
    const response = await apiClient.post(`/api/food/view-warning-foods`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllEnergySuggestions = async () => {
  try {
    const response = await apiClient.get(`/api/EnergySuggestion/GetAll`, {
      headers: {
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getEnergySuggestionById = async (energySuggestionId, token) => {
  try {
    if (!energySuggestionId || energySuggestionId === "") {
      throw new Error("Energy Suggestion ID is null or empty");
    }
    const headers = {
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await apiClient.get(`/api/EnergySuggestion/GetById`, {
      params: {
        enegrySuggestionId: energySuggestionId,
      },
      headers,
      timeout: 60000,
    });
    if (!response.data) {
      return null;
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createEnergySuggestion = async (energySuggestionData, token) => {
  try {
    if (!energySuggestionData.ageGroupId || energySuggestionData.ageGroupId.trim() === "") {
      throw new Error("Age Group ID is null or empty");
    }
    if (![1, 2].includes(Number(energySuggestionData.activityLevel))) {
      throw new Error("Activity Level must be 1 (Light) or 2 (Moderate)");
    }
    if (
      energySuggestionData.additionalCalories &&
      ![50, 250, 450].includes(Number(energySuggestionData.additionalCalories))
    ) {
      throw new Error("Additional Calories must be 50, 250, or 450");
    }
    if (!energySuggestionData.baseCalories || isNaN(energySuggestionData.baseCalories) || Number(energySuggestionData.baseCalories) <= 0) {
      throw new Error("Base Calories must be a positive number");
    }

    const payload = {
      activityLevel: Number(energySuggestionData.activityLevel),
      baseCalories: Number(energySuggestionData.baseCalories),
      trimester: Number(energySuggestionData.trimester) || 0,
      additionalCalories: Number(energySuggestionData.additionalCalories) || 0,
      ageGroupId: energySuggestionData.ageGroupId,
    };

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.post(
      `/api/EnergySuggestion/Create`,
      payload,
      { headers }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateEnergySuggestion = async (energySuggestionData, token) => {
  try {
    if (!energySuggestionData.id || energySuggestionData.id === "") {
      throw new Error("Energy Suggestion ID is null or empty");
    }
    if (!energySuggestionData.ageGroupId || energySuggestionData.ageGroupId === "") {
      throw new Error("Age Group ID is null or empty");
    }
    if (![1, 2].includes(Number(energySuggestionData.activityLevel))) {
      throw new Error("Activity Level must be 1 (Light) or 2 (Moderate)");
    }
    if (
      energySuggestionData.additionalCalories &&
      ![50, 250, 450].includes(Number(energySuggestionData.additionalCalories))
    ) {
      throw new Error("Additional Calories must be 50, 250, or 450");
    }
    if (!energySuggestionData.baseCalories || isNaN(energySuggestionData.baseCalories) || Number(energySuggestionData.baseCalories) <= 0) {
      throw new Error("Base Calories must be a positive number");
    }
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await apiClient.put(
      `/api/EnergySuggestion/Update`,
      {
        id: energySuggestionData.id,
        activityLevel: Number(energySuggestionData.activityLevel) || 0,
        baseCalories: Number(energySuggestionData.baseCalories) || 0,
        trimester: Number(energySuggestionData.trimester) || 0,
        additionalCalories: Number(energySuggestionData.additionalCalories) || 0,
        ageGroupId: energySuggestionData.ageGroupId,
      },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createNutrientSuggestion = async (nutrientSuggestionData, token) => {
  try {
    if (!nutrientSuggestionData.name || nutrientSuggestionData.name.trim() === "") {
      throw new Error("Nutrient suggestion name is required");
    }

    const payload = {
      nutrientSuggetionName: nutrientSuggestionData.name,
    };

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.post(
      `/api/NutrientSuggestion/Create`,
      payload,
      { headers }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addNutrientSuggestionAttribute = async (attributeData, token) => {
  try {
    if (!attributeData.nutrientSuggestionId || !attributeData.nutrientId) {
      throw new Error("Nutrient suggestion ID and nutrient ID are required");
    }

    const payload = {
      nutrientSuggestionId: attributeData.nutrientSuggestionId,
      ageGroupId: attributeData.ageGroupId || null,
      trimester: attributeData.trimester || 0,
      maxEnergyPercentage: attributeData.maxEnergyPercentage || 0,
      minEnergyPercentage: attributeData.minEnergyPercentage || 0,
      maxValuePerDay: attributeData.maxValuePerDay || 0,
      minValuePerDay: attributeData.minValuePerDay || 0,
      unit: attributeData.unit || "milligrams",
      amount: attributeData.amount || 0,
      minAnimalProteinPercentageRequire: attributeData.minAnimalProteinPercentageRequire || 0,
      nutrientId: attributeData.nutrientId,
      type: attributeData.type || 0,
    };

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.put(
      `/api/NutrientSuggestion/AddAttribute`,
      payload,
      { headers }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllNutrientSuggestions = async (token) => {
  try {
    const headers = {
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.get(`/api/NutrientSuggestion/view-all-nutrient-suggestions`, {
      headers,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNutrientSuggestionById = async (id, token) => {
  try {
    if (!id || id === "") {
      throw new Error("Nutrient Suggestion ID is null or empty");
    }

    const headers = {
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.get(`/api/NutrientSuggestion/view-nutrient-suggestion-by-id`, {
      params: { Id: id },
      headers,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateNutrientSuggestion = async (nutrientSuggestionData, token) => {
  try {
    if (!nutrientSuggestionData.id || nutrientSuggestionData.id === "") {
      throw new Error("Nutrient Suggestion ID is null or empty");
    }
    if (!nutrientSuggestionData.nutrientSuggetionName || nutrientSuggestionData.nutrientSuggetionName.trim() === "") {
      throw new Error("Nutrient suggestion name is required");
    }

    const payload = {
      id: nutrientSuggestionData.id,
      nutrientSuggetionName: nutrientSuggestionData.nutrientSuggetionName,
    };

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.put(
      `/api/NutrientSuggestion/Update`,
      payload,
      { headers }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteNutrientSuggestion = async (id, token) => {
  try {
    if (!id || id === "") {
      throw new Error("Nutrient Suggestion ID is null or empty");
    }

    const headers = {
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.delete(
      `/api/NutrientSuggestion/delete-nutrient-suggestion-by-id`,
      {
        params: { id },
        headers,
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};