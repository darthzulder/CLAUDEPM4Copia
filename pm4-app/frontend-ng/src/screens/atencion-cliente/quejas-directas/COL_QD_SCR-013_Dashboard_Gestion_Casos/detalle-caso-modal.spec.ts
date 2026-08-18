import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZrButton, ZrTag } from '../../../../components/fields/zds-reexports';
import type { CasoDashboard } from '../fields/types';
import { DetalleCasoModal } from './detalle-caso-modal';

/**
 * SCR-013 · modal PAN-13 — el detalle de un caso, una regla por caso.
 *
 * ── Por qué tiene spec aparte de la pantalla ──────────────────────────────────────────────────────
 * Mismo criterio que `expediente-completo-modal.spec.ts` de SCR-0051: su lógica entra por **entradas
 * puras** (un `CasoDashboard` y dos mapas de código→descripción) y no toca ni el `FormGroup` ni PM4.
 * Probarlo desde la pantalla obligaría a montar el tablero, drenar cuatro peticiones y apretar "Ver"
 * para mover un solo campo del modal — y cada caso costaría ese montaje completo.
 *
 * ── La regla central: el Estado es una PÍLDORA, y esa es la que se rompe sola ──────────────────────
 * Las otras seis filas de la barra son texto, así que un `computed` que devolviera strings las pintaría
 * todas bien. La fila Estado va por el camino del `TemplateRef` de `app-info-bar` —el mecanismo que
 * `info-bar.ts` expone justamente por esta pantalla— y es el único que puede degradarse sin que nada
 * más se note: si el `viewChild('tplEstado')` se renombra o el `computed` deja de leerlo, la fila cae
 * al texto del estado, que **es información correcta**. La pantalla se seguiría viendo razonable y
 * ningún caso que contara pares etiqueta/valor se pondría rojo. Por eso el caso asevera que existe un
 * `<za-tag>` **dentro de la celda de valor de la fila Estado**, no en cualquier parte del modal.
 *
 * ── ⚠ Se monta dentro de un HOST, no con `createComponent` directo ────────────────────────────────
 * `caso` es `input.required`, y un `input.required` sin valor tira NG0950 al leerse. El host lo provee
 * por plantilla, que además es cómo la pantalla lo consume de verdad: un binding renombrado en
 * `dashboard-gestion-casos.html` se vería acá.
 *
 * ── No hay `HttpTestingController`, y es una diferencia real con el modal de SCR-0051 ─────────────
 * Aquel monta `app-request-file-list`, que pide los archivos del request. Este modal no pide nada: la
 * foto del caso ya viene resuelta desde el tablero. Sin peticiones no hay nada que drenar ni que
 * verificar, así que agregar el mock sería ceremonia.
 */

/**
 * Host mínimo. Los inputs van por plantilla y no por `setInput()` a propósito — es la forma en que la
 * pantalla lo consume, y `sigCaso` permite cambiar el caso sin volver a montar.
 */
@Component({
  standalone: true,
  imports: [DetalleCasoModal],
  template: `
    <app-detalle-caso-modal
      [caso]="sigCaso()"
      [tipoMap]="dicTipoMap"
      [areaMap]="dicAreaMap"
      (cerrar)="intCerrado = intCerrado + 1"
    />
  `,
})
class HostDetalle {
  readonly sigCaso = signal<CasoDashboard>(caso());
  dicTipoMap: Record<string, string> = { '1': 'Queja' };
  dicAreaMap: Record<string, string> = { '35': 'Siniestros Autos' };
  intCerrado = 0;
}

/** Un caso con todos los campos poblados. Los `overrides` son lo que cada caso mueve. */
function caso(in_dicOverrides: Partial<CasoDashboard> = {}): CasoDashboard {
  return {
    id: 7,
    numeroCaso: 'QD-2026-000123',
    tipoSolicitud: '1',
    fechaCreacion: '01/08/2026',
    fechaVencimiento: '15/08/2026',
    sla: '15',
    diasRestantes: 3,
    estado: 'Abierta',
    areaResponsable: '35',
    responsable: 'Laura González',
    descripcion: 'El cliente reporta demora en la liquidación del siniestro.',
    ...in_dicOverrides,
  };
}

let objFixture: ComponentFixture<HostDetalle>;
let objHost: HostDetalle;

