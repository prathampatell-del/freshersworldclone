import api from './client';
import { User, Company, Application, Course, JobAlert } from '../types';

export { jobsApi } from './jobs';

export const authApi = {
  register: (data: { email: string; password: string; name: string; role?: string; phone?: string; location?: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<User>('/auth/me'),
};

export const companiesApi = {
  list: (params?: { q?: string; industry?: string; page?: number; limit?: number }) =>
    api.get<{ companies: Company[]; total: number; page: number; pages: number }>('/companies', { params }),

  get: (id: number | string) =>
    api.get<{ company: Company; jobs: any[]; reviews: any[] }>(`/companies/${id}`),

  create: (data: Partial<Company>) =>
    api.post<{ id: number }>('/companies', data),

  update: (id: number, data: Partial<Company>) =>
    api.put(`/companies/${id}`, data),

  addReview: (id: number, data: { rating: number; title?: string; review?: string; pros?: string; cons?: string }) =>
    api.post(`/companies/${id}/reviews`, data),
};

export const applicationsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; job_id?: number }) =>
    api.get<{ applications: Application[]; total: number; page: number; pages: number }>('/applications', { params }),

  updateStatus: (id: number, status: string) =>
    api.put(`/applications/${id}/status`, { status }),
};

export const usersApi = {
  me: () => api.get<User>('/users/me'),

  update: (data: Partial<User>) =>
    api.put('/users/me', data),

  bookmarks: (params?: { page?: number; limit?: number }) =>
    api.get<{ bookmarks: any[]; total: number; page: number; pages: number }>('/users/me/bookmarks', { params }),

  alerts: () => api.get<JobAlert[]>('/users/me/alerts'),

  createAlert: (data: { keywords?: string; location?: string; category?: string; job_type?: string; frequency?: string }) =>
    api.post<{ id: number }>('/users/me/alerts', data),

  deleteAlert: (id: number) =>
    api.delete(`/users/me/alerts/${id}`),
};

export const coursesApi = {
  list: (params?: { q?: string; category?: string; free?: boolean; featured?: boolean; page?: number; limit?: number }) =>
    api.get<{ courses: Course[]; total: number; page: number; pages: number }>('/courses', { params }),

  get: (id: number | string) =>
    api.get<Course>(`/courses/${id}`),
};
