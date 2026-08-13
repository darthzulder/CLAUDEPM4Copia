import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardGestionCasos from './DashboardGestionCasos';

// Smoke test de pantalla: no depende de useTask (no tiene task_id/case_id — lista TODOS
// los casos del proceso), sino de su propio hook de datos (useCasosDashboard) + useCollection
// (catálogos de Tipo/Área para resolver código→etiqueta). Referencias ESTABLES entre
// renders — mismas 4 trampas de testing-conventions.md.
const OBJ_USE_CASOS_VACIO = { casos: [], loading: false, error: null };

vi.mock('./useCasosDashboard', () => ({ useCasosDashboard: vi.fn(() => OBJ_USE_CASOS_VACIO) }));

const CLL_VACIO: never[] = [];
const OBJ_RAW_MAP_VACIO: Record<string, Record<string, unknown>> = {};
const CLL_RECORDS_VACIO: Record<string, unknown>[] = [];
const OBJ_USE_COLLECTION = {
  options: CLL_VACIO, loading: false, rawMap: OBJ_RAW_MAP_VACIO, records: CLL_RECORDS_VACIO,
};

vi.mock('../../../../core/useCollection', async (in_fnImportOriginal) => {
  const objActual = await in_fnImportOriginal<typeof import('../../../../core/useCollection')>();
  return { ...objActual, useCollection: () => OBJ_USE_COLLECTION };
});

import { useCasosDashboard } from './useCasosDashboard';
import type { CasoDashboard, EstadoCasoDashboard } from '../fields/types';
const fnUseCasosDashboard = vi.mocked(useCasosDashboard);

/** Lee los KPIs del DOM. `amount` es una PROPIEDAD del z-kpi-value, pero el encabezado NO:
 *  se renderiza como <span slot="header"> dentro del elemento. */
const leerKpis = (): Record<string, number | undefined> => Object.fromEntries(
  [...document.querySelectorAll('z-kpi-value')].map((objKpi) => [
    objKpi.querySelector('[slot="header"]')?.textContent,
    (objKpi as unknown as { amount?: number }).amount,
  ]),
);

const casoConEstado = (in_intId: number, in_strEstado: EstadoCasoDashboard): CasoDashboard => ({
  id: in_intId,
  numeroCaso: `C-${in_intId}`,
  tipoSolicitud: '1',
  fechaCreacion: '01/08/2026',
  fechaVencimiento: '15/08/2026',
  sla: '10',
  diasRestantes: 3,
  estado: in_strEstado,
  areaResponsable: 'SIN',
  responsable: 'Ana Pérez',
  descripcion: 'Descripción',
});

describe('DashboardGestionCasos (SCR-013)', () => {
  it('mientras carga muestra el loader, sin KPIs ni tabla', () => {
    fnUseCasosDashboard.mockReturnValue({ casos: [], loading: true, error: null });
    const { container } = render(<DashboardGestionCasos />);

    expect(container.querySelector('.screen-loading')).not.toBeNull();
    expect(screen.queryByText('Gestión de Casos')).not.toBeInTheDocument();
  });

  it('sin casos desde la API cae a los 8 datos de ejemplo (SAMPLE_CASES) y calcula los KPIs', () => {
    fnUseCasosDashboard.mockReturnValue(OBJ_USE_CASOS_VACIO);
    render(<DashboardGestionCasos />);

    expect(screen.getByText('Gestión de Casos')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–8 de 8 casos')).toBeInTheDocument();
    expect(screen.getByText('001')).toBeInTheDocument();

    // Los KPIs se asertan por VALOR, no por rótulo: antes se leía `getByText('Casos
    // abiertos')`, que es el texto fijo del componente, así que calcularKpis() podía
    // devolver todo en cero y el test pasaba igual.
    // SAMPLE_CASES: 2 Abierta, 2 Por Vencer, 2 Vencida, 1 Cerrada — la 8ª es Cancelada y no
    // suma en ningún KPI (ver calcularKpis(), cubierto en dashboardHelpers.test.ts).
    expect(leerKpis()).toEqual({
      'Casos abiertos': 2,
      'Próximos a vencer': 2,
      'Vencidos': 2,
      'Cerrados': 1,
    });
  });

  it('los KPIs cuentan cada estado por separado (conteos asimétricos)', () => {
    // Con SAMPLE_CASES hay 2 Abierta y 2 Por Vencer, así que un swap entre esos dos filtros
    // daría el mismo número y pasaría desapercibido. Con conteos distintos por estado, la
    // pantalla sí delata que cada KPI lee el estado que le corresponde.
    fnUseCasosDashboard.mockReturnValue({
      casos: [
        casoConEstado(1, 'Abierta'), casoConEstado(2, 'Abierta'), casoConEstado(3, 'Abierta'),
        casoConEstado(4, 'Por Vencer'),
        casoConEstado(5, 'Vencida'), casoConEstado(6, 'Vencida'),
        casoConEstado(7, 'Cerrada'), casoConEstado(8, 'Cerrada'), casoConEstado(9, 'Cerrada'),
        casoConEstado(10, 'Cancelada'), // no suma en ningún KPI
      ],
      loading: false,
      error: null,
    });
    render(<DashboardGestionCasos />);

    expect(leerKpis()).toEqual({
      'Casos abiertos': 3,
      'Próximos a vencer': 1,
      'Vencidos': 2,
      'Cerrados': 3,
    });
  });

  it('con error de PM4 muestra el aviso pero sigue mostrando los datos de ejemplo', () => {
    fnUseCasosDashboard.mockReturnValue({ casos: [], loading: false, error: 'Network Error' });
    render(<DashboardGestionCasos />);

    expect(screen.getByText(/No se pudieron cargar los casos desde PM4 \(Network Error\)/)).toBeInTheDocument();
    expect(screen.getByText('001')).toBeInTheDocument();
  });

  it('clic en "Ver" abre el modal de detalle del caso correspondiente', () => {
    fnUseCasosDashboard.mockReturnValue(OBJ_USE_CASOS_VACIO);
    render(<DashboardGestionCasos />);

    expect(screen.queryByText(/Caso #001/)).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Ver')[0]);

    expect(screen.getByText(/Caso #001/)).toBeInTheDocument();
  });

  it('con casos para exportar, "Descargar reporte" no está bloqueado y la tabla no dice "Sin casos"', () => {
    fnUseCasosDashboard.mockReturnValue(OBJ_USE_CASOS_VACIO);
    render(<DashboardGestionCasos />);

    // Se asserta el texto del contador además del botón: `disabled` queda en `undefined`
    // cuando el valor es falso, así que por sí sola esa lectura no distingue "habilitado"
    // de "el elemento no existe".
    expect(screen.getByText('Mostrando 1–8 de 8 casos')).toBeInTheDocument();
    expect(screen.queryByText('Sin casos')).not.toBeInTheDocument();
    const objBtn = screen.getByText('Descargar reporte').closest('z-button');
    expect(objBtn).not.toBeNull();
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).not.toBe(true);
  });

  // NOTA: la rama contraria (`disabled={filtrados.length === 0}` ⇒ bloqueado + "Sin casos")
  // NO se cubre acá a propósito. Solo se alcanza aplicando un filtro que no matchee, y eso
  // exige escribir en un control del DS, que en jsdom no es interactuable (ver
  // testing-conventions.md). La lógica subyacente sí está cubierta en dashboardHelpers.test.ts
  // (`casosToCSV([])` y `calcularKpis([])`); lo único sin cubrir es el cableado del filtro.
});
