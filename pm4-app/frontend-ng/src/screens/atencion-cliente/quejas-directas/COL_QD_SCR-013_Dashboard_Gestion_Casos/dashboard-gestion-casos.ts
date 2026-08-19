import { BotonHabilitado } from '../../../../components/fields/boton-habilitado';
import {
  ChangeDetectionStrategy, Component, computed, inject, Injector, type OnInit, signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModeloZa } from '../../../../components/fields/modelo-za';
import { ZdsInput } from '../../../../components/fields/zds-input';
import { ZdsSelect } from '../../../../components/fields/zds-select';
import {
  ZrAlertInline, ZrButton, ZrKpiValue, ZrLoader, ZrPagination,
} from '../../../../components/fields/zds-reexports';
import { FormSectionComponent } from '../../../../components/form-section';
import { ScreenHeaderComponent } from '../../../../components/screen-header';
import { CatalogosService } from '../../../../core/catalogos.service';
import { CollectionService } from '../../../../core/collection.service';
import { HolidaysService } from '../../../../core/holidays.service';
import {
  QD_COLLECTIONS, SCR013_FILTROS_DEFAULT, SCR013_OPTIONS_ESTADO, SCR013_PAGE_SIZE,
} from '../fields/fields';
import type { CasoDashboard } from '../fields/types';
import { CasosDashboardService } from './casos-dashboard.service';
import { SAMPLE_CASES, calcularKpis, casosToCSV } from './dashboard-helpers';
import { DetalleCasoModal } from './detalle-caso-modal';
import { TablaCasos } from './tabla-casos';

/** Nombre del archivo que baja el navegador. Igual que en React. */
const STR_NOMBRE_CSV = 'reporte-casos-quejas-directas.csv';

/**
 * SCR-013 · Dashboard — Gestión de Casos. Port de `DashboardGestionCasos.tsx`.
 *
 * ── La única pantalla del proceso que NO completa una tarea ────────────────────────────────────────
 * No hay `task_id` ni `TaskService`: es un tablero de supervisión de solo lectura que lista **todos**
 * los casos del proceso. Su fuente es `CasosDashboardService` (ver su docstring), provisto acá y no en
 * root porque su estado es el de *este* tablero.
 *
 * ── Draft vs aplicado: por qué son dos estados y no uno ───────────────────────────────────────────
 * Los cuatro filtros viven en un `FormGroup` (el borrador que el usuario tipea) y la lista se filtra
 * contra un `signal` **aparte** que solo se actualiza al apretar "Aplicar filtros". Es el `watch()` +
 * `useState` de React portado tal cual, y es deliberado: sobre 100+ casos, filtrar en cada tecla
 * recalcularía la tabla y la paginación por carácter. El spec cubre las dos mitades (que el draft
 * **no** filtra hasta aplicar, y que "Limpiar" resetea los dos y vuelve a página 1).
 *
 * ── Los KPIs se calculan sobre la lista COMPLETA, no sobre la filtrada ────────────────────────────
 * Decisión heredada y documentada en §9 de la ficha: los contadores son el estado del proceso, no del
 * recorte que el supervisor está mirando. Si siguieran al filtro, elegir "Cerrada" mostraría
 * "Vencidos: 0" y parecería que no hay nada vencido.
 *
 * ── `SAMPLE_CASES` cuando la API no trae nada ─────────────────────────────────────────────────────
 * Fallback heredado para el dev sin token real. ⚠ Se dispara con la lista **vacía**, no solo con
 * error: un tenant legítimamente sin casos muestra datos de ejemplo sin decirlo (el cartel de "datos
 * de ejemplo" solo aparece si además hubo error). Se porta como está — es comportamiento existente y
 * cambiarlo sería contrabando— y queda anotado en la ficha 2.0.
 *
 * ── Lo que se pierde respecto de React, y por qué no se compensa ──────────────────────────────────
 * Los filtros de Tipo y Área usan `withSearch` en React. `zds-select` **no tiene** ese input
 * (`lib-input-select-z` no ofrece búsqueda), así que los dos quedan como desplegables simples. Con
 * ~20 opciones de Área es una molestia, no un bloqueo, y ya está en el reporte al negocio.
 */
