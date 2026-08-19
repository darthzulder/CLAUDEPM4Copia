import { Injectable } from '@angular/core';
import { VITE_RECAPTCHA_SITE_KEY } from '../env.generated';

/**
 * Site key de reCAPTCHA v2 conocida, usada cuando la variable de entorno no está.
 *
 * Heredada textual de `RecaptchaModal.tsx:13`. Que esté hardcodeada acá **no es una filtración**: la
 * site key de v2 es pública por diseño (viaja en el HTML de cualquier sitio que use el widget y
 * Google la valida contra el dominio que la usa). El que sí es secreto es `RECAPTCHA_SECRET_KEY`, y
 * vive **solo** en el backend, que es quien llama a `siteverify` (regla 3 de pm4-app/CLAUDE.md).
 */
export const STR_SITE_KEY_DEFECTO = '6Lf8IkgtAAAAAO5z1J1gKek_pl83NM4hP0tfhy8Y';

/** `id` del `<script>` de Google. Heredado textual: es lo que hace idempotente la carga. */
const STR_ID_SCRIPT = 'google-recaptcha-api';

/** Cada cuánto se revisa si `grecaptcha.render` ya está, y hasta cuándo. Cuentas de React. */
const INT_INTERVALO_MS = 50;
const INT_ESPERA_MAX_MS = 10_000;

/**
 * La site key efectiva: entorno, y si no, la conocida.
 *
 * ⚠ El `||` (no `??`) se hereda a propósito de React (`RecaptchaModal.tsx:14`), y la diferencia
 * importa: el generador de env emite `''` para una variable ausente, no `undefined`, así que con `??`
 * la cadena vacía **ganaría** y el widget quedaría sin key — el estado `error` en pantalla. Con `||`,
 * `''` cae al default, que es el comportamiento vigente.
 */
export const STR_SITE_KEY = resolverSiteKey(VITE_RECAPTCHA_SITE_KEY);

/**
 * Resuelve la site key efectiva a partir del valor del entorno.
 *
 * Está extraída como función **exportada a propósito**, y el motivo es que sin eso el `||` no se puede
 * testear: `STR_SITE_KEY` se evalúa una sola vez al importar el módulo, leyendo `env.generated.ts`, que
 * a su vez se genera del `.env` de la máquina. En un entorno con la variable puesta —el caso normal— la
 * rama del default **nunca corre**, así que un spec sobre la constante pasa igual con `??` que con `||`
 * y no guarda nada. Verificado: la mutación a `??` dejaba los 29 casos en verde.
 *
 * Con la función, el `''` se pasa como argumento y la diferencia queda aseverada de verdad.
 */
export function resolverSiteKey(in_strDelEntorno: string | undefined): string {
  return in_strDelEntorno || STR_SITE_KEY_DEFECTO;
}

/**
 * Lo que este servicio usa de `window.grecaptcha`.
 *
 * Se declara la forma mínima en vez de `any` (que es lo que hace React con su `type Grecaptcha = any`)
 * porque `@typescript-eslint/no-explicit-any` lo rechaza y porque el spec necesita un doble que
 * satisfaga el tipo. `render` devuelve el id del widget, que es lo que hay que guardar para poder
 * resetearlo.
 */
