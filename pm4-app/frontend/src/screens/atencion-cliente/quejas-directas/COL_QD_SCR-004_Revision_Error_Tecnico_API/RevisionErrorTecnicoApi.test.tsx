import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RevisionErrorTecnicoApi from './RevisionErrorTecnicoApi';

// Smoke test de pantalla (patrón de docs/guides/testing-conventions.md): solo depende de
// useTask (no consume useCollection), así que alcanza con mockear ese hook. La referencia
// devuelta DEBE ser estable entre renders (ver las 4 trampas documentadas) porque la
// pantalla hace `useEffect(..., [task, reset])` para precargar con `reset(task.data)`.
const OBJ_TASK = {
  id: 1,
  status: 'ACTIVE',
  process_request_id: 10,
  data: {
    qd_strHttpCode: '400',
    qd_strErrorType: 'ESTRUCTURA_PAYLOAD',
    qd_strAttemptNum: '2',
    qd_strEndpointCalled: 'POST /api/queja/',
    qd_strApiTechMessage: 'El código ya existe',
    qd_strCompleteLogAPI: 'Log completo del intento fallido',
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
  completeTask: vi.fn(),
  saveDraft: vi.fn(),
  reassignTask: vi.fn(),
  startProcess: vi.fn(),
  isWebEntry: false,
};

vi.mock('../../../../core/useTask', () => ({ useTask: () => OBJ_USE_TASK }));

describe('RevisionErrorTecnicoApi (SCR-004)', () => {
  it('renderiza la pantalla y precarga el detalle del error técnico', () => {
    render(<RevisionErrorTecnicoApi />);

    expect(screen.getByText('Revisión Error Técnico API')).toBeInTheDocument();
    const objHttpCode = document.querySelector('z-text-input#field-qd_strHttpCode');
    expect((objHttpCode as unknown as { model?: string })?.model).toBe('400');
  });

  it('el botón "Autorizar Reenvío" arranca deshabilitado (RUL-004-01: faltan causa raíz/corrección)', () => {
    render(<RevisionErrorTecnicoApi />);

    const objBtn = screen.getByText(/Autorizar Reenvío/).closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
  });

  it('"Ver Log Completo" abre el modal con el log técnico', () => {
    render(<RevisionErrorTecnicoApi />);

    expect(screen.queryByText('Log completo del error técnico')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver Log Completo'));

    expect(screen.getByText('Log completo del error técnico')).toBeInTheDocument();
    const objLog = document.querySelector('z-textarea#field-qd_strCompleteLogAPI');
    expect((objLog as unknown as { model?: string })?.model).toBe('Log completo del intento fallido');
  });
});
