import axios from 'axios';

function resolveToken(): string {
  // Leemos los parametros de la URL del iframe
  const objParams = new URLSearchParams(window.location.search);
  // Devolvemos el token de la URL o el de entorno como respaldo
  return (
    objParams.get('token') ??
    import.meta.env.VITE_PM4_TOKEN ??
    ''
  );
}

// Creamos la instancia de axios apuntando al proxy del backend
const pm4 = axios.create({ baseURL: '/api' });

// Antes de cada peticion inyectamos el token en la cabecera
pm4.interceptors.request.use((config) => {
  const strToken = resolveToken();
  if (strToken) config.headers['x-pm4-token'] = strToken;
  return config;
});

export default pm4;
