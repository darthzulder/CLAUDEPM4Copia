import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, NgControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ZaFileInput } from '@zurich/angular-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileRegistryService } from '../../core/file-registry.service';
import { ZdsFileInput } from './zds-file-input';

/**
 * El wrapper con más lógica propia de toda la fachada, y por lo tanto el que más puede romperse en
 * silencio. Los cinco `lib-*-z` y `ZdsRadio` solo traducen; este además **reconstruye el archivo**,
 * valida extensión y tamaño, y consulta el registro por hash.
 *
 * ── Cómo se dispara el evento, y por qué así ──────────────────────────────────────────────────
 * La cadena real es: el `<z-file-input>` de Lit emite `change` con un `Blob` en `detail` →
 * `ZaFileInput._onChange` lo re-emite por el `EventEmitter` `change` que hereda de `ZaModelElement`
 * **pasando el mismo evento** (`this.change.emit(e)`) → el `(change)` de la plantilla del wrapper lo
 * recibe. Por eso los tests llaman a `_onChange` sobre la instancia hija con un `CustomEvent` armado
 * a mano: es el punto de entrada real y conserva el `target`, que es de donde el wrapper lee
 * `_fileName`.
 *
 * Que el `(change)` de plantilla funcione **no es obvio leyendo el bundle del DS** —la declaración
 * parcial de `ZaFileInput` no lista `outputs`— y el porqué (`usesInheritance: true` + el linker) está
 * medido en la cabecera de `zds-file-input.ts`.
 *
 * ── Lo que estos tests NO detectan, y hay que saberlo ─────────────────────────────────────────
 * Verificado por mutación: si el handler queda **muerto** (nunca corre), **112 de 113 tests siguen
 * verdes**. Los de rechazo aseveran *ausencias* (`toBeUndefined()`, control en `''`, `errors`
 * intacto) y esas condiciones se cumplen solas cuando no pasa nada; los de aceptación tampoco
 * alcanzan, porque el CVA nativo del DS escribe el valor en el control por su cuenta. El único que
 * cae es el del duplicado, que asevera un mensaje **presente**.
 *
 * La moraleja aplica a todo este archivo: **una aserción de ausencia no prueba que el código corrió.**
 * Los tests que sostienen el contrato son los que aseveran algo *presente* — el `File` reconstruido
 * en el registro, su `name`, su contenido, y el mensaje de rechazo.
 *
 * Se verificó que esto funciona bajo jsdom: `templateRef` es un `ViewChild('ref')` sobre el
 * `<z-file-input #ref>`, o sea una referencia a **elemento**, no a componente — resuelve aunque Lit no
 * haya hecho el upgrade del custom element. Si no resolviera, `_onChange` tiraría
 * `Error('TemplateRef not found')`, que es un mensaje que apunta al lugar correcto.
 *
 * El `target` se fuerza con `Object.defineProperty` porque un `CustomEvent` que nunca se despachó
 * tiene `target: null`, y es el `_fileName` de ese target lo que el wrapper necesita. Es exactamente
 * lo que el elemento real expone (declarado en `web-components/dist/file-input.d.ts`).
 *
 * ── Lo que NO se testea, y por qué ────────────────────────────────────────────────────────────
 * No se asevera que el archivo llegue a PM4: eso es del submit de cada pantalla, no del wrapper. Acá
 * el contrato termina en "el binario correcto quedó en el registro con el docKey correcto".
 */

/** Doble del `<z-file-input>` real: solo lo que el wrapper le toca. */
interface ElementoFalso extends Partial<HTMLElement> {
  _fileName: string | null;
  // Tipado como el spy que realmente es (y no como `() => void`), para que un `drenarAsincronia` pueda
  // esperar por `reset.mock.calls.length` en vez de por un número fijo de vueltas.
  reset: ReturnType<typeof vi.fn>;
}

function elementoFalso(in_strNombre: string | null): ElementoFalso {
  return { _fileName: in_strNombre, reset: vi.fn() };
}

