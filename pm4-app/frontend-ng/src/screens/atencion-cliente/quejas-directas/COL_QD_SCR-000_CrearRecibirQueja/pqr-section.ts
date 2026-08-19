import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Una sección del formulario público de radicación (`PqrSection` de React).
 *
 * ── Por qué NO es `app-form-section`, que es lo que usan las otras diez pantallas ────────────────
 * `FormSectionComponent` pinta una *card* con cabecera azul: es el chrome de una pantalla **interna**,
 * embebida en el iframe de PM4 y rodeada por la UI de la bandeja de tareas. SCR-000 es la única
 * pantalla publicada como **página web pública** (web entry), así que su chrome es el de un sitio: el
 * título de la sección va sobre la página, no dentro de un contenedor con relieve, y la separación la
 * da una regla horizontal.
 *
 * Es un componente y no una clase CSS suelta porque tiene markup propio (título + divisor + contenido)
 * y se repite en las cuatro secciones visibles de la pantalla — cumple el umbral de reúso ≥3 de la
 * jerarquía de UI.
 *
 * ⚠ El input se llama **`titulo`** y no `title`: `title` es un atributo global del DOM, así que
 * `<app-pqr-section title="…">` lo escribiría además como tooltip del navegador. `FormSectionComponent`
 * usa `title` por paridad histórica con React y arrastra ese efecto; acá no hay motivo para heredarlo.
 */
@Component({
  selector: 'app-pqr-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pqr-section.html',
})
export class PqrSectionComponent {
  public readonly titulo = input.required<string>();
}