function montar(in_objCaso: CasoDashboard = caso()): void {
  TestBed.configureTestingModule({});
  objFixture = TestBed.createComponent(HostDetalle);
  objHost = objFixture.componentInstance;
  objHost.sigCaso.set(in_objCaso);
  objFixture.detectChanges();
}

/**
 * Las siete filas de la barra como pares `label → texto del valor`.
 *
 * Se lee del DOM y no del `computed()`: la fila Estado viaja como `TemplateRef`, así que leer
 * `cllItems()` devolvería el objeto `TemplateRef` y el caso no distinguiría "se renderizó la píldora"
 * de "se pasó el template y nadie lo pintó".
 */
function dicFilas(): Record<string, string> {
  const cllItems = Array.from(
    objFixture.nativeElement.querySelectorAll('.info-bar-item') as NodeListOf<HTMLElement>,
  );
  return Object.fromEntries(
    cllItems.map((in_objItem) => [
      (in_objItem.querySelector('.info-bar-label')?.textContent ?? '').trim(),
      (in_objItem.querySelector('.info-bar-value')?.textContent ?? '').trim(),
    ]),
  );
}

/**
 * La instancia de un componente hijo del DS, buscada por tipo.
 *
 * ⚠ **Los inputs del DS son propiedades de la INSTANCIA, no atributos del DOM.** `fill` y `disabled`
 * son `@Input()` de Angular, así que `getAttribute('fill')` devuelve `null` y `(host as any).disabled`
 * devuelve `undefined` aunque el binding esté puesto y funcionando — la primera versión de estos dos
 * casos fallaba por eso, no porque la implementación estuviera mal. Es el mismo helper que usan
 * `zds-status-badge.spec.ts` y `zds-reexports.spec.ts`; el `abstract new` es porque varios componentes
 * del DS tienen dependencias en el constructor y solo se los usa como operando de `instanceof`.
 */
function hijo<T>(in_objTipo: abstract new (...in_cllArgs: never[]) => T): T {
  return objFixture.debugElement.query((in_objNodo) => in_objNodo.componentInstance instanceof in_objTipo)
    .componentInstance as T;
}

/** La celda de valor de una fila de la barra, por su rótulo. `null` si esa fila no existe. */
function objCeldaDe(in_strLabel: string): HTMLElement | null {
  const cllItems = Array.from(
    objFixture.nativeElement.querySelectorAll('.info-bar-item') as NodeListOf<HTMLElement>,
  );
  const objFila = cllItems.find(
    (in_objItem) => (in_objItem.querySelector('.info-bar-label')?.textContent ?? '').trim() === in_strLabel,
  );
  return (objFila?.querySelector('.info-bar-value') as HTMLElement | undefined) ?? null;
}

beforeEach(() => {
  TestBed.resetTestingModule();
});

