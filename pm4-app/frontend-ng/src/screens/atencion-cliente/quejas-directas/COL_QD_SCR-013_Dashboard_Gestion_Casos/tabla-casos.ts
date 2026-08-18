import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ZdsStatusBadge } from '../../../../components/fields/zds-status-badge';
import {
  type ModeloTablaZr, ZrButton, ZrTable, ZrTemplate,
} from '../../../../components/fields/zds-reexports';
import { diasRestantesTexto, estadoVariante } from './dashboard-helpers';
import type { CasoDashboard } from '../fields/types';

/**
 * Una fila ya resuelta a texto para `lib-table-z`, más lo que los dos slots necesitan.
 *
 * `TableZ` lee cada columna con `row[header.key]` y la pinta como texto, así que todo lo que sea
 * cálculo —resolver el código de la colección, el `${sla} días`, el texto de días restantes— tiene que
 * estar **hecho** antes de entrar. `caso` viaja en la fila porque los dos `ng-template` reciben la fila
 * completa como contexto (`{value: row}`) y desde ahí despachan el click y la píldora.
 *
 * Sin `readonly` en los campos: el input `data` de `TableZ` es mutable y un array de objetos
 * `readonly` rebota con TS4104.
 */
interface FilaCaso {
  numeroCaso: string;
  tipo: string;
  fechaCreacion: string;
  slaTexto: string;
  fechaVencimiento: string;
  diasTexto: string;
  area: string;
  responsable: string;
  caso: CasoDashboard;
}

/**
 * Tabla consolidada de casos (SCR-013). Port de `TablaCasos.tsx`.
 *
 * ── ⚠ Las columnas se REORDENAN respecto de React, y es la decisión de diseño del porte ──────────
 * React arma un `<table>` a mano dentro de `ZrTable` y pinta diez columnas en su orden natural, dos de
 * ellas con markup: **Estado** (píldora del DS) y **Acción** (botón Ver). En Angular `ZrTable` **es**
 * `TableZ` de `lib-zurich` (ver `zds-reexports.ts`), que no proyecta markup: arma la tabla desde
 * `[headers]`/`[data]` y solo expone **dos** huecos templateables, `start` y `end` — su
 * `columnTemplates` se llena en `ngAfterContentInit` y **nunca se lee**.
 *
 * Con exactamente dos celdas no-texto y exactamente dos slots, la asignación es forzada:
 *
 * | React (orden original)                                    | Angular                        |
 * |-----------------------------------------------------------|--------------------------------|
 * | …, Días restantes, **Estado**, Área, Responsable, **Ver**  | **Estado** (`start`), …, **Ver** (`end`) |
 *
 * O sea: **Estado se corre a la primera columna** y las ocho de texto quedan detrás, con Ver al final.
 * Se eligió esto y no degradar la píldora a texto porque la regla del proyecto es explícita —"gana el
 * componente del DS"— y porque el color del estado es el dato que un supervisor lee primero: ponerlo
 * primero no es una pérdida, es un orden distinto. Queda anotado en la ficha 2.0 como diferencia visual
 * conocida del porte.
 *
 * **Descartado `isTag`**, que sería la vía sin slots: `validColorByCoincidencia()` arranca en
 * `let color = '#000000'` y compara contra un vocabulario fijo en inglés
 * (`['Error','No disponible',…]`, `['OK','Disponible','Activo','ACTIVO']`, `['Warning',…]`,
 * `['Archivado']`). Ninguno de los cinco estados de esta pantalla —`Abierta`, `Por Vencer`, `Vencida`,
 * `Cerrada`, `Cancelada`— está ahí: serían cinco píldoras negras. Mismo hallazgo ya reportado en
 * SCR-0051, ahora con una segunda pantalla afectada.
 *
 * ── El empty state va AFUERA de la tabla, no envolviéndola ────────────────────────────────────────
 * En React el componente hace `if (casos.length === 0) return <p>…</p>` y la tabla no existe. Acá la
 * tabla queda montada siempre y el mensaje es un bloque hermano, igual que en SCR-003 y SCR-0051: el
 * `<tbody>` de `TableZ` es un `@for` pelado sin rama de lista vacía, así que con `data: []` pinta el
 * encabezado y nada más. Envolverla en un `@if` se comería los rótulos de columna.
 */
@Component({
  selector: 'app-tabla-casos',
  standalone: true,
  imports: [ZrTable, ZrTemplate, ZrButton, ZdsStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-casos.html',
})
export class TablaCasos {
  readonly casos = input<readonly CasoDashboard[]>([]);

  /** Código → descripción de la colección de Tipo de solicitud (id 18). */
  readonly tipoMap = input<Record<string, string>>({});

  /** Código → descripción de la colección de Área (id 35). */
  readonly areaMap = input<Record<string, string>>({});

  /** El caso cuyo botón "Ver" se apretó. La pantalla abre el modal. */
  readonly ver = output<CasoDashboard>();

  /**
   * Las ocho columnas de texto, en el orden en que van **detrás** de la píldora de Estado.
   *
   * "Estado" y "Acción" no están acá: son los rótulos de los dos slots y se pasan por
   * `genericStartName` / `generciEndName` (⚠ el typo de `generci` es de la librería y hay que
   * escribirlo así).
   */
  protected readonly cllColumnas: ModeloTablaZr[] = [
    { title: '# Caso', key: 'numeroCaso' },
    { title: 'Tipo', key: 'tipo' },
    { title: 'Creación', key: 'fechaCreacion' },
    { title: 'SLA', key: 'slaTexto' },
    { title: 'Vencimiento', key: 'fechaVencimiento' },
    { title: 'Días restantes', key: 'diasTexto' },
    { title: 'Área', key: 'area' },
    { title: 'Responsable', key: 'responsable' },
  ];

  protected readonly cllFilas = computed<FilaCaso[]>(() => {
    const dicTipo = this.tipoMap();
    const dicArea = this.areaMap();
    return this.casos().map((in_objCaso) => ({
      numeroCaso: in_objCaso.numeroCaso,
      // El `|| '—'` va DESPUÉS del `??`: el `??` cubre "el código no está en el mapa" y el `||` cubre
      // "el caso no tiene código". Son dos huecos distintos y los dos se pintan como guion.
      tipo: (dicTipo[in_objCaso.tipoSolicitud] ?? in_objCaso.tipoSolicitud) || '—',
      fechaCreacion: in_objCaso.fechaCreacion,
      slaTexto: in_objCaso.sla ? `${in_objCaso.sla} días` : '—',
      fechaVencimiento: in_objCaso.fechaVencimiento,
      diasTexto: diasRestantesTexto(in_objCaso),
      area: (dicArea[in_objCaso.areaResponsable] ?? in_objCaso.areaResponsable) || '—',
      responsable: in_objCaso.responsable || '—',
      caso: in_objCaso,
    }));
  });

  protected variante(in_objCaso: CasoDashboard) {
    return estadoVariante(in_objCaso.estado);
  }
}
