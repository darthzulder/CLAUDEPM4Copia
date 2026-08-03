import { useState, useEffect, useCallback } from 'react';
import pm4 from '../api/pm4Client';
import { useTaskId, useCaseId, useProcessId, useEventId } from './useToken';

export interface TaskData {
  id: number;
  status: string;
  process_request_id: number;
  data: Record<string, unknown>;
}

export function useTask() {
  // Resolvemos los identificadores del caso desde la URL o el entorno
  const strTaskId    = useTaskId();
  const strCaseId    = useCaseId();
  const strProcessId = useProcessId();
  const strEventId   = useEventId();
  const isWebEntry = !strTaskId && !strCaseId;
  const [task, setTask]           = useState<TaskData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Si no hay task ni case no hay nada que cargar
    if (!strTaskId && !strCaseId) {
      setLoading(false);
      return;
    }

    if (strCaseId) {
      // Resolver task activo desde el case_id
      console.log(`[useTask] Resolviendo task desde case_id=${strCaseId}...`);
      pm4.get(`/cases/${strCaseId}/task`)
        .then((in_objResp) => {
          // Guardamos la tarea que devolvio PM4
          const objTask = in_objResp.data as TaskData;
          console.log(`[useTask] case_id=${strCaseId} → task_id=${objTask.id}`);
          console.log('[useTask] Variables del caso (task.data):', objTask.data);
          setTask(objTask);
        })
        .catch((in_excError) => setError(in_excError.response?.data?.message ?? in_excError.message))
        .finally(() => setLoading(false));
      return;
    }

    // Ruta clásica: task_id directo
    console.log(`[useTask] Cargando task_id=${strTaskId}...`);
    pm4.get(`/tasks/${strTaskId}`, { params: { include: 'data' } })
      .then((in_objResp) => {
        console.log(`[useTask] task_id=${strTaskId} cargado`);
        console.log('[useTask] Variables del caso (task.data):', in_objResp.data?.data);
        setTask(in_objResp.data);
      })
      .catch((in_excError) => setError(in_excError.response?.data?.message ?? in_excError.message))
      .finally(() => setLoading(false));
  }, [strTaskId, strCaseId]);

  // Completamos la tarea actual y derivamos el proceso al siguiente nodo
  const completeTask = useCallback(
    async (in_dicFormData: Record<string, unknown>) => {
      if (!task?.id) throw new Error('No hay task_id resuelto');
      setSubmitting(true);
      try {
        // Armamos el payload con el estado completado y los datos del form
        const objPayload = { status: 'COMPLETED', data: in_dicFormData };
        console.log(`[useTask] Enviando task_id=${task.id}:`, objPayload);
        const objResponse = await pm4.put(`/tasks/${task.id}`, objPayload);
        console.log('[useTask] Respuesta de PM4:', objResponse.data);
        return objResponse.data;
      } finally {
        setSubmitting(false);
      }
    },
    [task]
  );

  // Reasigna la tarea actual a otro usuario PM4 (user_id) sin completarla. Confirmado
  // contra la UI real de PM4 (curl del navegador): el PUT que reasigna lleva SOLO
  // { user_id } — mezclarlo con status/data en el mismo PUT hace que PM4 no reasigne.
  // Los datos del formulario se guardan aparte, vía PUT /requests/{id} (mismo mecanismo
  // que "Guardar Borrador"), sin tocar el status de la tarea.
  const reassignTask = useCallback(
    async (in_dicFormData: Record<string, unknown>, in_strUserId: string) => {
      if (!task?.id) throw new Error('No hay task_id resuelto');
      setSubmitting(true);
      try {
        console.log(`[useTask] Reasignando task_id=${task.id} a user_id=${in_strUserId}`);
        const objReassignResp = await pm4.put(`/tasks/${task.id}`, { user_id: in_strUserId });
        console.log('[useTask] Respuesta de PM4 (reasignar):', objReassignResp.data);

        if (task.process_request_id) {
          const objDataResp = await pm4.put(`/requests/${task.process_request_id}`, { data: in_dicFormData });
          console.log('[useTask] Respuesta de PM4 (guardar datos):', objDataResp.data);
        }
        return objReassignResp.data;
      } finally {
        setSubmitting(false);
      }
    },
    [task]
  );

  // Guarda los datos del caso sin completar/avanzar la tarea (p.ej. "Guardar Borrador").
  const saveDraft = useCallback(
    async (in_dicFormData: Record<string, unknown>) => {
      if (!task?.process_request_id) throw new Error('No hay process_request_id resuelto');
      setSubmitting(true);
      try {
        const objPayload = { data: in_dicFormData };
        console.log(`[useTask] Guardando borrador request_id=${task.process_request_id}:`, objPayload);
        const objResponse = await pm4.put(`/requests/${task.process_request_id}`, objPayload);
        console.log('[useTask] Respuesta de PM4:', objResponse.data);
        return objResponse.data;
      } finally {
        setSubmitting(false);
      }
    },
    [task]
  );

  // Iniciamos un proceso nuevo cuando la app entra sin task previo
  const startProcess = useCallback(
    async (in_dicFormData: Record<string, unknown>) => {
      if (!strProcessId) throw new Error('No hay process_id para iniciar el proceso');
      setSubmitting(true);
      try {
        // Pasamos el evento de arranque como parametro si existe
        const dicParams: Record<string, string> = {};
        if (strEventId) dicParams['event'] = strEventId;
        const objResponse = await pm4.post(`/process_events/${strProcessId}`, in_dicFormData, { params: dicParams });
        console.log('[useTask] Proceso iniciado:', objResponse.data);
        return objResponse.data as Record<string, unknown>;
      } finally {
        setSubmitting(false);
      }
    },
    [strProcessId, strEventId]
  );

  return { task, loading, error, submitting, completeTask, saveDraft, reassignTask, startProcess, isWebEntry };
}
