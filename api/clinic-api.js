import apiClient from './url-api';

// Fetch view all clinics from the API
export const getAllClinics = async (token) => {
  try {
    const response = await apiClient.get('/api/clinic/view-all-clinics', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching clinics:', error.message);
    throw error;
  }
};

// Fetch view all clinics by name from the API
export const getClinicsByName = async (name, token) => {
  try {
    const response = await apiClient.get('/api/clinic/view-all-clinics-by-name', {
      params: { name },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching clinics by name:', error.message);
    throw error;
  }
};

// Fetch view clinic by ID from the API
export const getClinicById = async (id, token) => {
  try {
    const response = await apiClient.get(`/api/clinic/view-clinic-by-id/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching clinic by ID:', error.message);
    throw error;
  }
};

// Fetch suggested clinics for a user by user ID from the API
export const suggestClinics = async (userId, token) => {
  try {
    const response = await apiClient.get(`/api/clinic/suggest-clinics/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching suggested clinics:', error.message);
    throw error;
  }
};

// Create a new clinic using the API
export const createClinic = async (clinicData, token) => {
  try {
    const response = await apiClient.post('/api/clinic/create-clinic', null, {
      params: {
        Name: clinicData.name,
        Address: clinicData.address,
        Description: clinicData.description,
        Phone: clinicData.phone,
        Email: clinicData.email,
        IsInsuranceAccepted: clinicData.isInsuranceAccepted,
        Specializations: clinicData.specializations,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating clinic:', error.message);
    throw error;
  }
};

// Update an existing clinic using the API
export const updateClinic = async (clinicData, token) => {
  try {
    const response = await apiClient.put('/api/clinic/update-clinic', null, {
      params: {
        Id: clinicData.id,
        Name: clinicData.name,
        Address: clinicData.address,
        Description: clinicData.description,
        Phone: clinicData.phone,
        Email: clinicData.email,
        IsInsuranceAccepted: clinicData.isInsuranceAccepted,
        Specializations: clinicData.specializations,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating clinic:', error.message);
    throw error;
  }
};

// Soft delete a clinic by ID using the API
export const softDeleteClinic = async (id, token) => {
  try {
    const response = await apiClient.put(`/api/clinic/soft-delete-clinic/${id}`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error soft deleting clinic:', error.message);
    throw error;
  }
};

// Approve a clinic by ID using the API
export const approveClinic = async (id, token) => {
  try {
    const response = await apiClient.put(`/api/clinic/approve-clinic/${id}`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error approving clinic:', error.message);
    throw error;
  }
};

// Reject a clinic by ID using the API
export const rejectClinic = async (id, token) => {
  try {
    const response = await apiClient.put(`/api/clinic/reject-clinic/${id}`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting clinic:', error.message);
    throw error;
  }
};