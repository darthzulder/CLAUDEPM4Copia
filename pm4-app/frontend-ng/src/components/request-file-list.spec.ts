import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestFilesService } from '../core/request-files.service';
import type { Pm4File } from '../core/request-files.types';
import { PdfViewerComponent } from './pdf-viewer';
import { PreviewModalComponent } from './preview-modal';
import { RequestFileListComponent } from './request-file-list';

/**
 * Port de `components/RequestFileList.test.tsx` (6 casos de baseline), más los casos de las reglas que
 * el port introduce: el modal que monta cerrado, la exclusión mutua de los estados, y la descarga por
 * `HttpClient`.
 *
 * ── El servicio se dobla por `providers` del TestBed, NO con `vi.mock` ────────────────────────────
 * React mockeaba el módulo del hook (`vi.mock('../core/useRequestFiles')`) para poder dictar
 * `{files, loading, error}` desde el test. Acá eso **no es una opción** —el builder de Angular 21
 * prohíbe `vi.mock()` sobre imports relativos— y además no hace falta: el equivalente es proveer un
 * doble del servicio con las tres señales escribibles, que es más directo que interceptar un módulo.
 *
 * ⚠ El `providers` va en `TestBed.configureTestingModule` **y** el componente declara el servicio real
 * en sus propios `providers` (es per-pantalla, ver su encabezado). Los providers de componente **ganan**
 * sobre los del módulo, así que hay que sacarlo con `overrideComponent`: sin eso el doble se ignora en
 * silencio y el componente inyecta el real, dejando los casos de error y vacío imposibles de montar.
 *
 * ── El `PdfViewer` se dobla por la misma razón que en `preview-modal.spec.ts` ────────────────────
 * Llega por dentro de `app-preview-modal` y pega a PM4 por `HttpClient`. Ya tiene sus 14 casos propios.
 */

/** Doble de `RequestFilesService` con las tres señales escribibles desde el test. */
class ServicioDoble {
  public readonly files = signal<Pm4File[]>([]);
  public readonly cargando = signal(false);
  public readonly error = signal<string | null>(null);
  /** Cuenta las llamadas para el caso del `effect`. No hace HTTP. */
  public readonly cllPedidos: (number | null | undefined)[] = [];

  public async cargar(in_intRequestId: number | null | undefined): Promise<void> {
    this.cllPedidos.push(in_intRequestId);
  }
}

/** Doble de `app-pdf-viewer`: mismo selector y mismos inputs, sin HTTP. */
@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  template: `<div class="visor-doble" [attr.data-file-id]="fileId()"></div>`,
})
class PdfViewerDoble {
  public readonly fileId = input.required<number | null>();
  public readonly label = input<string>('');
  public readonly height = input<number>(0);
  public readonly className = input<string>('');
}

/** Host que gobierna los inputs desde afuera, como lo hace una pantalla. */
@Component({
  standalone: true,
  imports: [RequestFileListComponent],
  template: `<app-request-file-list
    [requestId]="intRequestId()"
    [docKeys]="cllClaves()"
    [fileIds]="cllIds()"
    [label]="strLabel()"
    [emptyText]="strVacio()"
    [loadingText]="strCargando()"
  />`,
})
class Host {
  public readonly intRequestId = signal<number | null>(101);
  public readonly cllClaves = signal<readonly string[]>([]);
  public readonly cllIds = signal<readonly (number | null | undefined)[]>([]);
  public readonly strLabel = signal('Documentos adjuntos');
  public readonly strVacio = signal('No hay documentos adjuntos.');
  public readonly strCargando = signal('Buscando documentos del caso…');
}

/** Archivo de PM4 con lo mínimo que la lista lee, más lo que cada caso necesite. */
function archivo(in_objParcial: Partial<Pm4File> & { id: number }): Pm4File {
  return {
    file_name: `archivo-${in_objParcial.id}.pdf`,
    mime_type: 'application/pdf',
    size: 1024,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...in_objParcial,
  };
}

