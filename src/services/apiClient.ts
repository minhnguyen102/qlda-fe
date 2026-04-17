import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Network error';

    if (status === 401 && !location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      location.href = '/login';
    }
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
