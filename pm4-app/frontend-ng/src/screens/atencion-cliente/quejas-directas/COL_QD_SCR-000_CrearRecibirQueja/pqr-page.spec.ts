import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ZrStageBanner } from '../../../../components/fields/zds-reexports';
import { PqrPageComponent } from './pqr-page';
import { PqrReadonlyComponent } from './pqr-readonly';
import { PqrSectionComponent } from './pqr-section';

/**
 * El chrome de la página pública de SCR-000. React no tenía spec para `PqrPage.tsx` — estos casos
 * son propios del port, y existen por un motivo concreto: **las dos divergencias con React viven en
 * el markup, y `ng build` no compila la plantilla de un componente que nada enruta**. Sin montarlos,
 * un `<img slot="logo">` descartado en silencio o un `content` interpolado como texto literal no dan
 * ningún error — la barra sale sin logo y el banner con markup escapado, en verde.
 *
 * Los dos primeros casos son las contrapartes ejecutables de esas divergencias (ver el docstring de
 * `PqrPageComponent`); el día que alguien "arregle" el logo devolviéndolo a `lib-navigation-z`, o
 * meta el intro en `category`, se ponen rojos y le cuentan por qué era así.
 */
@Component({
  standalone: true,
  imports: [PqrPageComponent, PqrSectionComponent, PqrReadonlyComponent],
  template: `
    <app-pqr-page titulo="Radica tu PQR" intro="Completa el formulario para radicar tu queja.">
      <div class="pqr-form">
        <app-pqr-section titulo="Datos del consumidor">
          <app-pqr-readonly label="Tipo de persona" [valor]="''" />
          <app-pqr-readonly label="Tipo de persona" valor="Natural" />
        </app-pqr-section>
      </div>
    </app-pqr-page>
  `,
})
class Host {}

describe('Chrome de la página pública (SCR-000)', () => {
  let objFixture: ComponentFixture<Host>;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(Host);
    await objFixture.whenStable();
  });

  /** El elemento raíz del host. */
  function raiz(): HTMLElement {
    return objFixture.nativeElement as HTMLElement;
  }

  it('pinta el logo en una barra propia, NO en un slot de lib-navigation-z', () => {
    // La barra existe y es la maquetada a mano.
    const objBarra = raiz().querySelector('.pqr-topnav');
    expect(objBarra).not.toBeNull();

    // Y el logo está DENTRO de ella. Si alguien vuelve a `lib-navigation-z` con un
    // `<img slot="logo">`, el `<img>` se descarta en silencio y esta aserción cae.
    const objLogo = objBarra!.querySelector('img') as HTMLImageElement | null;
    expect(objLogo).not.toBeNull();
    expect(objLogo!.alt).toBe('Zurich');
    expect(objLogo!.src).toContain('resources/zurich/');

    // Y no hay navegación del DS en la página: la ausencia es la decisión, no un olvido.
    expect(raiz().querySelector('lib-navigation-z')).toBeNull();
  });

  it('el banner lleva SOLO el titular por `content`, y el intro va fuera', () => {
    const objBanner = raiz().querySelector('lib-stage-banner-z');
    expect(objBanner).not.toBeNull();

    // `content` es un input de INSTANCIA (Angular `input()`), no un atributo reflejado: se lee del
    // componente, no del DOM.
    const objInstancia = objFixture.debugElement
      .query((in_objNodo) => in_objNodo.componentInstance instanceof ZrStageBanner)
      .componentInstance as ZrStageBanner;
    expect(objInstancia.content).toBe('Radica tu PQR');

    // El titular viaja como texto plano: nada de markup compuesto (que el wrapper escaparía).
    expect(objInstancia.content).not.toContain('<');

    // `category` se ata a '' a propósito: su default es el literal 'Category Header', que se
    // pintaría en inglés ARRIBA del titular. Este caso lo destapó de verdad al escribirlo.
    expect(objInstancia.category).toBe('');

    // El intro se pinta fuera del banner.
    const objIntro = raiz().querySelector('.pqr-intro');
    expect(objIntro!.textContent).toContain('Completa el formulario');
    expect(objBanner!.contains(objIntro)).toBe(false);
  });

  it('los colores del banner van por `customStr`, no por un style del host', () => {
    const objInstancia = objFixture.debugElement
      .query((in_objNodo) => in_objNodo.componentInstance instanceof ZrStageBanner)
      .componentInstance as ZrStageBanner;

    // El default del wrapper es un cian crudo (`bg: #73DCE6; color: #000;`) que su hijo
    // `z-stage-banner` convierte en estilo INLINE del <section> interno — un `style` en el host
    // pierde contra eso. Si alguien saca este binding, el banner sale cian.
    expect(objInstancia.customStr).toContain('var(--z-blue)');
    expect(objInstancia.customStr).toContain('var(--zg-white-zurich)');
    // Y sin hex crudo: la regla de tokens del proyecto.
    expect(objInstancia.customStr).not.toContain('#');
  });

  it('la sección pinta título y divisoria, y proyecta su contenido', () => {
    expect(raiz().querySelector('.pqr-section-title')!.textContent).toContain(
      'Datos del consumidor',
    );
    // La divisoria es un `<hr>` propio de la sección, no un borde del card.
    expect(raiz().querySelector('.pqr-section .pqr-section-divider')).not.toBeNull();
    // Y lo proyectado quedó adentro (si `<ng-content>` faltara, la sección saldría vacía sin error).
    expect(raiz().querySelectorAll('.pqr-section .pqr-readonly').length).toBe(2);
  });

  it('un valor vacío de solo lectura cae al guion, y uno con valor se respeta', () => {
    const cllValores = Array.from(raiz().querySelectorAll('.pqr-readonly-value')).map(
      (in_objNodo) => in_objNodo.textContent!.trim(),
    );
    // El guion es contrato: una celda en blanco al lado de campos llenos se lee como "no cargó".
    expect(cllValores).toEqual(['—', 'Natural']);
  });
});
