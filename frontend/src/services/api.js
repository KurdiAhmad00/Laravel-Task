import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set Content-Type only for non-FormData requests
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/register', userData),
  login: (credentials) => api.post('/login', credentials),
  logout: () => api.post('/logout'),
};

// Incident API calls
export const incidentAPI = {
  // Citizen endpoints
  getMyIncidents: (page = 1, perPage = 10) => api.get(`/my-incidents?page=${page}&per_page=${perPage}`),
  createIncident: (incidentData) => api.post('/incidents', incidentData),
  getIncident: (id) => api.get(`/incidents/${id}`),
  updateIncident: (id, data) => api.put(`/incidents/${id}`, data),
  deleteIncident: (id) => api.delete(`/incidents/${id}`),
  deleteAllIncidents: () => api.delete('/my-incidents'),
  
  // Operator endpoints
  getAllIncidents: (page = 1, perPage = 10) => api.get(`/incidents?page=${page}&per_page=${perPage}`),
  getIncident: (id) => api.get(`/incidents/${id}`),
  assignIncident: (id, agentId) => api.post(`/incidents/${id}/assign`, { agent_id: agentId }),
  updatePriority: (id, priority) => api.post(`/incidents/${id}/priority`, { priority }),
  
  // Agent endpoints
  getAssignedIncidents: (page = 1, perPage = 10) => api.get(`/assigned-incidents?page=${page}&per_page=${perPage}`),
  updateStatus: (id, status) => api.post(`/incidents/${id}/status`, { status }),
  addNote: (id, note) => api.post(`/incidents/${id}/notes`, { body: note }),
  
  // File attachments
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/incidents/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getAttachments: (id) => api.get(`/incidents/${id}/attachments`),
  deleteAttachment: (attachmentId) => api.delete(`/attachments/${attachmentId}`),
};

// Admin API calls
export const adminAPI = {
  getUsers: () => api.get('/users'),
  getAgents: () => api.get('/agents'),
  getAllIncidents: () => api.get('/incidents'),
  updateUserRole: (userId, role) => api.put(`/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  deleteUserWithCascade: (userId) => api.delete(`/users/${userId}/cascade`),
  getAuditLogs: (page = 1, filters = {}) => api.get('/audit-logs', { 
    params: { page, ...filters } 
  }),
  getIncidentAuditLogs: (incidentId) => api.get(`/audit-logs/${incidentId}`),
  getCategories: () => api.get('/categories'),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Get Categories API calls
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getCategories: () => api.get('/categories'), // Alias for consistency
};

// Import CSV API calls
export const importCSVAPI = {
  importCSV: (csvFile) => {
    const formData = new FormData();
    formData.append('csv_file', csvFile);
    return api.post('/incidents/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // getImportResults: () => api.get('/incidents/import-csv/results'),
};

export default api;
