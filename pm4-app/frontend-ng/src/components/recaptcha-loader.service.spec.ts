import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type Grecaptcha,
  RecaptchaLoaderService,
  resolverSiteKey,
  STR_SITE_KEY,
  STR_SITE_KEY_DEFECTO,
} from './recaptcha-loader.service';

/**
 * Specs de `RecaptchaLoaderService`.
 *
 * ── Lo que estos specs pueden probar, y lo que no ────────────────────────────────────────────────
 * `api.js` de Google **no se descarga** acá: jsdom no ejecuta el `src` de un `<script>` inyectado, y si
 * lo hiciera este spec dependería de la red y del dominio registrado en la site key. Así que lo que se
 * asevera es lo que el servicio controla: **qué `<script>` inyecta, cuántas veces, y cómo resuelve o
 * rechaza**. El `onload`/`onerror` se disparan a mano sobre el nodo que el servicio creó, que es
 * exactamente el punto de entrada que el navegador usaría.
 *
 * `window.grecaptcha` se stubea igual que en el test de React (`RecaptchaModal.test.tsx`): un objeto con
 * `render` y `reset` espiados. Sin ese stub el sondeo de `esperarRender()` corre sus 10 segundos reales.
 *
 * ── ⚠ Los timers son falsos y por eso el sondeo es testeable de verdad ──────────────────────────
 * `esperarRender()` sondea con `setInterval` cada 50 ms hasta 10 s. Con timers reales, el caso del
 * timeout tardaría 10 segundos de reloj y el caso feliz dependería de que el spec espere lo suficiente.
 * Con `vi.useFakeTimers()` el tiempo lo mueve el spec, así que se puede aseverar tanto que resuelve
 * **cuando `grecaptcha` aparece** como que rechaza **al pasar el límite**, en milisegundos.
 *
 * Ojo con el detalle que hace que el caso del timeout funcione: `Date.now()` **también** tiene que ser
 * falso (lo es, `vi.useFakeTimers()` lo intercepta por defecto), porque la condición del corte compara
 * marcas de tiempo y no cuenta iteraciones — ver el docstring de `esperarRender()`.
 */
