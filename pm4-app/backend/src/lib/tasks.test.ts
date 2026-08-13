import { describe, expect, it } from 'vitest';
import { pickActiveTask } from './tasks';

const tarea = (in_intId: number, in_strStatus?: string) => ({ id: in_intId, status: in_strStatus });

describe('pickActiveTask', () => {
  it('elige la tarea ACTIVE', () => {
    const lstTasks = [tarea(1, 'CLOSED'), tarea(2, 'ACTIVE'), tarea(3, 'CLOSED')];
    expect(pickActiveTask(lstTasks)?.id).toBe(2);
  });

  it.each(['ACTIVE', 'OPEN', 'IN_PROGRESS'])('reconoce el estado %s', (in_strStatus) => {
    expect(pickActiveTask([tarea(1, 'CLOSED'), tarea(2, in_strStatus)])?.id).toBe(2);
  });

  it('compara sin distinguir mayúsculas (PM4 no es consistente entre endpoints)', () => {
    expect(pickActiveTask([tarea(1, 'CLOSED'), tarea(2, 'active')])?.id).toBe(2);
    expect(pickActiveTask([tarea(1, 'CLOSED'), tarea(2, 'In_Progress')])?.id).toBe(2);
  });

  it('con varias activas devuelve la primera', () => {
    expect(pickActiveTask([tarea(1, 'ACTIVE'), tarea(2, 'ACTIVE')])?.id).toBe(1);
  });

  it('ignora estados desconocidos y sigue buscando', () => {
    const lstTasks = [tarea(1, 'ALGO_RARO'), tarea(2, 'OPEN')];
    expect(pickActiveTask(lstTasks)?.id).toBe(2);
  });

  it('con la lista vacía devuelve undefined (el endpoint responde 404)', () => {
    expect(pickActiveTask([])).toBeUndefined();
  });

  it('⚠️ sin ninguna activa cae a la PRIMERA de la lista, no a undefined', () => {
    // Comportamiento histórico conservado a propósito. En la práctica no se dispara porque
    // el endpoint ya consulta PM4 con status: 'ACTIVE', así que la lista viene pre-filtrada.
    // Pero si PM4 devolviera solo tareas cerradas, se abriría una CERRADA en vez de un 404.
    // Queda fijado para que cambiarlo sea una decisión consciente sobre el endpoint.
    const lstTasks = [tarea(7, 'CLOSED'), tarea(8, 'COMPLETED')];
    expect(pickActiveTask(lstTasks)?.id).toBe(7);
  });

  it('tolera tareas sin campo status', () => {
    expect(pickActiveTask([tarea(1, undefined), tarea(2, 'ACTIVE')])?.id).toBe(2);
    // Sin ninguna activa y sin status, sigue aplicando el fallback a la primera.
    expect(pickActiveTask([tarea(5, undefined)])?.id).toBe(5);
  });

  it('devuelve el objeto completo, no solo el id', () => {
    const objTask = { id: 9, status: 'ACTIVE', process_request_id: 100, data: { x: 1 } };
    expect(pickActiveTask([objTask])).toBe(objTask);
  });
});
