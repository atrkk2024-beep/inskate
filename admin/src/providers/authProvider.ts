import { AuthProvider } from 'react-admin';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const { data } = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('admin', JSON.stringify(data.admin));
    return Promise.resolve();
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    return Promise.resolve();
  },

  checkAuth: () => {
    return localStorage.getItem('token')
      ? Promise.resolve()
      : Promise.reject();
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: () => {
    const admin = localStorage.getItem('admin');
    if (admin) {
      const { id, name, email } = JSON.parse(admin);
      return Promise.resolve({
        id,
        fullName: name,
        avatar: undefined,
      });
    }
    return Promise.reject();
  },

  getPermissions: () => {
    return Promise.resolve(['admin']);
  },
};

