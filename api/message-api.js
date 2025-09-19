import apiClient from './url-api';

// Fetch chat thread by user ID from the API
export const getChatThreadByUserId = async (userId, token) => {
  try {
    const response = await apiClient.get(
      `/api/message/get-chat-thread-by-user-id/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching chat thread:', error.message);
    throw error;
  }
};

// Fetch chat thread by thread ID from the API
export const getChatThreadById = async (threadId, token) => {
  try {
    const response = await apiClient.get(
      `/api/message/get-chat-thread-by-id/${threadId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching chat thread by id:', error.message);
    throw error;
  }
};

// Send a message to the API
export const sendMessage = async (messageData, token) => {
  try {
    const response = await apiClient.post(
      '/api/message/send-message',
      messageData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.message);
    throw error;
  }
};

// Start a new chat thread
export const startChatThread = async (threadData, token) => {
  try {
    const response = await apiClient.post(
      '/api/message/start-thread',
      threadData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error starting chat thread:', error.message);
    throw error;
  }
};

// Soft delete a message by message ID
export const softDeleteMessage = async (messageId, token) => {
  try {
    const response = await apiClient.delete(
      `/api/message/soft-delete-message/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error soft deleting message:', error.message);
    throw error;
  }
};

// Soft delete a chat thread by thread ID
export const softDeleteChatThread = async (threadId, token) => {
  try {
    const response = await apiClient.delete(
      `/api/message/soft-delete-chat-thread/${threadId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error soft deleting chat thread:', error.message);
    throw error;
  }
};