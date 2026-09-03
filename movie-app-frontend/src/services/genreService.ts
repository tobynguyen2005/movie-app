import api from './api';
import type { Genre } from '../types';

export const genreService = {
  getAll: async () => {
    const response = await api.get<Genre[]>('/genres');
    return response.data;
  },
  
  create: async (data: Omit<Genre, 'id'>) => {
    const response = await api.post<Genre>('/genres', data);
    return response.data;
  },
  
  update: async (id: number, data: Omit<Genre, 'id'>) => {
    const response = await api.put<Genre>(`/genres/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/genres/${id}`);
  }
};