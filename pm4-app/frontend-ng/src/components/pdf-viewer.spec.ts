import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PdfViewerComponent } from './pdf-viewer';

/**
 * Port de `components/PdfViewer.test.tsx` (4 casos de baseline), más los casos que cubren las reglas
 * que el port introduce y React no tenía aseveradas.
 *
 * ── El mock del cliente PM4 es `HttpTestingController`, NO `vi.mock` ─────────────────────────────
 * React mockeaba el módulo `api/pm4Client` con `vi.mock`. Acá eso **no es una opción**: el builder de
 * test de Angular 21 prohíbe `vi.mock()` sobre imports relativos (limitación ya documentada en el
 * proyecto). Y no hace falta: `provideHttpClientTesting` intercepta a nivel de `HttpClient`, que es
 * estrictamente mejor para lo que hay que probar — permite aseverar **la URL exacta** que se pide, que
 * es contrato con el BFF (`/api/files/{id}/contents`), y el `responseType`, que es la diferencia entre
 * recibir un `Blob` y recibir un string roto.
 *
 * ── ⚠ `URL.createObjectURL` no existe en jsdom ──────────────────────────────────────────────────
 * jsdom no implementa ninguna de las dos funciones de blob URL, así que sin stub el componente lanza
 * `TypeError: URL.createObjectURL is not a function` y **todos** los casos fallan por el mismo motivo,
 * escondiendo lo que se quería medir. Se stubean las dos con `vi.fn()`, lo que además es lo que permite
 * contar revocaciones — que es justamente la regla del componente que más caro sale romper (fuga de
 * memoria silenciosa, sin síntoma visible en pantalla).
 *
 * ── ⚠⚠ `flush()` + `whenStable()` NO alcanza cuando el componente resuelve con `await` ───────────
 * Costó 9 de 14 casos en rojo con tres síntomas distintos (`expected null not to be null`, el loader
 * que no se va, `Cannot read properties of null`), todos con la **misma** causa: el DOM todavía no
 * había avanzado. Medido con una sonda desechable que imprimió el estado del `<iframe>` en cada punto
 * de espera:
 *
 * ```
 * A tras flush            : false
 * B tras whenStable       : false      ← acá estaban parados los asserts
 * C tras microtask+stable : true
 * ```
 *
 * El motivo: `flush()` emite el valor de forma **sincrónica**, pero el componente lo recibe por
 * `await firstValueFrom(...)`, así que la continuación que escribe los signals queda encolada como
 * **microtask**. `whenStable()` resuelve la verificación de estabilidad *de ese momento* — cuando los
 * signals todavía no se escribieron —, y por eso vuelve con el DOM viejo y sin ningún error.
 *
 * De ahí `estabilizar()`: cede un turno de microtasks **antes** de estabilizar. No es un `sleep`
 * defensivo ni un número mágico — es exactamente el turno que necesita la continuación del `await`, y
 * es la razón por la que todo caso de este spec pasa por el helper en vez de llamar `whenStable()`
 * suelto. Vale para cualquier componente del proyecto que resuelva con `async/await` sobre `HttpClient`.
 */

/** Host que gobierna el `fileId` desde afuera, como lo hace una pantalla. */
@Component({
  standalone: true,
  imports: [PdfViewerComponent],
  template: `<app-pdf-viewer [fileId]="sigId()" [label]="strLabel()" [height]="intAlto()" />`,
})
class Host {
  public readonly sigId = signal<number | null>(7);
  public readonly strLabel = signal('Soporte.pdf');
  public readonly intAlto = signal(640);
}

/** Blob de PDF de mentira. El `type` es lo único que el componente mira para elegir img vs iframe. */
function blobPdf(): Blob {
  return new Blob(['%PDF-1.4'], { type: 'application/pdf' });
}

/**
 * Cuerpo de error tal como llega de verdad en una petición `responseType: 'blob'`: **un Blob**, no un
 * objeto ya parseado.
 *
 * No es una comodidad del test, es el contrato real y `HttpTestingController` lo impone
 * (`_toBlob` lanza `Automatic conversion to Blob is not supported for response type` con cualquier otra
 * cosa). Ver el bloque sobre el mensaje de error en el componente: es la razón por la que acá el
 * mensaje de PM4 **no** se puede mostrar y el visor cae al genérico.
 */
function cuerpoError(in_strMensaje: string): Blob {
  return new Blob([JSON.stringify({ message: in_strMensaje })], { type: 'application/json' });
}

