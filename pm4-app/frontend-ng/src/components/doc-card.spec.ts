import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DocCardComponent } from './doc-card';

/**
 * Port de `components/DocCard.test.tsx` (4 casos), más 2 casos propios.
 *
 * Los 4 de React van 1:1: nombre/meta/acciones se pintan · sin `isOpen` no hay cuerpo aunque haya
 * contenido · con `isOpen` + contenido se pinta el cuerpo y la card queda `is-open` · con `isOpen`
 * pero SIN contenido no hay `.doc-viewer`.
 *
 * ── El 4º caso es el que obligó a usar `contentChild`, y por eso importa portarlo ─────────────────
 * En React salía gratis (`isOpen && children`). En Angular, con un `ng-content` a secas, el wrapper
 * existiría siempre y ese caso sería **imposible de hacer pasar**: la card abierta sin cuerpo pintaría
 * una banda con el padding de `.doc-viewer`. La alternativa de `FormSection` (`:empty`) tapa el nodo en
 * el navegador pero no le dice nada al template, y acá la misma condición gobierna también la clase
 * `is-open` del header. Ver el ⚠ del componente.
 *
 * ── Los 2 casos propios ──────────────────────────────────────────────────────────────────────────
 * 1. **Cerrar una card abierta desmonta el cuerpo.** Los otros casos montan cada estado desde cero;
 *    este asevera la transición, que es como la usa una pantalla de verdad (el usuario expande y
 *    colapsa el mismo archivo).
 * 2. **`is-open` y `.doc-viewer` no pueden divergir.** Son la mitad visible y la mitad estructural de
 *    la misma decisión; si se gobernaran por separado, una card podría quedar con el header azul de
 *    "abierta" y sin cuerpo debajo, que se lee como un error de carga.
 */

@Component({
  standalone: true,
  imports: [DocCardComponent],
  template: `
    <app-doc-card [fileName]="nombre()" [isOpen]="abierta()">
      <span meta>2,4 MB · 12/08/2026</span>
      <button actions>Descargar</button>
      @if (conCuerpo()) {
        <div #viewer viewer class="cuerpo-falso">Vista previa</div>
      }
    </app-doc-card>
  `,
})
class Host {
  readonly nombre = signal('acta-de-reclamo.pdf');
  readonly abierta = signal(false);
  readonly conCuerpo = signal(true);
}

