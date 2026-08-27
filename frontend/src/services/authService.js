import api from './api';

const login = async (username, password) => {
    // FastAPI's OAuth2PasswordRequestForm expects form data
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/token', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        // You might also want to store user info if the API returns it
        localStorage.setItem('user_role', response.data.role || 'user');
    }
    return response.data;
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
};

const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

const getRole = () => {
    return localStorage.getItem('user_role');
};

const getCurrentUser = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch {
        return null;
    }
};

const updateProfile = async (userData) => {
    const response = await api.put('/auth/me', userData);
    return response.data;
};

export default {
    login,
    logout,
    isAuthenticated,
    getRole,
    getCurrentUser,
    updateProfile,
};
