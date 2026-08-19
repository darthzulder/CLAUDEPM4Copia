import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActionBarComponent } from './action-bar';
import { ZrButton } from './fields/zds-reexports';

/**
 * Port de `components/ActionBar.test.tsx`.
 *
 * ── El caso de React era un spike de convención, y acá ya no hace falta ──────────────────────────
 * El único caso del baseline (`renderiza un ZrButton hijo con su texto`) existía para probar que un
 * custom element de `@zurich/web-components` se registra y renderiza bajo jsdom con RTL — era la
 * prueba de concepto que habilitó mandatar RTL en el proyecto. Ese hecho ya está establecido en
 * Angular por los 12 specs de la fachada de la Fase 2, así que acá el mismo caso se conserva
 * **midiendo lo que el componente aporta** (proyectar y no romper el DS que le pasan) en vez de
 * revalidar el runner.
 *
 * ── Los atributos del DS SÍ se aseveran, y no es sobre-especificar ───────────────────────────────
 * `z-flex`/`z-align` no son decoración: son la vía idiomática de layout del Zurich DS (eje B de la
 * jerarquía de UI), y son lo único que alinea los botones a la derecha. Si alguien los borra creyendo
 * que sobran, o los reemplaza por un `display:flex` a mano, el layout se rompe **en silencio** —
 * jsdom no aplica el CSS del DS, así que ningún test de render lo notaría. La aserción de atributos
 * es la única guarda posible bajo jsdom para una decisión que vive en el markup.
 */

@Component({
  standalone: true,
  imports: [ActionBarComponent, ZrButton],
  template: `
    <app-action-bar>
      <lib-button-z label="Enviar" [disabled]="false" />
    </app-action-bar>
  `,
})
class Host {}

describe('ActionBarComponent', () => {
  let objFixture: ComponentFixture<Host>;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(Host);
    await objFixture.whenStable();
  });

  it('proyecta el botón del DS que le pasa la pantalla', () => {
    // Equivalente del único caso de React. El botón se busca por su presencia en el DOM proyectado y
    // por su atributo, NO por su texto, y hay dos razones acumuladas (verificadas en los metadatos de
    // `lib-button-z`, no supuestas):
    //   1. El input se llama `label`, no `content` — `content` no existe y Angular lo dejaría como un
    //      atributo suelto sin llegar al componente. Va aseverado abajo para que un rename futuro en la
    //      lib se vea acá y no en la pantalla.
    //   2. `ButtonZ` pinta ese `label` como contenido PROYECTADO dentro de su propio template, así que
    //      bajo jsdom —donde el custom element de Lit no corre— el texto no aparece en el DOM ni con el
    //      nombre correcto. Por eso no hay aserción de string.
    // `[disabled]="false"` es obligatorio: el default de la lib es `true` (gotcha documentado en la
    // fachada). Sin él este host montaría un botón deshabilitado, que no es lo que usa una pantalla.
    const objBoton = objFixture.nativeElement.querySelector('lib-button-z') as HTMLElement;

    expect(objBoton).not.toBeNull();
    expect(objBoton.getAttribute('label')).toBe('Enviar');
    // Y que quedó DENTRO de la barra, no como hermano — que es lo que rompería un `ng-content` mal
    // ubicado o un template que envuelve mal.
    expect(objFixture.nativeElement.querySelector('.action-bar lib-button-z')).not.toBeNull();
  });

  it('mantiene los atributos de layout del DS en el contenedor', () => {
    // Ver el docstring: bajo jsdom esto es lo único que detecta que alguien sacó el layout del DS.
    const objBarra = objFixture.nativeElement.querySelector('.action-bar') as HTMLElement;

    expect(objBarra.getAttribute('z-flex')).toBe('75');
    expect(objBarra.getAttribute('z-align')).toBe('right:center');
  });

  it('sin contenido proyectado no lanza y deja la barra vacía', () => {
    // Hay pantallas que renderizan la barra con los botones detrás de un `@if`. Que el componente
    // aguante el caso vacío evita un error de consola en el primer render de esas pantallas.
    @Component({ standalone: true, imports: [ActionBarComponent], template: `<app-action-bar />` })
    class HostVacio {}

    const objVacio = TestBed.createComponent(HostVacio);
    objVacio.detectChanges();

    const objBarra = objVacio.nativeElement.querySelector('.action-bar') as HTMLElement;
    expect(objBarra).not.toBeNull();
    expect(objBarra.children).toHaveLength(0);
  });
});