describe('PdfViewerComponent', () => {
  let objFixture: ComponentFixture<Host>;
  let objHttp: HttpTestingController;
  let fnCrear: ReturnType<typeof vi.fn>;
  let fnRevocar: ReturnType<typeof vi.fn>;
  let intContador: number;

  beforeEach(() => {
    // Cada llamada devuelve una URL distinta: sin eso no se puede distinguir "revocó la anterior" de
    // "revocó la actual", que son cosas opuestas y el test tiene que separarlas.
    intContador = 0;
    fnCrear = vi.fn(() => `blob:mock/${++intContador}`);
    fnRevocar = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: fnCrear, revokeObjectURL: fnRevocar });

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    objHttp = TestBed.inject(HttpTestingController);
    objFixture = TestBed.createComponent(Host);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // ⚠ Restaura el espía de `document.createElement` de los casos de descarga (ver `espiarEnlaces`).
    // Va acá y no al final de cada caso porque un `mockRestore()` en la última línea del test **no
    // corre si una aserción anterior falla**, y el espía queda instalado para el caso siguiente. Eso
    // no es teórico: pasó al mutar el nombre de la descarga, y el segundo caso murió con
    // `RangeError: Maximum call stack size exceeded` en vez de con su propia aserción — el espía
    // capturaba al espía anterior y se llamaba a sí mismo. Un test que se cae por contaminación del
    // anterior no dice nada sobre lo que dice cubrir.
    vi.restoreAllMocks();
  });

  /**
   * Espía `document.createElement` y devuelve el array donde se acumulan los `<a>` creados.
   *
   * Es la única forma de alcanzar el enlace temporal de `descargar()`: se crea, se clickea y se quita
   * dentro de la misma función, así que nunca está en el DOM para consultarlo. No se simula el click
   * real de descarga porque jsdom no lo implementa (avisa con `Not implemented: navigation`).
   */
  function espiarEnlaces(): HTMLAnchorElement[] {
    const objEnlaces: HTMLAnchorElement[] = [];
    // El original se guarda ANTES de instalar el espía; si se leyera `document.createElement` ya
    // espiado, la implementación se llamaría a sí misma.
    const fnOriginal = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((in_strTag: string) => {
      const objNodo = fnOriginal(in_strTag as 'a');
      if (in_strTag === 'a') objEnlaces.push(objNodo as HTMLAnchorElement);
      return objNodo;
    });
    return objEnlaces;
  }

  /** Dispara el `eventClick` del botón de descarga del visor. */
  function clickearDescarga(): void {
    (
      objFixture.nativeElement.querySelector('.pdf-viewer-actions lib-button-z') as HTMLElement
    ).dispatchEvent(new CustomEvent('eventClick'));
  }

  /**
   * Deja el DOM al día tras una respuesta HTTP. Ver el ⚠⚠ del encabezado: el `await Promise.resolve()`
   * es el turno de microtasks que necesita la continuación del `await` del componente, sin el cual
   * `whenStable()` vuelve con el DOM anterior y **sin error**.
   */
  async function estabilizar(): Promise<void> {
    await Promise.resolve();
    await objFixture.whenStable();
  }

  /** Monta, responde la petición pendiente con `in_objBlob` y deja el DOM ya actualizado. */
  async function responder(in_objBlob: Blob = blobPdf()): Promise<void> {
    await objFixture.whenStable();
    objHttp.expectOne((in_objReq) => in_objReq.url === '/api/files/7/contents').flush(in_objBlob);
    await estabilizar();
  }

  it('pide el binario a la ruta del BFF con responseType blob', async () => {
    // Las dos mitades son contrato y ninguna es decorativa: la URL la resuelve `urlApi()` (regla 3,
    // ruta relativa /api/*, que es lo que hace que el interceptor inyecte el token), y sin
    // `responseType: 'blob'` Angular parsearía el PDF como JSON y fallaría con un error de parseo que
    // no dice nada del verdadero problema.
    await objFixture.whenStable();

    const objPeticion = objHttp.expectOne('/api/files/7/contents');

    expect(objPeticion.request.method).toBe('GET');
    expect(objPeticion.request.responseType).toBe('blob');
    objPeticion.flush(blobPdf());
  });

  it('muestra el loader mientras la petición está en vuelo y lo saca al responder', async () => {
    await objFixture.whenStable();
    const objPeticion = objHttp.expectOne('/api/files/7/contents');

    expect(objFixture.nativeElement.querySelector('lib-loader-z')).not.toBeNull();

    objPeticion.flush(blobPdf());
    await estabilizar();

    expect(objFixture.nativeElement.querySelector('lib-loader-z')).toBeNull();
  });

  it('pinta un iframe con la blob URL para un PDF', async () => {
    await responder();

    const objMarco = objFixture.nativeElement.querySelector('iframe.pdf-viewer-frame');
    expect(objMarco).not.toBeNull();
    // ⚠ Esta aserción vale por dos: además del binding, prueba que el **sanitizador de Angular no
    // bloquea** la `blob:` URL en un contexto RESOURCE_URL. Si la bloqueara, el src saldría vacío o
    // como 'unsafe:blob:…' y el visor se vería en blanco sin ningún error en consola — el modo de falla
    // que obligaría a meter DomSanitizer. Está aseverado, no supuesto.
    expect(objMarco.getAttribute('src')).toBe('blob:mock/1');
    expect(objFixture.nativeElement.querySelector('img.pdf-viewer-media')).toBeNull();
  });

  it('pinta un img en vez de un iframe cuando el blob es una imagen', async () => {
    // La decisión se toma con `type.startsWith('image/')`: un JPG dentro de un iframe se descarga en
    // vez de mostrarse en algunos navegadores, y era el motivo de la rama en React.
    await responder(new Blob([''], { type: 'image/png' }));

    const objImagen = objFixture.nativeElement.querySelector('img.pdf-viewer-media');
    expect(objImagen).not.toBeNull();
    expect(objImagen.getAttribute('src')).toBe('blob:mock/1');
    expect(objFixture.nativeElement.querySelector('iframe.pdf-viewer-frame')).toBeNull();
  });

  it('propaga el alto que pide la pantalla al medio', async () => {
    objFixture.componentInstance.intAlto.set(820);
    await responder();

    const objMarco = objFixture.nativeElement.querySelector('iframe.pdf-viewer-frame') as HTMLElement;
    // `PreviewModal` calcula el alto contra `window.innerHeight`, así que si el binding se cae el visor
    // queda en su default de 640 dentro de un modal de 820 y sobra un hueco. jsdom no aplica CSS del DS
    // pero sí refleja el estilo inline que pone el binding.
    expect(objMarco.style.height).toBe('820px');
  });

  it('⚠ muestra el error genérico de HTTP, NO el mensaje de PM4 (divergencia real con React)', async () => {
    // Es una diferencia de comportamiento medida, no un test que documenta una limitación del test.
    // Con `responseType: 'blob'` el **cuerpo del error también llega como Blob** (verificado en
    // `_toBlob` de http-testing.mjs, que solo acepta Blob/ArrayBuffer), así que `mensajeDeError` no
    // puede leer `.message` de ahí y cae al mensaje de `HttpErrorResponse`. React con axios sí
    // parseaba ese cuerpo. Queda aseverado para que la divergencia sea visible y no una sorpresa:
    // si algún día se quiere el mensaje de PM4 acá, hay que leer el Blob con `.text()` primero.
    await objFixture.whenStable();
    objHttp
      .expectOne('/api/files/7/contents')
      .flush(cuerpoError('Archivo no encontrado'), { status: 404, statusText: 'Not Found' });
    await estabilizar();

    const objEstado = objFixture.nativeElement.querySelector('.pdf-viewer-error');
    expect(objEstado).not.toBeNull();
    expect(objEstado.textContent).toContain('No se pudo cargar el documento');
    // El 404 llega al usuario: sin esto el visor podría mostrar "undefined" y el caso pasaría igual.
    expect(objEstado.textContent).toContain('404');
    expect(objEstado.textContent).not.toContain('Archivo no encontrado');
    expect(objFixture.nativeElement.querySelector('iframe.pdf-viewer-frame')).toBeNull();
  });

  it('sin fileId no monta el contenedor ni pide nada', async () => {
    objFixture.componentInstance.sigId.set(null);
    await objFixture.whenStable();

    // Ver el bloque del `@if` en el componente: `.pdf-viewer` tiene borde y fondo propios, así que
    // montarlo vacío dejaría un recuadro gris donde no hay documento.
    expect(objFixture.nativeElement.querySelector('.pdf-viewer')).toBeNull();
    objHttp.expectNone(() => true);
  });

  describe('⚠ revocación de las blob URLs (la fuga silenciosa)', () => {
    it('revoca la URL anterior al traer un archivo nuevo', async () => {
      await responder();
      expect(fnRevocar).not.toHaveBeenCalled();

      objFixture.componentInstance.sigId.set(9);
      await objFixture.whenStable();
      objHttp.expectOne('/api/files/9/contents').flush(blobPdf());
      await estabilizar();

      // La clave es *cuál* se revocó: la primera, no la que acaba de crearse. Aseverar solo el conteo
      // dejaría pasar una implementación que revoca la nueva y deja viva la vieja — que además rompería
      // el visor de forma visible, pero el test tiene que nombrar la diferencia.
      expect(fnRevocar).toHaveBeenCalledWith('blob:mock/1');
      expect(fnRevocar).toHaveBeenCalledTimes(1);
      expect(
        objFixture.nativeElement.querySelector('iframe.pdf-viewer-frame').getAttribute('src'),
      ).toBe('blob:mock/2');
    });

    it('revoca la URL al destruirse el componente', async () => {
      await responder();

      objFixture.destroy();

      // Sin esto, cerrar el modal de vista previa deja el blob del último documento colgado para
      // siempre. No tiene síntoma visible: la pantalla se ve bien y la memoria sube.
      expect(fnRevocar).toHaveBeenCalledWith('blob:mock/1');
    });

    it('revoca y limpia el visor cuando la pantalla pasa el fileId a null', async () => {
      await responder();

      objFixture.componentInstance.sigId.set(null);
      await objFixture.whenStable();

      expect(fnRevocar).toHaveBeenCalledWith('blob:mock/1');
      expect(objFixture.nativeElement.querySelector('.pdf-viewer')).toBeNull();
    });
  });

  it('⚠ descarta la respuesta de un fileId que ya no es el actual', async () => {
    // El caso que el `blnActive` de React cubría. Si la respuesta tardía se escribiera, el visor
    // mostraría el documento 7 con el label del 9 — sin error, sin síntoma, y el usuario gestionando el
    // caso con el adjunto equivocado a la vista.
    await objFixture.whenStable();
    const objPrimera = objHttp.expectOne('/api/files/7/contents');

    objFixture.componentInstance.sigId.set(9);
    await objFixture.whenStable();
    const objSegunda = objHttp.expectOne('/api/files/9/contents');

    // Llegan al revés: la del 9 primero, la del 7 (obsoleta) después.
    objSegunda.flush(blobPdf());
    await estabilizar();
    objPrimera.flush(blobPdf());
    await estabilizar();

    // Gana el archivo vigente, no el último que respondió.
    expect(
      objFixture.nativeElement.querySelector('iframe.pdf-viewer-frame').getAttribute('src'),
    ).toBe('blob:mock/1');
    expect(fnCrear).toHaveBeenCalledTimes(1);
  });

  it('⚠ un error tardío no pisa el archivo vigente', async () => {
    // La contracara del caso anterior, y hace falta aparte: la guarda tiene que estar en las DOS ramas
    // del try/catch. Sin la del catch, un 404 del documento anterior borraría el documento que se está
    // viendo bien y pintaría un error que no corresponde a nada de lo que el usuario pidió.
    await objFixture.whenStable();
    const objPrimera = objHttp.expectOne('/api/files/7/contents');

    objFixture.componentInstance.sigId.set(9);
    await objFixture.whenStable();
    objHttp.expectOne('/api/files/9/contents').flush(blobPdf());
    await estabilizar();

    // El cuerpo va como Blob por la misma razón que el caso del 404: con `responseType: 'blob'`
    // `HttpTestingController` rechaza cualquier otra cosa.
    objPrimera.flush(cuerpoError('Viejo'), { status: 404, statusText: 'Not Found' });
    await estabilizar();

    expect(objFixture.nativeElement.querySelector('.pdf-viewer-error')).toBeNull();
    expect(objFixture.nativeElement.querySelector('iframe.pdf-viewer-frame')).not.toBeNull();
  });

  describe('descarga', () => {
    it('usa el label como nombre del archivo', async () => {
      await responder();

      // El `<a download>` temporal es el único mecanismo que permite fijar el nombre: sin él el
      // navegador guarda el archivo con el UUID de la URL `blob:`, que para el usuario es un nombre
      // ilegible.
      const objEnlaces = espiarEnlaces();
      clickearDescarga();

      expect(objEnlaces).toHaveLength(1);
      expect(objEnlaces[0]!.download).toBe('Soporte.pdf');
      // ⚠ El `href` lleva la URL CRUDA, no la saneada. Un `SafeResourceUrl` se serializaría como
      // "[object Object]" y el enlace no descargaría nada — sin error de consola.
      expect(objEnlaces[0]!.href).toContain('blob:mock/1');
    });

    it('cae a documento.pdf cuando la pantalla no pasó label', async () => {
      objFixture.componentInstance.strLabel.set('');
      await responder();

      const objEnlaces = espiarEnlaces();
      clickearDescarga();

      expect(objEnlaces).toHaveLength(1);
      expect(objEnlaces[0]!.download).toBe('documento.pdf');
    });
  });
});
