export function useToken(): string {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('token') ??
    import.meta.env.VITE_PM4_TOKEN ??
    ''
  );
}

export function useTaskId(): string {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('task_id') ??
    import.meta.env.VITE_TASK_ID ??
    ''
  );
}

export function useCaseId(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('case_id') ?? import.meta.env.VITE_CASE_ID ?? '';
}

export function useProcessId(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('process_id') ?? import.meta.env.VITE_PROCESS_ID ?? '';
}

export function useEventId(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('event_id') ?? import.meta.env.VITE_EVENT_ID ?? '';
}
