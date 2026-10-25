import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', timeout: 90000, headers: { 'Content-Type': 'application/json' } });
const unwrap = (request) => request.then(({ data }) => data);
export const createMystery = (payload) => unwrap(api.post('/cases', payload));
export const getCase = (id) => unwrap(api.get(`/cases/${id}`));
export const discoverClue = (id, clueId) => unwrap(api.post(`/cases/${id}/clues/${clueId}/discover`));
export const requestHint = (id) => unwrap(api.post(`/cases/${id}/hints`));
export const accuse = (id, suspectId) => unwrap(api.post(`/cases/${id}/accuse`, { suspectId }));
export const getResult = (id) => unwrap(api.get(`/cases/${id}/result`));
export function errorMessage(error) { return error.response?.data?.error?.message || 'The case file could not be reached. Check your connection and try again.'; }
