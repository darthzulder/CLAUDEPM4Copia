import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RevisionRespuestaSac from './RevisionRespuestaSac';

// Smoke test de pantalla: depende de useTask + useCollection (plantillas de correo para
// la vista previa) + core/useRequestFiles (RequestFileList se renderiza dos veces, real,
// sin mockear — se aísla su red mockeando el hook que consume). Referencias ESTABLES
// entre renders — ver las 4 trampas de testing-conventions.md.
const OBJ_TASK = {
  id: 1,
  status: 'ACTIVE',
  process_request_id: 10,
  created_at: '2026-08-01T10:00:00.000Z',
  data: {
    qd_strSfcCode: '13950001',
    qd_strSlaAssigned: '10',
    qd_strRevisionVersion: 'v1',
    qd_strResponsableRole: 'Siniestros Autos',
    qd_strDraftDate: '01/08/2026 10:00',
    qd_strComplaintText: 'Texto original de la queja',
    qd_strClientResponse: '',
    qd_strActionsTaken: '',
    qd_strCompensation: '',
    qd_strSacRemarks: '',
  },
};

const OBJ_USE_TASK = {
  task: OBJ_TASK,
  loading: false,
  error: null,
  submitting: false,
  // completeTask() encadena .catch() en la pantalla — el mock debe devolver una promesa.
  completeTask: vi.fn((_dicData: Record<string, unknown>) => Promise.resolve({})),
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

// RequestFileList (dos instancias: adjuntos del radicador y soportes internos) pega a PM4
// vía core/useRequestFiles — se mockea ahí (ya tiene su propia suite en
// core/useRequestFiles.test.ts / components/RequestFileList.test.tsx).
vi.mock('../../../../core/useRequestFiles', () => ({
  useRequestFiles: () => ({ files: [], loading: false, error: null }),
}));

describe('RevisionRespuestaSac (SCR-008)', () => {
  it('renderiza la pantalla y precarga el contexto del caso', () => {
    render(<RevisionRespuestaSac />);

    expect(screen.getByText('Revisión Respuesta SAC')).toBeInTheDocument();
    const objSfcCode = document.querySelector('z-text-input#field-qd_strSfcCode');
    expect((objSfcCode as unknown as { model?: string })?.model).toBe('13950001');
  });

  it('sin qd_strSfcCode cae al número de caso BPM (respaldo antes de radicar ante la SFC)', () => {
    const dicData = OBJ_TASK.data as Record<string, unknown>;
    const genSfcCodeOriginal = dicData.qd_strSfcCode;
    dicData.qd_strSfcCode = '';
    dicData.qd_strBpmCaseId = '999';

    render(<RevisionRespuestaSac />);
    const objSfcCode = document.querySelector('z-text-input#field-qd_strSfcCode');
    expect((objSfcCode as unknown as { model?: string })?.model).toBe('999');

    dicData.qd_strSfcCode = genSfcCodeOriginal;
    delete dicData.qd_strBpmCaseId;
  });

  it('SLA crítico (<=3 días) muestra el banner de prioridad', () => {
    OBJ_USE_TASK.task.data.qd_strSlaAssigned = '2';
    render(<RevisionRespuestaSac />);
    expect(screen.getByText(/Priorice la/)).toBeInTheDocument();
    OBJ_USE_TASK.task.data.qd_strSlaAssigned = '10';
  });

  it('"Devolver con Observaciones" arranca deshabilitado (RUL-008-01: faltan observaciones)', () => {
    render(<RevisionRespuestaSac />);

    const objBtn = screen.getByText('Devolver con Observaciones').closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
  });

  it('"Aprobar Respuesta" completa la tarea con APROBAR y qd_blnSACApproved=true', () => {
    render(<RevisionRespuestaSac />);

    fireEvent.click(screen.getByText(/Aprobar Respuesta/));

    expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'APROBAR', qd_blnSACApproved: true }),
    );
  });

  it('"Reasignar Caso" completa la tarea con REASIGNAR, sin sobreescribir qd_blnSACApproved', () => {
    render(<RevisionRespuestaSac />);

    fireEvent.click(screen.getByText('Reasignar Caso'));

    // Reasignar no agrega qd_blnSACApproved (solo Aprobar/Devolver lo hacen) — el valor que
    // viaja es el que ya traía el form (el default de SCR008_DEFAULTS), no una decisión nueva.
    const lstCalls = OBJ_USE_TASK.completeTask.mock.calls;
    const objCallArg = lstCalls[lstCalls.length - 1][0] as Record<string, unknown>;
    expect(objCallArg.qd_strAction).toBe('REASIGNAR');
    expect(objCallArg.qd_blnSACApproved).toBe(false);
  });
});
