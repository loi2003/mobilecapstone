import apiClient from './url-api';

// GET: /api/offline-consultation/view-all-offline-consultations/{userId}?status={status}

export const viewAllOfflineConsultation = async (userId, status = '', token) => {
  try {
    const formData = new FormData();
    formData.append("UserId", userId);
    formData.append("Status", status); // always send Status, even if blank

    const response = await apiClient.get(
      `/api/offline-consultation/view-all-offline-consultations/${userId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Viewing offline consultation:', response.data);
    return response;
  } catch (error) {
    console.error(
      'Error viewing offline consultation:',
      error.response?.data || error.message
    );
    throw error;
  }
};
