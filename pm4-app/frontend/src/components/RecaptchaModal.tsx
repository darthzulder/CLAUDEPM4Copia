import { useEffect, useRef, useState } from 'react';
import { ZrModal, ZrButton, ZrAlert, ZrLoader } from './fields/ZdsFields';

// reCAPTCHA v2 (checkbox "No soy un robot"). El widget lo renderiza Google dentro
// del modal al abrirlo; cuando el usuario lo resuelve se dispara `onVerified(token)`.
// El token debe verificarse server-side (backend /api/recaptcha/verify) antes de confiar.

// La site key de reCAPTCHA v2 es PÚBLICA (viaja en el HTML de cualquier sitio que la use),
// no es un secreto. Se toma de VITE_RECAPTCHA_SITE_KEY (inyectada por Vite como
// __RECAPTCHA_SITE_KEY__), con fallback a la key conocida por si la env no está presente.
// El secret SÍ es privado y vive solo en el backend (RECAPTCHA_SECRET_KEY).
declare const __RECAPTCHA_SITE_KEY__: string;
const DEFAULT_SITE_KEY = '6Lf8IkgtAAAAAO5z1J1gKek_pl83NM4hP0tfhy8Y';
const SITE_KEY = (typeof __RECAPTCHA_SITE_KEY__ !== 'undefined' && __RECAPTCHA_SITE_KEY__) || DEFAULT_SITE_KEY;
const SCRIPT_ID = 'google-recaptcha-api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Grecaptcha = any;
declare global {
  interface Window { grecaptcha?: Grecaptcha; }
}

// Carga api.js una sola vez (idempotente entre montajes) y resuelve cuando
// grecaptcha.render está disponible.
let objLoader: Promise<void> | null = null;
function loadRecaptcha(): Promise<void> {
  if (window.grecaptcha?.render) return Promise.resolve();
  if (objLoader) return objLoader;
  objLoader = new Promise<void>((resolve, reject) => {
    // Esperamos a que grecaptcha.render este disponible o expiramos.
    const done = () => {
      const tspStart = Date.now();
      const intInterval = setInterval(() => {
        if (window.grecaptcha?.render) { clearInterval(intInterval); resolve(); }
        else if (Date.now() - tspStart > 10000) { clearInterval(intInterval); reject(new Error('reCAPTCHA no respondió a tiempo')); }
      }, 50);
    };
    // Reutilizamos el script si ya esta en el DOM, si no lo inyectamos.
    let objScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (objScript) { done(); return; }
    objScript = document.createElement('script');
    objScript.id = SCRIPT_ID;
    objScript.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    objScript.async = true;
    objScript.defer = true;
    objScript.onload = done;
    objScript.onerror = () => { objLoader = null; reject(new Error('No se pudo cargar reCAPTCHA')); };
    document.head.appendChild(objScript);
  });
  return objLoader;
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
  const [strStatus, setStrStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Google a veces emite "reCAPTCHA Timeout (d)" como unhandledrejection interno
  // (bug conocido del script; el token ya se consumió, es inofensivo). Lo silenciamos
  // de forma acotada para no ensuciar la consola en producción.
  useEffect(() => {
    const onRejection = (in_objEvent: PromiseRejectionEvent) => {
      const strMsg = String(in_objEvent?.reason?.message ?? in_objEvent?.reason ?? '');
      if (/recaptcha/i.test(strMsg) && /timeout/i.test(strMsg)) in_objEvent.preventDefault();
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, []);

  useEffect(() => {
    // Al cerrar, el modal se desmonta con su contenedor; reseteamos el widget (limpia el
    // token y su timer de expiración → evita el "Timeout" tardío) y lo olvidamos para
    // renderizar uno nuevo la próxima vez que se abra.
    if (!open) {
      if (widgetIdRef.current !== null) {
        try { window.grecaptcha?.reset?.(widgetIdRef.current); } catch { /* widget ya removido */ }
      }
      widgetIdRef.current = null;
      return;
    }

    if (!SITE_KEY) { setStrStatus('error'); return; }

    let blnCancelled = false;
    setStrStatus('loading');
    loadRecaptcha()
      .then(() => {
        if (blnCancelled || !containerRef.current || widgetIdRef.current !== null) return;
        try {
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: SITE_KEY,
            callback: (in_strToken: string) => onVerifiedRef.current(in_strToken),
            'expired-callback': () => {
              if (widgetIdRef.current !== null) window.grecaptcha.reset(widgetIdRef.current);
            },
          });
          setStrStatus('ready');
        } catch (in_excError) {
          console.error('[recaptcha] grecaptcha.render() falló:', in_excError);
          if (!blnCancelled) setStrStatus('error');
        }
      })
      .catch((in_excError) => {
        console.error('[recaptcha] no se pudo cargar api.js:', in_excError);
        if (!blnCancelled) setStrStatus('error');
      });

    return () => { blnCancelled = true; };
  }, [open]);

  if (!open) return null;

  return (
    <ZrModal model={open} onChange={(in_blnOpen: boolean) => { if (!in_blnOpen) onClose(); }}>
      <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
        Validación de seguridad
      </h3>
      <p style={{ margin: '0 0 var(--zs-150)', font: 'var(--zf-body-16--400)', color: 'var(--z-text)' }}>
        Confirma que no eres un robot para radicar tu solicitud.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '78px' }}>
        {strStatus === 'loading' && <ZrLoader />}
        {strStatus === 'error' && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            No se pudo cargar la validación de seguridad. Verifica tu conexión e inténtalo de nuevo.
          </ZrAlert>
        )}
        {/* Google renderiza el checkbox dentro de este contenedor. Siempre visible:
            en display:none, grecaptcha.render() puede fallar. */}
        <div ref={containerRef} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--zs-75)', marginTop: 'var(--zs-200)' }}>
        <ZrButton config="secondary" onClick={onClose}>Cancelar</ZrButton>
      </div>
    </ZrModal>
  );
}
