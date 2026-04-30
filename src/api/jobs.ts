import api from './client';
import { Job } from '../types';

export interface JobFilters {
  q?: string;
  location?: string;
  type?: string;
  category?: string;
  salary_min?: number;
  salary_max?: number;
  experience?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export const jobsApi = {
  list: (filters: JobFilters = {}) =>
    api.get<{ jobs: Job[]; total: number; page: number; pages: number }>('/jobs', { params: filters }),

  get: (id: number | string) =>
    api.get<{ job: Job; similar: Job[] }>(`/jobs/${id}`),

  create: (data: Partial<Job>) =>
    api.post<{ id: number }>('/jobs', data),

  update: (id: number, data: Partial<Job>) =>
    api.put(`/jobs/${id}`, data),

  delete: (id: number) =>
    api.delete(`/jobs/${id}`),

  apply: (id: number, cover_letter?: string) =>
    api.post<{ id: number }>(`/jobs/${id}/apply`, { cover_letter }),

  bookmark: (id: number) =>
    api.post<{ bookmarked: boolean }>(`/jobs/${id}/bookmark`),

  categories: () =>
    api.get<{ category: string; count: number }[]>('/jobs/categories'),
};
