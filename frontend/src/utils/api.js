import axios from 'axios';
import store from '@/redux/store';

const api = axios.create({
  baseURL: 'http://localhost:8888',
});

api.interceptors.request.use((config) => {
  const token = store.getState()?.auth?.result?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default api;