/**
 * Arma el evento tal como llega desde el DS: `detail` es un `Blob` **sin nombre** (ver el bloque 1 de
 * la cabecera de `zds-file-input.ts`) y el nombre real viaja aparte, en `_fileName` del elemento.
 */
function eventoCambio(
  in_objDetalle: Blob | null,
  in_objElemento: ElementoFalso,
): CustomEvent<Blob | null> {
  const objEvento = new CustomEvent<Blob | null>('change', { detail: in_objDetalle });
  Object.defineProperty(objEvento, 'target', { value: in_objElemento, writable: false });
  return objEvento;
}

function blob(in_strContenido: string, in_strTipo = 'application/pdf'): Blob {
  return new Blob([in_strContenido], { type: in_strTipo });
}

/**
 * Espera a que termine el `alCambiarArchivo` del wrapper, que es **async**.
 *
 * `fixture.whenStable()` **no alcanza**, y este es el detalle que hay que entender para que estos
 * tests prueben algo: el handler hace `await findDuplicateAttachment(...)`, que a su vez hace
 * `await file.arrayBuffer()` — y bajo jsdom eso resuelve por `FileReader`, o sea un **macrotask**. La
 * suscripción del wrapper no devuelve la promesa a nadie (es un `void this.alCambiarArchivo(...)`),
 * así que `whenStable()` vuelve mientras el handler está suspendido en el primer `await`.
 *
 * El síntoma era engañoso: los tests de **aceptación** fallaban con el registro vacío, y encima
 * aparecía `NG0953: Unexpected emit for destroyed OutputRef` — el `aceptado.emit()` corriendo después
 * de que el fixture se destruyó. Los de **rechazo** pasaban igual, porque cortan con `return` antes
 * del primer `await`: pasaban por el motivo equivocado.
 *
 * ── Por qué espera por CONDICIÓN y no un número fijo de vueltas ───────────────────────────────
 * Esta función drenaba 4 vueltas fijas, contadas como "un macrotask para el hash del archivo
 * entrante y otro para el de cada archivo ya registrado". Esa cuenta vale para un registro con UN
 * archivo, y es un **presupuesto**, no una condición: si el handler necesita una vuelta más, el test
 * asevera sobre un estado que todavía no llegó.
 *
 * Y falla de la peor manera posible — **de forma intermitente**. El caso del duplicado es el que más
 * ticks necesita (`arrayBuffer()` + `crypto.subtle.digest()` por CADA archivo comparado, en cadena),
 * así que es el primero en quedarse corto cuando el pool de workers de Vitest está bajo contención.
 * Se lo vio caer una vez en la suite completa (`expected '' to contain 'ya fue adjuntado'`: el
 * mensaje no había llegado) y pasar aislado y en las 4 corridas completas siguientes.
 *
 * Verificado bajando el tope a 1 vuelta: caen 6 de los 15 tests, entre ellos el del duplicado. O sea
 * que media suite dependía de que el presupuesto alcanzara, no de que el trabajo hubiera terminado.
 *
 * Así que ahora espera a que el handler **haya producido un efecto observable**, con el tope solo como
 * red de seguridad. Cada llamador pasa la condición que el propio test asevera después; los que
 * aseveran una AUSENCIA no pasan ninguna (ver el comentario en ese caso).
 *
 * **El margen, medido y no estimado:** barriendo el tope, el peor caso pasa con **3** vueltas (con 2
 * fallan 2 tests, con 3 pasan los 15). El tope quedó en **40**, o sea 13× el trabajo real. Antes eran
 * 4 vueltas para un trabajo de 3: margen de 1.33×, y de ahí la intermitencia. Con el trabajo ya hecho
 * la función vuelve en la primera vuelta, así que el tope alto no encarece nada.
 *
 * Ojo con un detalle que costó un falso rojo: `objAceptado` del host arranca en **`null`**, no en
 * `undefined`. Una condición `!== undefined` es verdadera desde la vuelta cero, sale sin esperar nada
 * y el test falla comparando contra el `Blob` sin reconstruir. La condición correcta es `!== null`.
 */
