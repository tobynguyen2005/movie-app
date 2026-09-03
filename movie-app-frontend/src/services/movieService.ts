import api from './api';
import type { Movie, PageResponse } from '../types';

type MoviePayload = Omit<Movie, 'id' | 'actors' | 'genres'> & { actorIds: number[], genreIds: number[] };

export const movieService = {
  getAll: async (params?: Record<string, any>) => {
    const response = await api.get<PageResponse<Movie>>('/movies', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Movie>(`/movies/${id}`);
    return response.data;
  },
  create: async (data: MoviePayload) => {
    const response = await api.post<Movie>('/movies', data);
    return response.data;
  },
  update: async (id: number, data: MoviePayload) => {
    const response = await api.put<Movie>(`/movies/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/movies/${id}`);
  }
};