import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
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
  getMyIncidents: () => api.get('/my-incidents'),
  createIncident: (incidentData) => api.post('/incidents', incidentData),
  getIncident: (id) => api.get(`/incidents/${id}`),
  updateIncident: (id, data) => api.put(`/incidents/${id}`, data),
  deleteIncident: (id) => api.delete(`/incidents/${id}`),
  
  // Operator endpoints
  getAllIncidents: () => api.get('/incidents'),
  assignIncident: (id, agentId) => api.post(`/incidents/${id}/assign`, { agent_id: agentId }),
  updatePriority: (id, priority) => api.post(`/incidents/${id}/priority`, { priority }),
  
  // Agent endpoints
  getAssignedIncidents: () => api.get('/assigned-incidents'),
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
  updateUserRole: (userId, role) => api.put(`/users/${userId}/role`, { role }),
  getCategories: () => api.get('/categories'),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  getAuditLogs: () => api.get('/audit-logs'),
  getIncidentAuditLogs: (incidentId) => api.get(`/audit-logs/${incidentId}`),
};

export default api;
