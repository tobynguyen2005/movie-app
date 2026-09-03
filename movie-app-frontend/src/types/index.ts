export type MovieStatus = 'PLAN_TO_WATCH' | 'WATCHING' | 'COMPLETED' | 'DROPPED';
export type ActorGender = 'MALE' | 'FEMALE';

export interface Genre {
  id: number;
  name: string;
}

export interface Actor {
  id: number;
  fullName: string;
  dob: string;
  country: string;
  gender: ActorGender;
  avatarUrl: string;
}

export interface Movie {
  id: number;
  title: string;
  releaseYear: number;
  totalEpisodes: number;
  country: string;
  posterUrl: string;
  description: string;
  status: MovieStatus;
  actors: Actor[];
  genres: Genre[];
}

export interface PageResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}