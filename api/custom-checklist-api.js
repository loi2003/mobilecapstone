import apiClient from './url-api';

// GET: /api/custom-checklist/view-all-custom-checklists-by-growthdata
export const getAllCustomChecklistsByGrowthData = async (growthDataId, token) => {
  try {
    const response = await apiClient.get('/api/custom-checklist/view-all-custom-checklists-by-growthdata', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      params: {
        growthDataId,
      },
    });
    console.log('Fetched custom checklists:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching custom checklists:', error.response?.data || error.message);
    throw error;
  }
};
