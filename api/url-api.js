import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.nestlycare.live',
  timeout: 20000,
});

export default apiClient;