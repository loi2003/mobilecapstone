import apiClient from './url-api';

// GET: /api/recorded-symptom/view-all-symptoms
export const getAllSymptoms = async (token) => {
  try {
    const response = await apiClient.get('/api/recorded-symptom/view-all-symptoms', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching all symptoms:', error.response?.data || error.message);
    throw error;
  }
};

// GET: /api/recorded-symptom/view-symptom-by-id
export const getSymptomById = async (symptomId, token) => {
  try {
    const response = await apiClient.get('/api/recorded-symptom/view-symptom-by-id', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      params: {
        symptomId,
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching symptom by ID:', error.response?.data || error.message);
    throw error;
  }
};

// GET: /api/recorded-symptom/view-all-symptoms-for-user
export const getSymptomsForUser = async (userId, token) => {
  try {
    const response = await apiClient.get('/api/recorded-symptom/view-all-symptoms-for-user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      params: {
        userId,
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching user symptoms:', error.response?.data || error.message);
    throw error;
  }
};

// POST: /api/recorded-symptom/add-new-custom-symptom
export const addNewCustomSymptom = async (symptomName, token) => {
  try {
    const formData = new FormData();
    formData.append("SymptomName", symptomName);

    const response = await apiClient.post('/api/recorded-symptom/add-new-custom-symptom', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data', // important for FormData
      },
    });

    return response;
  } catch (error) {
    console.error('Error adding custom symptom:', error.response?.data || error.message);
    throw error;
  }
};

// PUT: /api/recorded-symptom/update-custom-symptom
export const updateCustomSymptom = async (symptomId, updatedData, token) => {
  try {
    const formData = new FormData();
    formData.append("SymptomId", symptomId);
    formData.append("SymptomName", updatedData.SymptomName);
    if (updatedData.IsActive !== undefined && updatedData.IsActive !== null) {
      formData.append("IsActive", updatedData.IsActive);
    }
    const response = await apiClient.put(`/api/recorded-symptom/update-custom-symptom/${symptomId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data', 
      },
    });
    return response;
  } catch (error) {
    console.error('Error updating template symptom:', error.response?.data || error.message);
    throw error;
  }
};

// PUT: /api/recorded-symptom/mark-symptom-as-checked
export const markTemplateSymptomAsChecked = async (symptomId, token) => {
  try {
    const response = await apiClient.put(`/api/recorded-symptom/mark-symptom-as-checked/${symptomId}`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data', 
      },
    });
    return response;
  } catch (error) {
    console.error('Error marking template symptom as checked:', error.response?.data || error.message);
    throw error;
  }
};

// DELETE: /api/recorded-symptom/delete-recorded-symptom
export const deleteRecordedSymptom = async (symptomId, token) => {
  try {
    const response = await apiClient.delete(`/api/recorded-symptom/delete-recorded-symptom/${symptomId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data', 
      },
    });
    return response;
  } catch (error) {
    console.error('Error deleting recorded symptom:', error.response?.data || error.message);
    throw error;
  }
};
