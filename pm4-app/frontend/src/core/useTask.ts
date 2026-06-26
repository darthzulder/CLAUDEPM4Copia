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
  const taskId    = useTaskId();
  const caseId    = useCaseId();
  const processId = useProcessId();
  const eventId   = useEventId();
  const isWebEntry = !taskId && !caseId;
  const [task, setTask]           = useState<TaskData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!taskId && !caseId) {
      setLoading(false);
      return;
    }

    if (caseId) {
      // Resolver task activo desde el case_id
      console.log(`[useTask] Resolviendo task desde case_id=${caseId}...`);
      pm4.get(`/cases/${caseId}/task`)
        .then((r) => {
          const t = r.data as TaskData;
          console.log(`[useTask] case_id=${caseId} → task_id=${t.id}`);
          console.log('[useTask] Variables del caso (task.data):', t.data);
          setTask(t);
        })
        .catch((e) => setError(e.response?.data?.message ?? e.message))
        .finally(() => setLoading(false));
      return;
    }

    // Ruta clásica: task_id directo
    console.log(`[useTask] Cargando task_id=${taskId}...`);
    pm4.get(`/tasks/${taskId}`, { params: { include: 'data' } })
      .then((r) => {
        console.log(`[useTask] task_id=${taskId} cargado`);
        console.log('[useTask] Variables del caso (task.data):', r.data?.data);
        setTask(r.data);
      })
      .catch((e) => setError(e.response?.data?.message ?? e.message))
      .finally(() => setLoading(false));
  }, [taskId, caseId]);

  const completeTask = useCallback(
    async (formData: Record<string, unknown>) => {
      if (!task?.id) throw new Error('No hay task_id resuelto');
      setSubmitting(true);
      try {
        const payload = { status: 'COMPLETED', data: formData };
        console.log(`[useTask] Enviando task_id=${task.id}:`, payload);
        const response = await pm4.put(`/tasks/${task.id}`, payload);
        console.log('[useTask] Respuesta de PM4:', response.data);
        return response.data;
      } finally {
        setSubmitting(false);
      }
    },
    [task]
  );

  const startProcess = useCallback(
    async (formData: Record<string, unknown>) => {
      if (!processId) throw new Error('No hay process_id para iniciar el proceso');
      setSubmitting(true);
      try {
        const params: Record<string, string> = {};
        if (eventId) params['event'] = eventId;
        const response = await pm4.post(`/process_events/${processId}`, formData, { params });
        console.log('[useTask] Proceso iniciado:', response.data);
        return response.data as Record<string, unknown>;
      } finally {
        setSubmitting(false);
      }
    },
    [processId, eventId]
  );

  return { task, loading, error, submitting, completeTask, startProcess, isWebEntry };
}
