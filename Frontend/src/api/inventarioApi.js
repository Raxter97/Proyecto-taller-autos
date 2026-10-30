import axiosClient from './axiosClient';

export const inventarioApi = {
  // Ahora permite enviar ?page=X&limit=Y
  obtenerRepuestos: (page = 1, limit = 10) => axiosClient.get(`/inventario/repuestos?page=${page}&limit=${limit}`),
  crearRepuesto: (data) => axiosClient.post('/inventario/repuestos', data),
  actualizarRepuesto: (id, data) => axiosClient.put(`/inventario/repuestos/${id}`, data),
  bajaRepuesto: (id) => axiosClient.delete(`/inventario/repuestos/${id}`),
  
  obtenerProveedores: () => axiosClient.get('/inventario/proveedores'),
  crearProveedor: (data) => axiosClient.post('/inventario/proveedores', data),
  actualizarProveedor: (id, data) => axiosClient.put(`/inventario/proveedores/${id}`, data),
  bajaProveedor: (id) => axiosClient.delete(`/inventario/proveedores/${id}`),

  registrarOrdenCompra: (data) => axiosClient.post('/inventario/compras', data),
  confirmarRecepcion: (id_compra) => axiosClient.put(`/inventario/compras/${id_compra}/recibir`),
};