@Component({
  selector: 'app-dashboard-gestion-casos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ScreenHeaderComponent,
    FormSectionComponent,
    TablaCasos,
    DetalleCasoModal,
    ZdsInput,
    ZdsSelect,
    ZrAlertInline,
    ZrButton,
    BotonHabilitado,
    ZrKpiValue,
    ZrLoader,
    ZrPagination,
    ModeloZa,
  ],
  // `CasosDashboardService` necesita `HolidaysService` para los días hábiles, y `CatalogosService`
  // fabrica los dos catálogos (Tipo y Área) en injectors hijos de este. Ninguno es singleton: su
  // estado es el de esta pantalla.
  //
  // ⚠ `HolidaysService` va con su **propio** `CollectionService` y no como provider pelado, por el
  // mismo motivo que en SCR-0051 (donde se fijó el patrón): `HolidaysService` hace
  // `inject(CollectionService)`, así que un `providers: [HolidaysService]` suelto lo busca en el
  // injector de la pantalla —que no lo tiene— y revienta con **NG0201 en el primer `ngOnInit`**. La
  // pantalla no abre. Los dos catálogos no sufren esto porque `CatalogosService.de()` ya crea su
  // propio injector hijo por catálogo; los feriados no pasan por ahí.
  //
  // Y una instancia de `CollectionService` retiene **una** colección, así que tampoco alcanzaría con
  // proveerlo una vez a nivel pantalla: la carga de feriados pisaría a la del catálogo que compartiera
  // la instancia. De ahí el injector hijo con su par propio.
  providers: [
    CatalogosService,
    CasosDashboardService,
    {
      provide: HolidaysService,
      useFactory: (in_objPadre: Injector) =>
        Injector.create({
          providers: [{ provide: CollectionService }, { provide: HolidaysService }],
          parent: in_objPadre,
          name: 'feriados',
        }).get(HolidaysService),
      deps: [Injector],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-gestion-casos.html',
})
export class DashboardGestionCasos implements OnInit {
  private readonly objDashboard = inject(CasosDashboardService);
  private readonly objCatalogos = inject(CatalogosService);
  private readonly objFeriados = inject(HolidaysService);

  readonly blnCargando = this.objDashboard.cargando;
  readonly strError = this.objDashboard.error;

  protected readonly cllOpcionesEstado = SCR013_OPTIONS_ESTADO;

  /**
   * Los cuatro filtros, en su forma de borrador. Sin validadores: ninguno es obligatorio y un filtro
   * vacío significa "todos".
   */
  readonly form = new FormGroup({
    filtroTipo: new FormControl(SCR013_FILTROS_DEFAULT.filtroTipo, { nonNullable: true }),
    filtroEstado: new FormControl(SCR013_FILTROS_DEFAULT.filtroEstado, { nonNullable: true }),
    filtroArea: new FormControl(SCR013_FILTROS_DEFAULT.filtroArea, { nonNullable: true }),
    filtroBuscar: new FormControl(SCR013_FILTROS_DEFAULT.filtroBuscar, { nonNullable: true }),
  });

  /** Los filtros que la tabla está usando de verdad. Solo cambia en `aplicarFiltros()`. */
  private readonly sigAplicados = signal({ ...SCR013_FILTROS_DEFAULT });

  private readonly sigPagina = signal(1);

  /** El caso cuyo modal está abierto, o `null`. */
  protected readonly sigCasoSel = signal<CasoDashboard | null>(null);

  /**
   * Los dos catálogos con su opción "Todos"/"Todas" adelante — el `useFilterCatalog` de React partido
   * en un `computed` de opciones y otro de mapa código→descripción.
   *
   * El rótulo difiere por género ("Todos" para Tipo, "Todas" para Área) igual que en React: no es un
   * descuido que valga unificar.
   */
  protected readonly cllOpcionesTipo = computed(() => [
    { value: '', label: 'Todos' },
    ...this.objCatalogos.de('requestType').options(),
  ]);

  protected readonly cllOpcionesArea = computed(() => [
    { value: '', label: 'Todas' },
    ...this.objCatalogos.de('area').options(),
  ]);

  /** Código → descripción, para la tabla, el modal y el CSV. Sin la opción "Todos". */
  protected readonly dicTipoMap = computed(() =>
    Object.fromEntries(this.objCatalogos.de('requestType').options().map((in_objO) => [in_objO.value, in_objO.label])),
  );

  protected readonly dicAreaMap = computed(() =>
    Object.fromEntries(this.objCatalogos.de('area').options().map((in_objO) => [in_objO.value, in_objO.label])),
  );

  /** La lista efectiva: la de PM4, o los casos de ejemplo si PM4 no devolvió ninguno. */
  protected readonly cllCasos = computed<readonly CasoDashboard[]>(() => {
    const cllApi = this.objDashboard.casos();
    return cllApi.length > 0 ? cllApi : SAMPLE_CASES;
  });

  /** KPIs sobre la lista completa. Ver el bloque de la cabecera. */
  protected readonly objKpis = computed(() => calcularKpis(this.cllCasos()));

  /**
   * El filtrado cliente-side, contra los filtros **aplicados**.
   *
   * ⚠ **BUG HEREDADO DE REACT — el filtro de Área no matchea nunca.** `filtroArea` trae el *código* de
   * la colección de Área (id 35), pero `caso.areaResponsable` se llena desde `qd_strResponsableRole`
   * (ver el ⚠ de `mapRequestToCaso` en `dashboard-helpers.ts`), que es un **rol** ("Analista SAC"), no
   * un código. Comparar `'35'` contra `'Analista SAC'` da falso siempre, así que elegir cualquier área
   * vacía la tabla. Se replica tal cual: qué campo debe gobernar el filtro —¿área o rol?— es una
   * decisión de negocio, y arreglarlo acá sería un cambio funcional encubierto en una migración de
   * framework. Está cubierto por un `it()` que asevera el comportamiento **actual** y nombra
   * `qd_strAssigneeArea` en su comentario, para que el día que negocio lo decida el test se ponga rojo
   * señalando exactamente esta línea. Es el hallazgo de mayor prioridad del reporte de SCR-013.
   *
   * La búsqueda libre mira número de caso, responsable y **la descripción** del tipo (no su código):
   * es lo que el usuario ve en la tabla, así que es lo que espera poder tipear.
   */
  protected readonly cllFiltrados = computed<readonly CasoDashboard[]>(() => {
    const dicF = this.sigAplicados();
    const dicTipo = this.dicTipoMap();
    const strQ = dicF.filtroBuscar.trim().toLowerCase();

    return this.cllCasos().filter((in_objCaso) => {
      if (dicF.filtroTipo && in_objCaso.tipoSolicitud !== dicF.filtroTipo) return false;
      if (dicF.filtroEstado && in_objCaso.estado !== dicF.filtroEstado) return false;
      if (dicF.filtroArea && in_objCaso.areaResponsable !== dicF.filtroArea) return false;
      if (strQ) {
        const strBuscable =
          `${in_objCaso.numeroCaso} ${in_objCaso.responsable} ` +
          `${dicTipo[in_objCaso.tipoSolicitud] ?? in_objCaso.tipoSolicitud}`;
        if (!strBuscable.toLowerCase().includes(strQ)) return false;
      }
      return true;
    });
  });

  protected readonly intTotalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.cllFiltrados().length / SCR013_PAGE_SIZE)),
  );

  /**
   * La página que se está mostrando, **acotada** al total.
   *
   * El `min` no es defensivo: al aplicar un filtro que reduce la lista, la página guardada puede
   * quedar más allá del final. React hace exactamente lo mismo (`Math.min(page, totalPaginas)`), y sin
   * eso la tabla quedaría vacía con la paginación marcando una página que ya no existe.
   */
  protected readonly intPaginaActual = computed(() => Math.min(this.sigPagina(), this.intTotalPaginas()));

  private readonly intInicio = computed(() => (this.intPaginaActual() - 1) * SCR013_PAGE_SIZE);

  protected readonly cllPagina = computed(() =>
    this.cllFiltrados().slice(this.intInicio(), this.intInicio() + SCR013_PAGE_SIZE),
  );

  /** "Sin casos" o "Mostrando X–Y de N casos", igual que React. */
  protected readonly strResumenPagina = computed(() => {
    const intTotal = this.cllFiltrados().length;
    if (intTotal === 0) return 'Sin casos';
    const intHasta = Math.min(this.intInicio() + SCR013_PAGE_SIZE, intTotal);
    return `Mostrando ${this.intInicio() + 1}–${intHasta} de ${intTotal} casos`;
  });

  /** Sin casos filtrados no hay nada que exportar. */
  protected readonly blnDescargaBloqueada = computed(() => this.cllFiltrados().length === 0);

  async ngOnInit(): Promise<void> {
    // Las cuatro peticiones salen sin encadenarse: los catálogos pintan sus opciones mientras los
    // casos viajan, y los feriados solo hacen falta para el `computed` de días hábiles — que se
    // recalcula solo cuando llegan, tarde o temprano.
    void this.objCatalogos.cargar('requestType', QD_COLLECTIONS.requestType);
    void this.objCatalogos.cargar('area', QD_COLLECTIONS.area);
    void this.objFeriados.cargar();
    await this.objDashboard.cargar();
  }

  /** Copia el borrador a los filtros aplicados y vuelve a la primera página. */
  protected aplicarFiltros(): void {
    this.sigAplicados.set(this.form.getRawValue());
    this.sigPagina.set(1);
  }

  /** Resetea el borrador **y** lo aplicado. Los dos, o el form quedaría vacío filtrando igual. */
  protected limpiarFiltros(): void {
    this.form.reset({ ...SCR013_FILTROS_DEFAULT });
    this.sigAplicados.set({ ...SCR013_FILTROS_DEFAULT });
    this.sigPagina.set(1);
  }

  protected irAPagina(in_intPagina: number): void {
    this.sigPagina.set(in_intPagina);
  }

  protected abrirDetalle(in_objCaso: CasoDashboard): void {
    this.sigCasoSel.set(in_objCaso);
  }

  protected cerrarDetalle(): void {
    this.sigCasoSel.set(null);
  }

  /**
   * Baja los casos **filtrados** (no todos) como CSV.
   *
   * El `createElement('a')` + `click()` se mantiene: es la única forma de disparar una descarga en el
   * navegador. Lo que se agrega sobre React es el `revokeObjectURL` en un `finally`, igual que
   * `descargarAdjunto()` de SCR-0051 — sin eso el blob queda retenido si el `click()` tira.
   *
   * El `﻿` adelante es el BOM: sin él Excel abre el CSV en ANSI y las tildes salen mal. Es dato,
   * no adorno.
   */
  protected descargarCSV(): void {
    const strCsv = casosToCSV(this.cllFiltrados(), this.dicTipoMap(), this.dicAreaMap());
    const objBlob = new Blob(['﻿' + strCsv], { type: 'text/csv;charset=utf-8;' });
    const strUrl = URL.createObjectURL(objBlob);
    try {
      const objAncla = document.createElement('a');
      objAncla.href = strUrl;
      objAncla.download = STR_NOMBRE_CSV;
      document.body.appendChild(objAncla);
      objAncla.click();
      objAncla.remove();
    } finally {
      URL.revokeObjectURL(strUrl);
    }
  }
}
