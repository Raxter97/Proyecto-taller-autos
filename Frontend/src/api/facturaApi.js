import axiosClient from './axiosClient';

export const facturasApi = {
  generar: (data) => axiosClient.post('/facturas', data),
  registrarPago: (id_factura, data) => axiosClient.put(`/facturas/${id_factura}/pagar`, data),
};