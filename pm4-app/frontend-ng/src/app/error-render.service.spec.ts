import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ManejadorDeErrores } from './error-render.service';

/**
 * Specs del reemplazo del `ErrorBoundary` de React.
 *
 * ── Lo que hay que aseverar acá, y por qué no es obvio ───────────────────────────────────────
 * La parte fácil (guardar un `Error` en la señal) no es donde vive el riesgo. El riesgo está en la
 * **normalización**: `handleError` recibe `unknown`, y en JavaScript se puede lanzar cualquier cosa
 * —un string, un objeto plano, `undefined`—. Sin normalizar, la pantalla de error leería `.message`
 * de un string y pintaría un `undefined` **justo en el momento en que alguien necesita saber qué
 * pasó**, que es el peor lugar posible para perder información.
 *
 * Se instancia el servicio con `new` en vez de pasar por `TestBed`: no tiene dependencias, así que
 * el inyector no aportaría nada y sí sumaría el costo de configurar un módulo. La identidad del
 * provider (que `ErrorHandler` y `ManejadorDeErrores` sean **la misma instancia**) es una cuestión
 * de cableado y se asevera donde vive ese cableado, en `app.config.spec.ts`.
 */
describe('ManejadorDeErrores', () => {
  let objManejador: ManejadorDeErrores;

  beforeEach(() => {
    objManejador = new ManejadorDeErrores();
    // Silenciado a propósito: el servicio loguea **siempre** (es parte de su contrato, ver abajo),
    // así que sin el spy cada caso escupiría un error rojo en la salida de la suite y una corrida
    // verde se vería como si algo hubiera fallado.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('arranca sin error, y eso es lo que decide qué pinta la raíz', () => {
    // `null` no es solo un valor inicial: es la condición del `@if` de `app.html`. Si arrancara con
    // cualquier otra cosa, la app mostraría la página de error antes de que pase nada.
    expect(objManejador.objError()).toBeNull();
  });

  it('guarda un Error tal cual, sin envolverlo', () => {
    const objOriginal = new Error('estalló la pantalla');

    objManejador.handleError(objOriginal);

    // `toBe` y no `toEqual`: envolver un `Error` en otro `Error` perdería el `stack` original, que
    // es el único dato con el que se ubica la línea que falló dentro de un bundle minificado.
    expect(objManejador.objError()).toBe(objOriginal);
  });

  describe('normalización de lo que no es un Error', () => {
    it('⚠ un throw de string se convierte en Error, con el texto preservado', () => {
      // El caso que motiva la normalización. Sin ella la vista leería `.message` de un string
      // (→ `undefined`) y la pantalla de error diría literalmente "undefined": el diagnóstico se
      // pierde exactamente cuando se lo necesita.
      objManejador.handleError('algo salió mal');

      const objError = objManejador.objError();
      expect(objError).toBeInstanceOf(Error);
      expect(objError?.message).toBe('algo salió mal');
    });

    it('un objeto plano no se pierde: queda su representación como mensaje', () => {
      // Un rechazo de promesa con un objeto (típico de un cliente HTTP) llega acá igual. El
      // `String(...)` da `[object Object]`, que es pobre pero **no vacío** — y el objeto crudo sigue
      // estando en la consola por el `console.error`, que es lo que se lee de verdad.
      objManejador.handleError({ status: 500 });

      const objError = objManejador.objError();
      expect(objError).toBeInstanceOf(Error);
      expect(objError?.message).toBe('[object Object]');
    });

    it('undefined tampoco rompe la pantalla de error', () => {
      // `throw undefined` es legal en JS y aparece en la vida real por un `reject()` sin argumento.
      // La aserción que importa es que quede un `Error` **instanciable de leer**, no el texto.
      objManejador.handleError(undefined);

      expect(objManejador.objError()).toBeInstanceOf(Error);
      expect(objManejador.objError()?.message).toBe('undefined');
    });
  });

  describe('el log a consola', () => {
    it('loguea con el prefijo [ErrorBoundary], igual que React', () => {
      const objError = new Error('x');

      objManejador.handleError(objError);

      // El prefijo se hereda textual del `componentDidCatch` de React para que un log viejo y uno
      // nuevo se busquen con la misma cadena. El nombre del mecanismo cambió de framework; el del
      // síntoma no, y es lo que alguien va a tipear en el filtro de la consola.
      expect(console.error).toHaveBeenCalledWith('[ErrorBoundary]', objError);
    });

    it('⚠ loguea el valor ORIGINAL, no el Error normalizado', () => {
      objManejador.handleError('un string pelado');

      // Distinción deliberada: la señal recibe la versión normalizada (para que la vista no
      // necesite guardas) pero la consola recibe **lo que se lanzó de verdad**. Perder el valor
      // original en el log volvería indistinguible un `throw 'x'` de un `new Error('x')`, que es
      // información sobre dónde buscar el bug.
      expect(console.error).toHaveBeenCalledWith('[ErrorBoundary]', 'un string pelado');
    });

    it('⚠ loguea ANTES de escribir la señal', () => {
      // El orden es el contrato: el log es lo único que sobrevive si la señal no llega a pintarse
      // (un throw durante el bootstrap, antes de que `App` exista). Se asevera leyendo la señal
      // **desde dentro** del spy: en ese instante todavía tiene que estar en `null`.
      let objAlLoguear: Error | null | 'no-se-llamó' = 'no-se-llamó';
      vi.mocked(console.error).mockImplementation(() => {
        objAlLoguear = objManejador.objError();
      });

      objManejador.handleError(new Error('x'));

      expect(objAlLoguear).toBeNull();
      expect(objManejador.objError()).not.toBeNull();
    });
  });

  it('un segundo error pisa al primero, sin acumular', () => {
    objManejador.handleError(new Error('el primero'));
    objManejador.handleError(new Error('el segundo'));

    // La señal es un solo error, no una lista, y es a propósito: la app no se recupera de un error
    // (no hay `retry`, igual que el `ErrorBoundary` de React), así que los siguientes son
    // consecuencias del primero. Se conserva el último porque es el que la vista ya está mostrando;
    // la cadena completa está en la consola, que es donde sirve.
    expect(objManejador.objError()?.message).toBe('el segundo');
  });
});
