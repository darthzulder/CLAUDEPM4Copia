import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Un par rótulo/valor de solo lectura, alineado con los campos de la fachada (`PqrReadonly` de React).
 *
 * Lo usa un solo campo hoy —"Tipo de persona" de S2, que se **deriva** del tipo de documento
 * (RUL-000-02/03) y por eso no tiene control— pero va como componente y no como markup suelto porque
 * tiene que ocupar una celda de `.form-row.cols-3` con la misma altura y línea base que los dos
 * `zds-input` que lo rodean. Eso lo resuelven las clases `.pqr-readonly*` que ya existen en
 * `shared.css`; repetir el markup a mano en la plantilla dejaría esa alineación librada a la copia.
 *
 * ⚠ **El guion del valor vacío es contrato, no cosmética.** Una celda en blanco al lado de dos campos
 * llenos se lee como "la pantalla no cargó"; el `—` dice que el dato todavía no se puede derivar
 * (nadie eligió tipo de documento). Es el mismo criterio que el `|| '—'` de las filas del modal
 * resumen y de la barra de SCR-013.
 */
@Component({
  selector: 'app-pqr-readonly',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pqr-readonly.html',
})
export class PqrReadonlyComponent {
  public readonly label = input.required<string>();

  /** El valor a mostrar. Vacío o ausente cae al guion — ver el ⚠ de la clase. */
  public readonly valor = input<string>('');
}
