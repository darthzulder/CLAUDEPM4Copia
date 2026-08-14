import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Card con header de color + body + pie opcional. Es el contenedor de sección de casi todas las
 * pantallas. Port de `components/FormSection.tsx`.
 *
 * ── Tres slots de contenido, no uno ─────────────────────────────────────────────────────────────
 * React recibía `children` + dos props `ReactNode` (`action`, `footer`). En Angular eso son tres
 * `ng-content` distinguidos por `select`, así que la pantalla escribe:
 *
 * ```html
 * <app-form-section title="Datos del consumidor">
 *   <lib-button-z action ... />        <!-- a la derecha del header -->
 *   <div>...campos...</div>            <!-- body, el ng-content sin select -->
 *   <app-action-bar footer>...</app-action-bar>
 * </app-form-section>
 * ```
 *
 * **El `ng-content` sin `select` va último a propósito.** Angular asigna cada nodo proyectado al
 * primer `ng-content` que lo matchea, y el catch-all matchea todo: si estuviera declarado antes que
 * los otros dos, se comería también el `[action]` y el `[footer]`, y ninguno de los dos aparecería en
 * su lugar. El orden en el template no es cosmético, es lo que hace que la proyección funcione.
 *
 * ── El color viaja como estilo inline, igual que en React ────────────────────────────────────────
 * `[style.backgroundColor]` con un `var(--z-blue)` por defecto. No es una excepción a la regla de
 * "solo tokens": el valor **es** un token, y vive inline porque cada pantalla elige el color de su
 * header (azul para datos, otro para secciones de alerta). Una clase por color multiplicaría
 * `shared.css` por cada variante que aparezca.
 *
 * ── ⚠ El wrapper del `action` se colapsa con `:empty`, y hace falta ──────────────────────────────
 * React montaba ese `<span>` **solo** si venía la prop (`{action && <span>…</span>}`), así que sin
 * action no existía en el DOM. Con `ng-content` el contenedor existe siempre: la proyección no puede
 * ser condicional sin un `contentChild`, y hacer que lo sea solo para esto agregaría un ciclo de
 * detección de cambios a un componente que se monta en cada sección de cada pantalla.
 *
 * El problema no es el nodo vacío en sí, es el `margin-left: auto`: un span sin contenido pero con
 * ese margen **sigue empujando el layout del flex**, así que el título quedaría mal alineado en todas
 * las secciones que no pasan action (la mayoría). Por eso el `:empty` lo saca del layout con
 * `display: none`. Es CSS del componente, no de `shared.css`, porque no es un patrón reutilizable
 * sino la neutralización de una diferencia entre `children` y `ng-content`. Va con caso de test.
 *
 * **Por qué `:empty` funciona igual cuando la pantalla usa `@if` (medido, no asumido).** Al condicionar
 * el action con `@if`, Angular deja su ancla de control de flujo —un nodo **comentario**,
 * `<!--container-->`— dentro del wrapper, así que el wrapper "vacío" tiene 1 hijo. No importa: la spec
 * de CSS define `:empty` mirando solo elementos y texto, así que **ignora los comentarios** y la regla
 * sigue aplicando. Lo que sí la rompería es un espacio de texto suelto dentro del `<span>` — por eso
 * el template lo mantiene pegado y su caso de test asevera `textContent` vacío además de `:empty`.
 */
@Component({
  selector: 'app-form-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-section-card">
      <div class="form-section-header" [style.backgroundColor]="color()">
        <span>{{ title() }}</span>
        <!-- El wrapper del action lleva el margen que lo empuja a la derecha; en React era un
             style inline sobre el mismo span. -->
        <span class="form-section-action"><ng-content select="[action]" /></span>
      </div>
      <div class="form-section-body"><ng-content /></div>
      <ng-content select="[footer]" />
    </div>
  `,
  styles: `
    .form-section-action {
      margin-left: auto;
      display: inline-flex;
    }
    /* Ver el ⚠ del docstring: sin esto, el margin-left:auto de un wrapper vacío desalinea el
       título en todas las secciones que no proyectan un [action]. */
    .form-section-action:empty {
      display: none;
    }
  `,
})
export class FormSectionComponent {
  public readonly title = input.required<string>();

  /**
   * Color del header. Token del DS, no un hex.
   *
   * El default `var(--z-blue)` se preserva textual de React porque hay pantallas que no lo pasan y
   * su header tiene que seguir saliendo azul: cambiarlo acá les cambiaría el aspecto a todas de una
   * vez. Va con caso de test.
   */
  public readonly color = input<string>('var(--z-blue)');
}