describe('DocCardComponent', () => {
  let objFixture: ComponentFixture<Host>;

  function card(): HTMLElement {
    return objFixture.nativeElement.querySelector('.doc-card') as HTMLElement;
  }

  function cuerpo(): HTMLElement | null {
    return objFixture.nativeElement.querySelector('.doc-viewer');
  }

  /** Fija el estado del host y espera el render. */
  async function conEstado(in_blnAbierta: boolean, in_blnConCuerpo: boolean): Promise<void> {
    objFixture.componentInstance.abierta.set(in_blnAbierta);
    objFixture.componentInstance.conCuerpo.set(in_blnConCuerpo);
    await objFixture.whenStable();
  }

  beforeEach(async () => {
    objFixture = TestBed.createComponent(Host);
    await objFixture.whenStable();
  });

  it('renderiza el nombre, el meta y las acciones', () => {
    expect(objFixture.nativeElement.querySelector('.doc-name')!.textContent).toContain(
      'acta-de-reclamo.pdf',
    );
    // Cada slot en SU lugar, no solo presente en la card: el `select` del `ng-content` es lo que se
    // está probando, y un texto suelto en cualquier parte pasaría igual.
    expect(objFixture.nativeElement.querySelector('.doc-meta')!.textContent).toContain('2,4 MB');
    expect(objFixture.nativeElement.querySelector('.doc-actions')!.textContent).toContain(
      'Descargar',
    );
    // El ícono del archivo es fijo en el original y se preserva.
    const objIcono = objFixture.nativeElement.querySelector('za-icon') as HTMLElement;
    expect(objIcono).not.toBeNull();
    // ⚠ El input es `icon`, no `name` (`NG8008` si falta). Se asevera el atributo reflejado.
    expect(objIcono.getAttribute('icon')).toBe('file-blank:line');
  });

  it('sin isOpen no monta el cuerpo, aunque la pantalla proyecte contenido', async () => {
    await conEstado(false, true);

    expect(cuerpo()).toBeNull();
    expect(card().classList.contains('is-open')).toBe(false);
    // Y el contenido proyectado NO quedó pintado en otro lado (por ejemplo si el `select` fallara y
    // cayera en un catch-all): la ausencia tiene que ser real, no un traslado.
    expect(card().textContent).not.toContain('Vista previa');
  });

  it('con isOpen y contenido monta el cuerpo y marca la card como is-open', async () => {
    await conEstado(true, true);

    expect(cuerpo()).not.toBeNull();
    expect(cuerpo()!.querySelector('.cuerpo-falso')).not.toBeNull();
    expect(cuerpo()!.textContent).toContain('Vista previa');
    expect(card().classList.contains('is-open')).toBe(true);
  });

  it('⚠ con isOpen pero SIN contenido no monta el .doc-viewer', async () => {
    // El caso que obligó al `contentChild` (ver el docstring). `.doc-viewer` tiene padding y fondo
    // propios, así que un wrapper vacío se vería como una banda gris de relleno bajo el header.
    await conEstado(true, false);

    expect(cuerpo()).toBeNull();
    // Y el header tampoco se pinta como abierto: sin cuerpo, "abierta" no significa nada para el
    // usuario y el azul se leería como un error de carga.
    expect(card().classList.contains('is-open')).toBe(false);
    // La card sigue existiendo con su nombre: la ausencia del cuerpo no vació la card entera.
    expect(objFixture.nativeElement.querySelector('.doc-name')!.textContent).toContain(
      'acta-de-reclamo.pdf',
    );
  });

  it('colapsar una card abierta desmonta el cuerpo', async () => {
    // Caso propio: los anteriores montan cada estado desde cero, y una pantalla real alterna el mismo
    // archivo. Sin esto, el componente podría "funcionar" solo en el estado con el que se montó.
    await conEstado(true, true);
    expect(cuerpo()).not.toBeNull();

    await conEstado(false, true);
    expect(cuerpo()).toBeNull();
    expect(card().classList.contains('is-open')).toBe(false);

    // Y vuelve a abrir: la transición funciona en las dos direcciones.
    await conEstado(true, true);
    expect(cuerpo()).not.toBeNull();
    expect(card().classList.contains('is-open')).toBe(true);
  });

  it('is-open y .doc-viewer nunca divergen, en las 4 combinaciones', async () => {
    // Caso propio, y es el que fija la invariante: las dos mitades de la misma decisión (la clase del
    // header y el montaje del cuerpo) salen de un solo predicado. Si alguien las gobernara por
    // separado —por ejemplo `[class.is-open]="isOpen()"` a secas— este caso se pone rojo en la
    // combinación abierta-sin-cuerpo.
    for (const objCaso of [
      { abierta: false, cuerpo: false },
      { abierta: false, cuerpo: true },
      { abierta: true, cuerpo: false },
      { abierta: true, cuerpo: true },
    ]) {
      await conEstado(objCaso.abierta, objCaso.cuerpo);

      const blnClase = card().classList.contains('is-open');
      const blnCuerpo = cuerpo() !== null;
      expect(blnClase, `combinación ${JSON.stringify(objCaso)}`).toBe(blnCuerpo);
      // Y el valor esperado, para que la invariante no se cumpla por estar las dos siempre en false.
      expect(blnCuerpo, `combinación ${JSON.stringify(objCaso)}`).toBe(
        objCaso.abierta && objCaso.cuerpo,
      );
    }
  });
});
