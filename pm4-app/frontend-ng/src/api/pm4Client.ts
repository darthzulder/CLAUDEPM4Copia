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
import { inject } from '@angular/core';
import { Pm4ContextService } from '../core/pm4-context.service';

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
 *
 * **Delega en `Pm4ContextService`, no reimplementa la resolución.** Cuando este archivo se
 * escribió (Fase 1) el servicio no existía todavía y la función leía **solo** la query string,
 * así que el fallback de entorno que este mismo comentario describía no ocurría: el docstring
 * documentaba un contrato que el código no cumplía.
 *
 * El servicio entra **por parámetro**, no con un `new` interno ni con `inject()` acá: un
 * `HttpInterceptorFn` corre en contexto de inyección, así que el interceptor lo obtiene con
 * `inject()` y lo pasa. Con un `new`, el servicio no resolvería su token `PM4_ENV_FALLBACKS` (usaría
 * el `factory` que lee el archivo generado) y un spec no tendría forma de sustituir el entorno sin
 * manosear el prototipo — el builder de Angular 21 prohíbe `vi.mock` sobre imports relativos, así que
 * esa era la única alternativa. Recibirlo por parámetro deja la función testeable sin trucos.
 */
export function resolverToken(in_objCtx: Pm4ContextService): string {
  return in_objCtx.token();
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

  // El `inject()` va DESPUÉS del filtro por prefijo a propósito: un interceptor corre en contexto de
  // inyección, así que esto es válido, pero pedir el servicio solo cuando la petición es del BFF
  // evita trabajo en las que no lo son.
  const strToken = resolverToken(inject(Pm4ContextService));
  if (!strToken) return in_fnNext(in_objReq);

  return in_fnNext(
    in_objReq.clone({ setHeaders: { 'x-pm4-token': strToken } }),
  );
};