async function drenarAsincronia(
  in_objFixture: ComponentFixture<unknown>,
  in_fnListo?: () => boolean,
): Promise<void> {
  // El tope existe para que un handler que nunca resuelve falle por la aserción del test (con su
  // mensaje) en vez de colgar la suite hasta el `testTimeout`.
  const INT_TOPE_VUELTAS = 40;
  for (let intVuelta = 0; intVuelta < INT_TOPE_VUELTAS; intVuelta += 1) {
    await new Promise((in_fnResolver) => setTimeout(in_fnResolver, 0));
    await in_objFixture.whenStable();
    if (in_fnListo?.()) return;
  }
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsFileInput],
  providers: [FileRegistryService],
  template: `
    <form [formGroup]="form">
      <zds-file-input
        formControlName="qd_strSoporte"
        name="qd_strSoporte"
        label="Documento de soporte"
        [allowedExtensions]="cllExtensiones()"
        [maxSizeMb]="intMaxMb()"
        (rechazado)="strRechazo = $event"
        (aceptado)="objAceptado = $event"
      />
    </form>
  `,
})
class Host {
  readonly form = new FormGroup({
    qd_strSoporte: new FormControl('', [Validators.required]),
  });

  readonly cllExtensiones = signal<readonly string[]>(['pdf', 'jpg']);
  readonly intMaxMb = signal(5);

  strRechazo = '';
  objAceptado: File | null = null;
}

/** `_onChange` es `protected` en `ZaBaseInput`. Ver la nota equivalente en `zds-radio.spec.ts`. */
type ZaFileInputInterno = ZaFileInput & {
  _onChange(in_objEvento: CustomEvent<Blob | null> | Event): void;
};

function hijo(in_objFixture: ComponentFixture<unknown>): ZaFileInputInterno {
  return in_objFixture.debugElement.query(
    (in_objNodo) => in_objNodo.componentInstance instanceof ZaFileInput,
  ).componentInstance as ZaFileInputInterno;
}