describe('DetalleCasoModal (SCR-013 · PAN-13)', () => {
  it('el Estado se pinta como PÍLDORA dentro de su propia celda, no como texto pelado', () => {
    montar(caso({ estado: 'Vencida' }));

    // La aserción es sobre la celda de **esa** fila y no sobre el modal entero: hay otro
    // `zds-status-badge` en la tabla del tablero, y buscar el tag a nivel documento dejaría el caso
    // verde aunque la fila Estado hubiera caído al texto.
    const objCelda = objCeldaDe('Estado');
    expect(objCelda).not.toBeNull();
    expect(objCelda?.querySelector('za-tag')).not.toBeNull();
    expect(objCelda?.textContent?.trim()).toBe('Vencida');

    // Y la variante llega hasta el `fill` del tag: 'Vencida' → `danger` → `peach`. Sin esta línea un
    // `estadoVariante()` que devolviera siempre 'neutral' pasaría igual, porque el texto de la
    // píldora no cambia con el color. Se asevera el `fill` y no el input `variante` a propósito: el
    // input es lo que la plantilla escribe, el `fill` es lo que el usuario ve. La búsqueda por tipo es
    // inequívoca acá — este modal tiene exactamente un `za-tag`, y el `querySelector` de arriba ya
    // fijó que está dentro de la celda de Estado.
    //
    // La clase viene por la **fachada** (`ZrTag`), no de `@zurich/angular-components`: la exención de
    // `no-restricted-imports` cubre `components/fields/**` y **no** los specs de pantalla. Se importaba
    // directo hasta que `npm run verify` lo puso rojo — el lint del workspace es el que manda, no el
    // precedente de este archivo.
    expect(hijo(ZrTag).fill).toBe('peach');
  });

  it('el título y el subtítulo resuelven Tipo y Área a su DESCRIPCIÓN, no al código', () => {
    montar();

    const strTexto = (objFixture.nativeElement as HTMLElement).textContent ?? '';
    // Los códigos crudos ('1', '35') no deben aparecer donde va la descripción: es lo que distingue
    // un mapeo real de un `?? codigo` que nunca encuentra la clave.
    expect(strTexto).toContain('Caso #QD-2026-000123 — Queja');
    expect(strTexto).toContain('Siniestros Autos · Responsable: Laura González');
  });

  it('un código sin entrada en el mapa cae al CÓDIGO, y un código vacío al guion', () => {
    // Las dos mitades del `(dic[codigo] ?? codigo) || '—'`. Con solo la primera, un `|| '—'` borrado
    // pasaría; con solo la segunda, un `?? ''` en vez de `?? codigo` pasaría también.
    montar(caso({ tipoSolicitud: '99', areaResponsable: '' }));

    const strTexto = (objFixture.nativeElement as HTMLElement).textContent ?? '';
    expect(strTexto).toContain('Caso #QD-2026-000123 — 99');
    expect(strTexto).toContain('— · Responsable: Laura González');
  });

  it('las siete filas de la barra van en el orden de React, con el SLA en días HÁBILES', () => {
    montar();

    // El orden es contrato con el diseño: se asevera la lista de rótulos, no solo su presencia.
    expect(Object.keys(dicFilas())).toEqual([
      'Estado',
      'Tipo de solicitud',
      'Fecha de creación',
      'SLA asignado',
      'Fecha de vencimiento',
      'Días restantes',
      'Área responsable',
    ]);

    // ⚠ "días hábiles", no "días": el sufijo es distinto del de la tabla (`slaTexto` usa "días") y
    // se copió de React tal cual. Un unificado bienintencionado se ve acá.
    expect(dicFilas()['SLA asignado']).toBe('15 días hábiles');
    expect(dicFilas()['Días restantes']).toBe('3 días');
  });

  it('sin SLA la fila muestra el guion, no "null días hábiles"', () => {
    montar(caso({ sla: '' }));

    expect(dicFilas()['SLA asignado']).toBe('—');
  });

  it('sin descripción muestra la leyenda, no una celda vacía', () => {
    // Una celda en blanco se lee como "la pantalla no cargó"; la leyenda dice que el dato no existe.
    montar(caso({ descripcion: '' }));

    expect((objFixture.nativeElement as HTMLElement).textContent).toContain('Sin descripción registrada.');
  });

  it('⚠ el `(close)` del modal del DS emite `cerrar`, igual que el botón Cerrar', () => {
    montar();
    expect(objHost.intCerrado).toBe(0);

    // **Este caso es la razón por la que `(close)` está en la plantilla.** `ModalZ.change()` hace
    // `open = false` sobre su **propio** input, así que cerrar desde el backdrop o la X no avisa a
    // nadie: `sigCasoSel` del tablero se queda con el caso y el modal no vuelve a abrir. Sin este
    // caso, borrar el `(close)` deja la suite verde y el bug solo aparece al segundo clic en "Ver".
    const objModal = objFixture.nativeElement.querySelector('lib-modal-z') as HTMLElement;
    expect(objModal).not.toBeNull();
    objModal.dispatchEvent(new CustomEvent('close'));
    objFixture.detectChanges();

    expect(objHost.intCerrado).toBe(1);
  });

  it('el botón Cerrar también emite, y NO nace deshabilitado', () => {
    montar();

    // `lib-button-z` tiene `disabled = true` por default (fijado en `zds-reexports.spec.ts`): sin el
    // `[disabled]="false"` explícito el botón pinta igual y no dispara nunca. Se asevera el input
    // además del evento, y se lee de la INSTANCIA — en el host del DOM ese input no existe.
    expect(hijo(ZrButton).disabled).toBe(false);

    const objBoton = objFixture.nativeElement.querySelector('lib-button-z') as HTMLElement;
    objBoton.dispatchEvent(new CustomEvent('eventClick'));
    objFixture.detectChanges();

    expect(objHost.intCerrado).toBe(1);
  });
});