describe('RecaptchaLoaderService', () => {
  let objServicio: RecaptchaLoaderService;

  /** Limpia el `<script>` que el servicio dejó, si lo dejó: el DOM de jsdom persiste entre casos. */
  function limpiarScript(): void {
    document.getElementById('google-recaptcha-api')?.remove();
  }

  /** El `<script>` que el servicio inyectó, o `null`. */
  function leerScript(): HTMLScriptElement | null {
    return document.getElementById('google-recaptcha-api') as HTMLScriptElement | null;
  }

  /** Stub de `window.grecaptcha`, igual al del test de React. */
  function ponerGrecaptcha(): Grecaptcha {
    const objStub: Grecaptcha = {
      render: vi.fn(() => 1),
      reset: vi.fn(),
    };
    window.grecaptcha = objStub;
    return objStub;
  }

  beforeEach(() => {
    limpiarScript();
    delete window.grecaptcha;
    // El servicio es `providedIn: 'root'`, así que cada TestBed da una instancia nueva: la memoización
    // de `objCarga` NO se filtra entre casos. Eso es justo lo que permite testear el reintento.
    objServicio = TestBed.inject(RecaptchaLoaderService);
  });

  afterEach(() => {
    vi.useRealTimers();
    limpiarScript();
    delete window.grecaptcha;
  });

  describe('la site key', () => {
    it('nunca queda vacía en la app real', () => {
      expect(STR_SITE_KEY).toBeTruthy();
      expect(STR_SITE_KEY.length).toBeGreaterThan(20);
    });

    // ⚠ Estos tres casos van sobre `resolverSiteKey()` y NO sobre la constante, y la diferencia es todo:
    // `STR_SITE_KEY` se evalúa al importar leyendo `env.generated.ts`, generado del `.env` de la máquina.
    // Con la variable puesta —el caso normal— la rama del default no corre nunca, así que aseverar sobre
    // la constante pasa igual con `??` que con `||`. Medido: la mutación a `??` dejaba los 29 en verde.
    // Sobre la función el `''` se pasa como argumento y el `||` queda aseverado de verdad.
    it('cae al default cuando el entorno trae CADENA VACÍA', () => {
      // Es el caso que exige `||` en vez de `??`: el generador emite '' para una variable ausente, no
      // `undefined`, así que con `??` la vacía ganaría y el widget quedaría sin key → estado `error`.
      expect(resolverSiteKey('')).toBe(STR_SITE_KEY_DEFECTO);
    });

    it('cae al default cuando el entorno no trae nada', () => {
      expect(resolverSiteKey(undefined)).toBe(STR_SITE_KEY_DEFECTO);
    });

    it('respeta la del entorno cuando viene con valor', () => {
      // La contracara: el default es un fallback, no una constante que pise la configuración.
      expect(resolverSiteKey('6LxxKEY-DEL-ENTORNO')).toBe('6LxxKEY-DEL-ENTORNO');
    });
  });

  describe('cargar()', () => {
    it('inyecta el script con render=explicit, async y defer', async () => {
      const objPromesa = objServicio.cargar();

      const objScript = leerScript();
      expect(objScript).not.toBeNull();
      // `render=explicit` no es decorativo: sin él Google auto-renderiza sobre el primer contenedor y
      // el `grecaptcha.render()` del componente falla por doble render.
      expect(objScript!.src).toContain('render=explicit');
      expect(objScript!.async).toBe(true);
      expect(objScript!.defer).toBe(true);

      // Se cierra la promesa para no dejarla pendiente: grecaptcha ya disponible + onload.
      ponerGrecaptcha();
      objScript!.onload!(new Event('load'));
      await expect(objPromesa).resolves.toBeUndefined();
    });

    it('resuelve sin tocar el DOM si grecaptcha.render ya existe', async () => {
      ponerGrecaptcha();

      await expect(objServicio.cargar()).resolves.toBeUndefined();

      // Primera capa de idempotencia: el atajo del principio de `cargar()`.
      expect(leerScript()).toBeNull();
    });

    it('devuelve la MISMA promesa si ya hay una carga en vuelo, sin inyectar un segundo script', async () => {
      const objPrimera = objServicio.cargar();
      const objSegunda = objServicio.cargar();

      // Segunda capa: la memoización de `objCarga`. Es lo que evita dos <script> cuando el widget y el
      // modal se montan en la misma pantalla (SCR-000 usa los dos).
      expect(objSegunda).toBe(objPrimera);
      expect(document.querySelectorAll('script#google-recaptcha-api')).toHaveLength(1);

      ponerGrecaptcha();
      leerScript()!.onload!(new Event('load'));
      await objPrimera;
    });

    it('no reinyecta el script si ya está en el DOM: solo espera a que render aparezca', async () => {
      vi.useFakeTimers();

      // Tercera capa: el `<script>` puesto por otra instancia de la app (o por un `objCarga` perdido).
      const objAjeno = document.createElement('script');
      objAjeno.id = 'google-recaptcha-api';
      document.head.appendChild(objAjeno);

      const objPromesa = objServicio.cargar();
      expect(document.querySelectorAll('script#google-recaptcha-api')).toHaveLength(1);

      ponerGrecaptcha();
      await vi.advanceTimersByTimeAsync(50);
      await expect(objPromesa).resolves.toBeUndefined();
    });

    it('resuelve cuando grecaptcha.render aparece DESPUÉS del onload', async () => {
      vi.useFakeTimers();

      const objPromesa = objServicio.cargar();
      // El caso que motiva el sondeo: el script ya se ejecutó pero `render` todavía no existe. Ver el
      // docstring de `esperarRender()` — llamar render() en el onload a secas explota intermitentemente.
      leerScript()!.onload!(new Event('load'));

      await vi.advanceTimersByTimeAsync(500);
      let blnResuelta = false;
      void objPromesa.then(() => (blnResuelta = true));
      await vi.advanceTimersByTimeAsync(0);
      expect(blnResuelta).toBe(false);

      ponerGrecaptcha();
      await vi.advanceTimersByTimeAsync(50);
      await expect(objPromesa).resolves.toBeUndefined();
    });

    it('rechaza con "no respondió a tiempo" si render no aparece en 10 s', async () => {
      vi.useFakeTimers();

      const objPromesa = objServicio.cargar();
      leerScript()!.onload!(new Event('load'));

      // ⚠ La aserción se ENGANCHA antes de mover los timers, y no después. Con
      // `advanceTimersByTimeAsync(...)` primero, el rechazo ocurre sin ningún handler puesto y Vitest lo
      // reporta como *unhandled rejection* del archivo entero (avisando que "might cause false positive
      // tests") aunque el caso pase. Enganchar primero y esperar después es el mismo assert sin ese ruido.
      const objAserto = expect(objPromesa).rejects.toThrow('reCAPTCHA no respondió a tiempo');

      // El corte compara `Date.now()`, no cuenta vueltas: se avanza más allá del límite y basta.
      await vi.advanceTimersByTimeAsync(10_050);
      await objAserto;
    });

    it('rechaza con "No se pudo cargar" cuando el script falla', async () => {
      const objPromesa = objServicio.cargar();
      leerScript()!.onerror!(new Event('error'));

      await expect(objPromesa).rejects.toThrow('No se pudo cargar reCAPTCHA');
    });

    it('permite REINTENTAR después de un fallo del script: reinyecta y vuelve a esperar', async () => {
      // El motivo de la asimetría documentada en el servicio (`objCarga = null` solo en el `onerror`):
      // sin esto, una apertura sin red condenaría a fallar a todas las siguientes.
      //
      // ⚠ Acá NO se llama `ponerGrecaptcha()` antes del reintento, y es lo que hace que el caso sirva.
      // Con el stub puesto, `cargar()` toma su primer atajo (`if (window.grecaptcha?.render)`) y devuelve
      // un `Promise.resolve()` nuevo **sin mirar `objCarga`**, así que el caso pasaba igual con la
      // memoización liberada o sin liberar. Medido: quitar el `objCarga = null` dejaba los 13 en verde.
      // Sin el stub, el reintento tiene que pasar por `objCarga` de verdad.
      const objPrimera = objServicio.cargar();
      leerScript()!.onerror!(new Event('error'));
      await expect(objPrimera).rejects.toThrow('No se pudo cargar reCAPTCHA');

      // El nodo muerto se retira, como haría un navegador que reintenta con un script nuevo.
      limpiarScript();

      const objSegunda = objServicio.cargar();
      expect(objSegunda).not.toBe(objPrimera);
      // La prueba de que el reintento es real y no la promesa vieja: inyectó un `<script>` nuevo.
      expect(leerScript()).not.toBeNull();

      // Y termina de cerrarse como cualquier carga, para no dejar la promesa colgando.
      ponerGrecaptcha();
      leerScript()!.onload!(new Event('load'));
      await expect(objSegunda).resolves.toBeUndefined();
    });

    it('memoiza la promesa RESUELTA: una carga posterior no vuelve a inyectar nada', async () => {
      const objPrimera = objServicio.cargar();
      ponerGrecaptcha();
      leerScript()!.onload!(new Event('load'));
      await objPrimera;

      // La contracara del caso anterior: en el camino feliz no hay nada que reintentar.
      const objSegunda = objServicio.cargar();
      await expect(objSegunda).resolves.toBeUndefined();
      expect(document.querySelectorAll('script#google-recaptcha-api')).toHaveLength(1);
    });
  });
});