describe('RequestFileListComponent', () => {
  let objFixture: ComponentFixture<Host>;
  let objServicio: ServicioDoble;
  let objHttp: HttpTestingController;

  beforeEach(() => {
    objServicio = new ServicioDoble();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RequestFilesService, useValue: objServicio },
      ],
    });

    // Ver el ⚠ del encabezado: sin sacar el provider del componente, el doble de arriba se ignora.
    TestBed.overrideComponent(RequestFileListComponent, {
      remove: { providers: [RequestFilesService] },
    });
    TestBed.overrideComponent(PreviewModalComponent, {
      remove: { imports: [PdfViewerComponent] },
      add: { imports: [PdfViewerDoble] },
    });

    objFixture = TestBed.createComponent(Host);
    objHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // `verify()` en `afterEach` y no al final de cada caso: si una aserción falla antes, la línea
    // final no corre y la petición pendiente se filtraría al caso siguiente como un fallo fantasma.
    objHttp.verify();
    vi.restoreAllMocks();
  });

  /** El texto visible de toda la lista, para buscar mensajes sin acoplarse al markup del DS. */
  function texto(): string {
    return objFixture.nativeElement.textContent ?? '';
  }

  /** Los nombres de archivo que la lista pintó, en orden. */
  function nombres(): string[] {
    return [...objFixture.nativeElement.querySelectorAll('app-doc-card')].map((in_objCard) =>
      (in_objCard as HTMLElement).getAttribute('ng-reflect-file-name') ??
      ((in_objCard as HTMLElement).querySelector('.doc-name')?.textContent ?? '').trim(),
    );
  }

  describe('los cuatro estados, que son mutuamente excluyentes', () => {
    it('mientras carga muestra el loadingText y ningún otro mensaje', async () => {
      // ⚠ Los archivos se cargan a propósito ANTES de prender el `cargando`, y es lo que hace
      // verificable la última aserción. Es el escenario real de una **recarga**: el servicio ya tiene
      // los archivos de la vuelta anterior y sale a pedirlos de nuevo (el `effect` del componente
      // recarga al cambiar el `requestId`). Sin datos en el doble, `nombres()` daría `[]` por falta de
      // archivos y no por la guarda — medido: mutar la guarda de la lista a `@if (length > 0)` dejaba
      // los 20 tests verdes.
      //
      // ⚠⚠ Y el `cllIds` hay que pasarlo: el filtro es obligatorio (ver el ⚠ del componente), así que
      // un archivo que no matchea ningún criterio queda fuera de `cllDocs()` y `nombres()` volvería a
      // dar `[]` por el filtro en vez de por la guarda. Con esto el archivo SÍ entra al filtro, y lo
      // único que lo mantiene fuera del DOM es el `!cargando`.
      objServicio.files.set([archivo({ id: 42, file_name: 'de-la-vuelta-anterior.pdf' })]);
      objFixture.componentInstance.cllIds.set([42]);
      objServicio.cargando.set(true);
      await objFixture.whenStable();

      expect(texto()).toContain('Buscando documentos del caso…');
      // ⚠ Las dos aserciones de ausencia son el caso, no un adorno. Sin el `!cargando` de la guarda
      // del vacío, cada carga arrancaría afirmando "No hay documentos adjuntos" durante el viaje de
      // la petición — un mensaje que dice algo falso justo cuando todavía no se sabe. Y sin el
      // `!cargando` de la guarda de la LISTA, la recarga mostraría el loader **encima** de los
      // archivos viejos, o sea datos que ya se están reemplazando presentados como vigentes.
      expect(texto()).not.toContain('No hay documentos adjuntos.');
      expect(nombres()).toEqual([]);
    });

    it('con error muestra el mensaje y NO la lista', async () => {
      objServicio.error.set('Falla de red');
      objServicio.files.set([archivo({ id: 1 })]);
      await objFixture.whenStable();

      expect(texto()).toContain('No se pudieron cargar los documentos: Falla de red');
      expect(nombres()).toEqual([]);
    });

    it('⚠ con error NO muestra además el mensaje de vacío (el `!error` de la guarda)', async () => {
      // El término `!error` de la condición del vacío es lo que este caso fija. Sin él las dos cajas
      // se apilan y se contradicen: al lado de un error, "No hay documentos adjuntos." se lee como
      // "este caso no tiene adjuntos" — que es exactamente la confusión que el servicio documenta
      // como inadmisible (alguien podría gestionar la queja creyendo que no hay soportes).
      objServicio.error.set('Falla de red');
      await objFixture.whenStable();

      expect(texto()).toContain('No se pudieron cargar los documentos: Falla de red');
      expect(texto()).not.toContain('No hay documentos adjuntos.');
    });

    it('sin archivos que pasen el filtro muestra el emptyText', async () => {
      objServicio.files.set([archivo({ id: 1, custom_properties: { data_name: 'otra_cosa' } })]);
      objFixture.componentInstance.cllClaves.set(['qd_strAttach01']);
      await objFixture.whenStable();

      expect(texto()).toContain('No hay documentos adjuntos.');
      expect(nombres()).toEqual([]);
    });
  });

  describe('el filtro', () => {
    it('filtra por docKeys contra custom_properties.data_name y formatea el tamaño', async () => {
      objServicio.files.set([
        archivo({
          id: 1,
          file_name: 'soporte.pdf',
          size: 2048,
          custom_properties: { data_name: 'qd_strAttach01' },
        }),
        archivo({ id: 2, file_name: 'otro.pdf', custom_properties: { data_name: 'qd_strOtro' } }),
      ]);
      objFixture.componentInstance.cllClaves.set(['qd_strAttach01']);
      await objFixture.whenStable();

      expect(texto()).toContain('soporte.pdf');
      expect(texto()).toContain('2.0 KB');
      // El que NO pasa el filtro es la mitad que importa: ver el ⚠ del componente sobre por qué el
      // filtro es obligatorio (PM4 devuelve TODOS los adjuntos del caso, de todas las tareas).
      expect(texto()).not.toContain('otro.pdf');
    });

    it('filtra por fileIds y formatea bytes sueltos', async () => {
      objServicio.files.set([
        archivo({ id: 42, file_name: 'respuesta.pdf', size: 100 }),
        archivo({ id: 7, file_name: 'ajeno.pdf' }),
      ]);
      objFixture.componentInstance.cllIds.set([42]);
      await objFixture.whenStable();

      expect(texto()).toContain('respuesta.pdf');
      expect(texto()).toContain('100 B');
      expect(texto()).not.toContain('ajeno.pdf');
    });

    it('los dos criterios son UNIÓN, no intersección', async () => {
      // Preserva el `||` de React. Una pantalla puede pasar los dos y ve la suma; si fuera
      // intersección, la SCR-009 (que pasa `fileIds` para la respuesta final y `docKeys` para los
      // soportes) no vería ninguno de los dos.
      objServicio.files.set([
        archivo({ id: 42, file_name: 'por-id.pdf' }),
        archivo({ id: 9, file_name: 'por-clave.pdf', custom_properties: { data_name: 'qd_x' } }),
        archivo({ id: 3, file_name: 'por-nada.pdf' }),
      ]);
      objFixture.componentInstance.cllIds.set([42]);
      objFixture.componentInstance.cllClaves.set(['qd_x']);
      await objFixture.whenStable();

      expect(texto()).toContain('por-id.pdf');
      expect(texto()).toContain('por-clave.pdf');
      expect(texto()).not.toContain('por-nada.pdf');
    });

    it('⚠ sin docKeys ni fileIds NO muestra nada (el default es vacío, no "todo")', async () => {
      // El caso que hace de guarda contra un `?? files` "de comodidad" que algún día parezca una
      // mejora. Ver el ⚠ del componente: sin filtro, la sección "Documentos del radicador" de la
      // SCR-0051 mostraría también los soportes internos del área que gestionó antes.
      objServicio.files.set([archivo({ id: 1 }), archivo({ id: 2 })]);
      await objFixture.whenStable();

      expect(nombres()).toEqual([]);
      expect(texto()).toContain('No hay documentos adjuntos.');
    });

    it('descarta los null/undefined de fileIds sin descartar el 0 por accidente', async () => {
      // `fileIds` acepta huecos porque `resolveFileId` devuelve `null` cuando el campo del payload
      // viene vacío. El filtro es por `typeof === 'number'`, no por truthiness.
      //
      // ⚠ El archivo con `id: 0` está acá a propósito, y es lo único que hace verificable la mitad
      // "sin descartar el 0" del título. La primera versión de este caso pasaba `[null, undefined, 5]`
      // sobre un doble que solo tenía el 5, así que la rama del cero **no se ejercía**: mutar el filtro
      // a `Boolean(in_genId)` dejaba los 20 tests verdes. Con el archivo 0 en la lista, esa mutación se
      // pone roja.
      //
      // Que PM4 no emita hoy un id 0 no vuelve al caso hipotético: `Boolean` y `typeof` difieren
      // exactamente en `0`, `NaN` y `''`, así que es el único valor que distingue las dos
      // implementaciones — y un filtro por truthiness convertiría además un `NaN` en descarte
      // silencioso.
      objServicio.files.set([
        archivo({ id: 0, file_name: 'cero.pdf' }),
        archivo({ id: 5, file_name: 'cinco.pdf' }),
      ]);
      objFixture.componentInstance.cllIds.set([null, undefined, 0, 5]);
      await objFixture.whenStable();

      expect(nombres()).toEqual(['cero.pdf', 'cinco.pdf']);
    });

    it('ignora un data_name que no sea string', async () => {
      // PM4 devuelve `custom_properties` como `Record<string, unknown>`. Un `data_name` numérico
      // pasaría un `setKeys.has(...)` sin la guarda de tipo y entraría a la lista de otra pantalla.
      objServicio.files.set([
        archivo({ id: 1, file_name: 'raro.pdf', custom_properties: { data_name: 42 } }),
      ]);
      objFixture.componentInstance.cllClaves.set(['42']);
      await objFixture.whenStable();

      expect(texto()).not.toContain('raro.pdf');
    });
  });

  describe('los textos configurables', () => {
    it('acepta label y emptyText propios', async () => {
      objFixture.componentInstance.strLabel.set('Soportes SAC');
      objFixture.componentInstance.strVacio.set('Sin soportes cargados.');
      await objFixture.whenStable();

      expect(texto()).toContain('Soportes SAC');
      expect(texto()).toContain('Sin soportes cargados.');
    });

    it('acepta loadingText propio', async () => {
      objFixture.componentInstance.strCargando.set('Un momento…');
      objServicio.cargando.set(true);
      await objFixture.whenStable();

      expect(texto()).toContain('Un momento…');
    });
  });

  describe('formatearBytes', () => {
    it('cruza los tres escalones en sus bordes exactos', async () => {
      // Los bordes son `<` estricto en las dos comparaciones, así que 1024 y 1048576 caen al escalón
      // de arriba. Se prueban los valores límite y no solo el medio de cada rango, porque un `<=` por
      // error solo se ve acá.
      objServicio.files.set([
        archivo({ id: 1, file_name: 'a.pdf', size: 1023 }),
        archivo({ id: 2, file_name: 'b.pdf', size: 1024 }),
        archivo({ id: 3, file_name: 'c.pdf', size: 1024 * 1024 - 1 }),
        archivo({ id: 4, file_name: 'd.pdf', size: 1024 * 1024 }),
      ]);
      objFixture.componentInstance.cllIds.set([1, 2, 3, 4]);
      await objFixture.whenStable();

      const strTexto = texto();
      expect(strTexto).toContain('1023 B');
      expect(strTexto).toContain('1.0 KB');
      expect(strTexto).toContain('1024.0 KB');
      expect(strTexto).toContain('1.0 MB');
    });
  });

  describe('la carga', () => {
    it('pide los archivos del requestId al montar y al cambiar', async () => {
      await objFixture.whenStable();
      expect(objServicio.cllPedidos).toEqual([101]);

      objFixture.componentInstance.intRequestId.set(202);
      await objFixture.whenStable();
      expect(objServicio.cllPedidos).toEqual([101, 202]);
    });
  });

  describe('la vista previa', () => {
    /** El botón de vista previa de la primera fila. */
    function botonPrevia(): HTMLElement {
      return objFixture.nativeElement.querySelector('lib-button-z[title="Vista previa"]');
    }

    async function conUnArchivo(): Promise<void> {
      objServicio.files.set([archivo({ id: 42, file_name: 'anexo.pdf' })]);
      objFixture.componentInstance.cllIds.set([42]);
      await objFixture.whenStable();
    }

    it('⚠⚠ el modal monta CERRADO y al pedir la previa pinta su cuerpo', async () => {
      // Este es el caso de producción del defecto de slots de `ModalZ`, y por eso el modal se declara
      // fuera de todo `@if`. `objPrevia` arranca en `null`, así que el modal monta cerrado: si
      // estuviera envuelto en un `@if`, `ngAfterContentInit` correría sin el `<ng-template>` y el
      // modal quedaría con marco y X pero **cuerpo vacío para siempre**, sin ningún error en consola.
      //
      // La aserción de que el cuerpo está ausente antes del click es la mitad que hace válido el
      // caso: sin ella, un modal que pintara su contenido desde el arranque también pasaría.
      await conUnArchivo();
      expect(objFixture.nativeElement.querySelector('.preview-modal')).toBeNull();

      botonPrevia().dispatchEvent(new CustomEvent('eventClick', { detail: null }));
      await objFixture.whenStable();

      expect(objFixture.nativeElement.querySelector('.preview-modal')).not.toBeNull();
      expect(
        objFixture.nativeElement.querySelector('.preview-modal-doc-name').textContent,
      ).toContain('anexo.pdf');
    });

    it('le pasa el fileId al visor, no una blobUrl', async () => {
      // Ver `verPrevia()`: el modal delega en `app-pdf-viewer`, que baja el binario autenticado por
      // el BFF. Pasar una `blobUrl` obligaría a descargar acá primero.
      await conUnArchivo();
      botonPrevia().dispatchEvent(new CustomEvent('eventClick', { detail: null }));
      await objFixture.whenStable();

      const objVisor = objFixture.nativeElement.querySelector('.visor-doble');
      expect(objVisor).not.toBeNull();
      expect(objVisor.getAttribute('data-file-id')).toBe('42');
    });

    it('el cierre del modal baja la bandera y se puede reabrir', async () => {
      // El segundo abrir es la parte que importa: `ModalZ.change()` muta su propio `open`, así que si
      // el componente no bajara su señal al recibir `(cerrar)`, el valor seguiría en `true` y el
      // siguiente click no cambiaría nada — el modal no volvería a abrir nunca.
      await conUnArchivo();
      botonPrevia().dispatchEvent(new CustomEvent('eventClick', { detail: null }));
      await objFixture.whenStable();

      objFixture.nativeElement
        .querySelector('lib-modal-z')
        .dispatchEvent(new CustomEvent('close', { detail: false }));
      await objFixture.whenStable();
      expect(objFixture.nativeElement.querySelector('.preview-modal')).toBeNull();

      botonPrevia().dispatchEvent(new CustomEvent('eventClick', { detail: null }));
      await objFixture.whenStable();
      expect(objFixture.nativeElement.querySelector('.preview-modal')).not.toBeNull();
    });
  });

  describe('la descarga', () => {
    /** El botón de descarga de la primera fila. */
    function botonDescarga(): HTMLElement {
      return objFixture.nativeElement.querySelector('lib-button-z[icon="download:line"]');
    }

    async function conUnArchivo(in_strNombre = 'anexo.pdf'): Promise<void> {
      objServicio.files.set([archivo({ id: 42, file_name: in_strNombre })]);
      objFixture.componentInstance.cllIds.set([42]);
      await objFixture.whenStable();
    }

    /**
     * Cede el turno a la microcola.
     *
     * ⚠ `whenStable()` no alcanza: `descargar()` es `async` y `await`ea el `firstValueFrom`, así que
     * el `click()` y el `revokeObjectURL` ocurren en un microtask posterior a la resolución del
     * `flush()`. Sin este yield las aserciones corren antes que el efecto que miden.
     */
    async function estabilizar(): Promise<void> {
      await Promise.resolve();
      await Promise.resolve();
      await objFixture.whenStable();
    }

    /**
     * Intercepta **solo** `createElement('a')` y devuelve un enlace espiado.
     *
     * ⚠ El spy tiene que delegar al original para cualquier otro tag, y encontrar eso costó dos
     * corridas: un `mockReturnValue(objEnlace)` a secas devuelve el **mismo `<a>`** para todas las
     * llamadas, y Angular usa `document.createElement` para construir cada nodo del template. El
     * resultado es un `HierarchyRequestError: The operation would yield an incorrect node tree` al
     * intentar insertar ese `<a>` dentro de sí mismo — un fallo que parece del componente y es del
     * doble.
     */
    function espiarEnlace(): HTMLAnchorElement {
      const objEnlace = document.createElement('a');
      vi.spyOn(objEnlace, 'click').mockImplementation(() => undefined);
      const fnOriginal = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((in_strTag: string) =>
        in_strTag === 'a' ? objEnlace : fnOriginal(in_strTag),
      );
      return objEnlace;
    }

    it('baja el binario por HttpClient y lo guarda con el nombre real del archivo', async () => {
      // Va por `HttpClient` y no por un `<a href="/api/…">` porque la ruta necesita el header
      // `x-pm4-token` del interceptor del BFF; el navegador pediría la URL por su cuenta y sin token
      // recibiría un 401. El `download` es lo único que fija el nombre: sin él el archivo se guarda
      // con el UUID de la `blob:`.
      // El enlace se espía DESPUÉS de montar la fila: el spy de `createElement` no debe estar activo
      // mientras Angular construye el template (ver el ⚠ de `espiarEnlace`).
      await conUnArchivo('acta final.pdf');
      const objEnlace = espiarEnlace();
      const fnClick = objEnlace.click as unknown as ReturnType<typeof vi.fn>;
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:descarga-1');

      botonDescarga().dispatchEvent(new CustomEvent('eventClick', { detail: null }));

      const objPedido = objHttp.expectOne('/api/files/42/contents');
      expect(objPedido.request.responseType).toBe('blob');
      objPedido.flush(new Blob(['x'], { type: 'application/pdf' }));
      await estabilizar();

      expect(fnClick).toHaveBeenCalledTimes(1);
      expect(objEnlace.download).toBe('acta final.pdf');
      expect(objEnlace.getAttribute('href')).toBe('blob:descarga-1');
    });

    it('⚠ revoca la blob URL después de disparar la descarga', async () => {
      // Sin esto cada descarga ancla el binario entero en memoria: `createObjectURL` mantiene una
      // referencia global viva que el recolector no libera. Seis descargas de 5 MB son 30 MB
      // colgados, sin ningún síntoma visible.
      await conUnArchivo();
      espiarEnlace();
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:descarga-2');
      const fnRevocar = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

      botonDescarga().dispatchEvent(new CustomEvent('eventClick', { detail: null }));
      objHttp.expectOne('/api/files/42/contents').flush(new Blob(['x']));
      await estabilizar();

      expect(fnRevocar).toHaveBeenCalledWith('blob:descarga-2');
    });

    it('⚠ un fallo de descarga NO pinta ningún mensaje (se preserva React)', async () => {
      // Decisión heredada y deliberada: el `catch` solo hace `console.error`. El mensaje de error de
      // la lista describe la **carga de la lista**, no una descarga puntual — pintarlo ahí diría que
      // la lista falló cuando la lista está bien.
      //
      // ⚠ El body del error llega como `Blob` y no como texto, porque el pedido va con
      // `responseType: 'blob'`: eso vale para el `mensajeDeError` de cualquier otro consumidor, y es
      // otro motivo para no intentar pintarlo.
      const fnConsola = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const fnRevocar = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

      await conUnArchivo();
      botonDescarga().dispatchEvent(new CustomEvent('eventClick', { detail: null }));
      objHttp
        .expectOne('/api/files/42/contents')
        .flush(new Blob(['nope']), { status: 500, statusText: 'Server Error' });
      await estabilizar();

      expect(fnConsola).toHaveBeenCalled();
      expect(texto()).not.toContain('No se pudieron cargar los documentos');
      // Y el `finally`: como la URL nunca se creó, no hay nada que revocar. Un `revoke(null)` o un
      // `revoke(undefined)` sería un error silencioso de limpieza.
      expect(fnRevocar).not.toHaveBeenCalled();
      // La lista sigue en pie: el archivo que no bajó continúa listado y se puede reintentar.
      expect(texto()).toContain('anexo.pdf');
    });
  });
});
