import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RevisionRespuestaSac from './RevisionRespuestaSac';

// Smoke test de pantalla: depende de useTask + useCollection (plantillas de correo para
// la vista previa) + core/useRequestFiles (RequestFileList se renderiza dos veces, real,
// sin mockear — se aísla su red mockeando el hook que consume). Referencias ESTABLES
// entre renders — ver las 4 trampas de testing-conventions.md.

/** Fixture FRESCO por test. Antes se mutaba un objeto compartido restaurándolo al final del
 *  cuerpo del test: si una aserción fallaba en el medio, el restore no corría y el resto del
 *  archivo quedaba con datos corruptos. */
const makeTaskData = (): Record<string, unknown> => ({
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
});

const makeTask = () => ({
  id: 1,
  status: 'ACTIVE',
  process_request_id: 10,
  created_at: '2026-08-01T10:00:00.000Z',
  data: makeTaskData(),
});

const OBJ_USE_TASK = {
  task: makeTask(),
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

beforeEach(() => {
  OBJ_USE_TASK.task = makeTask();
});

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
// Referencias a nivel de módulo (trampa 1) y spread de importOriginal para NO borrar
// `resolveFileId`, que vive en el mismo módulo y podría necesitar algún hijo.
const CLL_FILES_VACIO: never[] = [];
const OBJ_USE_REQUEST_FILES = { files: CLL_FILES_VACIO, loading: false, error: null };

vi.mock('../../../../core/useRequestFiles', async (in_fnImportOriginal) => {
  const objActual = await in_fnImportOriginal<typeof import('../../../../core/useRequestFiles')>();
  return { ...objActual, useRequestFiles: () => OBJ_USE_REQUEST_FILES };
});

describe('RevisionRespuestaSac (SCR-008)', () => {
  it('renderiza la pantalla y precarga el contexto del caso', () => {
    render(<RevisionRespuestaSac />);

    expect(screen.getByText('Revisión Respuesta SAC')).toBeInTheDocument();
    const objSfcCode = document.querySelector('z-text-input#field-qd_strSfcCode');
    expect((objSfcCode as unknown as { model?: string })?.model).toBe('13950001');
  });

  it('sin qd_strSfcCode cae al número de caso BPM (respaldo antes de radicar ante la SFC)', () => {
    // El beforeEach da un fixture fresco, así que se puede mutar sin restaurar.
    OBJ_USE_TASK.task.data.qd_strSfcCode = '';
    OBJ_USE_TASK.task.data.qd_strBpmCaseId = '999';

    render(<RevisionRespuestaSac />);
    const objSfcCode = document.querySelector('z-text-input#field-qd_strSfcCode');
    expect((objSfcCode as unknown as { model?: string })?.model).toBe('999');
  });

  it('SLA crítico (<=3 días) muestra el banner de prioridad', () => {
    OBJ_USE_TASK.task.data.qd_strSlaAssigned = '2';
    render(<RevisionRespuestaSac />);
    expect(screen.getByText(/Priorice la/)).toBeInTheDocument();
  });

  it('con SLA holgado NO muestra el banner de prioridad', () => {
    // Contraparte del anterior: sin esto, el test de arriba no distingue "el banner aparece
    // por el SLA" de "el banner aparece siempre".
    render(<RevisionRespuestaSac />); // fixture: qd_strSlaAssigned = '10'
    expect(screen.queryByText(/Priorice la/)).not.toBeInTheDocument();
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

  it('"Reasignar Caso" completa con REASIGNAR y PRESERVA el qd_blnSACApproved existente', () => {
    // El fixture entra con `true` A PROPÓSITO: el default del form es `false`, así que
    // assertar `false` acá no probaría nada — pasaría igual si REASIGNAR sobreescribiera el
    // campo. Con `true`, si alguien agrega `...(action === 'REASIGNAR' ? {SACApproved:false} : {})`
    // (justo lo que el nombre del test prohíbe), esta aserción se pone en rojo.
    OBJ_USE_TASK.task.data.qd_blnSACApproved = true;

    render(<RevisionRespuestaSac />);
    fireEvent.click(screen.getByText('Reasignar Caso'));

    expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'REASIGNAR', qd_blnSACApproved: true }),
    );
  });

  it('"Devolver" bloqueado marca el error de RUL-008-01 y NO completa la tarea', () => {
    render(<RevisionRespuestaSac />); // qd_strSacRemarks vacío en el fixture

    fireEvent.click(screen.getByText('Devolver con Observaciones'));

    // El handler hace setError() y corta: la tarea no debe avanzar sin observaciones.
    expect(OBJ_USE_TASK.completeTask).not.toHaveBeenCalled();
  });

  it('con observaciones, "Devolver" completa con DEVOLVER y qd_blnSACApproved=false', async () => {
    // Rama que faltaba por completo: es la única que escribe SACApproved=false.
    OBJ_USE_TASK.task.data.qd_strSacRemarks = 'Falta detallar el análisis de la póliza.';

    render(<RevisionRespuestaSac />);
    // NO se asserta `disabled === false`: React deja la propiedad en `undefined` cuando el
    // valor es falso, así que esa aserción es un pase de tres vías (false, undefined, o
    // elemento no encontrado). La prueba real de que el botón está habilitado es que el
    // click efectivamente completa la tarea, que es lo que se asserta abajo.
    fireEvent.click(screen.getByText('Devolver con Observaciones'));

    // onDevolver pasa por handleSubmit (async), así que hay que esperar al flush.
    await vi.waitFor(() => {
      expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
        expect.objectContaining({ qd_strAction: 'DEVOLVER', qd_blnSACApproved: false }),
      );
    });
  });
});
