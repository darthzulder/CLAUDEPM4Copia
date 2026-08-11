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
const fnUseCasosDashboard = vi.mocked(useCasosDashboard);

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
    // KPIs sobre SAMPLE_CASES: 2 Abierta, 2 Por Vencer, 2 Vencida, 1 Cerrada (1 Cancelada
    // no cuenta en ningún KPI — ver calcularKpis()).
    expect(screen.getByText('Casos abiertos')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–8 de 8 casos')).toBeInTheDocument();
    expect(screen.getByText('001')).toBeInTheDocument();
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

  it('con casos filtrados el botón "Descargar reporte" está habilitado', () => {
    fnUseCasosDashboard.mockReturnValue(OBJ_USE_CASOS_VACIO);
    render(<DashboardGestionCasos />);

    const objBtn = screen.getByText('Descargar reporte').closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).not.toBe(true);
  });
});
