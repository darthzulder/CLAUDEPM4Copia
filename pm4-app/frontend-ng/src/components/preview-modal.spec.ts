import { Component, input, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PdfViewerComponent } from './pdf-viewer';
import { PreviewModalComponent, type DocumentoVistaPrevia } from './preview-modal';

/**
 * Port de `components/PreviewModal.test.tsx` (5 casos de baseline), más los casos de las reglas que
 * el port introduce: los slots de `ModalZ`, la verificación del esquema de la `blobUrl`, y la
 * destrucción del visor al cerrar.
 *
 * ── El doble de `PdfViewer` va por `overrideComponent`, NO por `vi.mock` ──────────────────────────
 * React mockeaba el módulo con `vi.mock('./PdfViewer')`. Acá eso **no es una opción**: el builder de
 * test de Angular 21 prohíbe `vi.mock()` sobre imports relativos. El equivalente es reemplazar el
 * componente en el array `imports` del componente bajo prueba, que además es más preciso — sustituye
 * exactamente la dependencia y deja intacto el resto del árbol.
 *
 * El motivo de doblarlo es el mismo que tenía React: `app-pdf-viewer` pega a PM4 por `HttpClient` y
 * ya tiene sus 14 casos propios en `pdf-viewer.spec.ts`. Sin el doble, este spec necesitaría
 * `provideHttpClientTesting` y estaría re-probando esa red.
 */

/** Doble de `app-pdf-viewer`: mismo selector y mismos inputs, sin HTTP. */
@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  template: `<div class="visor-doble" [attr.data-file-id]="fileId()" [attr.data-alto]="height()"></div>`,
})
class PdfViewerDoble {
  public readonly fileId = input.required<number | null>();
  public readonly label = input<string>('');
  public readonly height = input<number>(0);
  public readonly className = input<string>('');
}

/** Host que gobierna el modal desde afuera, como lo hace una pantalla. */
@Component({
  standalone: true,
  imports: [PreviewModalComponent],
  template: `<app-preview-modal
    [abierto]="blnAbierto()"
    [documento]="objDoc()"
    (cerrar)="intCierres = intCierres + 1"
  />`,
})
class Host {
  public readonly blnAbierto = signal(true);
  public readonly objDoc = signal<DocumentoVistaPrevia | null>({ fileName: 'anexo.pdf', fileId: 42 });
  public intCierres = 0;
}

