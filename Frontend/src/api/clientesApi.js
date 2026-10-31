import axiosClient from './axiosClient';

export const clientesApi = {
  obtenerTodos: (page = 1, limit = 50) => axiosClient.get(`/clientes?page=${page}&limit=${limit}`),
  crear: (data) => axiosClient.post('/clientes', data),
  actualizar: (id, data) => axiosClient.put(`/clientes/${id}`, data),
  desactivar: (id) => axiosClient.delete(`/clientes/${id}`),
};