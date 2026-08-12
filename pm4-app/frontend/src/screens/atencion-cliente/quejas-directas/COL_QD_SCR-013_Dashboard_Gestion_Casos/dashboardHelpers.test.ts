import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SAMPLE_CASES,
  calcularKpis,
  casosToCSV,
  diasRestantesTexto,
  estadoVariante,
  mapRequestToCaso,
} from './dashboardHelpers';
import type { CasoDashboard } from '../fields/types';

// Lógica pura que sostiene TODO el dashboard: el smoke test de la pantalla se apoyaba en
// estas funciones sin que ninguna tuviera cobertura propia. `mapRequestToCaso` recibe el set
// de feriados por argumento, así que es testeable sin red (misma decisión de diseño que
// core/businessDays.ts).

const SET_VACIO: ReadonlySet<string> = new Set();

/** Caso mínimo; cada test pisa solo lo que le interesa. */
const caso = (in_dicOverrides: Partial<CasoDashboard> = {}): CasoDashboard => ({
  id: 1,
  numeroCaso: '13950001',
  tipoSolicitud: '1',
  fechaCreacion: '01/08/2026',
  fechaVencimiento: '15/08/2026',
  sla: '10',
  diasRestantes: 5,
  estado: 'Abierta',
  areaResponsable: 'Siniestros',
  responsable: 'Ana Pérez',
  descripcion: 'Descripción de la queja',
  ...in_dicOverrides,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('calcularKpis', () => {
  it('cuenta cada estado por separado', () => {
    const lstCasos = [
      caso({ estado: 'Abierta' }), caso({ estado: 'Abierta' }),
      caso({ estado: 'Por Vencer' }),
      caso({ estado: 'Vencida' }), caso({ estado: 'Vencida' }), caso({ estado: 'Vencida' }),
      caso({ estado: 'Cerrada' }),
    ];
    expect(calcularKpis(lstCasos)).toEqual({ abiertos: 2, porVencer: 1, vencidos: 3, cerrados: 1 });
  });

  it('"Cancelada" no suma en NINGÚN KPI', () => {
    // Contrato explícito: un caso cancelado no es ni abierto ni cerrado a efectos del tablero.
    const objKpis = calcularKpis([caso({ estado: 'Cancelada' })]);
    expect(objKpis).toEqual({ abiertos: 0, porVencer: 0, vencidos: 0, cerrados: 0 });
  });

  it('con lista vacía devuelve todo en cero', () => {
    expect(calcularKpis([])).toEqual({ abiertos: 0, porVencer: 0, vencidos: 0, cerrados: 0 });
  });

  it('los KPIs de SAMPLE_CASES son los que muestra el dashboard en dev', () => {
    // Fija los datos de ejemplo: si alguien agrega una fila, este test obliga a revisar que
    // el tablero de dev siga contando lo que se espera.
    const objKpis = calcularKpis(SAMPLE_CASES);
    const intTotalEnKpis = objKpis.abiertos + objKpis.porVencer + objKpis.vencidos + objKpis.cerrados;
    expect(intTotalEnKpis).toBe(SAMPLE_CASES.filter((c) => c.estado !== 'Cancelada').length);
  });
});

describe('estadoVariante', () => {
  it.each([
    ['Cerrada', 'success'],
    ['Cancelada', 'neutral'],
    ['Vencida', 'danger'],
    ['Por Vencer', 'warning'],
    ['Abierta', 'info'],
  ] as const)('%s → %s', (in_strEstado, in_strVariante) => {
    expect(estadoVariante(in_strEstado)).toBe(in_strVariante);
  });
});

describe('diasRestantesTexto', () => {
  it('no aplica para casos cerrados o cancelados', () => {
    expect(diasRestantesTexto(caso({ estado: 'Cerrada', diasRestantes: 5 }))).toBe('—');
    expect(diasRestantesTexto(caso({ estado: 'Cancelada', diasRestantes: 5 }))).toBe('—');
  });

  it('no aplica si el caso no tiene vencimiento calculable', () => {
    expect(diasRestantesTexto(caso({ fechaVencimiento: '—' }))).toBe('—');
  });

  it('singulariza correctamente en 1 día', () => {
    expect(diasRestantesTexto(caso({ diasRestantes: 1 }))).toBe('1 día');
    expect(diasRestantesTexto(caso({ diasRestantes: 2 }))).toBe('2 días');
  });

  it('cero días es "Vence hoy", no "0 días"', () => {
    expect(diasRestantesTexto(caso({ diasRestantes: 0 }))).toBe('Vence hoy');
  });

  it('días negativos se muestran como mora, en positivo', () => {
    expect(diasRestantesTexto(caso({ diasRestantes: -3, estado: 'Vencida' }))).toBe('3 días de mora');
    expect(diasRestantesTexto(caso({ diasRestantes: -1, estado: 'Vencida' }))).toBe('1 día de mora');
  });
});

describe('casosToCSV', () => {
  const DIC_TIPO = { '1': 'Queja' };
  const DIC_AREA = { SIN: 'Siniestros' };

  it('emite la fila de encabezados y una fila por caso, separadas por CRLF', () => {
    const strCsv = casosToCSV([caso()], DIC_TIPO, DIC_AREA);
    const lstLineas = strCsv.split('\r\n');
    expect(lstLineas).toHaveLength(2);
    expect(lstLineas[0]).toContain('"# Caso"');
  });

  it('resuelve código → descripción para Tipo y Área', () => {
    const strCsv = casosToCSV([caso({ tipoSolicitud: '1', areaResponsable: 'SIN' })], DIC_TIPO, DIC_AREA);
    expect(strCsv).toContain('"Queja"');
    expect(strCsv).toContain('"Siniestros"');
  });

  it('si el código no está en el mapa, cae al propio código (no deja la celda vacía)', () => {
    const strCsv = casosToCSV([caso({ tipoSolicitud: '99', areaResponsable: 'XX' })], DIC_TIPO, DIC_AREA);
    expect(strCsv).toContain('"99"');
    expect(strCsv).toContain('"XX"');
  });

  it('escapa las comillas dobles duplicándolas (formato CSV)', () => {
    // Sin esto, una descripción con comillas rompe la estructura del archivo al abrirlo.
    const strCsv = casosToCSV([caso({ descripcion: 'El agente dijo "no aplica"' })], DIC_TIPO, DIC_AREA);
    expect(strCsv).toContain('"El agente dijo ""no aplica"""');
  });

  it('con lista vacía emite solo los encabezados', () => {
    expect(casosToCSV([], DIC_TIPO, DIC_AREA).split('\r\n')).toHaveLength(1);
  });
});

describe('mapRequestToCaso', () => {
  it('usa qd_strFilingDate (radicación SFC) como fecha de creación, no el created_at del request', () => {
    // Distinción deliberada del módulo: created_at es cuándo el BPM abrió la tarea, no
    // cuándo se radicó el caso ante la SFC.
    const objCaso = mapRequestToCaso(
      { id: 7, case_number: 700, status: 'ACTIVE', created_at: '2026-01-01T00:00:00Z', data: { qd_strFilingDate: '08/07/2026' } },
      SET_VACIO,
    );
    expect(objCaso.fechaCreacion).toContain('2026');
    expect(objCaso.fechaCreacion).not.toContain('01/01');
  });

  it('cae al case_number cuando el caso todavía no tiene código SFC', () => {
    const objCaso = mapRequestToCaso({ id: 7, case_number: 700, status: 'ACTIVE', data: {} }, SET_VACIO);
    expect(objCaso.numeroCaso).toBe('700');
  });

  it('prefiere el código SFC cuando ya existe', () => {
    const objCaso = mapRequestToCaso(
      { id: 7, case_number: 700, status: 'ACTIVE', data: { qd_strSfcCode: '13950001' } },
      SET_VACIO,
    );
    expect(objCaso.numeroCaso).toBe('13950001');
  });

  it('status COMPLETED ⇒ Cerrada, sin importar los días restantes', () => {
    const objCaso = mapRequestToCaso({ id: 1, status: 'COMPLETED', data: {} }, SET_VACIO);
    expect(objCaso.estado).toBe('Cerrada');
  });

  it.each(['CANCELED', 'CANCELLED'])('status %s ⇒ Cancelada (PM4 usa ambas grafías)', (in_strStatus) => {
    expect(mapRequestToCaso({ id: 1, status: in_strStatus, data: {} }, SET_VACIO).estado).toBe('Cancelada');
  });

  it('sin fecha de radicación no hay vencimiento calculable', () => {
    const objCaso = mapRequestToCaso({ id: 1, status: 'ACTIVE', data: {} }, SET_VACIO);
    expect(objCaso.fechaVencimiento).toBe('—');
    expect(objCaso.diasRestantes).toBe(0);
    expect(objCaso.estado).toBe('Abierta'); // sin deadline ⇒ nunca "Vencida"
  });

  it('toma el responsable de data._user.fullname', () => {
    const objCaso = mapRequestToCaso(
      { id: 1, status: 'ACTIVE', data: { _user: { fullname: 'Ana Pérez' } } },
      SET_VACIO,
    );
    expect(objCaso.responsable).toBe('Ana Pérez');
  });

  it('sin _user el responsable queda vacío, no "undefined"', () => {
    expect(mapRequestToCaso({ id: 1, status: 'ACTIVE', data: {} }, SET_VACIO).responsable).toBe('');
  });

  it('un caso con SLA vencido queda en Vencida y con días negativos', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 20)); // 20-ago-2026
    // Radicado el 8-jul con SLA de 5 días hábiles ⇒ venció hace rato.
    const objCaso = mapRequestToCaso(
      { id: 1, status: 'ACTIVE', data: { qd_strFilingDate: '08/07/2026', qd_strSlaAssigned: '5' } },
      SET_VACIO,
    );
    expect(objCaso.estado).toBe('Vencida');
    expect(objCaso.diasRestantes).toBeLessThan(0);
  });
});
