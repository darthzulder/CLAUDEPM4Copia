import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, TemplateRef } from '@angular/core';

/**
 * Un par etiqueta/valor de la barra.
 *
 * `value` admite `null`/`undefined` porque PM4 manda campos vacíos con frecuencia, y admite un
 * `TemplateRef` para el caso de la celda con markup — ver el ⚠ del componente.
 */
export interface InfoBarItem {
  label: string;
  value: string | number | null | undefined | TemplateRef<unknown>;
}

/**
 * Barra horizontal de pares etiqueta/valor: número de caso, estado, responsable, fechas. Va arriba
 * de las pantallas de gestión, como resumen de solo lectura. Port de `components/InfoBar.tsx`.
 *
 * ── ⚠ El `value` acepta un `TemplateRef`, y NO es sobreingeniería ────────────────────────────────
 * En React el tipo era `ReactNode`, así que una pantalla podía inyectar JSX en la celda de valor.
 * La primera versión de este port estrechó el tipo a un escalar dando por sentado que ninguna
 * pantalla lo aprovechaba; **medido, es falso**: `DetalleCasoModal` de la SCR-013 pasa
 * `value: <ZdsStatusBadge variant={...}>{caso.estado}</ZdsStatusBadge>` para pintar el estado como
 * píldora. Con el tipo escalar, esa pantalla habría tenido que dejar de usar `InfoBar` o pintar el
 * estado como texto pelado — un cambio funcional encubierto en una migración de framework.
 *
 * Angular no tiene un equivalente directo de "un nodo como valor de un objeto", así que el
 * mecanismo es un `TemplateRef` que la pantalla declara con `<ng-template>` y pasa en el item; el
 * `@switch` de abajo lo renderiza con `ng-container`. Los strings siguen siendo strings, que es el
 * 95% de los casos.
 *
 * ── El placeholder `—` es contrato con el usuario, no cosmética ──────────────────────────────────
 * `?? '—'` se preserva textual de React. Importa porque estas barras muestran datos de PM4 que
 * llegan vacíos con frecuencia (un caso sin responsable asignado todavía): una celda en blanco se lee
 * como "la pantalla no cargó", y el guion como "no hay dato". Va con caso de test.
 *
 * **Ojo con el `??`, y es deliberado que no sea `||`:** un valor `0` es un dato legítimo (un contador
 * en cero) y debe pintarse como `0`, no como guion. Con `||` se perdería. Va con su propio caso.
 */
@Component({
  selector: 'app-info-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="info-bar">
      <!-- El track va por índice y no por label: los labels no son únicos por contrato (dos
           pantallas podrían repetir "Fecha") y la lista es estática, así que el índice es estable. -->
      @for (objItem of items(); track $index) {
        <div class="info-bar-item">
          <span class="info-bar-label">{{ objItem.label }}</span>
          <span class="info-bar-value">
            @if (esPlantilla(objItem.value)) {
              <ng-container [ngTemplateOutlet]="objItem.value" />
            } @else {
              {{ objItem.value ?? '—' }}
            }
          </span>
        </div>
      }
    </div>
  `,
  imports: [NgTemplateOutlet],
})
export class InfoBarComponent {
  public readonly items = input.required<readonly InfoBarItem[]>();

  /**
   * Distingue una celda con markup de un valor escalar.
   *
   * Se usa `instanceof TemplateRef` y no un discriminante propio (`{tipo: 'template'}`) porque el
   * `TemplateRef` real es lo que la pantalla ya tiene a mano desde su `<ng-template>`: pedirle además
   * que lo envuelva en un objeto sería ceremonia sin ganancia.
   */
  protected esPlantilla(in_gen: InfoBarItem['value']): in_gen is TemplateRef<unknown> {
    return in_gen instanceof TemplateRef;
  }
}
