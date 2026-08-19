import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { InfoBarComponent, type InfoBarItem } from './info-bar';

/**
 * Port de `components/InfoBar.test.tsx` (3 casos), más 3 casos propios.
 *
 * Los 3 de React van 1:1: un par label/value por item · `null`/`undefined` caen al placeholder `—` ·
 * lista vacía no lanza ni pinta filas.
 *
 * ── Los 3 casos nuevos, y por qué existen ────────────────────────────────────────────────────────
 * 1. **`value: 0` pinta `0`, no `—`.** Es la diferencia entre `??` y `||`, y sin este caso alguien
 *    "simplifica" a `||` y un contador en cero se lee como "no hay dato". React tampoco lo cubría.
 * 2. **Una celda con `TemplateRef` renderiza el markup.** `DetalleCasoModal` de la SCR-013 pasa un
 *    `ZdsStatusBadge` como value; en React eso salía gratis porque el tipo era `ReactNode`. Acá hace
 *    falta el `ngTemplateOutlet`, así que hace falta el test.
 * 3. **Un `TemplateRef` NO cae al placeholder.** Es la trampa concreta del `?? '—'`: si el `@if` que
 *    distingue plantilla de escalar se rompe, el binding de texto imprimiría el `toString()` del
 *    `TemplateRef` (algo tipo `[object Object]`) en vez del badge, y el caso 2 solo por sí mismo no
 *    lo detecta si el markup igual aparece por otra vía.
 */

@Component({
  standalone: true,
  imports: [InfoBarComponent],
  template: `
    <ng-template #plantillaEstado><span class="badge-falso">Abierta</span></ng-template>
    <app-info-bar [items]="items()" />
  `,
})
class Host {
  readonly plantilla = viewChild.required<TemplateRef<unknown>>('plantillaEstado');
  readonly items = signal<readonly InfoBarItem[]>([]);
}

describe('InfoBarComponent', () => {
  let objFixture: ComponentFixture<Host>;

  /** Fija los items y espera el render. */
  async function conItems(in_lstItems: readonly InfoBarItem[]): Promise<void> {
    objFixture.componentInstance.items.set(in_lstItems);
    await objFixture.whenStable();
  }

  function filas(): HTMLElement[] {
    return Array.from(objFixture.nativeElement.querySelectorAll('.info-bar-item'));
  }

  beforeEach(async () => {
    objFixture = TestBed.createComponent(Host);
    await objFixture.whenStable();
  });

  it('renderiza un par label/value por cada item', async () => {
    await conItems([
      { label: 'Caso', value: '123' },
      { label: 'Estado', value: 'Abierta' },
    ]);

    expect(filas()).toHaveLength(2);
    // Se asevera el par junto, no los 4 strings sueltos como hacía React: que 'Caso' y '123' existan
    // en la pantalla no prueba que estén en la misma fila.
    expect(filas()[0]!.querySelector('.info-bar-label')!.textContent).toContain('Caso');
    expect(filas()[0]!.querySelector('.info-bar-value')!.textContent).toContain('123');
    expect(filas()[1]!.querySelector('.info-bar-label')!.textContent).toContain('Estado');
    expect(filas()[1]!.querySelector('.info-bar-value')!.textContent).toContain('Abierta');
  });

  it('un value null/undefined cae al placeholder "—"', async () => {
    // Contrato con el usuario, no cosmética: una celda en blanco se lee como "la pantalla no cargó".
    await conItems([
      { label: 'Responsable', value: null },
      { label: 'Fecha', value: undefined },
    ]);

    const lstValores = filas().map((in_objF) =>
      in_objF.querySelector('.info-bar-value')!.textContent!.trim(),
    );
    expect(lstValores).toEqual(['—', '—']);
  });

  it('un value 0 pinta 0, NO el placeholder (?? y no ||)', async () => {
    // Caso nuevo. Un contador en cero es un dato legítimo; con `||` se perdería y se leería como
    // "sin dato". Fija la semántica para que nadie lo "simplifique".
    await conItems([{ label: 'Reclamos previos', value: 0 }]);

    expect(filas()[0]!.querySelector('.info-bar-value')!.textContent!.trim()).toBe('0');
  });

  it('un value string vacío NO cae al placeholder', async () => {
    // Mismo eje que el anterior y por el mismo motivo: `''` no es `null`. Es lo que PM4 devuelve en un
    // campo de texto que el usuario dejó en blanco, y el `??` lo respeta.
    await conItems([{ label: 'Observación', value: '' }]);

    expect(filas()[0]!.querySelector('.info-bar-value')!.textContent!.trim()).toBe('');
  });

  it('lista vacía no lanza y no renderiza filas', async () => {
    await conItems([]);

    expect(filas()).toHaveLength(0);
    // La barra sigue existiendo: el caso vacío no debe hacer desaparecer el contenedor, porque las
    // pantallas la montan antes de que llegue la respuesta de PM4.
    expect(objFixture.nativeElement.querySelector('.info-bar')).not.toBeNull();
  });

  it('renderiza un TemplateRef como celda de valor (el caso de la SCR-013)', async () => {
    // `DetalleCasoModal` pasa un `ZdsStatusBadge` en el value para pintar el estado como píldora. Acá
    // se usa un span propio en lugar del badge del DS: lo que se prueba es el `ngTemplateOutlet`, y
    // meter un custom element de Lit en el medio agregaría una dependencia que jsdom no ejecuta.
    await conItems([{ label: 'Estado', value: objFixture.componentInstance.plantilla() }]);

    const objCelda = filas()[0]!.querySelector('.info-bar-value') as HTMLElement;
    expect(objCelda.querySelector('.badge-falso')).not.toBeNull();
    expect(objCelda.textContent).toContain('Abierta');
  });

  it('un TemplateRef NO cae al placeholder ni se imprime como objeto', async () => {
    // La trampa del `?? '—'`: un `TemplateRef` no es null, así que si el `@if` se rompiera, el binding
    // de texto imprimiría su `toString()`. Se asevera la ausencia de las dos formas de fallar.
    await conItems([{ label: 'Estado', value: objFixture.componentInstance.plantilla() }]);

    const strTexto = filas()[0]!.querySelector('.info-bar-value')!.textContent!;
    expect(strTexto).not.toContain('—');
    expect(strTexto).not.toContain('object');
  });

  it('mezcla escalares y plantillas en la misma barra', async () => {
    // Es como la usa la SCR-013 de verdad: casi todas las celdas son strings y una es un badge. Sin
    // este caso, los dos anteriores pasarían igual si el componente solo supiera hacer una cosa a la vez.
    await conItems([
      { label: 'Caso', value: '123' },
      { label: 'Estado', value: objFixture.componentInstance.plantilla() },
      { label: 'Responsable', value: null },
    ]);

    expect(filas()).toHaveLength(3);
    expect(filas()[0]!.querySelector('.info-bar-value')!.textContent!.trim()).toBe('123');
    expect(filas()[1]!.querySelector('.badge-falso')).not.toBeNull();
    expect(filas()[2]!.querySelector('.info-bar-value')!.textContent!.trim()).toBe('—');
  });
});
