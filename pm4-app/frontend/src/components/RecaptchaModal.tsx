import { useEffect, useRef, useState } from 'react';
import { ZrModal, ZrButton, ZrAlert, ZrLoader } from './fields/ZdsFields';

// reCAPTCHA v2 (checkbox "No soy un robot"). El widget lo renderiza Google dentro
// del modal al abrirlo; cuando el usuario lo resuelve se dispara `onVerified(token)`.
// El token debe verificarse server-side (backend /api/recaptcha/verify) antes de confiar.

// Inyectada por Vite (define) desde VITE_RECAPTCHA_SITE_KEY del .env raíz.
declare const __RECAPTCHA_SITE_KEY__: string;
const SITE_KEY = __RECAPTCHA_SITE_KEY__;
const SCRIPT_ID = 'google-recaptcha-api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Grecaptcha = any;
declare global {
  interface Window { grecaptcha?: Grecaptcha; }
}

// Carga api.js una sola vez (idempotente entre montajes) y resuelve cuando
// grecaptcha.render está disponible.
let loader: Promise<void> | null = null;
function loadRecaptcha(): Promise<void> {
  if (window.grecaptcha?.render) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const done = () => {
      const start = Date.now();
      const iv = setInterval(() => {
        if (window.grecaptcha?.render) { clearInterval(iv); resolve(); }
        else if (Date.now() - start > 10000) { clearInterval(iv); reject(new Error('reCAPTCHA no respondió a tiempo')); }
      }, 50);
    };
    let s = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (s) { done(); return; }
    s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = done;
    s.onerror = () => { loader = null; reject(new Error('No se pudo cargar reCAPTCHA')); };
    document.head.appendChild(s);
  });
  return loader;
}

interface Props {
  open: boolean;
  onVerified: (token: string) => void;
  onClose: () => void;
}

export default function RecaptchaModal({ open, onVerified, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  // Ref al callback para no re-ejecutar el effect (ni re-renderizar el widget) al cambiarlo.
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    // Al cerrar, el modal se desmonta con su contenedor; olvidamos el widget para
    // renderizar uno nuevo (en un contenedor visible) la próxima vez que se abra.
    if (!open) { widgetIdRef.current = null; return; }

    if (!SITE_KEY) { setStatus('error'); return; }

    let cancelled = false;
    setStatus('loading');
    loadRecaptcha()
      .then(() => {
        if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onVerifiedRef.current(token),
          'expired-callback': () => {
            if (widgetIdRef.current !== null) window.grecaptcha.reset(widgetIdRef.current);
          },
        });
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });

    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  return (
    <ZrModal model={open} onChange={(v: boolean) => { if (!v) onClose(); }}>
      <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
        Validación de seguridad
      </h3>
      <p style={{ margin: '0 0 var(--zs-150)', font: 'var(--zf-body-16--400)', color: 'var(--z-text)' }}>
        Confirma que no eres un robot para radicar tu solicitud.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '78px' }}>
        {status === 'loading' && <ZrLoader />}
        {status === 'error' && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            No se pudo cargar la validación de seguridad. Verifica tu conexión e inténtalo de nuevo.
          </ZrAlert>
        )}
        {/* Google renderiza el checkbox dentro de este contenedor */}
        <div ref={containerRef} style={{ display: status === 'ready' ? 'block' : 'none' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--zs-75)', marginTop: 'var(--zs-200)' }}>
        <ZrButton config="secondary" onClick={onClose}>Cancelar</ZrButton>
      </div>
    </ZrModal>
  );
}
