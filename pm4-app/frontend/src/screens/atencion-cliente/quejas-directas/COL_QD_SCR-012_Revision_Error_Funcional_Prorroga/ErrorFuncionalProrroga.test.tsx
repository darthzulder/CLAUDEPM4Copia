import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorFuncionalProrroga from './ErrorFuncionalProrroga';

/** Fecha ISO desplazada N días respecto de hoy, para probar la regla sin fechas fijas
 *  (un literal se volvería pasado con el tiempo y el test empezaría a fallar solo). */
const isoDesplazado = (in_intDias: number): string => {
  const dtFecha = new Date();
  dtFecha.setDate(dtFecha.getDate() + in_intDias);
  return dtFecha.toISOString().slice(0, 10);
};
const STR_HOY = isoDesplazado(0);

// Smoke test de pantalla: depende de useTask Y useCollection (catálogo de motivo de
// prórroga). Referencias ESTABLES entre renders — ver las 4 trampas de
// testing-conventions.md.
const OBJ_TASK = {
  id: 1,
  status: 'ACTIVE',
  process_request_id: 10,
  data: {
    qd_strExtErrorCode: '400',
    qd_strExtAffectedField: 'fecha_prorroga',
    qd_strExtCurrentAttempt: '1',
    qd_strExtErrorMessage: 'fecha_prorroga inválida',
    qd_strExtensionReason: '',
    qd_strNewDeadline: '',
    qd_strExtensionCounter: '',
    qd_strExtensionJustif: '',
  },
};

/** Fixture fresco por test, para pisar campos sin contaminar los siguientes. */
const makeTask = (in_dicOverrides: Record<string, unknown> = {}) => ({
  ...OBJ_TASK,
  data: { ...OBJ_TASK.data, ...in_dicOverrides },
});

/** Todos los obligatorios completos salvo la fecha, que la decide cada test. */
const conFecha = (in_strFecha: string) => makeTask({
  qd_strExtensionReason: '1',
  qd_strExtensionCounter: '2',
  qd_strExtensionJustif: 'Se requiere más tiempo para el análisis',
  qd_strNewDeadline: in_strFecha,
});

const OBJ_USE_TASK = {
  task: makeTask(),
  loading: false,
  error: null,
  submitting: false,
  // completeTask() encadena .catch() en la pantalla — el mock debe devolver una promesa.
  completeTask: vi.fn(() => Promise.resolve({})),
  saveDraft: vi.fn(),
  reassignTask: vi.fn(),
  startProcess: vi.fn(),
  isWebEntry: false,
};

vi.mock('../../../../core/useTask', () => ({ useTask: () => OBJ_USE_TASK }));

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

beforeEach(() => {
  OBJ_USE_TASK.task = makeTask();
});

describe('ErrorFuncionalProrroga (SCR-012)', () => {
  it('renderiza la pantalla y precarga el panel de error de prórroga', () => {
    render(<ErrorFuncionalProrroga />);

    expect(screen.getByText('Corrección Error Funcional Prórroga')).toBeInTheDocument();
    const objErrorCode = document.querySelector('z-text-input#field-qd_strExtErrorCode');
    expect((objErrorCode as unknown as { model?: string })?.model).toBe('400');
  });

  it('"Reenviar Prórroga" arranca deshabilitado (RUL-012-01: faltan motivo/fecha/justificación)', () => {
    render(<ErrorFuncionalProrroga />);

    const objBtn = screen.getByText(/Reenviar Prórroga/).closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
  });

  it('"Cancelar Prórroga" completa con CANCELAR aunque falten los obligatorios', () => {
    // Con el fixture vacío: prueba que CANCELAR no está sujeta a RUL-012-01.
    render(<ErrorFuncionalProrroga />);

    fireEvent.click(screen.getByText('Cancelar Prórroga'));

    expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'CANCELAR' }),
    );
  });
});

// RUL-012-01 — la nueva fecha límite debe ser POSTERIOR a hoy. Antes no había ningún test:
// el fixture dejaba qd_strNewDeadline vacío, así que "deshabilitado" no distinguía "la regla
// de fecha funciona" de "faltan todos los campos".
describe('ErrorFuncionalProrroga — RUL-012-01 (nueva fecha límite)', () => {
  const expectBloqueadoPorFecha = () => {
    // El bloqueo se asserta por la propiedad + MSG-012-01, no clickeando: en jsdom un
    // z-button deshabilitado no es un <button> nativo y el click dispara igual su onClick.
    const objBtn = screen.getByText(/Reenviar Prórroga/).closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
    expect(screen.getByText(/posterior a la fecha actual/)).toBeInTheDocument();
  };

  it('una fecha pasada bloquea el reenvío y muestra MSG-012-01', () => {
    OBJ_USE_TASK.task = conFecha(isoDesplazado(-1));
    render(<ErrorFuncionalProrroga />);
    expectBloqueadoPorFecha();
  });

  it('la fecha de HOY también bloquea: la regla es "posterior", no "hoy o posterior"', () => {
    // Este es el borde que delata un `>=` puesto donde va un `>`. Con el resto de los
    // obligatorios completos, lo único que puede estar bloqueando es la fecha.
    OBJ_USE_TASK.task = conFecha(STR_HOY);
    render(<ErrorFuncionalProrroga />);
    expectBloqueadoPorFecha();
  });

  it('con fecha futura y el resto completo, "Reenviar Prórroga" completa con REENVIAR', async () => {
    OBJ_USE_TASK.task = conFecha(isoDesplazado(7));
    render(<ErrorFuncionalProrroga />);

    // Ya no aparece el mensaje de fecha inválida.
    expect(screen.queryByText(/posterior a la fecha actual/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Reenviar Prórroga/));

    await vi.waitFor(() => {
      expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
        expect.objectContaining({ qd_strAction: 'REENVIAR' }),
      );
    });
  });
});
