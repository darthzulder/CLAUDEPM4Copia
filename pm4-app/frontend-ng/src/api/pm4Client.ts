/**
 * Cliente HTTP hacia el BFF. Equivalente Angular de `frontend/src/api/pm4Client.ts`.
 *
 * Contrato de la regla 3 de pm4-app/CLAUDE.md (arquitectura BFF), que este archivo hace
 * ejecutable: el frontend **solo** habla rutas **relativas** `/api/*`; el token PM4 nunca
 * sale de `backend/` más allá del header `x-pm4-token` que se inyecta acá. Ninguna pantalla
 * ni componente debe llamar a un host externo por su cuenta.
 *
 * En Angular no hay una "instancia de cliente" con `baseURL` como en axios: `HttpClient` es
 * el único cliente y la configuración transversal vive en interceptores. Por eso el
 * equivalente del `axios.create({ baseURL: '/api' })` es la constante `STR_BASE_API` + el
 * helper `urlApi()`, y el equivalente del `interceptors.request.use` es
 * `interceptorPm4Token`, registrado una vez en `app.config.ts`.
 */
import { HttpInterceptorFn } from '@angular/common/http';

/** Prefijo del proxy del BFF. Toda URL de PM4 se arma con `urlApi()`, nunca a mano. */
export const STR_BASE_API = '/api';

/**
 * Arma una URL del BFF a partir de una ruta de PM4.
 *
 * Acepta la ruta con o sin barra inicial (`tasks/1` y `/tasks/1` dan lo mismo) porque el
 * código portado desde React usa las dos formas indistintamente — axios normalizaba eso y
 * `HttpClient` no.
 */
export function urlApi(in_strRuta: string): string {
  return `${STR_BASE_API}/${in_strRuta.replace(/^\/+/, '')}`;
}

/**
 * Token PM4 de la sesión: query string del iframe primero, variable de entorno después.
 *
 * Ese orden es el contrato que ya tiene `core/useToken.ts` en React y **no** es arbitrario:
 * en producción PM4 genera la URL del iframe con `?token=`, y el fallback de entorno existe
 * solo para desarrollo local, donde no hay PM4 emitiendo la URL. Invertir el orden haría que
 * un `.env` olvidado pisara el token real de la tarea.
 *
 * Devuelve `''` (no `null`) cuando no hay ninguno, para que el interceptor pueda decidir con
 * un simple truthy check y no inyectar un header vacío.
 */
export function resolverToken(): string {
  const objParams = new URLSearchParams(window.location.search);
  return objParams.get('token') ?? '';
}

/**
 * Inyecta `x-pm4-token` **solo** en peticiones a rutas relativas `/api/*`.
 *
 * El filtro por prefijo no es defensa en profundidad decorativa: un interceptor global se
 * aplica a *toda* petición que salga por `HttpClient`, así que sin él un `GET` a un host de
 * terceros (p. ej. el `recaptcha/api.js` que la Fase 4 tiene que cargar) se llevaría el
 * token de PM4 en un header hacia afuera. Es exactamente el modo de falla que la regla 3
 * existe para prevenir.
 */
export const interceptorPm4Token: HttpInterceptorFn = (in_objReq, in_fnNext) => {
  if (!in_objReq.url.startsWith(`${STR_BASE_API}/`)) return in_fnNext(in_objReq);

  const strToken = resolverToken();
  if (!strToken) return in_fnNext(in_objReq);

  return in_fnNext(
    in_objReq.clone({ setHeaders: { 'x-pm4-token': strToken } }),
  );
};
