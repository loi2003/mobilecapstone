import apiClient from './url-api';

export const viewConsultantByUserId = async (userId, token) => {
  try {
    const response = await apiClient.get(
      `/api/consultant/view-consultant-by-user-id/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
};

export const getAllUsers = async (token) => {
  try {
    const response = await apiClient.get(
      '/api/consultant/get-all-users',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
};

export const getAllUsersByName = async (name, token) => {
  try {
    const response = await apiClient.get(
      `/api/consultant/get-all-users-by-name`,
      {
        params: { name },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
};