import { Component, InjectionToken, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { listarSlugsEnrutables } from './pantallas';

/**
 * Los slugs a enumerar. Existe **para poder testear la enumeración**, y no es un adorno.
 *
 * ── ⚠ Por qué un token y no `listarSlugsEnrutables()` leída directo ─────────────────────────
 * Porque el registro está **vacío** en la Fase 4 (la ex SCR-010 era su único slug y se eliminó,
 * ago-2026), y con `[]` toda aserción sobre la lista se cumple sola: el `for` del spec no corría y
 * borrar el `{{ strDisponibles }}` del template dejaba el caso **verde**. Es la misma vacuidad que
 * desarmó cuatro casos de `indice-pantallas.spec.ts`.
 *
 * Pisar el campo de la instancia —el arreglo que sirvió allá— **acá no funciona**: la instancia la
 * crea el router, así que no hay un "antes del primer render" donde pisarla, y bajo
 * `provideZonelessChangeDetection()` una escritura posterior no notifica nada y el template no se
 * vuelve a pintar. El token deja inyectar el dato **antes** de que el componente se construya, que
 * es el único momento que sirve cuando no se controla la creación.
 *
 * El default es la función real, así que la app no configura nada: `app.routes.ts` monta esta
 * pantalla sin providers propios.
 */
export const SLUGS_DISPONIBLES = new InjectionToken<string[]>('SLUGS_DISPONIBLES', {
  factory: () => listarSlugsEnrutables(),
});

/**
 * Lo que se ve cuando el `?screen=` pedido no existe.
 *
 * Port del bloque `if (!Screen)` de `frontend/src/App.tsx:132-140`. Es el destino de la ruta
 * comodín (`**`), así que atrapa **cualquier** path no declarado, no solo un slug mal escrito.
 *
 * ── Por qué se nombra el slug pedido Y se listan los disponibles ─────────────────────────────
 * Se conserva textual de React, y el motivo es el iframe: esta pantalla se ve **dentro** de PM4,
 * donde no hay barra de direcciones que muestre qué se pidió ni consola a mano. Sin el slug en
 * pantalla el síntoma es "iframe vacío" y no hay forma de distinguir un slug con un typo en el nodo
 * del BPM de una pantalla que nunca se registró — que son dos arreglos en dos repos distintos.
 * La lista de disponibles convierte el segundo caso en obvio.
 *
 * ── De dónde sale el slug, y por qué NO de `window.location.search` ──────────────────────────
 * Del `ActivatedRoute`, leyendo el path. Cuando esto se activa, el `redirectTo` de `app.routes.ts`
 * ya tradujo `?screen=<slug>` a `/<slug>` y **borró el `screen` del query string** (lo hace a
 * propósito, para no duplicar el dato en la URL final). O sea que a esta altura el query param ya
 * no existe: leer `window.location.search` mostraría `undefined` justo en el caso que esta pantalla
 * existe para diagnosticar.
 */
@Component({
  selector: 'app-pantalla-no-encontrada',
  template: `
    <div class="pm4-diag">
      <h2>
        Pantalla no encontrada: <code>{{ strSlug }}</code>
      </h2>
      <p>Pantallas disponibles: {{ strDisponibles }}</p>
      <!-- Un href y no routerLink: mismo motivo que en el índice — la raíz sin ?screen= es la
           entrada real de la app, y una recarga garantiza pasar por el redirectTo de verdad.
           (Sin comillas invertidas en este comentario: terminan el template literal de TS.) -->
      <a href="/">← Volver al índice</a>
    </div>
  `,
})
export class PantallaNoEncontrada {
  /**
   * El slug pedido, tal como quedó en el path tras la traducción del `redirectTo`.
   *
   * `snapshot` y no el observable de `url`: la ruta comodín no se re-usa entre navegaciones
   * distintas (el router destruye y recrea el componente), así que suscribirse no aportaría nada
   * y dejaría un `takeUntilDestroyed` que hay que mantener.
   *
   * El `join('/')` es por el `**`: si alguien pide `/a/b/c` el path tiene tres segmentos, y
   * mostrar solo el primero mentiría sobre lo que se pidió.
   */
  public readonly strSlug = inject(ActivatedRoute)
    .snapshot.url.map((in_objSegmento) => in_objSegmento.path)
    .join('/');

  /**
   * Los slugs registrados, en el mismo formato de lista que usa React.
   *
   * Sale del token y no de la función directa para que el spec pueda inyectar slugs de prueba; ver
   * el bloque de `SLUGS_DISPONIBLES`. En la app el token resuelve a `listarSlugsEnrutables()`.
   */
  public readonly strDisponibles = inject(SLUGS_DISPONIBLES).join(', ');
}
