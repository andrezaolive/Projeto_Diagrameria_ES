import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('diagrameria_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento padronizado conforme o contrato: { erro: { codigo, mensagem } }
    if (error.response?.status === 401) {
      localStorage.removeItem('diagrameria_token');
    }
    return Promise.reject(error.response?.data?.erro || error);
  }
);