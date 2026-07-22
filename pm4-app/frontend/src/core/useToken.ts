export function useToken(): string {
  // Leemos los parametros de la URL del iframe
  const objParams = new URLSearchParams(window.location.search);
  // Devolvemos el token de la URL o el de entorno como respaldo
  return (
    objParams.get('token') ??
    import.meta.env.VITE_PM4_TOKEN ??
    ''
  );
}

export function useTaskId(): string {
  // Leemos los parametros de la URL del iframe
  const objParams = new URLSearchParams(window.location.search);
  // Devolvemos el task_id de la URL o el de entorno como respaldo
  return (
    objParams.get('task_id') ??
    import.meta.env.VITE_TASK_ID ??
    ''
  );
}

export function useCaseId(): string {
  // Leemos los parametros de la URL del iframe
  const objParams = new URLSearchParams(window.location.search);
  // Devolvemos el case_id de la URL o el de entorno como respaldo
  return objParams.get('case_id') ?? import.meta.env.VITE_CASE_ID ?? '';
}

export function useProcessId(): string {
  // Leemos los parametros de la URL del iframe
  const objParams = new URLSearchParams(window.location.search);
  // Devolvemos el process_id de la URL o el de entorno como respaldo
  return objParams.get('process_id') ?? import.meta.env.VITE_PROCESS_ID ?? '';
}

export function useEventId(): string {
  // Leemos los parametros de la URL del iframe
  const objParams = new URLSearchParams(window.location.search);
  // Devolvemos el event_id de la URL o el de entorno como respaldo
  return objParams.get('event_id') ?? import.meta.env.VITE_EVENT_ID ?? '';
}

// URL del home de tareas de ProcessMaker (frame superior), para redirigir tras
// guardar un borrador sin completar la tarea.
export function pm4TasksUrl(): string {
  const base = (import.meta.env.VITE_PM4_BASE_URL ?? '').replace(/\/$/, '');
  return `${base}/tasks`;
}
