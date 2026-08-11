import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import pm4 from '../api/pm4Client';
import { useCaseId, useEventId, useProcessId, useTaskId } from './useToken';
import { useTask } from './useTask';

// Hook completo (no solo una función pura extraída): la carga inicial dispara un efecto con
// una petición HTTP real vía `pm4`, así que hay que mockear el cliente axios y los 4
// resolvers de useToken (igual patrón que las pantallas, ver testing-conventions.md). Se
// nombra .test.tsx (no .test.ts) porque renderHook necesita DOM — el project 'logic' corre
// en 'node' sin jsdom.
vi.mock('../api/pm4Client', () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));

vi.mock('./useToken', () => ({
  useTaskId: vi.fn(),
  useCaseId: vi.fn(),
  useProcessId: vi.fn(),
  useEventId: vi.fn(),
}));

const fnGet = vi.mocked(pm4.get);
const fnPut = vi.mocked(pm4.put);
const fnPost = vi.mocked(pm4.post);
const fnTaskId = vi.mocked(useTaskId);
const fnCaseId = vi.mocked(useCaseId);
const fnProcessId = vi.mocked(useProcessId);
const fnEventId = vi.mocked(useEventId);

beforeEach(() => {
  vi.clearAllMocks();
  // Por defecto no hay ningún identificador en la URL — cada test que lo necesite lo pisa.
  fnTaskId.mockReturnValue('');
  fnCaseId.mockReturnValue('');
  fnProcessId.mockReturnValue('');
  fnEventId.mockReturnValue('');
});

describe('useTask — carga inicial', () => {
  it('sin task_id ni case_id no golpea PM4 y expone isWebEntry', async () => {
    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.task).toBeNull();
    expect(result.current.isWebEntry).toBe(true);
    expect(fnGet).not.toHaveBeenCalled();
  });

  it('con task_id resuelve GET /tasks/{id}?include=data', async () => {
    fnTaskId.mockReturnValue('55');
    const objTaskResp = { id: 55, status: 'ACTIVE', process_request_id: 9, data: { qd_x: '1' } };
    fnGet.mockResolvedValueOnce({ data: objTaskResp });

    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fnGet).toHaveBeenCalledWith('/tasks/55', { params: { include: 'data' } });
    expect(result.current.task).toEqual(objTaskResp);
    expect(result.current.isWebEntry).toBe(false);
  });

  it('con case_id resuelve el task activo vía GET /cases/{id}/task', async () => {
    fnCaseId.mockReturnValue('C-1');
    const objTaskResp = { id: 77, status: 'ACTIVE', process_request_id: 3, data: {} };
    fnGet.mockResolvedValueOnce({ data: objTaskResp });

    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fnGet).toHaveBeenCalledWith('/cases/C-1/task');
    expect(result.current.task).toEqual(objTaskResp);
  });

  it('un error con response.data.message expone ese mensaje (no el genérico de axios)', async () => {
    fnTaskId.mockReturnValue('55');
    fnGet.mockRejectedValueOnce({
      response: { data: { message: 'Task no encontrada' } },
      message: 'Request failed with status code 404',
    });

    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Task no encontrada');
    expect(result.current.task).toBeNull();
  });

  it('sin response.data.message cae al message del error nativo', async () => {
    fnTaskId.mockReturnValue('55');
    fnGet.mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network Error');
  });
});

describe('completeTask', () => {
  it('lanza si no hay task resuelto', async () => {
    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.completeTask({})).rejects.toThrow('No hay task_id resuelto');
  });

  it('PUT /tasks/{id} con status COMPLETED + los datos del form', async () => {
    fnTaskId.mockReturnValue('55');
    fnGet.mockResolvedValueOnce({ data: { id: 55, status: 'ACTIVE', process_request_id: 9, data: {} } });
    fnPut.mockResolvedValueOnce({ data: { ok: true } });

    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let genResultado: unknown;
    await act(async () => {
      genResultado = await result.current.completeTask({ qd_x: '2' });
    });

    expect(fnPut).toHaveBeenCalledWith('/tasks/55', { status: 'COMPLETED', data: { qd_x: '2' } });
    expect(genResultado).toEqual({ ok: true });
    expect(result.current.submitting).toBe(false);
  });
});

