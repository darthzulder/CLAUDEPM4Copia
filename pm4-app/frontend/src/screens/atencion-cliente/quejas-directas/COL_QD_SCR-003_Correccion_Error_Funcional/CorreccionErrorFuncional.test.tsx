import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CorreccionErrorFuncional from './CorreccionErrorFuncional';

// Smoke test de pantalla: depende de useTask Y useCollection (S2 delega en
// SeccionCamposPayload/useMatrizMotivos, que catalogan país/depto/ciudad/producto/motivo).
// Referencias ESTABLES entre renders — ver las 4 trampas de testing-conventions.md.
const OBJ_TASK = {
  id: 1,
  status: 'ACTIVE',
  process_request_id: 10,
  data: {
    // SCR-003 cae a los campos que SÍ emite el script (qd_strHttpCode/qd_strApiTechMessage/
    // qd_strAttemptNum) cuando los propios (qd_strSfcErrorCode/...) vienen vacíos.
    qd_strHttpCode: '400',
    qd_strErrorType: 'ESTRUCTURA_PAYLOAD',
    qd_strAttemptNum: '1',
    qd_strEndpointCalled: 'POST /api/queja/',
    qd_strApiTechMessage: 'canal_cod inválido',
    qd_strCompleteLogAPI: 'Log completo del rechazo',
    qd_strPayloadSent: '',
    qd_lstAttemptHistory: [],
  },
};

const OBJ_USE_TASK = {
  task: OBJ_TASK,
  loading: false,
  error: null,
  submitting: false,
  // completeTask() encadena .catch() en la pantalla (onEscalar/onReenviar) — el mock
  // necesita devolver una promesa resuelta, no undefined.
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

describe('CorreccionErrorFuncional (SCR-003)', () => {
  it('renderiza la pantalla y precarga el detalle del error (fallback a los campos que sí emite el script)', () => {
    render(<CorreccionErrorFuncional />);

    expect(screen.getByText('Corrección Error Funcional M1/M2')).toBeInTheDocument();
    const objHttpCode = document.querySelector('z-text-input#field-qd_strHttpCode');
    expect((objHttpCode as unknown as { model?: string })?.model).toBe('400');
  });

  it('sin intentos previos muestra la fila vacía del historial', () => {
    render(<CorreccionErrorFuncional />);
    expect(screen.getByText('Sin intentos anteriores registrados')).toBeInTheDocument();
  });

  it('"Escalar a Soporte Técnico" completa la tarea con esa acción, sin tocar el payload', () => {
    render(<CorreccionErrorFuncional />);

    fireEvent.click(screen.getByText('Escalar a Soporte Técnico'));

    expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'ESCALAR_SOPORTE' }),
    );
  });

  it('"Ver Log Completo" abre el modal con el log técnico', () => {
    render(<CorreccionErrorFuncional />);

    fireEvent.click(screen.getByText('Ver Log Completo'));

    expect(screen.getByText('Log completo del rechazo funcional')).toBeInTheDocument();
    const objLog = document.querySelector('z-textarea#field-qd_strCompleteLogAPI');
    expect((objLog as unknown as { model?: string })?.model).toBe('Log completo del rechazo');
  });
});
