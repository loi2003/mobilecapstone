// aiadvise-api.jsx
import apiClient from './url-api'; // Adjust the import path based on your project structure

// Fetch AI chat response from the API
export const getAIChatResponse = async (query) => {
  try {
    const response = await apiClient.get('/api/AIChat/chat', {
      params: { query },
      headers: {
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI chat response:', error.message);
    throw error;
  }
};