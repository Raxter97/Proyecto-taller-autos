import axiosClient from './axiosClient';

export const authApi = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  registro: (userData) => axiosClient.post('/auth/registro', userData),
  recuperarPassword: (data) => axiosClient.post('/auth/recuperar-password', data),
  obtenerPerfil: () => axiosClient.get('/auth/me'),
  actualizarEmail: (data) => axiosClient.put('/auth/me/email', data),
  actualizarPassword: (data) => axiosClient.put('/auth/me/password', data),
  eliminarCuenta: () => axiosClient.delete('/auth/me/cuenta'),
};