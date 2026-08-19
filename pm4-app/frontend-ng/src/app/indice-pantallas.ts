import { Component } from '@angular/core';
import { listarSlugsEnrutables } from './pantallas';
import { STR_COMMIT_HASH } from '../env.generated';

/**
 * Índice de pantallas: lo que se ve al abrir la app **sin** `?screen=`.
 *
 * Port del `ScreenIndex` de `frontend/src/App.tsx:70-119`. No es una pantalla de negocio ni la
 * ve nunca un usuario de PM4 —el BPM siempre manda un `?screen=`— sino la portada de desarrollo:
 * la lista de slugs disponibles con un enlace a cada uno, que es como se navega el proyecto a
 * mano durante la migración y en cada verificación manual de los gates.
 *
 * ── La lista sale del registro, no está escrita acá ──────────────────────────────────────────
 * Se recorre `listarSlugsEnrutables()`, así que el índice no puede quedar desactualizado
 * respecto de las rutas: una pantalla registrada en la Fase 5 aparece sola. En React esto era lo
 * mismo (`Object.keys(SCREENS).map(...)`) y conviene conservarlo — un índice mantenido a mano se
 * desincroniza en el primer descuido y se convierte en una lista que miente.
 *
 * ── Por qué son `<a href>` y no `routerLink` ────────────────────────────────────────────────
 * Porque el destino es `?screen=<slug>`, que es **el contrato de URL de PM4**, no una ruta
 * interna de Angular. Un `routerLink` navegaría a `/<slug>` directamente y saltearía la
 * traducción del query param que hace `app.routes.ts` — o sea que el índice probaría un camino
 * distinto del que usa el BPM, que es justo el que interesa ejercitar a mano. Con el `href`, cada
 * click recarga y pasa por el `redirectTo` real, params incluidos.
 */
@Component({
  selector: 'app-indice-pantallas',
  template: `
    <div class="pm4-indice">
      <!-- Sirve para saber qué build corre dentro del iframe, donde no hay barra de direcciones. -->
      <div class="pm4-indice-commit">{{ strCommit }}</div>

      <div class="pm4-indice-cuerpo">
        <div z-flex="col:50" style="margin-bottom: var(--zs-300)">
          <div z-flex="100" z-align="left:center">
            <!-- Decorativa: la barrita azul no aporta información, así que se oculta al lector. -->
            <div class="pm4-indice-marca" aria-hidden="true"></div>
            <h1 class="pm4-indice-titulo">PM4 Screens</h1>
          </div>
          <p class="pm4-indice-conteo">{{ cllSlugs.length }} pantallas disponibles</p>
        </div>

        @if (cllSlugs.length === 0) {
          <!-- El estado real de la Fase 4: el registro está vacío hasta que la Fase 5 porte la
               primera pantalla. Se dice explícitamente en vez de mostrar una grilla vacía, que
               se lee como "algo se rompió" en vez de "todavía no hay nada". -->
          <p class="pm4-indice-conteo">
            Todavía no hay pantallas de negocio portadas. Se agregan de a una en la Fase 5.
          </p>
        } @else {
          <div class="pm4-indice-grilla">
            @for (strSlug of cllSlugs; track strSlug) {
              <a class="pm4-indice-item" [href]="'?screen=' + strSlug">
                <span class="pm4-indice-item-prefijo">?screen=</span>{{ strSlug }}
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class IndicePantallas {
  /**
   * Los slugs a listar, leídos una sola vez.
   *
   * No es una señal ni un getter porque el registro es un módulo estático: no cambia en runtime,
   * y recalcularlo en cada ciclo de detección sería trabajo por nada.
   */
  public readonly cllSlugs = listarSlugsEnrutables();

  /** Hash del commit del build. Equivalente del `__COMMIT_HASH__` de Vite en React. */
  public readonly strCommit = STR_COMMIT_HASH;
}
