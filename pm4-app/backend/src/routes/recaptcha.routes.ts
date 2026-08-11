import { Router, Request, Response } from 'express';
import axios from 'axios';
import {
  STR_SITEVERIFY_URL,
  decidirVerificacion,
  ipDesdeForwardedFor,
  respuestaFailOpen,
} from '../lib/recaptcha';

// Verificación server-side del token de reCAPTCHA v2 contra Google.
// El frontend obtiene el token con el checkbox "No soy un robot" y lo envía aquí
// ANTES de completar la tarea en PM4. La clave secreta nunca sale del backend.
//
// Las decisiones puras (qué hacer sin token / sin secret, y de dónde sacar la IP) viven en
// lib/recaptcha.ts, donde están testeadas.

const router = Router();

interface SiteVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

router.post('/verify', async (req: Request, res: Response) => {
  // Leemos el token del cuerpo y la clave secreta del entorno
  const strToken = (req.body?.token ?? '') as string;
  const objDecision = decidirVerificacion(strToken, process.env.RECAPTCHA_SECRET_KEY);

  // Sin token no hay nada que verificar
  if (objDecision.kind === 'missing-token') {
    res.status(400).json({ success: false, message: 'Falta el token de reCAPTCHA' });
    return;
  }

  // Sin secret configurado no podemos verificar. Fail-open explícito para no
  // bloquear el flujo en dev, pero avisando fuerte: en producción DEBE estar seteada.
  if (objDecision.kind === 'fail-open') {
    console.warn(
      '[recaptcha] RECAPTCHA_SECRET_KEY no está configurada — se omite la verificación ' +
      'server-side. NO usar así en producción.',
    );
    res.json(respuestaFailOpen());
    return;
  }

  try {
    // Armamos los parametros del siteverify de Google
    const objParams = new URLSearchParams({ secret: objDecision.secret, response: strToken });
    // Adjuntamos la ip del cliente si viene en los headers
    const strIp = ipDesdeForwardedFor(req.headers['x-forwarded-for']) ?? req.socket.remoteAddress;
    if (strIp) objParams.append('remoteip', strIp);

    // Consultamos a Google si el token es valido
    const { data: dicData } = await axios.post<SiteVerifyResponse>(STR_SITEVERIFY_URL, objParams.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (dicData.success) {
      res.json({ success: true, verified: true });
    } else {
      // error-codes típicos: invalid-input-secret (secret incorrecto / es la site key),
      // invalid-input-response (token inválido/mal formado), timeout-or-duplicate (token ya usado/expirado).
      console.warn('[recaptcha] siteverify rechazó el token. error-codes:', dicData['error-codes']);
      res.status(400).json({ success: false, verified: false, errors: dicData['error-codes'] ?? [] });
    }
  } catch (excError) {
    console.error('[recaptcha] Error al verificar el token:', excError);
    res.status(502).json({ success: false, message: 'No se pudo verificar reCAPTCHA' });
  }
});

export default router;