export interface Grecaptcha {
  render: (
    in_objContenedor: HTMLElement,
    in_dicOpciones: {
      sitekey: string;
      callback: (in_strToken: string) => void;
      'expired-callback': () => void;
    },
  ) => number;
  reset: (in_intWidgetId?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

/**
 * Carga `api.js` de Google una sola vez para toda la app y resuelve cuando `grecaptcha.render` está
 * disponible. Port de la función-módulo `loadRecaptcha()` de `components/RecaptchaModal.tsx`.
 *
 * ── Por qué un servicio y no una función exportada con un `let` al lado ─────────────────────────
 * En React el estado de la carga vivía en un `let objLoader: Promise<void> | null` a nivel de módulo:
 * un singleton implícito, que es lo que hace que dos montajes del modal no inyecten dos `<script>`.
 * Acá eso mismo se escribe como `@Injectable({ providedIn: 'root' })`, que **es** el singleton pero
 * inyectable, y esa diferencia es la que hace testeable al componente: un spec provee un doble de
 * este servicio y no necesita interceptar `document.head.appendChild` ni esperar a la red.
 *
 * La promesa se memoiza en `objCarga`. La idempotencia tiene tres capas, y las tres estaban en React:
 * 1. Si `grecaptcha.render` ya existe, resuelve sin tocar el DOM (es el atajo que aprovecha el spec).
 * 2. Si ya hay una carga en vuelo, devuelve **esa misma** promesa.
 * 3. Si el `<script>` ya está en el DOM (otra instancia de la app, o un `objCarga` que se perdió),
 *    no lo vuelve a inyectar: solo espera a que `render` aparezca.
 *
 * ⚠ La excepción a la regla del BFF, y por qué es legítima. El `<script src="https://www.google.com/…">`
 * es la **excepción documentada** en `pm4-app/CLAUDE.md`: carga un script de terceros, sin
 * credenciales y sin datos del caso. Lo que **sí** es una llamada de datos —verificar el token que el
 * usuario obtuvo— va por `POST /api/recaptcha/verify`, en el backend, que es el único que conoce
 * `RECAPTCHA_SECRET_KEY`. Este servicio no verifica nada y no debe empezar a hacerlo.
 *
 * ── El `catch` resetea `objCarga`, y el `then` NO ───────────────────────────────────────────────
 * Heredado de React (`objLoader = null` solo en el `onerror`) y vale explicarlo porque la asimetría
 * parece un olvido: si la carga falló (sin red, script bloqueado), la próxima apertura del modal debe
 * poder **reintentar**, y con la promesa rechazada memoizada quedaría condenada a fallar para siempre.
 * En el camino feliz no hay nada que reintentar, así que la promesa resuelta se guarda y sirve para
 * todos los montajes siguientes.
 *
 * ⚠ El reintento cubre el fallo del `<script>`, no el del **timeout**: ese rechazo viene del `setInterval`
 * de `esperarRender()`, después de que el script cargó, y no pasa por el `catch` del `onerror`. Es el
 * comportamiento de React y se porta igual; el caso real (script que carga pero nunca define
 * `grecaptcha`) es un fallo de Google, no algo que un reintento arregle.
 */
@Injectable({ providedIn: 'root' })
export class RecaptchaLoaderService {
  /** La carga en vuelo o ya resuelta. `null` = todavía no se intentó, o el último intento falló. */
  private objCarga: Promise<void> | null = null;

  public cargar(): Promise<void> {
    if (window.grecaptcha?.render) return Promise.resolve();
    if (this.objCarga) return this.objCarga;

    this.objCarga = new Promise<void>((in_fnResolver, in_fnRechazar) => {
      // Si el script ya está en el DOM no se reinyecta: solo se espera a que `render` aparezca.
      if (document.getElementById(STR_ID_SCRIPT)) {
        this.esperarRender(in_fnResolver, in_fnRechazar);
        return;
      }

      const objScript = document.createElement('script');
      objScript.id = STR_ID_SCRIPT;
      // `render=explicit` es obligatorio: sin él Google renderiza el widget solo, sobre el primer
      // contenedor que encuentre, y `grecaptcha.render()` sobre el nuestro falla por doble render.
      objScript.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      objScript.async = true;
      objScript.defer = true;
      objScript.onload = (): void => this.esperarRender(in_fnResolver, in_fnRechazar);
      objScript.onerror = (): void => {
        // Solo acá se libera la memoización: ver el bloque del servicio sobre el reintento.
        this.objCarga = null;
        in_fnRechazar(new Error('No se pudo cargar reCAPTCHA'));
      };
      document.head.appendChild(objScript);
    });

    return this.objCarga;
  }

  /**
   * Sondea hasta que `grecaptcha.render` exista, o expira a los 10 s.
   *
   * El sondeo no es paranoia portada de más: el `onload` del `<script>` dispara cuando el archivo se
   * ejecutó, pero `api.js` define `grecaptcha.render` de forma **asíncrona** (carga sus propios
   * recursos). Llamar `render()` en el `onload` a secas explota con `grecaptcha.render is not a
   * function` de manera intermitente, según la red.
   *
   * `Date.now()` en vez de contar iteraciones: si la pestaña queda en segundo plano el navegador
   * estira los timers, y contar vueltas mediría cualquier cosa menos 10 segundos.
   */
  private esperarRender(in_fnResolver: () => void, in_fnRechazar: (in_objError: Error) => void): void {
    const intInicio = Date.now();
    const intIntervalo = window.setInterval(() => {
      if (window.grecaptcha?.render) {
        window.clearInterval(intIntervalo);
        in_fnResolver();
      } else if (Date.now() - intInicio > INT_ESPERA_MAX_MS) {
        window.clearInterval(intIntervalo);
        in_fnRechazar(new Error('reCAPTCHA no respondió a tiempo'));
      }
    }, INT_INTERVALO_MS);
  }
}
