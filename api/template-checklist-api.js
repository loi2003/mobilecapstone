import apiClient from './url-api';

// GET: /api/template-checklist/view-all-template-checklists
export const getAllChecklistProgressForGrowthData = async (growthDataId, token) => {
  try {
    const response = await apiClient.get('/api/template-checklist/view-all-template-checklists', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      params: {
        growthDataId,
      },
    });
    console.log('Fetched checklist progress:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching checklist progress:', error.response?.data || error.message);
    throw error;
  }
};


