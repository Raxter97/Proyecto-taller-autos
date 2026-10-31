import axiosClient from './axiosClient';

export const autosApi = {
  crear: (data) => axiosClient.post('/autos', data),
  actualizar: (id, data) => axiosClient.put(`/autos/${id}`, data),
  consultarHistorial: (patente) => axiosClient.get(`/autos/historial/${patente}`),
  obtenerMisAutos: () => axiosClient.get('/autos/mis-autos'),
};