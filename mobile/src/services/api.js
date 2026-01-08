import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/api';

// Create axios instance
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('authToken');
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
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, clear storage
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (username, password) => {
        // Backend uses OAuth2PasswordRequestForm which expects x-www-form-urlencoded
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/token', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const token = response.data.access_token;

        // After login, fetch user info
        const userResponse = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        return {
            token: token,
            user: userResponse.data
        };
    },
    register: async (username, password, email = null) => {
        const response = await api.post('/auth/signup', {
            username,
            password,
            email
        });
        return response.data;
    },
    logout: async () => {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
    },
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    changePassword: async (currentPassword, newPassword) => {
        const response = await api.post('/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
        });
        return response.data;
    },
    updateProfile: async (userData) => {
        const response = await api.put('/auth/me', userData);
        return response.data;
    },
    requestPasswordReset: async (email) => {
        const response = await api.post('/auth/password-reset-request', { email });
        return response.data;
    },
    confirmPasswordReset: async (token, newPassword) => {
        const response = await api.post('/auth/password-reset-confirm', {
            token,
            new_password: newPassword
        });
        return response.data;
    },
};

// Dashboard API
export const dashboardAPI = {
    getKPIs: async (filters = {}) => {
        const response = await api.get('/analytics/dashboard-stats', { params: filters });
        const data = response.data;
        return {
            totalRecords: data.total_records || 0,
            totalRevenue: data.total_revenue || 0,
            predictedRevenue: data.predicted_revenue || 0,
            topFleet: data.top_performing_fleet || 'N/A',
            averageTrip: data.average_trip_revenue || 0
        };
    },
};

// Reports API
export const reportsAPI = {
    getReports: async (filters = {}) => {
        // Using summary endpoint which has daily_subtotals
        const response = await api.get('/analytics/summary', { params: filters });
        const data = response.data;

        // Transform daily_subtotals into items reports screen expects
        const transformed = (data.daily_subtotals || []).map(item => ({
            bus_code: item.fleet,
            date: item.date,
            pax: item.pax,
            revenue: item.daily_total,
            remittance: 0 // Calculate if needed or use from fleet_summaries
        }));

        return {
            reports: transformed
        };
    },
    exportExcel: async (filters = {}) => {
        const response = await api.get('/analytics/download/excel', {
            params: filters,
            responseType: 'blob',
        });
        return response.data;
    },
};

// Analytics API
export const analyticsAPI = {
    getChartData: async (filters = {}) => {
        const response = await api.get('/analytics/charts', { params: filters });
        const data = response.data;

        // Transform ChartResponse into format ChartKit expects
        const revenueTrend = {
            labels: (data.revenue_trend || []).slice(-6).map(d => d.label.split('-').slice(1).join('/')),
            datasets: [{
                data: (data.revenue_trend || []).slice(-6).map(d => d.value)
            }]
        };

        const fleetPerformance = {
            labels: (data.top_fleets || []).slice(0, 5).map(d => d.label),
            datasets: [{
                data: (data.top_fleets || []).slice(0, 5).map(d => d.value)
            }]
        };

        return {
            revenueTrend,
            fleetPerformance,
            raw: data
        };
    },
};

// Upload API
export const uploadAPI = {
    uploadFile: async (formData) => {
        const response = await api.post('/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// Audit Logs API
export const auditAPI = {
    getLogs: async (filters = {}) => {
        // Prefix is /audit
        const response = await api.get('/audit', { params: filters });
        return {
            logs: response.data
        };
    },
};

// Fleet API
export const fleetAPI = {
    getFleets: async () => {
        const response = await api.get('/analytics/filters');
        return response.data.fleets || [];
    },
};

// Notifications API
export const notificationAPI = {
    getNotifications: async () => {
        const response = await api.get('/notifications/');
        return response.data;
    },
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },
    markAsRead: async (id) => {
        const response = await api.post(`/notifications/${id}/read`);
        return response.data;
    }
};

export default api;
