import api from './api';
import type { Actor, PageResponse } from '../types';

export const actorService = {
  getAll: async (params?: Record<string, any>) => {
    const response = await api.get<PageResponse<Actor>>('/actors', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get<Actor>(`/actors/${id}`);
    return response.data;
  },

  create: async (data: Omit<Actor, 'id'>) => {
    const response = await api.post<Actor>('/actors', data);
    return response.data;
  },
  
  update: async (id: number, data: Omit<Actor, 'id'>) => {
    const response = await api.put<Actor>(`/actors/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/actors/${id}`);
  }
};