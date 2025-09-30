import apiClient from './url-api';

export const getAllUsers = async () => {
  try {
    const response = await apiClient.get(
      '/api/admin/view-all-users'
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching users', error.message)
    throw error;
  }
}