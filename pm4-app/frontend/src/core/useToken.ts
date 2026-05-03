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
