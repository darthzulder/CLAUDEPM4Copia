import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FormularioSuperintendencia from './FormularioSuperintendencia';

// Smoke test de pantalla: depende de useTask + useCollection (12 catálogos, todos
// mockeados con el mismo objeto estable) + core/useRequestFiles (RequestFileList real
// dentro de SeccionFraudeAnexos). Referencias ESTABLES entre renders — ver las 4 trampas
// de testing-conventions.md.
function makeTask(objDataOverrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    status: 'ACTIVE',
    process_request_id: 10,
    data: {
      qd_strFavorability: '1',
      qd_strFraudRelated: 'NO',
      qd_strSpecialCondition: '',
      qd_strM3ClosureStatus: '',
      ...objDataOverrides,
    },
  };
}

const OBJ_USE_TASK = {
  task: makeTask(),
  loading: false,
  error: null,
  submitting: false,
  // completeTask()/saveDraft() encadenan .catch()/await en la pantalla — deben devolver
  // una promesa, no undefined.
  completeTask: vi.fn((_d: Record<string, unknown>) => Promise.resolve({})),
  saveDraft: vi.fn((_d: Record<string, unknown>) => Promise.resolve({})),
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

vi.mock('../../../../core/useRequestFiles', async (in_fnImportOriginal) => {
  // resolveFileId es lógica pura ya cubierta por su propia suite — se conserva real; solo
  // se stubea el hook, que es el que pega a PM4 (RequestFileList lo consume).
  const objActual = await in_fnImportOriginal<typeof import('../../../../core/useRequestFiles')>();
  return { ...objActual, useRequestFiles: () => ({ files: [], loading: false, error: null }) };
});

beforeEach(() => {
  // El historial de llamadas de completeTask/saveDraft NO se limpia solo entre tests
  // (no hay clearMocks/restoreMocks global en vitest.config.ts) — hay que hacerlo a mano
  // para que "not.toHaveBeenCalled()" en un test no vea las llamadas de uno anterior.
  vi.clearAllMocks();
  OBJ_USE_TASK.task = makeTask();
});

describe('FormularioSuperintendencia (SCR-009)', () => {
  it('renderiza la pantalla y muestra la Condición de la Queja precargada', () => {
    render(<FormularioSuperintendencia />);

    expect(screen.getByText('Formulario Superintendencia')).toBeInTheDocument();
    // Sin catálogo (mock vacío), descOf cae al código crudo — confirma que task.data llegó.
    // Varios "Ro" del back comparten el mismo código '1' por defecto, así que se acota la
    // búsqueda al wrapper de Favorabilidad en vez de un texto '1' ambiguo en toda la pantalla.
    const objWrapper = screen.getByText('Favorabilidad').closest('.zds-field-wrap');
    expect(objWrapper).toHaveTextContent('1');
  });

  it('"Enviar a SmartSupervision" arranca deshabilitado sin Condición Especial (MSG-009-02)', () => {
    render(<FormularioSuperintendencia />);

    const objBtn = screen.getByText(/Enviar a SmartSupervision/).closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
    expect(screen.getByText(/Complete/)).toBeInTheDocument();
  });

  it('con fraude relacionado y datos de fraude vacíos, el envío sigue bloqueado (RUL-009-01)', () => {
    OBJ_USE_TASK.task = makeTask({ qd_strSpecialCondition: 'X', qd_strFraudRelated: 'SI' });
    render(<FormularioSuperintendencia />);

    expect(screen.getByText('Datos de Fraude CE-019-2024')).toBeInTheDocument();
    const objBtn = screen.getByText(/Enviar a SmartSupervision/).closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
    expect(screen.getByText(/datos de fraude/)).toBeInTheDocument();
    OBJ_USE_TASK.task = makeTask();
  });

  it('con Condición Especial completa y sin fraude, "Enviar a SmartSupervision" se habilita y abre el popup de confirmación', async () => {
    OBJ_USE_TASK.task = makeTask({ qd_strSpecialCondition: 'X' });
    render(<FormularioSuperintendencia />);

    const objBtn = screen.getByText(/Enviar a SmartSupervision/).closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).not.toBe(true);

    // onSolicitarEnvio es handleSubmit(...) de react-hook-form: react-hook-form valida de
    // forma asíncrona antes de abrir el popup, así que el cambio de estado no es
    // sincrónico con el click — hay que esperarlo con waitFor.
    fireEvent.click(screen.getByText(/Enviar a SmartSupervision/));
    await waitFor(() => expect(screen.getByText('Confirmar envío a SmartSupervision')).toBeInTheDocument());
    OBJ_USE_TASK.task = makeTask();
  });

  it('confirmar el popup completa la tarea con la acción ENVIAR_SFC', async () => {
    OBJ_USE_TASK.task = makeTask({ qd_strSpecialCondition: 'X' });
    render(<FormularioSuperintendencia />);

    fireEvent.click(screen.getByText(/Enviar a SmartSupervision/));
    await waitFor(() => expect(screen.getByText('Enviar ▶')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Enviar ▶'));

    await waitFor(() => expect(OBJ_USE_TASK.completeTask).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'ENVIAR_SFC' }),
    ));
    OBJ_USE_TASK.task = makeTask();
  });

  it('si la SFC rechazó el cierre, el botón cambia a "Reenviar Cierre (corrección)"', () => {
    OBJ_USE_TASK.task = makeTask({ qd_strSpecialCondition: 'X', qd_strM3ClosureStatus: 'Rechazado (400)' });
    render(<FormularioSuperintendencia />);

    expect(screen.getByText(/Reenviar Cierre \(corrección\)/)).toBeInTheDocument();
    expect(screen.getByText('Envío rechazado por SFC.')).toBeInTheDocument();
    OBJ_USE_TASK.task = makeTask();
  });

  it('"Guardar Borrador" guarda sin completar la tarea, con la acción GUARDAR_BORRADOR', async () => {
    render(<FormularioSuperintendencia />);

    fireEvent.click(screen.getByText('Guardar Borrador'));

    // onGuardarBorrador es async (llama saveDraft y luego redirige el frame superior) — el
    // registro de la llamada no es sincrónico con el click.
    await waitFor(() => expect(OBJ_USE_TASK.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ qd_strAction: 'GUARDAR_BORRADOR' }),
    ));
    expect(OBJ_USE_TASK.completeTask).not.toHaveBeenCalled();
  });
});
