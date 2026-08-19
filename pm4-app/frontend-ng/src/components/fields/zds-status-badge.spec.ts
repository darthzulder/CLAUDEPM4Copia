import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ZaTag } from '@zurich/angular-components';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZdsStatusBadge, type VarianteEstado } from './zds-status-badge';

/**
 * El único wrapper de la fachada sin `ControlValueAccessor` de esta tanda, así que el spec es corto:
 * lo que puede romperse es el mapeo de variante a `fill` y la base elegida.
 *
 * **El test que importa es el de la base.** Si alguien "corrige" este componente a `za-badge`
 * —siguiendo la tabla del plan de migración, que lo dice mal— el render no falla: `ZaBadge` también
 * existe, también acepta `fill` y también proyecta contenido. El error se vería recién en la
 * comparación visual de la Fase 6, contra la app React. Por eso hay una aserción explícita de que la
 * instancia hija es un `ZaTag`.
 */

@Component({
  standalone: true,
  imports: [ZdsStatusBadge],
  template: `<zds-status-badge [variante]="variante()">Aprobado</zds-status-badge>`,
})
class Host {
  readonly variante = signal<VarianteEstado>('neutral');
}

function hijo(in_objFixture: ComponentFixture<unknown>): ZaTag {
  return in_objFixture.debugElement.query((in_objNodo) => in_objNodo.componentInstance instanceof ZaTag)
    .componentInstance as ZaTag;
}

describe('ZdsStatusBadge', () => {
  let objFixture: ComponentFixture<Host>;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(Host);
    await objFixture.whenStable();
  });

  it('se construye sobre za-tag, NO sobre za-badge', () => {
    // La tabla del plan de migración dice `za-badge` y es un error: la fachada React envuelve
    // `ZrTag` con un `fill` por variante (ZdsFields.tsx:163). `ZaBadge` compilaría igual, así que sin
    // esta aserción el cambio de base sería invisible para la suite.
    expect(hijo(objFixture)).toBeInstanceOf(ZaTag);
  });

  it.each([
    ['success', 'moss'],
    ['danger', 'peach'],
    ['info', 'teal'],
    ['warning', 'lemon'],
  ] as const)('la variante %s pinta el fill %s', async (in_strVariante, in_strFill) => {
    objFixture.componentInstance.variante.set(in_strVariante);
    await objFixture.whenStable();

    expect(hijo(objFixture).fill).toBe(in_strFill);
  });

  it('neutral NO manda fill, para que el tag tome su gris por defecto', async () => {
    objFixture.componentInstance.variante.set('neutral');
    await objFixture.whenStable();

    // `undefined`, no `''`: un fill vacío pintaría un fondo distinto al del tag sin fill.
    expect(hijo(objFixture).fill).toBeUndefined();
  });

  it('proyecta el contenido de la pantalla', () => {
    expect(objFixture.nativeElement.textContent).toContain('Aprobado');
  });
});