describe('PreviewModalComponent', () => {
  let objFixture: ComponentFixture<Host>;

  beforeEach(() => {
    TestBed.overrideComponent(PreviewModalComponent, {
      remove: { imports: [PdfViewerComponent] },
      add: { imports: [PdfViewerDoble] },
    });
    objFixture = TestBed.createComponent(Host);
  });

  /**
   * Monta con el modal **cerrado**, que es el estado inicial real de una pantalla.
   *
   * ⚠ Hace falta un helper aparte y no alcanza con `blnAbierto.set(false)` sobre el fixture ya
   * estabilizado: lo que importa es el estado en la **primera** detección de cambios, porque es ahí
   * donde `ModalZ` captura sus slots (ver el caso de la reapertura). Un `set(false)` posterior llega
   * tarde — la captura ya ocurrió con el template montado.
   */
  function montarCerrado(): void {
    objFixture.componentInstance.blnAbierto.set(false);
  }

  /** El nodo raíz del cuerpo del modal, o `null` si el modal no pintó contenido. */
  function cuerpo(): HTMLElement | null {
    return objFixture.nativeElement.querySelector('.preview-modal');
  }

  it('⚠ pinta el cuerpo DENTRO del slot `content` de lib-modal-z', async () => {
    // Es el caso que cubre el modo de falla estructural del port: si el contenido fuera un `<div>`
    // suelto en vez de un `<ng-template libZTemplate id="content">`, `ModalZ` montaría su marco y su
    // X con el cuerpo **vacío y sin ningún error**. Aseverar que el modal existe no alcanza — hay que
    // aseverar que el cuerpo llegó adentro, que es lo que prueba que el slot quedó bien nombrado.
    await objFixture.whenStable();

    const objModal = objFixture.nativeElement.querySelector('lib-modal-z');
    expect(objModal).not.toBeNull();
    expect(objModal.querySelector('.preview-modal')).not.toBeNull();
  });

  it('⚠⚠ pinta el cuerpo al abrirse habiendo montado CERRADO (los slots se leen una sola vez)', async () => {
    // El caso que faltaba, y encontrarlo costó dos intentos — vale documentar el error, porque el
    // primero **parecía** cubrir la regla y no cubría nada.
    //
    // La regla: `ModalZ` resuelve sus tres slots en `ngAfterContentInit`, que corre **una sola vez**.
    // Si en ese momento el `<ng-template>` no está montado porque un `@if` lo apagó, guarda
    // `undefined` y no vuelve a mirar nunca más. El modal queda con marco, X y backdrop, y el cuerpo
    // **vacío para siempre**, sin ningún error en consola.
    //
    // ⚠ El primer intento hizo abrir→cerrar→reabrir partiendo de `abierto=true`, y la mutación
    // (envolver el template en un `@if (abierto())`) lo dejó **verde**. El motivo, verificado en el
    // bundle: `ngAfterContentInit` guarda el `TemplateRef` en `this.content` y el modal lo pinta con
    // `<ng-template [ngTemplateOutlet]="content">`. Una vez capturada la **referencia**, que el nodo
    // fuente siga o no en el contenido da igual — el outlet la reinstancia en cada apertura. O sea que
    // partir de `abierto=true` hace que la captura salga bien y el defecto no exista nunca.
    //
    // Lo que de verdad rompe es montar **cerrado**, que es además el estado inicial real de una
    // pantalla: el modal se declara con la bandera en `false` y se abre cuando el usuario elige un
    // documento. Ahí la captura ocurre sin template y ya no hay segunda oportunidad.
    montarCerrado();
    await objFixture.whenStable();
    expect(cuerpo()).toBeNull();

    objFixture.componentInstance.blnAbierto.set(true);
    await objFixture.whenStable();

    // Con el `@if` por fuera del `ng-template`, esto es `null`: el modal abre vacío.
    expect(cuerpo()).not.toBeNull();
    expect(objFixture.nativeElement.querySelector('.preview-modal-doc-name').textContent).toContain(
      'anexo.pdf',
    );
    // Y el medio también, que es lo que el usuario venía a ver.
    expect(objFixture.nativeElement.querySelector('.visor-doble')).not.toBeNull();
  });

  it('⚠ anula el padding del modal y aclara el backdrop por custom property (paridad React)', async () => {
    // El caso del tamaño de la vista previa, y va sobre el `style` **inline** del `lib-modal-z` porque
    // ahí es donde el DS lee las dos propiedades: su SCSS declara
    // `padding: var(--z-modal--padding, var(--zs-150))` y `background-color: var(--z-modal--backdrop, …)`
    // en el `section`/`main` de su shadow DOM, así que el valor tiene que estar en el host para heredar.
    //
    // ⚠ Vale un caso propio, aunque parezca cosmético, por dos motivos medidos:
    //   1. El desajuste que esto arregla se diagnosticó mal una vez. El culpable señalado fue un
    //      `tamanio="l"` que **no existe en el DS** (ni en `web-components/dist/modal.js` ni en
    //      `angular-components`): era un atributo inerte. El ancho lo movía el padding heredado, que es
    //      justo lo que estas dos líneas anulan — y sin test, volver a perderlas no rompe nada visible
    //      en la suite.
    //   2. Un `[style.--z-modal--padding]` mal escrito **no da error de compilación**: Angular acepta
    //      cualquier nombre de propiedad custom y simplemente no aplica nada. El modo de falla es
    //      silencioso, que es la definición de lo que hay que aseverar.
    await objFixture.whenStable();

    const objModal = objFixture.nativeElement.querySelector('lib-modal-z') as HTMLElement;
    expect(objModal.style.getPropertyValue('--z-modal--padding')).toBe('0');
    // El mismo `color-mix` que pone React en el `style` de su `ZrModal` (`PreviewModal.tsx:27-31`).
    expect(objModal.style.getPropertyValue('--z-modal--backdrop')).toBe(
      'color-mix(in srgb, var(--z-modal-backdrop) 55%, transparent)',
    );
  });

  it('con abierto=false no pinta el cuerpo', async () => {
    // El equivalente del `if (!isOpen) return null` de React. Ojo con la diferencia deliberada: acá el
    // `ng-template` del slot **sigue montado** (ver el ⚠ del componente: si viviera dentro de un `@if`
    // el modal quedaría vacío para siempre tras el primer cierre); lo que se apaga es su contenido.
    objFixture.componentInstance.blnAbierto.set(false);
    await objFixture.whenStable();

    expect(cuerpo()).toBeNull();
  });

  it('con fileId monta el visor con ese id y no el iframe del blob', async () => {
    await objFixture.whenStable();

    const objVisor = objFixture.nativeElement.querySelector('.visor-doble');
    expect(objVisor).not.toBeNull();
    expect(objVisor.getAttribute('data-file-id')).toBe('42');
    expect(objFixture.nativeElement.querySelector('.preview-modal-doc-name').textContent).toContain(
      'anexo.pdf',
    );
    expect(objFixture.nativeElement.querySelector('iframe.preview-modal-iframe')).toBeNull();
  });

  it('el fileId gana sobre blobUrl cuando vienen los dos', async () => {
    // Preserva la precedencia de React (`blnHasFileId ? … : blobUrl && …`). Importa porque el visor
    // baja el binario autenticado por el BFF y el iframe del blob no: si ganara el blob, el usuario
    // vería una previa que la pantalla armó en memoria en vez del archivo que PM4 tiene guardado.
    objFixture.componentInstance.objDoc.set({
      fileName: 'a.pdf',
      fileId: 7,
      blobUrl: 'blob:local/1',
    });
    await objFixture.whenStable();

    expect(objFixture.nativeElement.querySelector('.visor-doble')).not.toBeNull();
    expect(objFixture.nativeElement.querySelector('iframe.preview-modal-iframe')).toBeNull();
  });

  it('propaga al visor el alto calculado contra window.innerHeight', async () => {
    // `min(innerHeight * 0.82, 820)`. Se prueba el lado que NO es el tope, porque un `intAlto()` que
    // devolviera la constante 820 pasaría el caso del tope sin calcular nada.
    //
    // ⚠ El valor es FRACCIONARIO y eso es correcto: `600 * 0.82` da 491.99999999999994 en IEEE-754, no
    // 492. Se asevera el número real en vez de redondear en el componente, porque React tenía la misma
    // expresión y por lo tanto el mismo float — redondear acá sería un cambio de comportamiento
    // disfrazado de port, y el efecto visible sería nulo (termina en `[style.height.px]`, y una
    // fracción de píxel no se ve). Si algún día se decide redondear, es una decisión de diseño propia
    // y este caso es el que hay que actualizar a mano.
    vi.stubGlobal('innerHeight', 600);
    objFixture.componentInstance.objDoc.set({ fileName: 'a.pdf', fileId: 1 });
    await objFixture.whenStable();

    expect(objFixture.nativeElement.querySelector('.visor-doble').getAttribute('data-alto')).toBe(
      String(600 * 0.82),
    );

    // Y el tope, que es la otra mitad de la regla: con una ventana grande gana la constante.
    vi.stubGlobal('innerHeight', 4000);
    objFixture.componentInstance.objDoc.set({ fileName: 'b.pdf', fileId: 2 });
    await objFixture.whenStable();

    expect(objFixture.nativeElement.querySelector('.visor-doble').getAttribute('data-alto')).toBe(
      '820',
    );
    vi.unstubAllGlobals();
  });

  describe('la rama del blobUrl (sin fileId)', () => {
    it('pinta un iframe con la blob URL saneada', async () => {
      objFixture.componentInstance.objDoc.set({
        fileName: 'temporal.pdf',
        blobUrl: 'blob:local-preview',
      });
      await objFixture.whenStable();

      const objMarco = objFixture.nativeElement.querySelector('iframe.preview-modal-iframe');
      expect(objMarco).not.toBeNull();
      // ⚠ Vale por dos, igual que en el visor: además del binding, prueba que el saneado dejó pasar
      // la URL. Sin `bypassSecurityTrustResourceUrl` esto lanza NG0904 y el modal no pinta; con un
      // saneado que devolviera otra cosa, el src saldría como 'unsafe:blob:…' y el iframe quedaría en
      // blanco **sin error de consola**.
      expect(objMarco.getAttribute('src')).toBe('blob:local-preview');
      expect(objMarco.getAttribute('title')).toBe('temporal.pdf');
      expect(objFixture.nativeElement.querySelector('.visor-doble')).toBeNull();
    });

    it('⚠ NO pinta nada cuando la URL no es una blob: (el bypass verifica, no confía)', async () => {
      // Ver el ⚠⚠ del componente: el bypass del visor se justifica porque el valor se produce en esa
      // misma clase; acá entra por un input, así que la garantía se restituye comprobando el esquema.
      // Sin la comprobación, una pantalla que pasara una cadena venida de PM4 haría que este
      // componente ejecute `javascript:` con el origen de la app — y el bypass lo habría habilitado.
      objFixture.componentInstance.objDoc.set({
        fileName: 'malo.pdf',
        blobUrl: 'javascript:alert(1)',
      });
      await objFixture.whenStable();

      expect(objFixture.nativeElement.querySelector('iframe.preview-modal-iframe')).toBeNull();
      // El resto del modal sí se pinta: no es un error de la pantalla, es un documento que no se
      // puede previsualizar.
      expect(cuerpo()).not.toBeNull();
    });

    it('sin fileId y sin blobUrl pinta la cabecera pero ningún medio', async () => {
      objFixture.componentInstance.objDoc.set({ fileName: 'solo-nombre.pdf' });
      await objFixture.whenStable();

      expect(cuerpo()).not.toBeNull();
      expect(objFixture.nativeElement.querySelector('iframe.preview-modal-iframe')).toBeNull();
      expect(objFixture.nativeElement.querySelector('.visor-doble')).toBeNull();
    });
  });

  describe('la cabecera', () => {
    it('sin fileName cae al título por defecto', async () => {
      objFixture.componentInstance.objDoc.set({ fileName: '' });
      await objFixture.whenStable();

      expect(objFixture.nativeElement.querySelector('.preview-modal-doc-name').textContent).toContain(
        'Vista previa',
      );
    });

    it('muestra la descripcion bajo el nombre cuando viene', async () => {
      objFixture.componentInstance.objDoc.set({
        fileName: 'a.pdf',
        descripcion: 'Cédula del titular',
        fileId: 1,
      });
      await objFixture.whenStable();

      expect(objFixture.nativeElement.querySelector('.preview-modal-doc-desc').textContent).toContain(
        'Cédula del titular',
      );
    });

    it('omite el bloque de descripcion cuando no viene', async () => {
      // El `@if` importa: un bloque vacío deja el margen y el line-height de `.preview-modal-doc-desc`
      // ocupando lugar debajo del nombre, y la cabecera queda desalineada.
      await objFixture.whenStable();

      expect(objFixture.nativeElement.querySelector('.preview-modal-doc-desc')).toBeNull();
    });
  });

  it('destruye el visor al cerrarse (es lo que revoca la blob URL del documento)', async () => {
    // Lo que el desmontaje de React hacía y su comentario no nombraba: destruir el visor es lo que
    // dispara la revocación del blob, y sin eso el archivo del último documento queda anclado en
    // memoria por cada previa que el usuario abre — sin síntoma visible, la pantalla se ve bien y la
    // memoria sube.
    //
    // ⚠ Lo que este caso NO es: la guarda del `@if (abierto())` del componente. Medido con una sonda
    // sobre el `ngOnDestroy` del visor —y por eso vale aclararlo acá—: quien garantiza la destrucción
    // es `ModalZ`, cuya plantilla envuelve los outlets en su propio `@if (open)` y baja la
    // `.modal-window` entera al cerrar. Mutar el `@if` interno a `@if (true)` deja este caso **verde**
    // con razón, porque el visor se destruye igual. Así que esto asevera el comportamiento
    // (cerrar ⇒ visor destruido ⇒ blob liberado), que es lo que importa preservar, sea cual sea la
    // pieza que lo produzca.
    await objFixture.whenStable();
    expect(objFixture.nativeElement.querySelector('.visor-doble')).not.toBeNull();

    objFixture.componentInstance.blnAbierto.set(false);
    await objFixture.whenStable();

    expect(objFixture.nativeElement.querySelector('.visor-doble')).toBeNull();
  });

  it('reemite el cierre cuando lib-modal-z emite close', async () => {
    // Ver el bloque del componente: `ModalZ.change()` hace `this.open = false` sobre su **propio**
    // input, así que si la pantalla no baja su bandera, el modal se esconde pero el estado queda en
    // `true` y el segundo intento de abrir no hace nada (el valor no cambió).
    await objFixture.whenStable();

    objFixture.nativeElement
      .querySelector('lib-modal-z')
      .dispatchEvent(new CustomEvent('close', { detail: false }));
    await objFixture.whenStable();

    expect(objFixture.componentInstance.intCierres).toBe(1);
  });
});
