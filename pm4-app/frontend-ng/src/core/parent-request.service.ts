import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { urlApi } from '../api/pm4Client';

/**
 * Lee las variables **frescas** del request padre de un subproceso. Port del `pm4.get(...)` que
 * `RespuestaAreaResponsable.tsx` hacía inline (SCR-0052).
 *
 * ── El problema real que resuelve, y por qué no es una optimización ─────────────────────────────
 * Un subproceso de PM4 arranca con un **snapshot** de las variables del padre en el momento del
 * llamado. SCR-0052 corre dentro de ese subproceso y tiene que escribir su respuesta *dentro de un
 * array* (`qd_lstAssignHistory`) que vive en el padre.
 *
 * Si mientras el ayudante redacta su comentario el Analista SAC pide **otra** ayuda, el padre gana una
 * fila que el snapshot no tiene. Guardar el array del snapshot con la respuesta encima **borra esa
 * fila**: no es un dato desactualizado que se corrige después, es una escritura destructiva sobre
 * trabajo de otro usuario, y no deja rastro de que ocurrió. Por eso la relectura pasa antes de
 * cualquier `completarTarea`, y por eso vive en un servicio con su propio spec en vez de en la
 * pantalla.
 *
 * ── Por qué NO lanza cuando falla ───────────────────────────────────────────────────────────────
 * Devuelve `null` y lo registra por consola, igual que el `catch` de React. Es la decisión correcta y
 * conviene dejarla escrita porque la tentación de "propagar el error" es fuerte: si la relectura
 * fallara y esto lanzara, el ayudante **no podría enviar su comentario** por un problema que no es
 * suyo y que no puede resolver. Con `null` la pantalla cae al snapshot local, que es peor que el
 * estado fresco pero muchísimo mejor que perder la respuesta entera. El modo de falla degrada, no
 * bloquea.
 *
 * ── `include=data` es obligatorio ───────────────────────────────────────────────────────────────
 * Sin ese parámetro PM4 devuelve el request pero **sin las variables del caso**, así que la respuesta
 * llega con 200 y el array vacío — indistinguible de "el padre no tiene historial". Va con caso de
 * test propio porque es exactamente la clase de omisión que no rompe nada visible.
 */
@Injectable({ providedIn: 'root' })
export class ParentRequestService {
  private readonly objHttp = inject(HttpClient);

  /**
   * Resuelve el id del request padre a partir de `task.data`.
   *
   * PM4 lo publica en **dos formas distintas** según cómo se haya configurado el subproceso, así que
   * se prueban las dos: `_request.parent_request_id` y `_parent.request_id`. Se conserva el orden de
   * React (primero `_request`) porque es el que la instancia real usa hoy; el segundo es el respaldo.
   *
   * @returns El id, o `null` si `task.data` no trae ninguna de las dos formas — que es el caso normal
   *   cuando la pantalla **no** corre dentro de un subproceso.
   */
  public idDelPadre(in_dicDatos: Record<string, unknown> | undefined): number | null {
    if (!in_dicDatos) return null;

    const objRequest = in_dicDatos['_request'] as { parent_request_id?: number } | undefined;
    const objPadre = in_dicDatos['_parent'] as { request_id?: number } | undefined;

    return objRequest?.parent_request_id ?? objPadre?.request_id ?? null;
  }

  /**
   * Trae las variables del request padre.
   *
   * El desempaquetado prueba `data.data` y después `data` porque el proxy de PM4 devuelve las dos
   * formas según el endpoint; es el mismo `?? ` que tenía React y se conserva tal cual.
   *
   * @returns Las variables del caso padre, o `null` si la petición falla. **No lanza** — ver el bloque
   *   de la cabecera.
   */
  public async leerVariables(in_intRequestId: number): Promise<Record<string, unknown> | null> {
    try {
      const objResp = await firstValueFrom(
        this.objHttp.get<Record<string, unknown>>(urlApi(`/requests/${in_intRequestId}`), {
          // Sin `include=data` la respuesta llega sin las variables del caso. Ver la cabecera.
          params: new HttpParams().set('include', 'data'),
        }),
      );

      const dicFrescas = (objResp?.['data'] ?? objResp ?? {}) as Record<string, unknown>;
      return dicFrescas;
    } catch (in_excError: unknown) {
      // Degradar, no bloquear: la pantalla sigue con su snapshot local. Ver la cabecera.
      console.warn(
        `[ParentRequestService] No se pudo leer el request padre ${in_intRequestId}; ` +
          `la pantalla usará su snapshot local:`,
        in_excError,
      );
      return null;
    }
  }
}
