import { Component, computed, input } from '@angular/core';
import { ZaTag } from '@zurich/angular-components';

/** Variantes de estado que ya usan las pantallas (contrato de la fachada React). */
export type VarianteEstado = 'success' | 'danger' | 'info' | 'neutral' | 'warning';

/**
 * `fill` del tag por variante. Copiado literal del `STATUS_FILL` de la fachada React para que una
 * pantalla portada no cambie de color. `neutral` es `undefined` a propósito: sin `fill` el tag toma
 * su gris por defecto, y pasarle `''` pintaría un fill vacío en vez de ninguno.
 */
const DIC_FILL: Record<VarianteEstado, 'moss' | 'peach' | 'teal' | 'lemon' | undefined> = {
  success: 'moss',
  danger: 'peach',
  info: 'teal',
  warning: 'lemon',
  neutral: undefined,
};

/**
 * Píldora de estado. Sin `ControlValueAccessor`: no es un campo de formulario, solo pinta.
 *
 * ```html
 * <zds-status-badge variante="success">Aprobado</zds-status-badge>
 * ```
 *
 * ── Corrección al plan: la base es `za-tag`, NO `za-badge` ───────────────────────────────────
 * La tabla de mapeo del plan de migración dice `ZdsStatusBadge → za-badge`. **Es un error del
 * plan**, y conviene dejarlo escrito porque el nombre `Badge` invita a repetirlo: la fachada React
 * envuelve **`ZrTag`** con un `fill` por variante, no `ZrBadge`. Verificado en
 * `frontend/src/components/fields/ZdsFields.tsx:163`.
 *
 * `ZaTag` da paridad exacta —tiene `fill` y proyecta contenido con `<ng-content>`—, mientras que
 * `ZaBadge` es otro componente: sus inputs son `config`/`icon`/`text`/`fill` y su semántica visual
 * en el DS es la de un contador/marca, no la de una etiqueta de estado. Usar `za-badge` habría
 * compilado y renderizado algo, o sea que el error **no** se habría visto en ningún spec: se habría
 * visto recién en la comparación visual de la Fase 6.
 *
 * ── El `className` de React no se porta ──────────────────────────────────────────────────────
 * La versión React acepta `className` y lo pasa al tag. Acá no hace falta un input: en Angular una
 * `class` escrita en el host (`<zds-status-badge class="...">`) ya queda en el elemento host, que es
 * donde la pantalla la espera. Agregar un input `className` sería un segundo camino para lo mismo.
 */
@Component({
  selector: 'zds-status-badge',
  standalone: true,
  imports: [ZaTag],
  template: `
    <za-tag [fill]="strFill()">
      <ng-content />
    </za-tag>
  `,
})
export class ZdsStatusBadge {
  readonly variante = input<VarianteEstado>('neutral');

  protected readonly strFill = computed(() => DIC_FILL[this.variante()]);
}
