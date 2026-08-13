import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

/** Fixture fresco por test, para pisar campos sin contaminar los siguientes. */
const makeTask = (in_dicOverrides: Record<string, unknown> = {}) => ({
  ...OBJ_TASK,
  data: { ...OBJ_TASK.data, ...in_dicOverrides },
});

const OBJ_USE_TASK = {
  task: makeTask(),
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

beforeEach(() => {
  OBJ_USE_TASK.task = makeTask();
});

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

  it('"Escalar a Soporte Técnico" completa con esa acción y CONSERVA el payload como evidencia', () => {
    // El nombre del test prometía "sin tocar el payload" pero solo se assertaba la acción.
    // El fixture entra con un payload no vacío justamente para poder verificarlo: escalar
    // NO debe vaciarlo (a diferencia de reenviar), porque queda como evidencia del rechazo.
    OBJ_USE_TASK.task = makeTask({ qd_strPayloadSent: '{"canal_cod":"XX"}' });
    render(<CorreccionErrorFuncional />);

    fireEvent.click(screen.getByText('Escalar a Soporte Técnico'));

    expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
      expect.objectContaining({
        qd_strAction: 'ESCALAR_SOPORTE',
        qd_strPayloadSent: '{"canal_cod":"XX"}',
      }),
    );
  });

  it('"Corregir y Reenviar" VACÍA qd_strPayloadSent (si no, se reenvía el payload viejo)', async () => {
    // El fallo más caro de esta pantalla y el único que su código documenta explícitamente:
    // opMomento2 reconstruye el body desde los campos corregidos, pero si qd_strPayloadSent
    // llega con el valor viejo, el script ve diferencia y reenvía el VIEJO a SmartSupervision.
    // Sin este test, borrar esa línea pasa en verde y el bug es silencioso.
    OBJ_USE_TASK.task = makeTask({ qd_strPayloadSent: '{"canal_cod":"XX"}' });
    render(<CorreccionErrorFuncional />);

    fireEvent.click(screen.getByText(/Corregir y Reenviar/));

    await vi.waitFor(() => {
      expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
        expect.objectContaining({
          qd_strAction: 'CORREGIR_REENVIAR',
          qd_strPayloadSent: '',
          qd_strPayloadAdjustNeeded: 'NO',
        }),
      );
    });
  });

  it('reenviar sin cambios deja constancia explícita en qd_strFieldCorrection', () => {
    // lstCambios() vacío ⇒ texto fijo, para que el resumen nunca viaje vacío al BPM.
    render(<CorreccionErrorFuncional />);

    fireEvent.click(screen.getByText(/Corregir y Reenviar/));

    return vi.waitFor(() => {
      expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
        expect.objectContaining({ qd_strFieldCorrection: 'Reenvío sin cambios en el payload' }),
      );
    });
  });

  it('"Ver Log Completo" abre el modal con el log técnico', () => {
    render(<CorreccionErrorFuncional />);

    fireEvent.click(screen.getByText('Ver Log Completo'));

    expect(screen.getByText('Log completo del rechazo funcional')).toBeInTheDocument();
    const objLog = document.querySelector('z-textarea#field-qd_strCompleteLogAPI');
    expect((objLog as unknown as { model?: string })?.model).toBe('Log completo del rechazo');
  });
});
