import axiosClient from './axiosClient';

export const facturasApi = {
  obtenerTodas: () => axiosClient.get('/facturas'),
  obtenerPorAuto: (id_auto) => axiosClient.get(`/facturas/auto/${id_auto}`),
  obtenerPorCliente: (id_cliente) => axiosClient.get(`/facturas/cliente/${id_cliente}`),
  generar: (data) => axiosClient.post('/facturas', data),
  registrarPago: (id_factura, data) => axiosClient.put(`/facturas/${id_factura}/pagar`, data),
};