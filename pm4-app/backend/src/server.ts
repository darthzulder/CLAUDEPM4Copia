import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import pm4Routes from './routes/pm4.routes';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

app.use('/api', pm4Routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', pm4: process.env.PM4_BASE_URL });
});

if (isProd) {
  const staticPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(staticPath));
  // Express 5 (path-to-regexp v8) quito el wildcard '*' suelto en rutas con metodo;
  // fallback SPA como middleware final sin path, funciona igual en 4 y 5.
  app.use((_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Manejador de errores global — red de seguridad para excepciones no
// capturadas antes de llegar al try/catch de una ruta (multer, JSON
// malformado, etc.). Sin esto, Express devuelve un 500 en texto plano
// sin cuerpo, indistinguible en el cliente de un error real de PM4.
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) { next(err); return; }
  console.error('[error-handler]', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Proxying to: ${process.env.PM4_BASE_URL}`);
});
