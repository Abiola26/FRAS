import axios from 'axios';

// Default to localhost:8000 if env var not set
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle 401 (Unauthorized) and 503 (maintenance mode)
api.interceptors.response.use(
    (response) => {
        if (window.sessionStorage.getItem('maintenance')) {
            window.sessionStorage.removeItem('maintenance');
            window.dispatchEvent(new CustomEvent('fras:maintenance', { detail: false }));
        }
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Only redirect if not already on login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        if (error.response && error.response.status === 503) {
            // Maintenance mode — surface a global banner via MainLayout
            window.sessionStorage.setItem('maintenance', '1');
            window.dispatchEvent(new CustomEvent('fras:maintenance', { detail: true }));
        }
        return Promise.reject(error);
    }
);

export default api;
