import axiosClient from './axiosClient';

export const informesApi = {
  obtenerTodos: () => axiosClient.get('/informes'), 
  crear: (data) => axiosClient.post('/informes', data),
  imputarRepuesto: (id_informe, data) => axiosClient.post(`/informes/${id_informe}/repuestos`, data),
  imputarServicio: (id_informe, data) => axiosClient.post(`/informes/${id_informe}/servicios`, data),
  finalizar: (id_informe) => axiosClient.put(`/informes/${id_informe}/finalizar`),
};