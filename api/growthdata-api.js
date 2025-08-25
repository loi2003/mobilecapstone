import apiClient from './url-api';

export const getAllGrowthData = async (token) => {
  try {
    const response = await apiClient.get('/api/growthdata/view-all-growthdata', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching all growthdata:', error.message);
    throw error;
  }
};

export const getGrowthDataById = async (id, token) => {
  try {
    const response = await apiClient.get('/api/growthdata/view-growthdata-by-id', {
      params: { id },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching growthdata by ID:', error.message);
    throw error;
  }
};

export const getCurrentWeekGrowthData = async (userId, currentDate, token) => {
  try {
    const response = await apiClient.get(`/api/growthdata/view-growthdata-with-current-week/${userId}/${currentDate}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching current week growthdata:', error.message);
    throw error;
  }
};

export const getGrowthDataFromUser = async (userId, token) => {
  try {
    const response = await apiClient.get(`/api/growthdata/view-growthdata-by-user-id`, {
      params: { userId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching growthdata by user ID:', error.message);
    throw error;
  }
};



export const createGrowthDataProfile = async (data, token) => {
  try {
    const formData = new FormData();
    formData.append('UserId', data.userId);
    formData.append('FirstDayOfLastMenstrualPeriod', data.firstDayOfLastMenstrualPeriod);
    formData.append('PreWeight', data.preWeight);

    const response = await apiClient.post('/api/growthdata/create-new-growthdata-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
        Accept: 'text/plain',
      },
    });
    console.log('Create growthdata response:', response.data);
    return response;
  } catch (error) {
    console.error('Error creating growthdata:', error.response?.data?.message || error.message, error.response?.status, error.response?.data);
    throw error;
  }
};


export const editGrowthDataProfile = async (data, token) => {
  try {
    const formData = new FormData();
    formData.append('Id', data.id);
    formData.append('UserId', data.userId);
    formData.append('FirstDayOfLastMenstrualPeriod', data.firstDayOfLastMenstrualPeriod);
    formData.append('PreWeight', data.preWeight);

    const response = await apiClient.put('/api/growthdata/edit-growthdata-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
        Accept: 'text/plain',
      },
    });
    console.log('Edit growthdata response:', response.data);
    return response;
  } catch (error) {
    console.error('Error editing growthdata:', error.response?.data?.message || error.message, error.response?.status, error.response?.data);
    throw error;
  }
};

export const deleteGrowthData = async (id, token) => {
  try {
    const response = await apiClient.delete('/api/growthdata/delete-growthdata', {
      params: { id },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Delete growthdata response:', response.data);
    return response;
  } catch (error) {
    console.error('Error deleting growthdata:', error.response?.data?.message || error.message, error.response?.status, error.response?.data);
    throw error;
  }
};

