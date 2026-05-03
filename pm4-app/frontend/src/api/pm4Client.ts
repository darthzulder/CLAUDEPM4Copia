import axios from 'axios';

function resolveToken(): string {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('token') ??
    import.meta.env.VITE_PM4_TOKEN ??
    ''
  );
}

const pm4 = axios.create({ baseURL: '/api' });

pm4.interceptors.request.use((config) => {
  const token = resolveToken();
  if (token) config.headers['x-pm4-token'] = token;
  return config;
});

export default pm4;
