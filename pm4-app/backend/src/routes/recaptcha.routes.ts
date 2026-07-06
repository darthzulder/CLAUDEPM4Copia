import { Router, Request, Response } from 'express';
import axios from 'axios';

// Verificación server-side del token de reCAPTCHA v2 contra Google.
// El frontend obtiene el token con el checkbox "No soy un robot" y lo envía aquí
// ANTES de completar la tarea en PM4. La clave secreta nunca sale del backend.

const router = Router();

const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

interface SiteVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

router.post('/verify', async (req: Request, res: Response) => {
  const token = (req.body?.token ?? '') as string;
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!token) {
    res.status(400).json({ success: false, message: 'Falta el token de reCAPTCHA' });
    return;
  }

  // Sin secret configurado no podemos verificar. Fail-open explícito para no
  // bloquear el flujo en dev, pero avisando fuerte: en producción DEBE estar seteada.
  if (!secret) {
    console.warn(
      '[recaptcha] RECAPTCHA_SECRET_KEY no está configurada — se omite la verificación ' +
      'server-side. NO usar así en producción.',
    );
    res.json({ success: true, verified: false, reason: 'secret-not-configured' });
    return;
  }

  try {
    const params = new URLSearchParams({ secret, response: token });
    const fwd = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim() || req.socket.remoteAddress;
    if (ip) params.append('remoteip', ip);

    const { data } = await axios.post<SiteVerifyResponse>(SITEVERIFY_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (data.success) {
      res.json({ success: true, verified: true });
    } else {
      // error-codes típicos: invalid-input-secret (secret incorrecto / es la site key),
      // invalid-input-response (token inválido/mal formado), timeout-or-duplicate (token ya usado/expirado).
      console.warn('[recaptcha] siteverify rechazó el token. error-codes:', data['error-codes']);
      res.status(400).json({ success: false, verified: false, errors: data['error-codes'] ?? [] });
    }
  } catch (err) {
    console.error('[recaptcha] Error al verificar el token:', err);
    res.status(502).json({ success: false, message: 'No se pudo verificar reCAPTCHA' });
  }
});

export default router;