describe('ZdsFileInput', () => {
  let objFixture: ComponentFixture<Host>;
  let objHost: Host;
  let objControl: FormControl<string | null>;
  let objRegistro: FileRegistryService;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(Host);
    objHost = objFixture.componentInstance;
    objControl = objHost.form.controls.qd_strSoporte;
    await objFixture.whenStable();
    // El servicio se resuelve del injector del host, que es donde está declarado (por pantalla, no
    // en root — ver la cabecera de file-registry.service.ts).
    objRegistro = objFixture.debugElement.injector.get(FileRegistryService);
  });

  it('le presta a za-file-input EL MISMO FormControl de la pantalla, no una copia', () => {
    const objDirectiva = objFixture.debugElement
      .query((in_objNodo) => in_objNodo.componentInstance instanceof ZaFileInput)
      .injector.get(NgControl);

    expect(objDirectiva.control).toBe(objControl);
  });

  it('emite id="field-<name>" para scrollToFirstError', () => {
    expect(objFixture.nativeElement.querySelector('#field-qd_strSoporte')).not.toBeNull();
  });

  describe('reconstrucción del File a partir del Blob sin nombre', () => {
    it('registra un File con el nombre real, tomado de _fileName del elemento', async () => {
      // **El test central de este wrapper.** El DS emite un `Blob` que perdió la identidad del
      // archivo; si no se reconstruye, `FormData` lo sube como "blob" y PM4 no puede resolver la
      // extensión. Este test se pone rojo si alguien saca el `new File([...], strNombre, ...)`.
      hijo(objFixture)._onChange(eventoCambio(blob('CONTENIDO-PDF'), elementoFalso('cedula.pdf')));
      await drenarAsincronia(objFixture, () => objRegistro.obtener('qd_strSoporte') !== undefined);

      const objArchivo = objRegistro.obtener('qd_strSoporte');
      expect(objArchivo).toBeInstanceOf(File);
      expect(objArchivo?.name).toBe('cedula.pdf');
      expect(objArchivo?.type).toBe('application/pdf');
      // Y el binario es el mismo que emitió el componente, no un placeholder vacío.
      await expect(objArchivo?.text()).resolves.toBe('CONTENIDO-PDF');
    });

    it('escribe el NOMBRE en el control (no el binario) y avisa por aceptado', async () => {
      hijo(objFixture)._onChange(eventoCambio(blob('X'), elementoFalso('anexo.pdf')));
      await drenarAsincronia(objFixture, () => objHost.objAceptado !== null);

      expect(objControl.value).toBe('anexo.pdf');
      expect(objHost.objAceptado?.name).toBe('anexo.pdf');
    });
  });

  describe('rechazos', () => {
    it('rechaza una extensión no permitida y NO la registra', async () => {
      hijo(objFixture)._onChange(eventoCambio(blob('X'), elementoFalso('virus.exe')));
      await drenarAsincronia(objFixture, () => objHost.strRechazo !== '');

      expect(objRegistro.obtener('qd_strSoporte')).toBeUndefined();
      expect(objControl.value).toBe('');
      // El mensaje **presente** es lo que prueba que el handler corrió y decidió rechazar. Las dos
      // aserciones de arriba se cumplirían solas con el handler muerto (ver la cabecera).
      expect(objHost.strRechazo).toContain('pdf, jpg');
    });

    it('rechaza un archivo más grande que maxSizeMb', async () => {
      objHost.intMaxMb.set(1);
      await objFixture.whenStable();

      // 1 MB + 1 byte: justo por encima del límite, para que el test falle si alguien usa `>=` o
      // se equivoca en el factor 1024.
      const objGrande = new Blob(['a'.repeat(1024 * 1024 + 1)], { type: 'application/pdf' });
      hijo(objFixture)._onChange(eventoCambio(objGrande, elementoFalso('grande.pdf')));
      await drenarAsincronia(objFixture, () => objHost.strRechazo !== '');

      expect(objRegistro.obtener('qd_strSoporte')).toBeUndefined();
      expect(objHost.strRechazo).toContain('1 MB');
    });

    it('acepta un archivo exactamente en el límite de tamaño', async () => {
      objHost.intMaxMb.set(1);
      await objFixture.whenStable();

      const objJusto = new Blob(['a'.repeat(1024 * 1024)], { type: 'application/pdf' });
      hijo(objFixture)._onChange(eventoCambio(objJusto, elementoFalso('justo.pdf')));
      await drenarAsincronia(objFixture, () => objRegistro.obtener('qd_strSoporte') !== undefined);

      expect(objRegistro.obtener('qd_strSoporte')).toBeDefined();
    });

    it('rechaza el duplicado por CONTENIDO, aunque el nombre sea distinto', async () => {
      // Smart Supervision rechaza el binario repetido al guardar el media. Un chequeo por nombre
      // dejaría pasar este caso y el error saldría recién en PM4.
      objRegistro.registrar('qd_strOtroDoc', new File(['MISMO-BINARIO'], 'original.pdf'));

      // Es el caso que más ticks necesita de todo el archivo: hashea el entrante Y el ya registrado,
      // en cadena. Por eso fue el primero en caerse cuando el drenaje era de 4 vueltas fijas.
      hijo(objFixture)._onChange(eventoCambio(blob('MISMO-BINARIO'), elementoFalso('copia.pdf')));
      await drenarAsincronia(objFixture, () => objHost.strRechazo !== '');

      expect(objRegistro.obtener('qd_strSoporte')).toBeUndefined();
      expect(objHost.strRechazo).toContain('ya fue adjuntado');
    });

    it('reemplazar el archivo del propio campo NO se reporta como duplicado', async () => {
      objRegistro.registrar('qd_strSoporte', new File(['MISMO-BINARIO'], 'cedula.pdf'));

      // Acá se espera que el archivo del propio slot quede REEMPLAZADO por el entrante. Es el mismo
      // trabajo de hash que el caso anterior (dos hashes), pero termina en aceptación, no en rechazo.
      hijo(objFixture)._onChange(eventoCambio(blob('MISMO-BINARIO'), elementoFalso('cedula.pdf')));
      await drenarAsincronia(objFixture, () => objHost.objAceptado !== null);

      expect(objRegistro.obtener('qd_strSoporte')?.name).toBe('cedula.pdf');
      expect(objHost.strRechazo).toBe('');
    });

    it('al rechazar llama al reset() del elemento, en vez de tocarle campos privados', async () => {
      // La versión React hacía `target._fileName = null; ...; target.requestUpdate()`. Acá se usa el
      // `reset()` público, que hace lo mismo desde adentro y deja que Lit re-renderice.
      const objElemento = elementoFalso('virus.exe');
      hijo(objFixture)._onChange(eventoCambio(blob('X'), objElemento));
      await drenarAsincronia(objFixture, () => objElemento.reset.mock.calls.length > 0);

      expect(objElemento.reset).toHaveBeenCalledOnce();
    });

    it('NO escribe errores en el control: el required de la pantalla sobrevive al rechazo', async () => {
      // `setErrors` reemplaza en vez de componer, así que si el wrapper lo usara borraría el
      // `required` que declaró la pantalla. El aviso sale por `output` justamente por esto.
      hijo(objFixture)._onChange(eventoCambio(blob('X'), elementoFalso('virus.exe')));
      await drenarAsincronia(objFixture, () => objHost.strRechazo !== '');

      expect(objControl.errors).toEqual({ required: true });
      expect(objHost.strRechazo).not.toBe('');
    });
  });

  describe('limpieza', () => {
    it('un change con detail null saca el archivo del registro y vacía el control', async () => {
      hijo(objFixture)._onChange(eventoCambio(blob('X'), elementoFalso('anexo.pdf')));
      await drenarAsincronia(objFixture, () => objRegistro.obtener('qd_strSoporte') !== undefined);
      expect(objRegistro.obtener('qd_strSoporte')).toBeDefined();

      // Es lo que llega cuando el usuario borra el archivo, y también lo que re-entra acá cuando el
      // propio `reset()` del elemento emite `change` con `detail: null`.
      hijo(objFixture)._onChange(eventoCambio(null, elementoFalso(null)));
      await drenarAsincronia(objFixture, () => objRegistro.obtener('qd_strSoporte') === undefined);

      expect(objRegistro.obtener('qd_strSoporte')).toBeUndefined();
      expect(objControl.value).toBe('');
    });

    it('la limpieza NO emite rechazado (borrar un archivo no es un error)', async () => {
      hijo(objFixture)._onChange(eventoCambio(null, elementoFalso(null)));
      // Sin condición a propósito: este test asevera una AUSENCIA, así que hay que drenar el tope
      // completo. Cortar antes por una condición positiva sería trampa — daría verde justamente
      // cuando el mensaje no llegó todavía, que es el fallo que debería detectar.
      await drenarAsincronia(objFixture);

      expect(objHost.strRechazo).toBe('');
    });
  });

  it('un archivo sin extensión se rechaza en vez de registrarse con extensión vacía', async () => {
    hijo(objFixture)._onChange(eventoCambio(blob('X'), elementoFalso('sinextension')));
    await drenarAsincronia(objFixture, () => objHost.strRechazo !== '');

    expect(objRegistro.obtener('qd_strSoporte')).toBeUndefined();
    // Sin esta aserción el test pasaría igual con el handler muerto: `obtener` devuelve `undefined`
    // tanto si el rechazo funcionó como si nunca se ejecutó nada.
    expect(objHost.strRechazo).toContain('Solo se permiten archivos');
  });

  it('la extensión se compara sin distinguir mayúsculas', async () => {
    // El diálogo nativo devuelve el nombre tal como está en disco, así que `.PDF` es habitual.
    hijo(objFixture)._onChange(eventoCambio(blob('X'), elementoFalso('CEDULA.PDF')));
    await drenarAsincronia(objFixture, () => objRegistro.obtener('qd_strSoporte') !== undefined);

    expect(objRegistro.obtener('qd_strSoporte')?.name).toBe('CEDULA.PDF');
  });
});
