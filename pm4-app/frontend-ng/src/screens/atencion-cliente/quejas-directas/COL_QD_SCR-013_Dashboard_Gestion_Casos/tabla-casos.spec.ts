import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZrButton, ZrTable, ZrTag } from '../../../../components/fields/zds-reexports';
import type { CasoDashboard } from '../fields/types';
import { TablaCasos } from './tabla-casos';

/**
 * SCR-013 · la tabla consolidada de casos — una regla por caso.
 *
 * ── Por qué tiene spec aparte de la pantalla ──────────────────────────────────────────────────────
 * Mismo criterio que `detalle-caso-modal.spec.ts`: la tabla entra por **tres entradas puras** (la
 * lista de casos y los dos mapas código→descripción) y sale por un `output`. No toca el `FormGroup`,
 * no toca PM4 y no tiene HTTP que drenar. Probarla desde el tablero costaría montar la pantalla y
 * drenar cuatro peticiones para mover una celda.
 *
 * ── La regla central: los DOS slots del DS, que es donde el porte puede degradarse en silencio ────
 * `ZrTable` **es** `TableZ` de `lib-zurich`: no proyecta markup, arma la tabla desde
 * `[headers]`/`[data]` y expone exactamente **dos** huecos templateables. Esta pantalla necesita
 * exactamente dos celdas no-texto (la píldora de Estado y el botón Ver), así que la asignación es
 * forzada y **frágil por tres motivos distintos**, cada uno con su caso acá:
 *
 * 1. Los `id="start"`/`id="end"` son literales que `TableZ` compara en un `switch`. Cualquier otro id
 *    cae en `columnTemplates`, que **nunca se lee**: el template se pasa, nadie lo pinta, y la celda
 *    desaparece sin ningún error.
 * 2. `generciEndName` **va con el typo de la librería**. Su hermano `genericStartName` está bien
 *    escrito, lo que hace que corregirlo "de paso" sea el error natural — y el rótulo de la columna
 *    Acción se cae sin avisar.
 * 3. El empty state es un **hermano** de la tabla, no un `@if` que la envuelva. Envolverla se comería
 *    los rótulos de las ocho columnas cuando la lista está vacía, que es justo cuando el usuario
 *    necesita ver contra qué está filtrando.
 *
 * Ninguna de las tres pone rojo nada por sí sola: la pantalla sigue montando y la tabla sigue
 * pintando filas. Son exactamente el tipo de degradación que sin un caso propio se descubre en
 * producción.
 *
 * ── ⚠ Se monta dentro de un HOST y se leen las INSTANCIAS del DS ───────────────────────────────────
 * El host es cómo la pantalla la consume de verdad (un binding renombrado en
 * `dashboard-gestion-casos.html` se vería acá). Y los inputs de `TableZ`/`ButtonZ` son `@Input()` de
 * Angular, no atributos reflejados: `getAttribute('generciEndName')` devuelve `null` aunque el binding
 * esté puesto y funcionando. Ver el ⚠ de `hijo()` en `detalle-caso-modal.spec.ts`.
 */

@Component({
  standalone: true,
  imports: [TablaCasos],
  template: `
    <app-tabla-casos
      [casos]="sigCasos()"
      [tipoMap]="dicTipoMap"
      [areaMap]="dicAreaMap"
      (ver)="cllVistos.push($event)"
    />
  `,
})
class HostTabla {
  readonly sigCasos = signal<readonly CasoDashboard[]>([caso()]);
  dicTipoMap: Record<string, string> = { '1': 'Queja' };
  dicAreaMap: Record<string, string> = { '35': 'Siniestros Autos' };
  cllVistos: CasoDashboard[] = [];
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
    descripcion: 'Demora en la liquidación del siniestro.',
    ...in_dicOverrides,
  };
}

let objFixture: ComponentFixture<HostTabla>;
let objHost: HostTabla;

function montar(in_cllCasos: readonly CasoDashboard[] = [caso()]): void {
  TestBed.configureTestingModule({});
  objFixture = TestBed.createComponent(HostTabla);
  objHost = objFixture.componentInstance;
  objHost.sigCasos.set(in_cllCasos);
  objFixture.detectChanges();
}

/** La instancia de un componente hijo del DS, buscada por tipo. Ver el ⚠ de la cabecera. */
function hijo<T>(in_objTipo: abstract new (...in_cllArgs: never[]) => T): T {
  return objFixture.debugElement.query((in_objNodo) => in_objNodo.componentInstance instanceof in_objTipo)
    .componentInstance as T;
}

