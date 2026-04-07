import api from './api';

const processDates = (params) => {
    if (!params) return {};
    const p = { ...params };
    if (p.start_date) p.start_date = p.start_date.toISOString().split('T')[0];
    if (p.end_date) p.end_date = p.end_date.toISOString().split('T')[0];
    return p;
};

export const getSummary = async (filters, limit) => {
    const response = await api.get('/analytics/summary', {
        params: { ...processDates(filters), limit },
    });
    return response.data;
};

export const getDashboardStats = async (filters) => {
    const response = await api.get('/analytics/dashboard-stats', {
        params: processDates(filters),
    });
    return response.data;
};

export const getCharts = async (filters) => {
    const response = await api.get('/analytics/charts', {
        params: processDates(filters),
    });
    return response.data;
};

export const getFilters = async () => {
    const response = await api.get('/analytics/filters');
    return response.data;
};

export const downloadExcel = async (filters) => {
    const response = await api.get('/analytics/download/excel', {
        params: processDates(filters),
        responseType: 'blob', // Important for file downloads
    });
    return response.data;
};

export const emailReport = async (filters, email) => {
    const response = await api.post('/analytics/email-report', null, {
        params: { ...processDates(filters), email },
    });
    return response.data;
};

export default {
    getSummary,
    getDashboardStats,
    getCharts,
    getFilters,
    downloadExcel,
    emailReport,
};
