/**
 * Cotizador Worker Manager
 * Mantiene UN proceso Python vivo durante toda la vida del servidor.
 * El modelo Excel se carga UNA vez (~150-200MB) y se reutiliza en cada request.
 */
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';

interface PendingReq {
  resolve: (v: unknown) => void;
  reject:  (e: Error)   => void;
}

let worker: ChildProcessWithoutNullStreams | null = null;
let ready  = false;
let queue: PendingReq[] = [];
let current: PendingReq | null = null;
let rl: readline.Interface | null = null;

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'cotizador_worker.py');
const PY_CMD = process.platform === 'win32' ? 'python' : 'python3';

function startWorker() {
  console.log('[cotizador-worker] Iniciando proceso Python…');
  worker = spawn(PY_CMD, [SCRIPT], { shell: true });

  rl = readline.createInterface({ input: worker.stdout });

  rl.on('line', (line: string) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }

    // Primera línea: señal de ready
    if (!ready) {
      if (msg.ready) {
        ready = true;
        console.log('[cotizador-worker] Modelo cargado, worker listo.');
        drainQueue();
      } else {
        console.error('[cotizador-worker] Falló al cargar el modelo:', msg.error);
      }
      return;
    }

    // Respuesta a la request actual
    if (current) {
      const { resolve, reject } = current;
      current = null;
      if (msg.ok) {
        resolve(msg.result);
      } else {
        reject(new Error(String(msg.error ?? 'Error desconocido del cotizador')));
      }
      drainQueue();
    }
  });

  worker.stderr.on('data', (d: Buffer) => {
    const s = d.toString().trim();
    if (s && !s.includes('%|')) {           // ignorar barras de progreso
      console.log('[cotizador-worker] stderr:', s.slice(0, 200));
    }
  });

  worker.on('close', (code: number) => {
    console.warn(`[cotizador-worker] Proceso terminó (code=${code}). Reiniciando en 3s…`);
    ready   = false;
    current = null;
    worker  = null;
    rl      = null;
    setTimeout(startWorker, 3000);
  });

  worker.on('error', (err: Error) => {
    console.error('[cotizador-worker] Error al arrancar Python:', err.message);
  });
}

function drainQueue() {
  if (current || queue.length === 0 || !worker || !ready) return;
  current = queue.shift()!;
  // No podemos reenviar aquí sin el payload — se hace en calculate()
}

export function calculate(inputs: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const entry: PendingReq = { resolve, reject };

    const send = () => {
      current = entry;
      worker!.stdin.write(JSON.stringify(inputs) + '\n');
    };

    if (!ready || current) {
      // Encolar y enviar cuando el worker esté libre
      const wrappedResolve = (v: unknown) => { resolve(v); };
      const wrappedReject  = (e: Error)   => { reject(e); };

      // Guardamos el payload junto con el entry para poder enviarlo cuando llegue el turno
      (entry as PendingReq & { _inputs: unknown })._inputs = inputs;
      queue.push(entry);

      if (ready && !current) {
        current = queue.shift()!;
        worker!.stdin.write(JSON.stringify((current as PendingReq & { _inputs: unknown })._inputs) + '\n');
      }
    } else {
      send();
    }
  });
}

// Arrancar al importar el módulo
startWorker();