/** Los rótulos de las columnas tal como los pinta el `<thead>`. */
function cllEncabezados(): string[] {
  return Array.from(
    objFixture.nativeElement.querySelectorAll('lib-table-z thead th') as NodeListOf<HTMLElement>,
  ).map((in_objTh) => (in_objTh.textContent ?? '').trim());
}

/** Las celdas de la primera fila, en orden. */
function cllCeldas(in_intFila = 0): HTMLElement[] {
  const cllFilas = Array.from(
    objFixture.nativeElement.querySelectorAll('lib-table-z tbody tr') as NodeListOf<HTMLElement>,
  );
  return Array.from((cllFilas[in_intFila]?.querySelectorAll('td') ?? []) as NodeListOf<HTMLElement>);
}

beforeEach(() => {
  TestBed.resetTestingModule();
});

describe('TablaCasos (SCR-013)', () => {
  it('⚠ el Estado va en la PRIMERA celda como píldora y "Ver" en la ÚLTIMA como botón', () => {
    montar([caso({ estado: 'Vencida' })]);

    // **Este es el caso que fija la decisión de diseño del porte.** Los dos slots del DS son `start` y
    // `end` y no hay tercero, así que Estado se corre a la primera columna y Ver queda al final, con
    // las ocho de texto en el medio. Si alguien intercambiara los `id` de los dos `ng-template`, la
    // tabla seguiría pintando las dos celdas —solo cambiadas de lugar— y nada más se pondría rojo.
    const cllTd = cllCeldas();
    expect(cllTd).toHaveLength(10);
    expect(cllTd[0].querySelector('zds-status-badge')).not.toBeNull();
    expect(cllTd[0].textContent?.trim()).toBe('Vencida');
    expect(cllTd[9].querySelector('lib-button-z')).not.toBeNull();

    // Y la variante llega hasta el `fill` del tag: 'Vencida' → `danger` → `peach`. Sin esta línea un
    // `variante()` que devolviera siempre 'neutral' pasaría igual, porque el texto de la píldora no
    // cambia con el color.
    //
    // ⚠ Se lee el `fill` de la INSTANCIA del `za-tag`, no un atributo del host. La primera versión de
    // esta línea era `getAttribute('variante')` y comparaba `'' !== ''`: `variante` es un `input()` de
    // Angular, así que el atributo **no existe** y la aserción no podía pasar. Es exactamente la
    // trampa que documenta el `hijo()` de `detalle-caso-modal.spec.ts`.
    //
    // La clase viene por la **fachada** (`ZrTag`), no de `@zurich/angular-components`: la exención de
    // `no-restricted-imports` cubre `components/fields/**`, no los specs de pantalla. Ver el comentario
    // de esa re-exportación sobre por qué existe si ninguna plantilla la usa.
    expect(hijo(ZrTag).fill).toBe('peach');
  });

  it('⚠ los diez rótulos, con "Estado" primero y "Acción" último (el typo de `generciEndName`)', () => {
    montar();

    // **La mitad de "Acción" es la que justifica el caso.** El input de la librería se llama
    // `generciEndName` —con el typo— mientras su hermano es `genericStartName`. Escribirlo bien es el
    // error natural, y el resultado es una columna sin rótulo: la tabla no falla, el `<th>` sale
    // vacío. Se asevera la lista completa y en orden porque el orden ES el contrato con el diseño.
    expect(cllEncabezados()).toEqual([
      'Estado',
      '# Caso',
      'Tipo',
      'Creación',
      'SLA',
      'Vencimiento',
      'Días restantes',
      'Área',
      'Responsable',
      'Acción',
    ]);
  });

  it('⚠ los `id` de los dos slots son "start" y "end", los únicos que `TableZ` reconoce', () => {
    montar();

    // `ngAfterContentInit` de `TableZ` hace `switch (item.id)` con esos dos literales; cualquier otro
    // valor cae en `columnTemplates`, que se llena y **nunca se lee**. O sea: el template se pasa,
    // nadie lo pinta y la celda desaparece sin error. Se asevera sobre los flags de la INSTANCIA
    // —no sobre atributos del DOM, que no existen— más el efecto visible de que las dos celdas se
    // pintaron, que es lo que distingue "el id es correcto" de "el id es cualquiera".
    const objTabla = hijo(ZrTable);
    expect(objTabla.showGenericStart).toBe(true);
    expect(objTabla.showGenericEnd).toBe(true);
    expect(cllCeldas()[0].querySelector('zds-status-badge')).not.toBeNull();
    expect(cllCeldas()[9].querySelector('lib-button-z')).not.toBeNull();
  });

  it('las ocho columnas de texto llegan ya RESUELTAS, con Tipo y Área en su descripción', () => {
    montar();

    // `TableZ` lee `row[header.key]` y lo pinta como texto: no hay dónde resolver un código dentro de
    // la tabla, así que todo cálculo tiene que estar hecho antes de entrar. Se asevera el contenido de
    // las ocho celdas del medio, que es lo que el usuario lee.
    const cllTd = cllCeldas();
    expect(cllTd.slice(1, 9).map((in_objTd) => (in_objTd.textContent ?? '').trim())).toEqual([
      'QD-2026-000123',
      'Queja',            // ← código '1' resuelto por tipoMap
      '01/08/2026',
      '15 días',          // ← `${sla} días`, armado en la fila
      '15/08/2026',
      '3 días',           // ← diasRestantesTexto()
      'Siniestros Autos', // ← código '35' resuelto por areaMap
      'Laura González',
    ]);
  });

  it('un código sin entrada en el mapa cae al CÓDIGO, y un campo vacío al guion', () => {
    // Las dos mitades del `(dic[codigo] ?? codigo) || '—'`, más el `sla` vacío y el `responsable`
    // vacío. Con solo la primera, un `|| '—'` borrado pasaría; con solo la segunda, un `?? ''` en vez
    // de `?? codigo` pasaría también.
    montar([caso({ tipoSolicitud: '99', areaResponsable: '', sla: '', responsable: '' })]);

    const cllTexto = cllCeldas().slice(1, 9).map((in_objTd) => (in_objTd.textContent ?? '').trim());
    expect(cllTexto[1]).toBe('99'); // Tipo: no está en el mapa → el código crudo
    expect(cllTexto[3]).toBe('—');  // SLA vacío → guion, NO "días" pelado
    expect(cllTexto[6]).toBe('—');  // Área vacía → guion
    expect(cllTexto[7]).toBe('—');  // Responsable vacío → guion
  });

  it('⚠ con la lista vacía el mensaje aparece y los ENCABEZADOS sobreviven', () => {
    montar([]);

    // **La segunda mitad es el punto entero del caso.** El empty state es un bloque hermano y no un
    // `@if` que envuelva la tabla, porque el `<tbody>` de `TableZ` es un `@for` pelado sin rama de
    // lista vacía: con `data: []` pinta el encabezado y nada más. Envolverla en un `@if` se comería
    // los diez rótulos justo cuando el usuario necesita ver contra qué está filtrando — y un caso que
    // solo aseverara el mensaje quedaría verde con esa regresión puesta.
    expect((objFixture.nativeElement as HTMLElement).textContent).toContain(
      'No hay casos que coincidan con los filtros seleccionados.',
    );
    expect(cllCeldas()).toHaveLength(0);
    expect(cllEncabezados()).toHaveLength(10);
    expect(cllEncabezados()[0]).toBe('Estado');
  });

  it('con casos el mensaje de lista vacía NO está', () => {
    montar();

    // La otra mitad del `@if`: sin este caso, un mensaje dejado siempre visible pasaría inadvertido.
    expect((objFixture.nativeElement as HTMLElement).textContent).not.toContain(
      'No hay casos que coincidan',
    );
  });

  it('"Ver" emite el caso COMPLETO de su propia fila, y no nace deshabilitado', () => {
    const objUno = caso({ id: 1, numeroCaso: 'C-1' });
    const objDos = caso({ id: 2, numeroCaso: 'C-2' });
    montar([objUno, objDos]);

    // `lib-button-z` tiene `disabled = true` por default (fijado en `zds-reexports.spec.ts`): sin el
    // `[disabled]="false"` explícito el botón pinta igual y no dispara nunca.
    expect(hijo(ZrButton).disabled).toBe(false);

    // Se aprieta el de la SEGUNDA fila: el contexto que `TableZ` inyecta es `{value: row}`, así que un
    // template que leyera la fila equivocada —o el primer caso de la lista— abriría el modal del caso
    // de al lado. Con una sola fila ese bug es invisible.
    const cllBotones = Array.from(
      objFixture.nativeElement.querySelectorAll('lib-table-z tbody lib-button-z') as NodeListOf<HTMLElement>,
    );
    expect(cllBotones).toHaveLength(2);
    cllBotones[1].dispatchEvent(new CustomEvent('eventClick'));
    objFixture.detectChanges();

    // El objeto completo, no el número: la pantalla necesita el caso entero para el modal.
    expect(objHost.cllVistos).toEqual([objDos]);
  });
});
