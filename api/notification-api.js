import apiClient from "./url-api";

// GET: /api/notification/view-notifications-by-user-id
export const viewNotificationsByUserId = async (userId, token) => {
  try {
    const response = await apiClient.get("/api/notification/view-notifications-by-user-id", {
      params: { userId },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
    });
    console.log("View notifications by user ID response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching notifications by user ID:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// GET: /api/notification/view-notification-by-id
export const viewNotificationById = async (notificationId, token) => {
  try {
    const response = await apiClient.get("/api/notification/view-notification-by-id", {
      params: { notificationId },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
    });
    console.log("View notification by ID response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching notification by ID:",
      error.response?.data || error.message
    );
    throw error;
  }
};
export const markNotificationAsRead = async (notificationId, token) => {
  try {
    const response = await apiClient.put("/api/notification/mark-notification-as-read", null, {
      params: { notificationId },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
    });
    console.log("Mark notification as read response:", response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`Error marking notification ${notificationId} as read:`, errorMessage);
    throw new Error(`Failed to mark notification as read: ${errorMessage}`);
  }
};

export const deleteNotification = async (notificationId, token) => {
  try {
    const response = await apiClient.delete("/api/notification/delete-notification", {
      params: { notificationId },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/plain",
      },
    });
    console.log("Delete notification response:", response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`Error deleting notification ${notificationId}:`, errorMessage);
    throw new Error(`Failed to delete notification: ${errorMessage}`);
  }
};