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

export default router;
