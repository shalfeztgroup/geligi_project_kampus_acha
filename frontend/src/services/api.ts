import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.error || error.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: { email: string; password: string; name?: string }) =>
    api.post('/auth/register', userData),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  updateProfile: (profileData: { name?: string; avatar?: string }) =>
    api.put('/auth/profile', profileData),
  
  refreshToken: () =>
    api.post('/auth/refresh'),
  
  logout: () =>
    api.post('/auth/logout'),
};

// Integration API
export const integrationAPI = {
  getIntegrations: () =>
    api.get('/integrations'),
  
  getIntegration: (id: string) =>
    api.get(`/integrations/${id}`),
  
  createIntegration: (data: any) =>
    api.post('/integrations', data),
  
  updateIntegration: (id: string, data: any) =>
    api.put(`/integrations/${id}`, data),
  
  deleteIntegration: (id: string) =>
    api.delete(`/integrations/${id}`),
  
  testIntegration: (id: string) =>
    api.post(`/integrations/${id}/test`),
  
  syncIntegration: (id: string, direction?: string) =>
    api.post(`/integrations/${id}/sync`, { direction }),
  
  getIntegrationStats: () =>
    api.get('/integrations/stats/overview'),
  
  getAvailableTypes: () =>
    api.get('/integrations/types/available'),
};

// Webhook API
export const webhookAPI = {
  getWebhooks: (params?: any) =>
    api.get('/webhooks', { params }),
  
  getWebhookStats: () =>
    api.get('/webhooks/stats'),
  
  retryFailedWebhooks: () =>
    api.post('/webhooks/retry'),
  
  deleteOldWebhooks: (daysOld?: number) =>
    api.delete('/webhooks/cleanup', { data: { daysOld } }),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () =>
    api.get('/dashboard/overview'),
  
  getSyncLogs: (params?: any) =>
    api.get('/dashboard/sync-logs', { params }),
  
  getWebhookLogs: (params?: any) =>
    api.get('/dashboard/webhook-logs', { params }),
  
  getActivity: (params?: any) =>
    api.get('/dashboard/activity', { params }),
  
  getMetrics: (params?: any) =>
    api.get('/dashboard/metrics', { params }),
};

export default api;
