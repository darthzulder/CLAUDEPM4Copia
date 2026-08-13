import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RevisionErrorTecnicoProrroga from './RevisionErrorTecnicoProrroga';

// Smoke test de pantalla: solo depende de useTask (no consume useCollection). Es el
// mismo patrón que SCR-004/SCR-011 (mismo componente, distinto texto/acción de escalado).
const OBJ_TASK = {
  id: 1,
  status: 'ACTIVE',
  process_request_id: 10,
  data: {
    qd_strHttpCode: '400',
    qd_strErrorType: 'ESTRUCTURA_PAYLOAD',
    qd_strAttemptNum: '2',
    qd_strEndpointCalled: 'POST /api/queja/{codigo}/prorroga/',
    qd_strApiTechMessage: 'fecha_prorroga inválida',
    qd_strCompleteLogAPI: 'Log completo del intento fallido de prórroga',
    qd_strPayloadSent: '',
    qd_strPayloadAdjustNeeded: 'NO',
    qd_strRootCause: '',
    qd_strCorrectionApplied: '',
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
  // completeTask() encadena .catch() en la pantalla — el mock debe devolver una promesa.
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

describe('RevisionErrorTecnicoProrroga (SCR-011)', () => {
  it('renderiza la pantalla y precarga el detalle del error de prórroga', () => {
    render(<RevisionErrorTecnicoProrroga />);

    expect(screen.getByText('Revisión Error Técnico Prórroga')).toBeInTheDocument();
    const objHttpCode = document.querySelector('z-text-input#field-qd_strHttpCode');
    expect((objHttpCode as unknown as { model?: string })?.model).toBe('400');
  });

  it('"Autorizar Reenvío Prórroga" arranca deshabilitado (RUL-011-01)', () => {
    render(<RevisionErrorTecnicoProrroga />);

    const objBtn = screen.getByText(/Autorizar Reenvío Prórroga/).closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
  });

  it('"Escalar a Proveedor" completa la tarea con esa acción sin exigir causa/corrección', () => {
    // Se quitó la aserción `?.disabled).not.toBe(true)`: la satisfacen `false`, `undefined`
    // Y que `closest()` devuelva null, así que no probaba nada. Que el click complete la
    // tarea con el fixture VACÍO (sin causa raíz ni corrección) es la prueba real de que
    // esta acción no está sujeta a RUL-011-01, a diferencia de Autorizar.
    render(<RevisionErrorTecnicoProrroga />);

    fireEvent.click(screen.getByText('Escalar a Proveedor'));

    expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'ESCALAR_PROVEEDOR' }),
    );
  });

  it('con causa raíz y corrección, "Autorizar Reenvío Prórroga" completa con AUTORIZAR_REENVIO', async () => {
    OBJ_USE_TASK.task = makeTask({
      qd_strRootCause: 'Formato de fecha incorrecto',
      qd_strCorrectionApplied: 'Se normalizó a DD/MM/YYYY',
    });
    render(<RevisionErrorTecnicoProrroga />);

    fireEvent.click(screen.getByText(/Autorizar Reenvío Prórroga/));

    await vi.waitFor(() => {
      expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
        expect.objectContaining({ qd_strAction: 'AUTORIZAR_REENVIO' }),
      );
    });
  });

  it('con ajuste de payload marcado y JSON inválido, Autorizar queda bloqueado', () => {
    // Bloqueo se asserta por la propiedad + la alerta, NO clickeando: en jsdom un z-button
    // deshabilitado no es un <button> nativo y `fireEvent.click` dispara igual su onClick.
    OBJ_USE_TASK.task = makeTask({
      qd_strRootCause: 'causa',
      qd_strCorrectionApplied: 'corrección',
      qd_strPayloadAdjustNeeded: 'SI',
      qd_strPayloadSent: '{roto',
    });
    render(<RevisionErrorTecnicoProrroga />);

    const objBtn = screen.getByText(/Autorizar Reenvío Prórroga/).closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
    expect(screen.getByText(/antes de autorizar el reenvío de la prórroga/)).toBeInTheDocument();
  });

  it('"Ver Log Completo" abre el modal con el log técnico', () => {
    render(<RevisionErrorTecnicoProrroga />);

    fireEvent.click(screen.getByText('Ver Log Completo'));

    expect(screen.getByText('Log completo del error técnico')).toBeInTheDocument();
    const objLog = document.querySelector('z-textarea#field-qd_strCompleteLogAPI');
    expect((objLog as unknown as { model?: string })?.model).toBe('Log completo del intento fallido de prórroga');
  });
});
