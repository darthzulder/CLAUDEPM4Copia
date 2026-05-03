import { useState, useEffect, useCallback } from 'react';
import pm4 from '../api/pm4Client';
import { useTaskId } from './useToken';

export interface TaskData {
  id: number;
  status: string;
  process_request_id: number;
  data: Record<string, unknown>;
}

export function useTask() {
  const taskId = useTaskId();
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }
    pm4.get(`/tasks/${taskId}`, { params: { include: 'data' } })
      .then((r) => {
        console.log('[useTask] Datos recibidos del task:', r.data);
        console.log('[useTask] Variables del caso (task.data):', r.data?.data);
        setTask(r.data);
      })
      .catch((e) => setError(e.response?.data?.message ?? e.message))
      .finally(() => setLoading(false));
  }, [taskId]);

  const completeTask = useCallback(
    async (formData: Record<string, unknown>) => {
      if (!taskId) throw new Error('No task_id disponible');
      setSubmitting(true);
      try {
        const payload = { status: 'COMPLETED', data: formData };
        console.log('[useTask] Enviando al task:', payload);
        const response = await pm4.put(`/tasks/${taskId}`, payload);
        console.log('[useTask] Respuesta de PM4:', response.data);
        return response.data;
      } finally {
        setSubmitting(false);
      }
    },
    [taskId]
  );

  return { task, loading, error, submitting, completeTask };
}
