import apiClient from './url-api';

// GET: /api/basicbiometric/view-all-bbm
export const getAllBasicBioMetrics = async (token) => {
  try {
    const response = await apiClient.get('/api/basicbiometric/view-all-bbm', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all basic bio metrics:', error);
    throw error;
  }
};

// GET: /api/basicbiometric/view-bbm-by-id
export const viewBasicBioMetricById = async (id, token) => {
  try {
    const response = await apiClient.get(`/api/basicbiometric/view-bbm-by-id?id=${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error viewing basic biometric by id:', error);
    throw error;
  }
};


// POST: /api/basicbiometric/create-bbm
export const createBasicBioMetric = async (bbmData, token) => {
  try {
    const formData = new FormData();
    formData.append('Id', bbmData.id || '');
    formData.append('GrowthDataId', bbmData.GrowthDataId);
    formData.append('WeightKg', bbmData.WeightKg);
    formData.append('HeightCm', bbmData.HeightCm);

    if (bbmData.SystolicBP !== undefined && bbmData.SystolicBP !== null)
      formData.append('SystolicBP', bbmData.SystolicBP);
    if (bbmData.DiastolicBP !== undefined && bbmData.DiastolicBP !== null)
      formData.append('DiastolicBP', bbmData.DiastolicBP);
    if (bbmData.HeartRateBPM !== undefined && bbmData.HeartRateBPM !== null)
      formData.append('HeartRateBPM', bbmData.HeartRateBPM);
    if (bbmData.BloodSugarLevelMgDl !== undefined && bbmData.BloodSugarLevelMgDl !== null)
      formData.append('BloodSugarLevelMgDl', bbmData.BloodSugarLevelMgDl);
    if (bbmData.Notes)
      formData.append('Notes', bbmData.Notes);

    const response = await apiClient.post('/api/basicbiometric/create-bbm', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
        Accept: 'text/plain',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error creating basic biometric:', error);
    throw error;
  }
};
// PUT: /api/basicbiometric/edit-bbm
export const editBasicBioMetric = async (bbmData, token) => {
  try {
    const formData = new FormData();
    formData.append('BasicBiometricId', bbmData.BasicBiometricId);

    if (bbmData.WeightKg !== undefined && bbmData.WeightKg !== null)
      formData.append('WeightKg', bbmData.WeightKg);
    if (bbmData.HeightCm !== undefined && bbmData.HeightCm !== null)
      formData.append('HeightCm', bbmData.HeightCm);
    if (bbmData.SystolicBP !== undefined && bbmData.SystolicBP !== null)
      formData.append('SystolicBP', bbmData.SystolicBP);
    if (bbmData.DiastolicBP !== undefined && bbmData.DiastolicBP !== null)
      formData.append('DiastolicBP', bbmData.DiastolicBP);
    if (bbmData.HeartRateBPM !== undefined && bbmData.HeartRateBPM !== null)
      formData.append('HeartRateBPM', bbmData.HeartRateBPM);
    if (bbmData.BloodSugarLevelMgDl !== undefined && bbmData.BloodSugarLevelMgDl !== null)
      formData.append('BloodSugarLevelMgDl', bbmData.BloodSugarLevelMgDl);
    if (bbmData.Notes)
      formData.append('Notes', bbmData.Notes);

    const response = await apiClient.put('/api/basicbiometric/edit-bbm', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
        Accept: 'text/plain',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error editing basic biometric:', error);
    throw error;
  }
};

// DELETE: /api/basicbiometric/delete-bbm
export const deleteBasicBioMetric = async (id, token) => {
  try {
    const response = await apiClient.delete(`/api/basicbiometric/delete-bbm?id=${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting basic biometric:', error);
    throw error;
  }
};
