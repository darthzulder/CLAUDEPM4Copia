import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Raíz de la app. Hoy es solo el hueco del router.
 *
 * Lo que este componente **va** a ser (Fase 4) es el equivalente del `App.tsx` de React:
 * lee `?screen=` del query string, resuelve la pantalla, y envuelve el render en el
 * fallback de carga y el manejo de errores. Nada de eso se adelanta acá porque no hay
 * pantallas todavía y un andamiaje especulativo se reescribiría entero.
 *
 * Tres piezas de `App.tsx` que la Fase 4 no debe perder, listadas donde corresponde
 * mirarlas: el índice de pantallas cuando no hay `?screen=` (`ScreenIndex`), el banner de
 * "token de debug" cuando el token sale del `.env` en vez del query string, y el
 * `ErrorBoundary`, que en Angular es un `ErrorHandler` global provisto en `app.config.ts`
 * más un componente de fallback — no hay equivalente por componente.
 */
// Sin `styleUrl` a propósito: el `ng new` genera un `app.css` vacío, y en este proyecto una hoja
// de estilos por componente es justo lo que la regla 3 de pm4-app/CLAUDE.md prohíbe ("no crear
// styles.css por pantalla, DRY"). `shared.css` es la única hoja global permitida y entra por
// `main.ts`. Dejar el archivo vacío pero referenciado sentaría el precedente en el commit inicial,
// que es el peor lugar posible para dejarlo.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {}
