import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitudes: Inyecta el token Bearer automáticamente si existe
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas: Maneja errores globales y expiración de token
axiosClient.interceptors.response.use(
  (response) => response.data, // Retorna directamente los datos del servidor
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      const message = error.response.data?.mensaje || 'Error en la petición del servidor';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(new Error('Error de red o el servidor no responde'));
  }
);

export default axiosClient;