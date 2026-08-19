import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, TemplateRef } from '@angular/core';

/**
 * Lo que una pantalla puede pasar como subtítulo.
 *
 * Los tres casos son los que ya usaba React: una lista de fragmentos (el caso normal, con valores
 * falsy que se filtran), un string suelto, o un `TemplateRef` para markup propio.
 */
export type SubtituloScreenHeader =
  | string
  | readonly (string | number | undefined | null | false)[]
  | TemplateRef<unknown>;

/** Ruta del logo. Vive en `public/`, así que se sirve tal cual desde la raíz. */
const RUTA_LOGO = 'resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

/**
 * Cabecera azul de pantalla: título, subtítulo opcional y el logo Zurich. Port de
 * `components/ScreenHeader.tsx`.
 *
 * ── El subtítulo tiene TRES formas, y la de lista es la que carga la regla ───────────────────────
 * React aceptaba `ReactNode | string | (string|number|undefined|null|false)[]`, y esa unión no es
 * decorativa: la forma de lista existe porque las pantallas arman el subtítulo con fragmentos
 * condicionales, del estilo
 *
 * ```ts
 * [`Caso #${caso.numero}`, caso.estado && `Estado: ${caso.estado}`, esVencido && 'VENCIDO']
 * ```
 *
 * donde los fragmentos que no aplican quedan en `false`/`undefined`. **El filtrado de falsy es el
 * contrato**: sin él la cabecera pintaría spans vacíos —o peor, la palabra `false`— cada vez que una
 * condición no se cumple. Y si TODOS los fragmentos son falsy, el bloque `.subtitle` no se monta,
 * porque un contenedor vacío igual ocupa espacio y desalinea la cabecera.
 *
 * ⚠ **Ojo con el `0`.** El filtro es `.filter(Boolean)`, heredado textual de React, así que un
 * fragmento que sea el número `0` **se descarta**. Se preserva a propósito: cambiarlo a un filtro de
 * `null`/`undefined`/`false` sería más correcto en abstracto, pero es un cambio de comportamiento
 * respecto de la app que se está migrando, y esta es una migración de framework, no un rediseño. Hoy
 * ninguna pantalla pasa un `0` suelto; si alguna lo necesitara, pasa el string `'0'`. Va con caso de
 * test para que el día que alguien lo "arregle" se entere de que era deliberado.
 *
 * ── El `TemplateRef` NO se envuelve en `.subtitle`, igual que en React ───────────────────────────
 * Cuando la pantalla pasa markup propio, se renderiza tal cual: el `.subtitle` de la lib aporta su
 * propio layout (los spans en fila) y aplicarlo a markup ajeno le rompería el diseño a quien lo pasó.
 * Es el mismo reparto que hacía la rama `else` de React. Va con caso de test.
 *
 * ── El logo se sirve desde `public/`, no se importa ──────────────────────────────────────────────
 * React hacía `import zurichLogo from '../resources/zurich/...png'` y Vite lo resolvía a una URL con
 * hash. En Angular eso necesitaría una declaración de módulo para `*.png` (el `tsconfig` de este
 * workspace no la tiene), así que el PNG vive en `public/resources/zurich/` —que ya es el único
 * `assets` declarado en `angular.json`— y se referencia por ruta. Se pierde el cache-busting por hash
 * del nombre; para un logo que no cambia es un intercambio razonable frente a sumar tipado de assets.
 */
@Component({
  selector: 'app-screen-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="screen-header">
      <div class="title-block">
        <h1>{{ title() }}</h1>
        @if (esPlantilla()) {
          <ng-container [ngTemplateOutlet]="plantilla()!" />
        } @else if (fragmentos().length > 0) {
          <div class="subtitle">
            @for (genTexto of fragmentos(); track $index) {
              <span>{{ genTexto }}</span>
            }
          </div>
        }
      </div>
      <img [src]="rutaLogo" alt="Zurich" class="header-logo" />
    </div>
  `,
  imports: [NgTemplateOutlet],
})
export class ScreenHeaderComponent {
  public readonly title = input.required<string>();
  public readonly subtitle = input<SubtituloScreenHeader | undefined>(undefined);

  protected readonly rutaLogo = RUTA_LOGO;

  /** `true` si la pantalla pasó markup propio, que se renderiza sin envolver. */
  protected readonly esPlantilla = computed(() => this.subtitle() instanceof TemplateRef);

  protected readonly plantilla = computed(() =>
    this.esPlantilla() ? (this.subtitle() as TemplateRef<unknown>) : null,
  );

  /**
   * Los fragmentos de texto ya filtrados, en el orden en que los pasó la pantalla.
   *
   * Un string suelto se normaliza a una lista de uno, así que el template tiene un solo camino para
   * los dos casos de texto. Ver el ⚠ del componente sobre el `0`.
   */
  protected readonly fragmentos = computed<readonly (string | number)[]>(() => {
    const genSubtitulo = this.subtitle();
    if (genSubtitulo === undefined || genSubtitulo === null || this.esPlantilla()) return [];
    if (typeof genSubtitulo === 'string') {
      // Un string vacío no arma bloque: es el mismo `if (subtitle)` de React.
      return genSubtitulo ? [genSubtitulo] : [];
    }
    if (Array.isArray(genSubtitulo)) {
      return genSubtitulo.filter(Boolean) as readonly (string | number)[];
    }
    return [];
  });
}
