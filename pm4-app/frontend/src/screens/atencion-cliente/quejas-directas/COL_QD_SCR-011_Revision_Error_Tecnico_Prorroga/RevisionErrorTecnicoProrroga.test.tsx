import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

const OBJ_USE_TASK = {
  task: OBJ_TASK,
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

  it('"Escalar a Proveedor" está siempre disponible y completa la tarea con esa acción', () => {
    render(<RevisionErrorTecnicoProrroga />);

    const objBtnEscalar = screen.getByText('Escalar a Proveedor').closest('z-button');
    expect((objBtnEscalar as unknown as { disabled?: boolean })?.disabled).not.toBe(true);

    fireEvent.click(screen.getByText('Escalar a Proveedor'));

    expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'ESCALAR_PROVEEDOR' }),
    );
  });

  it('"Ver Log Completo" abre el modal con el log técnico', () => {
    render(<RevisionErrorTecnicoProrroga />);

    fireEvent.click(screen.getByText('Ver Log Completo'));

    expect(screen.getByText('Log completo del error técnico')).toBeInTheDocument();
    const objLog = document.querySelector('z-textarea#field-qd_strCompleteLogAPI');
    expect((objLog as unknown as { model?: string })?.model).toBe('Log completo del intento fallido de prórroga');
  });
});
