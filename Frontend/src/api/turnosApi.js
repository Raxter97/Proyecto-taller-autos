import axiosClient from './axiosClient';

export const turnosApi = {
  obtenerTodos: () => axiosClient.get('/turnos'),
  agendar: (data) => axiosClient.post('/turnos', data),
  reprogramar: (id, data) => axiosClient.put(`/turnos/${id}`, data),
  cancelar: (id) => axiosClient.put(`/turnos/${id}/cancelar`),
  obtenerMisTurnos: async () => {
        const response = await axiosClient.get('/turnos/mis-turnos');
        return response.data;
    }
};