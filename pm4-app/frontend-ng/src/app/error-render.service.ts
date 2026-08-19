import { ErrorHandler, Injectable, signal } from '@angular/core';

/**
 * Reemplazo del `ErrorBoundary` de React (`frontend/src/App.tsx:20-37`): captura cualquier
 * excepción no atrapada del árbol y la expone para que la raíz la pinte.
 *
 * ── Por qué son DOS piezas y no un componente, como en React ─────────────────────────────────
 * En React el boundary **es** un componente: `getDerivedStateFromError` le da el error y su
 * propio `render()` lo pinta, todo en la misma clase. Angular no tiene equivalente por
 * componente — no existe un "component boundary" — y el `ErrorHandler` global es un
 * **servicio**, así que no puede renderizar nada.
 *
 * La traducción es entonces: el servicio guarda el error en una señal, y la raíz (`App`) lee esa
 * señal y decide qué pintar. Es la misma garantía observable que da el boundary de React (un
 * throw en cualquier pantalla termina en una página de error con el stack, en vez de un árbol a
 * medio montar o una pantalla en blanco), con la diferencia de que acá el alcance es **global**:
 * un boundary de React envuelve un subárbol y en teoría podría haber varios, mientras que este
 * atrapa todo. Para esta app da igual — el `App.tsx` de React tiene exactamente uno, envolviendo
 * la única pantalla que el iframe renderiza a la vez.
 *
 * ── El `console.error` no es decorativo, y por qué va ANTES de la señal ──────────────────────
 * Se hereda del `componentDidCatch` de React, que loguea con el prefijo `[ErrorBoundary]`. Es lo
 * único que sobrevive si la señal no llega a pintarse (un throw durante el bootstrap, antes de
 * que `App` exista) y lo único que queda en la consola del navegador para diagnosticar dentro de
 * un iframe, donde la pantalla de error es difícil de leer y aún más de copiar. Va primero por
 * eso: si `set()` fallara —o si la excepción viniera de un efecto que se re-dispara— el registro
 * ya está hecho.
 */
@Injectable()
export class ManejadorDeErrores implements ErrorHandler {
  /**
   * El error no atrapado, o `null` si todavía no hubo ninguno.
   *
   * Es de solo lectura hacia afuera a propósito: el único que escribe es `handleError`. Que la
   * raíz pudiera limpiarlo sería un `retry` que esta app no tiene — el `ErrorBoundary` de React
   * tampoco se recupera, y una vez que el árbol quedó a medio montar reintentar sin recargar el
   * iframe pintaría estado inconsistente.
   */
  public readonly objError = signal<Error | null>(null);

  public handleError(in_objError: unknown): void {
    // El prefijo se mantiene idéntico al de React para que un log viejo y uno nuevo se busquen
    // igual; el nombre del mecanismo cambió de framework, el del síntoma no.
    console.error('[ErrorBoundary]', in_objError);

    // `handleError` recibe `unknown`: lo que se lanza no siempre es un `Error` (un `throw 'texto'`
    // o un rechazo con un objeto plano llegan igual acá). Se normaliza para que la vista pueda
    // leer `.message`/`.stack` sin guardas y no pinte un `undefined` en la pantalla de error.
    this.objError.set(
      in_objError instanceof Error ? in_objError : new Error(String(in_objError)),
    );
  }
}
