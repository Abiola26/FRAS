import api from './api';

const processDates = (params) => {
    const p = { ...params };
    if (p.start_date) p.start_date = p.start_date.toISOString().split('T')[0];
    if (p.end_date) p.end_date = p.end_date.toISOString().split('T')[0];
    return p;
};

export const getRecords = async (skip = 0, limit = 50) => {
    const response = await api.get('/fleet/', { params: { skip, limit } });
    return response.data;
};

export const getRecord = async (id) => {
    const response = await api.get(`/fleet/${id}`);
    return response.data;
};

export const createRecord = async (data) => {
    const response = await api.post('/fleet/', data);
    return response.data;
};

export const updateRecord = async (id, data) => {
    const response = await api.put(`/fleet/${id}`, data);
    return response.data;
};

export const deleteRecord = async (id) => {
    const response = await api.delete(`/fleet/${id}`);
    return response.data;
};

export const deleteRecordsBatch = async (filters) => {
    const response = await api.delete('/fleet/batch', {
        params: processDates(filters)
    });
    return response.data;
};

export default {
    getRecords,
    getRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    deleteRecordsBatch,
};
