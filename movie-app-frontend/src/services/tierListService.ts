import api from './api';
import type { MovieTier, MovieTierEntry, TierListMovieOption } from '../types';

export interface TierListOrderItem {
  id: number;
  tier: MovieTier;
  position: number;
}

export const tierListService = {
  getAll: async () => {
    const response = await api.get<MovieTierEntry[]>('/tier-list');
    return response.data;
  },

  getAvailableMovies: async (keyword?: string) => {
    const response = await api.get<TierListMovieOption[]>('/tier-list/available-movies', {
      params: keyword?.trim() ? { keyword: keyword.trim() } : undefined,
    });
    return response.data;
  },

  add: async (movieId: number, tier: MovieTier) => {
    const response = await api.post<MovieTierEntry>('/tier-list', { movieId, tier });
    return response.data;
  },

  reorder: async (items: TierListOrderItem[]) => {
    const response = await api.put<MovieTierEntry[]>('/tier-list/reorder', items);
    return response.data;
  },

  remove: async (id: number) => {
    await api.delete(`/tier-list/${id}`);
  },

  clear: async () => {
    await api.delete('/tier-list');
  },
};