describe('reassignTask — contrato de dos PUT', () => {
  it('lanza si no hay task resuelto', async () => {
    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.reassignTask({}, 'user-1')).rejects.toThrow('No hay task_id resuelto');
  });

  it('reasigna con SOLO user_id y guarda los datos aparte vía PUT /requests/{id}', async () => {
    fnTaskId.mockReturnValue('55');
    fnGet.mockResolvedValueOnce({ data: { id: 55, status: 'ACTIVE', process_request_id: 9, data: {} } });
    // Primer PUT = reasignación (/tasks/{id}); segundo PUT = guardado de datos (/requests/{id}).
    fnPut.mockResolvedValueOnce({ data: { reasignado: true } });
    fnPut.mockResolvedValueOnce({ data: { guardado: true } });

    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reassignTask({ qd_x: '3' }, 'user-99');
    });

    // Confirmado contra la UI real de PM4: el PUT que reasigna lleva SOLO { user_id } —
    // mezclarlo con status/data en el mismo PUT hace que PM4 no reasigne.
    expect(fnPut).toHaveBeenNthCalledWith(1, '/tasks/55', { user_id: 'user-99' });
    // Los datos del form se guardan aparte, sin tocar el status de la tarea.
    expect(fnPut).toHaveBeenNthCalledWith(2, '/requests/9', { data: { qd_x: '3' } });
    expect(fnPut).toHaveBeenCalledTimes(2);
  });

  it('sin process_request_id NO intenta el segundo PUT de guardado', async () => {
    fnTaskId.mockReturnValue('55');
    fnGet.mockResolvedValueOnce({ data: { id: 55, status: 'ACTIVE', process_request_id: 0, data: {} } });
    fnPut.mockResolvedValueOnce({ data: { reasignado: true } });

    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reassignTask({ qd_x: '3' }, 'user-99');
    });

    expect(fnPut).toHaveBeenCalledTimes(1);
    expect(fnPut).toHaveBeenCalledWith('/tasks/55', { user_id: 'user-99' });
  });
});

describe('saveDraft', () => {
  it('lanza si no hay process_request_id resuelto', async () => {
    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.saveDraft({})).rejects.toThrow('No hay process_request_id resuelto');
  });

  it('PUT /requests/{id} con los datos del form, sin tocar el status de la tarea', async () => {
    fnTaskId.mockReturnValue('55');
    fnGet.mockResolvedValueOnce({ data: { id: 55, status: 'ACTIVE', process_request_id: 9, data: {} } });
    fnPut.mockResolvedValueOnce({ data: { ok: true } });

    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveDraft({ qd_x: '4' });
    });

    expect(fnPut).toHaveBeenCalledWith('/requests/9', { data: { qd_x: '4' } });
  });
});

describe('startProcess', () => {
  it('lanza si no hay process_id para iniciar el proceso', async () => {
    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.startProcess({})).rejects.toThrow('No hay process_id para iniciar el proceso');
  });

  it('POST /process_events/{id} con el event_id como parámetro cuando existe', async () => {
    fnProcessId.mockReturnValue('31');
    fnEventId.mockReturnValue('node_661');
    fnPost.mockResolvedValueOnce({ data: { case_number: 100 } });

    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let genResultado: unknown;
    await act(async () => {
      genResultado = await result.current.startProcess({ qd_x: '5' });
    });

    expect(fnPost).toHaveBeenCalledWith('/process_events/31', { qd_x: '5' }, { params: { event: 'node_661' } });
    expect(genResultado).toEqual({ case_number: 100 });
  });

  it('sin event_id no manda el parámetro event', async () => {
    fnProcessId.mockReturnValue('31');
    fnEventId.mockReturnValue('');
    fnPost.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useTask());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.startProcess({});
    });

    expect(fnPost).toHaveBeenCalledWith('/process_events/31', {}, { params: {} });
  });
});
