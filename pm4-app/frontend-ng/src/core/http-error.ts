import { HttpErrorResponse } from '@angular/common/http';

/**
 * Saca el mensaje que la pantalla debe mostrar, priorizando el que manda PM4 sobre el genérico del
 * transporte.
 *
 * El orden es el mismo que tenía React con axios (`error.response?.data?.message ?? error.message`) y
 * la razón es que el genérico de HTTP no dice nada útil: `"Http failure response for /api/tasks/55:
 * 404 Not Found"` frente a `"Task no encontrada"`. Traducción del acceso: lo que en axios era
 * `response.data` en Angular es `HttpErrorResponse.error` — el cuerpo ya parseado de la respuesta.
 *
 * Se guarda contra un `error` que no sea un objeto con `message` (PM4 puede devolver texto plano en un
 * 502 de gateway) para no terminar mostrando `undefined` al usuario.
 *
 * ── Por qué vive acá y no en cada servicio ─────────────────────────────────────────────────────
 * Nació dentro de `task.service.ts`. Cuando `RequestFilesService` necesitó exactamente el mismo orden
 * de precedencia, la alternativa era una segunda copia, y dos copias de una regla de precedencia
 * derivan: se arregla un caso límite en una y la otra sigue mostrando `undefined`. Los dos servicios
 * que exponen `error` traducen el fallo igual porque la pantalla lo pinta igual.
 */
export function mensajeDeError(in_excError: unknown): string {
  if (in_excError instanceof HttpErrorResponse) {
    const genCuerpo: unknown = in_excError.error;
    if (
      typeof genCuerpo === 'object' &&
      genCuerpo !== null &&
      typeof (genCuerpo as { message?: unknown }).message === 'string'
    ) {
      return (genCuerpo as { message: string }).message;
    }
    return in_excError.message;
  }
  return in_excError instanceof Error ? in_excError.message : String(in_excError);
}
