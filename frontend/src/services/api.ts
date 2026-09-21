import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SERVER_URL = 'https://clinic-appointment-app-production-da2b.up.railway.app';
const API_BASE_URL = `${SERVER_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;