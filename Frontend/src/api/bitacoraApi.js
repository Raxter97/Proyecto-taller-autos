import axiosClient from './axiosClient';

export const bitacoraApi = {
  consultar: () => axiosClient.get('/bitacora'),
};