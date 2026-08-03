import { Router, Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import { createDecipheriv, createHash } from 'crypto';
import multer from 'multer';
import FormData from 'form-data';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

function decryptToken(in_strBlob: string): string {
  // Leemos la llave de encriptacion desde el entorno
  const strKeyRaw = process.env.IFRAME_ENCRYPTION_KEY;
  if (!strKeyRaw) throw new Error('IFRAME_ENCRYPTION_KEY not configured');

  // Derivamos la llave a 32 bytes con sha256
  const objKey = createHash('sha256').update(strKeyRaw).digest(); // siempre 32 bytes
  // Decodificamos el blob base64 url-safe a buffer
  const objBuf  = Buffer.from(in_strBlob.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  // Separamos el vector de inicializacion del texto cifrado
  const objIv         = objBuf.subarray(0, 16);
  const objCipher     = objBuf.subarray(16);

  // Desciframos el contenido con aes-256-cbc
  const objDecipher  = createDecipheriv('aes-256-cbc', objKey, objIv);
  const objDecrypted = Buffer.concat([objDecipher.update(objCipher), objDecipher.final()]);
  const dicPayload   = JSON.parse(objDecrypted.toString('utf8')) as { token: string; ts: number };

  // Validamos que el token no haya expirado
  // TODO: bajar a 300 (5 min) en producción
  if (Math.floor(Date.now() / 1000) - dicPayload.ts > 3600) {
    throw new Error('Encrypted token expired (>1h)');
  }

  return dicPayload.token;
}

function getToken(req: Request): string {
  // Tomamos el token del header o del entorno como respaldo
  const strRaw = (req.headers['x-pm4-token'] as string | undefined) ?? process.env.PM4_TOKEN ?? '';

  // TODO: eliminar estos logs antes de producción
  console.log('[token] raw header:', strRaw ? strRaw.slice(0, 40) + '…' : '(vacío)');
  console.log('[token] tipo:', !strRaw ? 'vacío' : strRaw.startsWith('eyJ') ? 'JWT directo' : 'blob encriptado');

  // JWTs empiezan con "eyJ" — pasar directo (dev local con VITE_PM4_TOKEN)
  if (!strRaw || strRaw.startsWith('eyJ')) return strRaw;

  // Cualquier otra cosa → blob AES encriptado desde PM4
  try {
    const strDecrypted = decryptToken(strRaw);
    // TODO: eliminar este log antes de producción
    console.log('[token] 🔓 desencriptado:', strDecrypted.slice(0, 40) + '…');
    return strDecrypted;
  } catch (excError) {
    console.warn('[token] decrypt failed:', (excError as Error).message);
    return strRaw;
  }
}

function pm4Base(): string {
  return (process.env.PM4_BASE_URL ?? '').replace(/\/$/, '');
}

async function pm4Request(method: string, path: string, req: Request, res: Response) {
  // Resolvemos el token y armamos la url del proxy
  const strToken = getToken(req);
  const strUrl = `${pm4Base()}/api/1.0${path}`;

  console.log(`[proxy] ${method} ${strUrl}`);
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    console.log('[proxy] body →', JSON.stringify(req.body).slice(0, 400));
  }

  try {
    // Reenviamos la peticion a PM4 con el token
    const objResponse = await axios({
      method,
      url: strUrl,
      params: method === 'GET' ? req.query : undefined,
      data: ['POST', 'PUT', 'PATCH'].includes(method) ? req.body : undefined,
      headers: {
        Authorization: `Bearer ${strToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    console.log(`[proxy] ← ${objResponse.status} OK`);
    res.json(objResponse.data);
  } catch (excError) {
    const excAxios = excError as AxiosError;
    const intStatus = excAxios.response?.status ?? 500;
    console.error(`[proxy] ← ${intStatus} ERROR:`, JSON.stringify(excAxios.response?.data ?? excAxios.message).slice(0, 300));
    res.status(intStatus).json(excAxios.response?.data ?? { message: excAxios.message });
  }
}

// Tasks
router.get('/tasks', (req, res) => pm4Request('GET', '/tasks', req, res));
router.get('/tasks/:id', (req, res) => pm4Request('GET', `/tasks/${req.params.id}`, req, res));
const PM4_INTERNAL_KEYS = ['_user', '_request'];

router.put('/tasks/:id', (req, res) => {
  // Quitamos las claves internas que PM4 no acepta al actualizar
  if (req.body?.data && typeof req.body.data === 'object') {
    PM4_INTERNAL_KEYS.forEach(strKey => delete req.body.data[strKey]);
  }
  pm4Request('PUT', `/tasks/${req.params.id}`, req, res);
});

// Requests (casos) — listado paginado (dashboard). Reenvía query (include, per_page, page, type, pmql).
router.get('/requests', (req, res) => pm4Request('GET', '/requests', req, res));

// Requests (casos)
router.get('/requests/:id', (req, res) => pm4Request('GET', `/requests/${req.params.id}`, req, res));

// Actualiza los datos del caso sin completar/avanzar la tarea (p.ej. "Guardar Borrador").
router.put('/requests/:id', (req, res) => pm4Request('PUT', `/requests/${req.params.id}`, req, res));

// Resolver task activo a partir de un case_id (request_id)
router.get('/cases/:case_id/task', async (req, res) => {
  const strToken = getToken(req);
  const strCaseId = req.params.case_id;
  const strUrl = `${pm4Base()}/api/1.0/tasks`;

  console.log(`[cases] GET ${strUrl} process_request_id=${strCaseId}`);

  try {
    // Consultamos las tareas del caso en PM4
    const objResponse = await axios.get(strUrl, {
      params: {
        process_request_id: strCaseId,
        status: 'ACTIVE',
        per_page: 100,
        include: 'data',
      },
      headers: { Authorization: `Bearer ${strToken}`, Accept: 'application/json' },
    });

    console.log(`[cases] PM4 tasks response status:`, objResponse.status);
    console.log(`[cases] Total tasks encontradas:`, objResponse.data?.meta?.total ?? objResponse.data?.data?.length);

    const lstTasks: Record<string, unknown>[] = objResponse.data?.data ?? [];

    // Filtrar la activa (status ACTIVE o IN_PROGRESS según PM4)
    const dicActiveTask = lstTasks.find(dicTask =>
      ['ACTIVE', 'OPEN', 'IN_PROGRESS'].includes(String(dicTask['status'] ?? '').toUpperCase())
    ) ?? lstTasks[0];

    if (!dicActiveTask) {
      res.status(404).json({ message: `No hay tarea activa para el caso ${strCaseId}` });
      return;
    }

    console.log(`[cases] caso ${strCaseId} → task_id ${dicActiveTask['id']} status=${dicActiveTask['status']}`);
    res.json(dicActiveTask);
  } catch (excError) {
    const excAxios = excError as AxiosError;
    const intStatus = excAxios.response?.status ?? 500;
    console.error(`[cases] ERROR:`, excAxios.response?.data ?? excAxios.message);
    res.status(intStatus).json(excAxios.response?.data ?? { message: excAxios.message });
  }
});

// Processes
router.get('/start_processes', (req, res) => pm4Request('GET', '/start_processes', req, res));
router.post('/process_events/:process_id', async (req, res) => {
  const strToken = getToken(req);
  const strUrl = `${pm4Base()}/api/1.0/process_events/${req.params.process_id}`;
  console.log(`[process_events] POST ${strUrl} event=${req.query['event'] ?? '(none)'}`);
  try {
    // Disparamos el evento del proceso en PM4
    const objResponse = await axios.post(strUrl, req.body, {
      params: req.query,
      headers: {
        Authorization: `Bearer ${strToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    console.log(`[process_events] ← ${objResponse.status}`, objResponse.data);
    res.json(objResponse.data);
  } catch (excError) {
    const excAxios = excError as AxiosError;
    const intStatus = excAxios.response?.status ?? 500;
    console.error('[process_events] ERROR:', excAxios.response?.data ?? excAxios.message);
    res.status(intStatus).json(excAxios.response?.data ?? { message: excAxios.message });
  }
});

// Collections
router.get('/collections', (req, res) => pm4Request('GET', '/collections', req, res));
router.get('/collections/:id/records', (req, res) =>
  pm4Request('GET', `/collections/${req.params.id}/records`, req, res)
);

// Groups (equipos/roles de ProcessMaker) — usado por SCR-0051 para resolver el
// grupo elegido en "Área a reasignar" y su primer usuario.
router.get('/groups', (req, res) => pm4Request('GET', '/groups', req, res));
router.get('/groups/:group_id/users', (req, res) =>
  pm4Request('GET', `/groups/${req.params.group_id}/users`, req, res)
);

// Scripts (watchers) — PM4 path is /scripts/execute/{id}, not /scripts/{id}/execute
router.post('/scripts/:id/execute', (req, res) =>
  pm4Request('POST', `/scripts/execute/${req.params.id}`, req, res)
);

// Files — list files attached to a request
router.get('/requests/:request_id/files', (req, res) =>
  pm4Request('GET', `/requests/${req.params.request_id}/files`, req, res)
);

// Files — upload a file to a request
router.post('/requests/:request_id/files', upload.single('file'), async (req, res) => {
  if (!req.file) { res.status(400).json({ message: 'No file provided' }); return; }

  const strToken = getToken(req);
  const strUrl   = `${pm4Base()}/api/1.0/requests/${req.params.request_id}/files`;

  // Armamos el multipart con el archivo recibido
  const objForm = new FormData();
  objForm.append('file', req.file.buffer, {
    filename:    req.file.originalname,
    contentType: req.file.mimetype,
  });

  if (req.query.data_name) objForm.append('data_name', String(req.query.data_name));

  console.log(`[file-upload] POST ${strUrl} — ${req.file.originalname} (${req.file.size} bytes)`);
  try {
    // Subimos el archivo a PM4
    const objResponse = await axios.post(strUrl, objForm, {
      headers: {
        ...objForm.getHeaders(),
        Authorization: `Bearer ${strToken}`,
      },
    });
    console.log(`[file-upload] ← ${objResponse.status}`, objResponse.data);
    res.json(objResponse.data);
  } catch (excError) {
    const excAxios = excError as AxiosError;
    const intStatus = excAxios.response?.status ?? 500;
    console.error(`[file-upload] ERROR ${intStatus}:`, excAxios.response?.data ?? excAxios.message);
    res.status(intStatus).json(excAxios.response?.data ?? { message: excAxios.message });
  }
});

// Files — stream binary content (PDF, images, etc.) proxied with auth
async function streamFile(in_strPmPath: string, req: Request, res: Response) {
  const strToken = getToken(req);
  const strUrl   = `${pm4Base()}/api/1.0${in_strPmPath}`;

  console.log(`[file-stream] GET ${strUrl}`);
  try {
    // Pedimos el archivo a PM4 como stream
    const objResponse = await axios.get(strUrl, {
      responseType: 'stream',
      headers: { Authorization: `Bearer ${strToken}` },
    });

    // Propagamos los headers de tipo y descarga del archivo
    const strCt = (objResponse.headers['content-type'] as string | undefined) ?? 'application/octet-stream';
    const strCd = objResponse.headers['content-disposition'] as string | undefined;
    res.setHeader('Content-Type', strCt);
    if (strCd) res.setHeader('Content-Disposition', strCd);
    console.log(`[file-stream] ← ${objResponse.status} ${strCt}`);
    (objResponse.data as NodeJS.ReadableStream).pipe(res);
  } catch (excError) {
    const excAxios = excError as AxiosError;
    const intStatus = excAxios.response?.status ?? 500;
    console.error(`[file-stream] ERROR ${intStatus}:`, excAxios.message);
    res.status(intStatus).json({ message: excAxios.message });
  }
}

router.get('/files/:file_id/contents', (req, res) =>
  streamFile(`/files/${req.params.file_id}/contents`, req, res)
);

router.get('/requests/:request_id/files/:file_id/contents', (req, res) =>
  streamFile(`/requests/${req.params.request_id}/files/${req.params.file_id}/contents`, req, res)
);

// Cotizador Excel — proxy al micro-servicio Python separado
router.post('/cotizador/calcular', async (req: Request, res: Response) => {
  // Validamos que el micro-servicio este configurado
  const strApiUrl = process.env.COTIZADOR_API_URL;
  if (!strApiUrl) {
    res.status(503).json({ message: 'COTIZADOR_API_URL no configurado' });
    return;
  }
  console.log('[cotizador] Enviando a', strApiUrl);
  try {
    // Reenviamos el calculo al micro-servicio
    const objResponse = await axios.post(`${strApiUrl}/calcular`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    res.json(objResponse.data);
  } catch (excError) {
    const excAxios = excError as AxiosError;
    const intStatus = excAxios.response?.status ?? 500;
    const strMsg    = (excAxios.response?.data as { error?: string })?.error ?? excAxios.message;
    console.error('[cotizador] Error:', strMsg);
    res.status(intStatus).json({ message: strMsg });
  }
});

export default router;
