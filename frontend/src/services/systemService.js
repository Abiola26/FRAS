import api from './api';

// Audit Logs
export const getAuditLogs = async (skip = 0, limit = 50, filters = {}) => {
    const response = await api.get('/audit/', {
        params: { skip, limit, ...filters }
    });
    return response.data;
};

// System Settings
export const getSettings = async () => {
    const response = await api.get('/settings/');
    return response.data;
};

export const updateSetting = async (key, data) => {
    const response = await api.put(`/settings/${key}`, data);
    return response.data;
};

export const deleteSetting = async (key) => {
    const response = await api.delete(`/settings/${key}`);
    return response.data;
};

export default {
    getAuditLogs,
    getSettings,
    updateSetting,
    deleteSetting,
};
