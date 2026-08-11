import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorFuncionalProrroga from './ErrorFuncionalProrroga';

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

  it('"Cancelar Prórroga" está siempre disponible y completa la tarea con esa acción', () => {
    render(<ErrorFuncionalProrroga />);

    fireEvent.click(screen.getByText('Cancelar Prórroga'));

    expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'CANCELAR' }),
    );
  });
});
