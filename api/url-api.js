import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.nestlycare.live',
  timeout: 40000,
});

export default apiClient;