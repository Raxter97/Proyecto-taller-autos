import axiosClient from './axiosClient';

export const userApi = {
  listarUsuarios: () => axiosClient.get('/user'),
  registrarCuenta: (data) => axiosClient.post('/user', data),
  modificarCuenta: (id, data) => axiosClient.put(`/user/${id}`, data),
  desactivarCuenta: (id) => axiosClient.delete(`/user/${id}`),
};