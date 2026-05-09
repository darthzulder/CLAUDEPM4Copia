import { Router, Request, Response } from 'express';
import axios, { AxiosError } from 'axios';

const router = Router();

function getToken(req: Request): string {
  const fromHeader = req.headers['x-pm4-token'] as string | undefined;
  return fromHeader ?? process.env.PM4_TOKEN ?? '';
}

async function pm4Request(method: string, path: string, req: Request, res: Response) {
  const token = getToken(req);
  const base = process.env.PM4_BASE_URL;
  const url = `${base}/api/1.0${path}`;

  console.log(`[proxy] ${method} ${url}`);
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    console.log('[proxy] body →', JSON.stringify(req.body).slice(0, 400));
  }

  try {
    const response = await axios({
      method,
      url,
      params: method === 'GET' ? req.query : undefined,
      data: ['POST', 'PUT', 'PATCH'].includes(method) ? req.body : undefined,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    console.log(`[proxy] ← ${response.status} OK`);
    res.json(response.data);
  } catch (err) {
    const e = err as AxiosError;
    const status = e.response?.status ?? 500;
    console.error(`[proxy] ← ${status} ERROR:`, JSON.stringify(e.response?.data ?? e.message).slice(0, 300));
    res.status(status).json(e.response?.data ?? { message: e.message });
  }
}

// Tasks
router.get('/tasks', (req, res) => pm4Request('GET', '/tasks', req, res));
router.get('/tasks/:id', (req, res) => pm4Request('GET', `/tasks/${req.params.id}`, req, res));
router.put('/tasks/:id', (req, res) => pm4Request('PUT', `/tasks/${req.params.id}`, req, res));

// Requests (casos)
router.get('/requests/:id', (req, res) => pm4Request('GET', `/requests/${req.params.id}`, req, res));

// Resolver task activo a partir de un case_id (request_id)
router.get('/cases/:case_id/task', async (req, res) => {
  const token = getToken(req);
  const base = process.env.PM4_BASE_URL;
  const caseId = req.params.case_id;

  try {
    // Buscar tareas del caso — probamos PMQL con request_id numérico
    const response = await axios.get(`${base}/api/1.0/tasks`, {
      params: {
        pmql: `process_request_id = ${caseId}`,
        per_page: 100,
        include: 'data',
      },
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    console.log(`[cases] PM4 tasks response status:`, response.status);
    console.log(`[cases] Total tasks encontradas:`, response.data?.meta?.total ?? response.data?.data?.length);

    const tasks: Record<string, unknown>[] = response.data?.data ?? [];

    // Filtrar la activa (status ACTIVE o IN_PROGRESS según PM4)
    const activeTask = tasks.find(t =>
      ['ACTIVE', 'OPEN', 'IN_PROGRESS'].includes(String(t['status'] ?? '').toUpperCase())
    ) ?? tasks[0];

    if (!activeTask) {
      res.status(404).json({ message: `No hay tarea activa para el caso ${caseId}` });
      return;
    }

    console.log(`[cases] caso ${caseId} → task_id ${activeTask['id']} status=${activeTask['status']}`);
    res.json(activeTask);
  } catch (err) {
    const e = err as AxiosError;
    const status = e.response?.status ?? 500;
    console.error(`[cases] ERROR:`, e.response?.data ?? e.message);
    res.status(status).json(e.response?.data ?? { message: e.message });
  }
});

// Processes
router.get('/start_processes', (req, res) => pm4Request('GET', '/start_processes', req, res));
router.post('/process_events/:process_id', (req, res) =>
  pm4Request('POST', `/process_events/${req.params.process_id}`, req, res)
);

// Collections
router.get('/collections', (req, res) => pm4Request('GET', '/collections', req, res));
router.get('/collections/:id/records', (req, res) =>
  pm4Request('GET', `/collections/${req.params.id}/records`, req, res)
);

// Scripts (watchers) — PM4 path is /scripts/execute/{id}, not /scripts/{id}/execute
router.post('/scripts/:id/execute', (req, res) =>
  pm4Request('POST', `/scripts/execute/${req.params.id}`, req, res)
);

// Files — list files attached to a request
router.get('/requests/:request_id/files', (req, res) =>
  pm4Request('GET', `/requests/${req.params.request_id}/files`, req, res)
);

// Files — stream binary content (PDF, images, etc.) proxied with auth
async function streamFile(pmPath: string, req: Request, res: Response) {
  const token = getToken(req);
  const base  = process.env.PM4_BASE_URL;
  const url   = `${base}/api/1.0${pmPath}`;

  console.log(`[file-stream] GET ${url}`);
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: { Authorization: `Bearer ${token}` },
    });

    const ct = (response.headers['content-type'] as string | undefined) ?? 'application/octet-stream';
    const cd = response.headers['content-disposition'] as string | undefined;
    res.setHeader('Content-Type', ct);
    if (cd) res.setHeader('Content-Disposition', cd);
    console.log(`[file-stream] ← ${response.status} ${ct}`);
    (response.data as NodeJS.ReadableStream).pipe(res);
  } catch (err) {
    const e = err as AxiosError;
    const status = e.response?.status ?? 500;
    console.error(`[file-stream] ERROR ${status}:`, e.message);
    res.status(status).json({ message: e.message });
  }
}

router.get('/files/:file_id/contents', (req, res) =>
  streamFile(`/files/${req.params.file_id}/contents`, req, res)
);

router.get('/requests/:request_id/files/:file_id/contents', (req, res) =>
  streamFile(`/requests/${req.params.request_id}/files/${req.params.file_id}/contents`, req, res)
);

export default router;
