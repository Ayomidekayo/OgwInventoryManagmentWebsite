import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ogwbackend.vercel.app/api', // Update with your backend URL
  // you can also set default headers here if needed
});

// Request interceptor: attach token if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;
