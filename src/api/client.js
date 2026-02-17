import axios from 'axios';

// Backend URL: production always uses Railway (no env override); dev uses localhost or VITE_API_URL.
const RAILWAY_BACKEND = 'https://backend-production-e79a.up.railway.app';
const baseURL = import.meta.env.PROD
  ? RAILWAY_BACKEND
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

const api = axios.create({ baseURL });

// Export for building image URLs (e.g. backend + /uploads/xxx) so card images load from Railway.
export const getBackendBaseUrl = () => (typeof baseURL === 'string' ? baseURL.replace(/\/$/, '') : '');

// Debug: log effective API base URL (open DevTools Console to verify production hits Railway).
if (typeof console !== 'undefined') {
  console.log('[API] baseURL:', baseURL, '| PROD:', !!import.meta.env.PROD);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const fullUrl = (config.baseURL || '') + (config.url || '');
  console.log('[API] Request:', config.method?.toUpperCase(), fullUrl);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = (err.config?.baseURL || '') + (err.config?.url || '');
    const msg = err.response?.data?.message || err.message;
    console.error('[API] Error:', status || 'NETWORK', url, msg);
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
