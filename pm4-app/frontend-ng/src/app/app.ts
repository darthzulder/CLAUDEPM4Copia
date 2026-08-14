import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Pm4ContextService } from '../core/pm4-context.service';
import { ManejadorDeErrores } from './error-render.service';

/**
 * Raíz de la app. Equivalente del `App()` de `frontend/src/App.tsx:121-154`, con las tres piezas
 * que ese archivo compone alrededor de la pantalla.
 *
 * ── Lo que hace acá el router y no este componente ───────────────────────────────────────────
 * En React esta función también **despachaba**: leía `?screen=`, buscaba en `SCREENS` y decidía
 * entre índice, pantalla o "no encontrada". Nada de eso vive acá: lo hace la tabla de rutas
 * (`app.routes.ts`), y por eso el `<router-outlet>` cubre los tres casos de una. Que este
 * componente haya quedado más chico que su original es la señal de que el port está bien hecho —
 * la lógica no desapareció, se mudó a donde el framework ya la resuelve.
 *
 * Quedan las dos piezas que **no** son enrutado —el error de render y el banner de debug— y las
 * dos son globales por naturaleza: se ven sobre cualquier pantalla, así que la raíz es su lugar.
 *
 * ── Por qué la pantalla de error se pinta acá y no en el `ErrorHandler` ──────────────────────
 * Porque un `ErrorHandler` es un servicio y no puede renderizar (ver `error-render.service.ts`).
 * La división es: el servicio **captura y normaliza**, la raíz **decide qué mostrar**. Cuando la
 * señal tiene un error, el `@else` deja de renderizar el outlet: la pantalla que reventó se
 * reemplaza por el diagnóstico, igual que hace el `render()` del `ErrorBoundary` de React.
 *
 * ⚠ **El outlet se DESMONTA, y eso es intencional.** Una pantalla a medio montar que ya lanzó
 * suele seguir lanzando en cada ciclo de detección de cambios; dejarla viva al lado del error
 * daría un bucle de excepciones sobre el mismo error ya reportado. React tampoco la conserva —su
 * boundary devuelve el fallback *en lugar de* `children`.
 *
 * ── Sin `Suspense`: el fallback de carga NO se porta acá ─────────────────────────────────────
 * React envolvía la pantalla en `<Suspense fallback={<ZrLoader/>}>` porque `React.lazy` lo exige.
 * `loadComponent` no tiene equivalente ni lo necesita: el router no renderiza nada hasta que el
 * chunk resolvió, así que no hay hueco que rellenar. El overlay de carga que el usuario **sí** ve
 * es el de los datos de la tarea (`TaskService.loading`), que cada pantalla ya pinta por su
 * cuenta; era una carga distinta de la del chunk aunque compartieran el spinner.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  /**
   * El `ErrorHandler` global, inyectado por su tipo concreto para poder leer su señal.
   *
   * Funciona porque `app.config.ts` lo registra con `useExisting`: hay **una** instancia, y tanto
   * `ErrorHandler` (lo que usa Angular para reportar) como `ManejadorDeErrores` (lo que se
   * inyecta acá) apuntan a ella. Con `useClass` habría dos y esta señal nunca se llenaría — es un
   * fallo silencioso, así que el spec de `app.config` lo asevera por identidad.
   */
  private readonly objManejador = inject(ManejadorDeErrores);

  /** El error no atrapado, si hubo alguno. Es lo que decide entre outlet y diagnóstico. */
  public readonly objError = this.objManejador.objError;

  /**
   * `true` si el token en uso salió del `.env`. Se lee **una vez**, no en cada ciclo: la query
   * string no cambia sin recargar el iframe, y el banner no tiene por qué aparecer y desaparecer.
   */
  public readonly blnTokenDeDebug = inject(Pm4ContextService).usandoTokenDeDebug();
}
