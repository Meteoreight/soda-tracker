import axios from 'axios';

// Dynamically determine API URL based on current host
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Use current host but port 8000 for API
  const currentHost = window.location.hostname;
  return `http://${currentHost}:8000`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Consumption Logs API
export const logsApi = {
  getAll: (skip = 0, limit = 100) => api.get(`/logs?skip=${skip}&limit=${limit}`),
  getById: (id) => api.get(`/logs/${id}`),
  create: (data) => api.post('/logs', data),
  update: (id, data) => api.put(`/logs/${id}`, data),
  delete: (id) => api.delete(`/logs/${id}`),
};

// Cylinders API
export const cylindersApi = {
  getAll: () => api.get('/cylinders'),
  getById: (id) => api.get(`/cylinders/${id}`),
  create: (data) => api.post('/cylinders', data),
  update: (id, data) => api.put(`/cylinders/${id}`, data),
  delete: (id) => api.delete(`/cylinders/${id}`),
  changeActive: (cylinderId) => api.post(`/cylinders/change-active?new_cylinder_id=${cylinderId}`),
  getDateRange: (id) => api.get(`/cylinders/${id}/date-range`),
  getTotalPushes: (id) => api.get(`/cylinders/${id}/total-pushes`),
};

// Analytics API
export const analyticsApi = {
  getAnalytics: (period = '30d') => api.get(`/analytics?period=${period}`),
  getDashboardSummary: () => api.get('/analytics/dashboard'),
};

// Settings API
export const settingsApi = {
  getAll: () => api.get('/settings'),
  getBySetting: (key) => api.get(`/settings/${key}`),
  create: (data) => api.post('/settings', data),
  update: (key, data) => api.put(`/settings/${key}`, data),
  delete: (key) => api.delete(`/settings/${key}`),
  getRetailPrice: () => api.get('/settings/retail-price/current'),
  updateRetailPrice: (price) => api.put(`/settings/retail-price/current?price=${price}`),
  getInitialCost: () => api.get('/settings/initial-cost/current'),
  updateInitialCost: (cost) => api.put(`/settings/initial-cost/current?cost=${cost}`),
  getDefaultPushes1L: () => api.get('/settings/default-pushes-1l/current'),
  updateDefaultPushes1L: (pushes) => api.put(`/settings/default-pushes-1l/current?pushes=${pushes}`),
  getDefaultPushes05L: () => api.get('/settings/default-pushes-05l/current'),
  updateDefaultPushes05L: (pushes) => api.put(`/settings/default-pushes-05l/current?pushes=${pushes}`),
};

// Data Import/Export API
export const dataApi = {
  importCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/data/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  exportCsv: () => api.get('/data/export', { responseType: 'blob' }),
  getSampleCsv: () => api.get('/data/sample-csv', { responseType: 'blob' }),
};

export default api;