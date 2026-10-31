import axiosClient from './axiosClient';

export const parkingApi = {
  consultar: () => axiosClient.get('/parking'),
  ingreso: (data) => axiosClient.post('/parking/ingreso', data),
  salida: (nro_lugar) => axiosClient.put(`/parking/salida/${nro_lugar}`),
};