import axios from 'axios';
import { useToken } from '../core/useToken';

// Creamos la instancia de axios apuntando al proxy del backend
const pm4 = axios.create({ baseURL: '/api' });

// Antes de cada peticion inyectamos el token en la cabecera
pm4.interceptors.request.use((config) => {
  const strToken = useToken();
  if (strToken) config.headers['x-pm4-token'] = strToken;
  return config;
});

export default pm4;
