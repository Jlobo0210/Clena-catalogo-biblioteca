import axios from 'axios';

const env = import.meta as ImportMeta & {
  env: {
    VITE_API_BASE_URL?: string;
  };
};

export const apiClient = axios.create({
  baseURL: env.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});
