import { useEffect, useRef, useState } from 'react';
import { ZrModal, ZrButton, ZrAlert, ZrLoader } from './fields/ZdsFields';

// reCAPTCHA v2 (checkbox "No soy un robot"). El widget lo renderiza Google dentro
// del modal al abrirlo; cuando el usuario lo resuelve se dispara `onVerified(token)`.
// El token debe verificarse server-side (backend /api/recaptcha/verify) antes de confiar.

// La site key de reCAPTCHA v2 es PÚBLICA (viaja en el HTML de cualquier sitio que la use),
// no es un secreto. Se toma de VITE_RECAPTCHA_SITE_KEY (inyectada por Vite como
// __RECAPTCHA_SITE_KEY__), con fallback al valor conocido para que funcione aunque la
// inyección por env falle (p.ej. dev server no reiniciado en el mount de Windows sin HMR).
// El secret SÍ es privado y vive solo en el backend (RECAPTCHA_SECRET_KEY).
declare const __RECAPTCHA_SITE_KEY__: string;
const DEFAULT_SITE_KEY = '6Le5LjItAAAAAPPr5YQM3dIey2zhH9WZVz9n75c9';
const SITE_KEY = (typeof __RECAPTCHA_SITE_KEY__ !== 'undefined' && __RECAPTCHA_SITE_KEY__) || DEFAULT_SITE_KEY;
const SCRIPT_ID = 'google-recaptcha-api';

// PROVISIONAL (debug): permite pegar una site key y re-renderizar el widget en caliente
// para descubrir qué key funciona con el dominio actual. Poner en false / borrar el bloque
// antes de dar por cerrado el feature.
const SHOW_KEY_DEBUG = true;

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

  // Key activa (la que se usa para renderizar) + input provisional + nonce para forzar
  // el re-render limpio del widget al probar otra key.
  const [activeKey, setActiveKey] = useState(SITE_KEY);
  const [keyInput, setKeyInput] = useState(SITE_KEY);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    // Al cerrar, el modal se desmonta con su contenedor; olvidamos el widget para
    // renderizar uno nuevo (en un contenedor visible) la próxima vez que se abra.
    if (!open) { widgetIdRef.current = null; return; }

    if (!activeKey) { setStatus('error'); return; }

    let cancelled = false;
    setStatus('loading');
    widgetIdRef.current = null; // el contenedor se remonta (key), renderizamos de cero
    loadRecaptcha()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        try {
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: activeKey,
            callback: (token: string) => onVerifiedRef.current(token),
            'expired-callback': () => {
              if (widgetIdRef.current !== null) window.grecaptcha.reset(widgetIdRef.current);
            },
          });
          setStatus('ready');
        } catch (e) {
          console.error('[recaptcha] grecaptcha.render() falló:', e);
          if (!cancelled) setStatus('error');
        }
      })
      .catch((e) => {
        console.error('[recaptcha] no se pudo cargar api.js:', e);
        if (!cancelled) setStatus('error');
      });

    return () => { cancelled = true; };
  }, [open, activeKey, nonce]);

  if (!open) return null;

  return (
    <ZrModal model={open} onChange={(v: boolean) => { if (!v) onClose(); }}>
      <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
        Validación de seguridad
      </h3>
      <p style={{ margin: '0 0 var(--zs-150)', font: 'var(--zf-body-16--400)', color: 'var(--z-text)' }}>
        Confirma que no eres un robot para radicar tu solicitud.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '78px' }}>
        {status === 'loading' && <ZrLoader />}
        {status === 'error' && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            {!activeKey
              ? 'Falta configurar la clave del captcha (site key). Avisa al equipo técnico.'
              : 'No se pudo cargar la validación de seguridad. Verifica tu conexión e inténtalo de nuevo.'}
          </ZrAlert>
        )}
        {/* Google renderiza el checkbox dentro de este contenedor. La `key` fuerza un
            contenedor nuevo/limpio al cambiar de site key (grecaptcha no re-renderiza
            sobre un nodo ya usado). Siempre visible: en display:none render() puede fallar. */}
        <div key={`${activeKey}:${nonce}`} ref={containerRef} />
      </div>

      {SHOW_KEY_DEBUG && (
        <div style={{ marginTop: 'var(--zs-150)', padding: 'var(--zs-100)', border: '1px dashed var(--z-border)', borderRadius: 4 }}>
          <div style={{ font: 'var(--zf-capt-12)', color: 'var(--z-orange)', marginBottom: 'var(--zs-50)' }}>
            ⚠ PROVISIONAL (debug) — probar site keys sin re-deploy
          </div>
          <div style={{ font: 'var(--zf-capt-12)', color: 'var(--z-muted)', marginBottom: 'var(--zs-50)', wordBreak: 'break-all' }}>
            Dominio actual (el que debe estar en la whitelist de la key): <strong>{window.location.hostname}</strong>
          </div>
          <input
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Pegá la site key a probar"
            style={{ width: '100%', boxSizing: 'border-box', padding: 'var(--zs-50)', font: 'var(--zf-capt-14)', marginBottom: 'var(--zs-50)' }}
          />
          <div style={{ display: 'flex', gap: 'var(--zs-50)', alignItems: 'center', flexWrap: 'wrap' }}>
            <ZrButton config="secondary" onClick={() => { setActiveKey(keyInput.trim()); setNonce((n) => n + 1); }}>
              Probar esta key
            </ZrButton>
            <span style={{ font: 'var(--zf-capt-12)', color: 'var(--z-muted)', wordBreak: 'break-all' }}>
              Key activa: {activeKey || '(vacía)'}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--zs-75)', marginTop: 'var(--zs-200)' }}>
        <ZrButton config="secondary" onClick={onClose}>Cancelar</ZrButton>
      </div>
    </ZrModal>
  );
}
