import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GestionLinea2 from './GestionLinea2';

// Smoke + reglas de SCR-003 (patrón de docs/guides/testing-conventions.md): la pantalla se
// aísla de la red mockeando useTask (task.data) y useCollection (catálogos PM4).
// ⚠️ `task` DEBE ser una referencia estable entre renders: la pantalla hace
// `useEffect(..., [task, reset])` para precargar con reset(task.data); un objeto literal
// nuevo por llamada relanza el efecto en bucle y el test muere por OOM.
const OBJ_TASK = {
  id: 1,
  status: 'ACTIVE',
  process_request_id: 10,
  data: {} as Record<string, unknown>,
};

const OBJ_USE_TASK = {
  task: OBJ_TASK,
  loading: false,
  error: null as string | null,
  submitting: false,
  // Devuelven promesas resueltas porque la pantalla encadena sobre el resultado.
  completeTask: vi.fn(() => Promise.resolve({})),
  saveDraft: vi.fn(() => Promise.resolve({})),
  reassignTask: vi.fn(() => Promise.resolve({})),
  startProcess: vi.fn(() => Promise.resolve({})),
  isWebEntry: false,
};

vi.mock('../../../../core/useTask', () => ({ useTask: () => OBJ_USE_TASK }));

// Firma COMPLETA de useCollection (`{ options, loading, rawMap, records }`, sin `error`) y
// con referencias estables — un `[]` literal nuevo reactiva useSyncDesc en bucle.
const CLL_VACIO: never[] = [];
const OBJ_RAW_MAP_VACIO: Record<string, Record<string, unknown>> = {};
const CLL_RECORDS_VACIO: Record<string, unknown>[] = [];
const OBJ_USE_COLLECTION = {
  options: CLL_VACIO,
  loading: false,
  rawMap: OBJ_RAW_MAP_VACIO,
  records: CLL_RECORDS_VACIO,
};

vi.mock('../../../../core/useCollection', async (in_fnImportOriginal) => {
  const objActual = await in_fnImportOriginal<typeof import('../../../../core/useCollection')>();
  return { ...objActual, useCollection: () => OBJ_USE_COLLECTION };
});

// RequestFileList (FLD-048) lista los archivos del request: sin este mock jsdom intenta el
// XHR real contra PM4 y ensucia la salida con AggregateError.
const OBJ_REQUEST_FILES = { files: [], loading: false, error: null };
vi.mock('../../../../core/useRequestFiles', async (in_fnImportOriginal) => {
  const objActual = await in_fnImportOriginal<typeof import('../../../../core/useRequestFiles')>();
  return { ...objActual, useRequestFiles: () => OBJ_REQUEST_FILES };
});

// Fixture fresco por test: se muta `data` del MISMO objeto para no romper la estabilidad
// de la referencia `task` (ver comentario de arriba).
const setTaskData = (in_dicData: Record<string, unknown> = {}) => { OBJ_TASK.data = in_dicData; };

beforeEach(() => { setTaskData(); });

describe('GestionLinea2 (SCR-003 · Otras Solicitudes)', () => {
  it('renderiza la pantalla con sus cuatro secciones (SEC-009..SEC-012)', () => {
    render(<GestionLinea2 />);

    expect(screen.getByText('Bandeja de Tareas — Gestión Línea 2')).toBeInTheDocument();
    expect(screen.getByText('S1 · Encabezado Estado del Caso')).toBeInTheDocument();
    expect(screen.getByText('S2 · Detalle del Caso Asignado')).toBeInTheDocument();
    expect(screen.getByText('S3 · Análisis y Respuesta Técnica')).toBeInTheDocument();
    expect(screen.getByText('S4 · Soportes Internos')).toBeInTheDocument();
  });

  it('precarga en el formulario los valores os_* que llegan en task.data', () => {
    setTaskData({
      os_strBpmCaseId: 'OS-2026-0118',
      os_strCaseDescription: 'El cliente solicita la cancelación de su póliza de hogar.',
    });
    render(<GestionLinea2 />);

    // Los controles del DS son custom elements sin input/textarea nativo: el valor vive en
    // la propiedad `model` (ver docs/guides/testing-conventions.md).
    const objCaseId = document.querySelector('z-text-input#field-os_strBpmCaseId');
    expect((objCaseId as unknown as { model?: string })?.model).toBe('OS-2026-0118');
    const objDesc = document.querySelector('z-textarea#field-os_strCaseDescription');
    expect((objDesc as unknown as { model?: string })?.model)
      .toBe('El cliente solicita la cancelación de su póliza de hogar.');
  });

  it('bloquea Confirmar Atención mientras no haya análisis técnico (RUL-003-01)', () => {
    render(<GestionLinea2 />);

    // React 19 asigna `disabled` como PROPIEDAD del custom element, no como atributo.
    const objSubmit = screen.getByText(/Confirmar Atención/).closest('z-button');
    expect(objSubmit).not.toBeNull();
    expect((objSubmit as unknown as { disabled?: boolean })?.disabled).toBe(true);
    // MSG-003-01 — el motivo del bloqueo tiene que estar a la vista.
    expect(screen.getByText(/antes de confirmar la/)).toBeInTheDocument();
  });

  it('habilita Confirmar Atención cuando el análisis técnico viene cargado (RUL-003-01)', () => {
    setTaskData({ os_strTechAnalysis: 'Se verificó la póliza en el core y se aplicó la cancelación.' });
    render(<GestionLinea2 />);

    // "Habilitado" se asserta por la consecuencia observable (desaparece MSG-003-01), no por
    // `disabled !== true`, que también pasaría si el botón no existiera.
    expect(screen.queryByText(/antes de confirmar la/)).not.toBeInTheDocument();
    const objSubmit = screen.getByText(/Confirmar Atención/).closest('z-button');
    expect((objSubmit as unknown as { disabled?: boolean })?.disabled).not.toBe(true);
  });

  it('semaforiza el SLA y avisa cuando quedan pocos días hábiles (FLD-042)', () => {
    setTaskData({ os_intSlaRemaining: 1 });
    render(<GestionLinea2 />);

    // Aparece en el InfoBar y en S1, de ahí el getAllByText.
    expect(screen.getAllByText('1 días hábiles').length).toBeGreaterThan(0);
    expect(screen.getByText(/Priorice el análisis técnico/)).toBeInTheDocument();
  });

  it('no muestra el aviso de SLA crítico con holgura suficiente', () => {
    setTaskData({ os_intSlaRemaining: 5 });
    render(<GestionLinea2 />);

    expect(screen.queryByText(/Priorice el análisis técnico/)).not.toBeInTheDocument();
  });

  it('ofrece las cuatro acciones del Anexo02 (ACT-003-01..04)', () => {
    render(<GestionLinea2 />);

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Reasignar Caso')).toBeInTheDocument();
    expect(screen.getByText('Guardar Borrador')).toBeInTheDocument();
    expect(screen.getByText(/Confirmar Atención/)).toBeInTheDocument();
  });
});
