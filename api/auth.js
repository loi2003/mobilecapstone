import apiClient from "./url-api";

export const register = async (data) => {
  try {
    const response = await apiClient.post(`/api/Auth/user/register/user`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "*/*",
      },
    });
    return response;
  } catch (error) {
    console.error("Error registering:", error);
    throw error;
  }
};

export const verifyOtp = async (data) => {
  try {
    const response = await apiClient.post(`/api/Auth/user/otp/verify`, data, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });
    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

export const login = async (data) => {
  try {
    const response = await apiClient.post(`/api/auth/user/login`, data, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });
    return response;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const getCurrentUser = async (token) => {
  try {
    const response = await apiClient.get(`/api/User/get-current-user`, {
      headers: {
        "Accept": "*/*",
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
};

export const logout = async (userId, token) => {
  try {
    const response = await apiClient.post(
      `/api/auth/user/logout`,
      userId, // Send userId as a plain string
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          Authorization: `Bearer ${token}`, // Add token
        },
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const formData = new FormData();
    formData.append('EmailOrPhoneNumber', email);
    const response = await apiClient.post(`/api/auth/user/password/forgot`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "*/*",
      },
    });
    return response;
  } catch (error) {
    console.error("Error sending OTP for password reset:", error);
    throw error;
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await apiClient.post(`/api/auth/user/password/reset`, data, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });
    return response;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};

export const uploadAvatar = async (userId, file, token) => {
  try {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('file', file);
    
    const response = await apiClient.post(`/api/user/upload-avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
};

export const editUserProfile = async (profileData, token) => {
  try {
    const formData = new FormData();
    formData.append('Id', profileData.Id);
    formData.append('UserName', profileData.UserName);
    formData.append('PhoneNumber', profileData.PhoneNumber);
    formData.append('DateOfBirth', profileData.DateOfBirth);

    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    const response = await apiClient.put(
      `/api/user/edit-user-profile`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Update error details:", {
      requestData: error.config?.data,
      responseData: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};