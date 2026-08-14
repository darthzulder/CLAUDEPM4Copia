import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { FileRegistryService } from './file-registry.service';

/**
 * Specs de `FileRegistryService`, el port del `useRef(new Map<string, File>())` que la app React
 * declara en el componente raíz de cada pantalla con adjuntos.
 *
 * ── Qué paridad se está cerrando, medida ────────────────────────────────────────────────────────
 * En React el registro **no era un módulo**: era un `useRef` inline en 4 pantallas, así que no había
 * ni podía haber un archivo de tests propio. Su comportamiento se ejercitaba de refilón desde
 * `DocSupportUploader.test.tsx` (que le pasa un `useRef` armado a mano) y desde los specs de las
 * pantallas. Acá pasa lo mismo un nivel más arriba: `zds-file-input.spec.ts` **inyecta el servicio
 * real** —no un mock— y asevera sobre él a través del wrapper, así que el servicio ya venía cubierto
 * de forma indirecta desde la Fase 2. Lo que faltaba, y es lo que agrega este archivo, es la unidad:
 * el contrato del registro sin un componente en el medio.
 *
 * ── Por qué no es un spec de cuatro métodos triviales ───────────────────────────────────────────
 * Un `Map` envuelto no merecería tests propios; lo que se testea acá son las **tres decisiones** que
 * el servicio toma y que un `Map` pelado no impone:
 *
 * 1. **La instancia es por pantalla, no un singleton.** Es el motivo por el que no lleva
 *    `providedIn: 'root'`, y el bug que previene es concreto: los adjuntos de una pantalla llegando
 *    a la siguiente dentro del mismo iframe de PM4. Se asevera con dos `TestBed` distintos, que es
 *    la única forma de que el test se ponga rojo si alguien "arregla" el servicio agregándole
 *    `providedIn: 'root'`.
 * 2. **`mapArchivos` devuelve el mapa REAL, no una copia defensiva.** También es deliberado (ver el
 *    encabezado del servicio) y también es contrato: `findDuplicateAttachment` y el bucle de subida
 *    lo recorren tal cual. Un test de identidad lo fija, porque "devolver una copia" es exactamente
 *    el tipo de endurecimiento que alguien agregaría de buena fe y que rompería a los consumidores
 *    en silencio.
 * 3. **Reemplazar un `docKey` sobrescribe, no acumula.** Es lo que hace que volver a elegir archivo
 *    en el mismo campo suba el nuevo y no el viejo.
 *
 * ── El escenario de la reindexación ─────────────────────────────────────────────────────────────
 * El último describe reproduce el bucle de `DocSupportUploader` (borrar una fila del medio de una
 * lista de adjuntos desplaza todos los posteriores un lugar hacia arriba). Es el consumidor que
 * usa `obtener`/`registrar`/`quitar` **en secuencia** sobre el mismo mapa, y el que explica por qué
 * `obtener` existe: sin él, el desplazamiento no puede leer el binario que va a re-registrar.
 */

/** Un `File` real (jsdom lo soporta), porque el servicio guarda instancias, no descriptores. */
function archivo(in_strNombre: string, in_strContenido = 'x'): File {
  return new File([in_strContenido], in_strNombre, { type: 'application/pdf' });
}

let objSvc: FileRegistryService;

beforeEach(() => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [FileRegistryService] });
  objSvc = TestBed.inject(FileRegistryService);
});

describe('FileRegistryService · el registro básico', () => {
  it('arranca vacío', () => {
    expect(objSvc.intCantidad).toBe(0);
    expect(objSvc.mapArchivos.size).toBe(0);
  });

  it('registra un binario bajo su docKey', () => {
    const objArchivo = archivo('cedula.pdf');
    objSvc.registrar('qd_docCedula', objArchivo);

    // La clave es el `docKey` porque es lo que viaja como `?data_name=` al subir: perder esa
    // correspondencia significa subir un archivo que el proceso PM4 no puede encontrar.
    expect(objSvc.obtener('qd_docCedula')).toBe(objArchivo);
    expect(objSvc.intCantidad).toBe(1);
  });

  it('devuelve undefined para un docKey que no registró nada', () => {
    expect(objSvc.obtener('qd_docInexistente')).toBeUndefined();
  });

  it('guarda la MISMA instancia de File, no una copia', () => {
    // El caché de hash de `file-hash.ts` es un WeakMap sobre las instancias de File, así que una
    // copia rompería la detección de duplicados sin dar error: cada lectura se re-hashearía.
    const objArchivo = archivo('contrato.pdf');
    objSvc.registrar('qd_docContrato', objArchivo);
    expect(objSvc.obtener('qd_docContrato')).toBe(objArchivo);
  });

  it('quita el binario de un docKey', () => {
    objSvc.registrar('qd_docCedula', archivo('cedula.pdf'));
    objSvc.quitar('qd_docCedula');

    expect(objSvc.obtener('qd_docCedula')).toBeUndefined();
    expect(objSvc.intCantidad).toBe(0);
  });

  it('quitar un docKey que no existe no lanza', () => {
    // Corre cuando el usuario abre el selector de archivo y cancela: el handler limpia igual.
    expect(() => objSvc.quitar('qd_docNunca')).not.toThrow();
    expect(objSvc.intCantidad).toBe(0);
  });

  it('limpiar vacía todo el registro', () => {
    objSvc.registrar('qd_docA', archivo('a.pdf'));
    objSvc.registrar('qd_docB', archivo('b.pdf'));
    expect(objSvc.intCantidad).toBe(2);

    objSvc.limpiar();

    expect(objSvc.intCantidad).toBe(0);
    expect(objSvc.obtener('qd_docA')).toBeUndefined();
  });

  it('limpiar sobre un registro vacío no lanza', () => {
    expect(() => objSvc.limpiar()).not.toThrow();
  });

  it('intCantidad refleja el tamaño en cada operación', () => {
    // Es lo que las pantallas consultan antes de subir (`if (fileRegistry.current.size > 0)`): un
    // conteo desfasado dispararía un POST de subida sin nada que subir.
    expect(objSvc.intCantidad).toBe(0);
    objSvc.registrar('qd_docA', archivo('a.pdf'));
    expect(objSvc.intCantidad).toBe(1);
    objSvc.registrar('qd_docB', archivo('b.pdf'));
    expect(objSvc.intCantidad).toBe(2);
    objSvc.quitar('qd_docA');
    expect(objSvc.intCantidad).toBe(1);
    objSvc.limpiar();
    expect(objSvc.intCantidad).toBe(0);
  });
});

describe('FileRegistryService · reemplazar un docKey sobrescribe', () => {
  it('registrar dos veces el mismo docKey deja el último archivo', () => {
    // Es el caso de "elegí otro archivo en el mismo campo". Si acumulara, se subiría el primero.
    const objViejo = archivo('viejo.pdf');
    const objNuevo = archivo('nuevo.pdf');

    objSvc.registrar('qd_docCedula', objViejo);
    objSvc.registrar('qd_docCedula', objNuevo);

    expect(objSvc.obtener('qd_docCedula')).toBe(objNuevo);
    expect(objSvc.intCantidad).toBe(1); // no 2: es reemplazo, no alta
  });
});

describe('FileRegistryService · mapArchivos expone el mapa real', () => {
  it('devuelve la misma referencia en cada lectura', () => {
    // Contrato deliberado, documentado en el encabezado del servicio. Va con test porque devolver
    // una copia defensiva es un endurecimiento que alguien agregaría de buena fe y que rompería a
    // `findDuplicateAttachment` y al bucle de subida en silencio.
    expect(objSvc.mapArchivos).toBe(objSvc.mapArchivos);
  });

  it('lo que se registra se ve al recorrer mapArchivos', () => {
    // Así lo consume el submit: `for (const [docKey, file] of mapArchivos.entries())`.
    const objA = archivo('a.pdf');
    const objB = archivo('b.pdf');
    objSvc.registrar('qd_docA', objA);
    objSvc.registrar('qd_docB', objB);

    expect([...objSvc.mapArchivos.entries()]).toEqual([
      ['qd_docA', objA],
      ['qd_docB', objB],
    ]);
  });

  it('una escritura sobre mapArchivos impacta el registro', () => {
    // Consecuencia directa de no copiar. No es un uso que se recomiende, pero fija que el mapa
    // devuelto ES el estado y no una vista.
    objSvc.mapArchivos.set('qd_docDirecto', archivo('directo.pdf'));
    expect(objSvc.intCantidad).toBe(1);
    expect(objSvc.obtener('qd_docDirecto')).toBeDefined();
  });
});

describe('FileRegistryService · una instancia por pantalla, no un singleton', () => {
  it('NO es inyectable sin un provider explícito', () => {
    // ES EL CASO CENTRAL de por qué el servicio no lleva `providedIn: 'root'`, y la única forma de
    // aseverarlo. Con un singleton de root, los adjuntos de una pantalla seguirían vivos en la
    // siguiente dentro del mismo iframe de PM4 — un bug que el `useRef` de React no podía tener
    // porque moría con el componente.
    //
    // ⚠ El test obvio ("dos TestBed dan registros independientes") **no sirve**: verificado con
    // mutación, pasa igual con `providedIn: 'root'`, porque un `providers: [...]` explícito gana
    // sobre el de root y cada TestBed da una instancia nueva de todos modos. Aseveraba el
    // aislamiento del TestBed, no el del servicio. Lo que SÍ distingue los dos casos es inyectar
    // **sin** declarar el provider: si el servicio fuera de root, resolvería; al no serlo, tira
    // NullInjectorError. Y es además el escenario real que se quiere que falle ruidosamente: una
    // pantalla nueva que se olvida de ponerlo en sus `providers`.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [] });
    expect(() => TestBed.inject(FileRegistryService)).toThrow(/NullInjector|No provider/);
  });

  it('dos inyectores distintos dan registros independientes', () => {
    // Complemento del de arriba, no sustituto: fija que el estado no se filtra entre pantallas.
    objSvc.registrar('qd_docCedula', archivo('cedula.pdf'));
    expect(objSvc.intCantidad).toBe(1);

    // Otro inyector = otra pantalla.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [FileRegistryService] });
    const objOtro = TestBed.inject(FileRegistryService);

    expect(objOtro.intCantidad).toBe(0);
    expect(objOtro.obtener('qd_docCedula')).toBeUndefined();
  });

  it('el mismo inyector devuelve siempre la misma instancia', () => {
    // La otra mitad del contrato: dentro de UNA pantalla, el campo y el submit tienen que ver el
    // mismo registro. Si cada `inject()` diera una instancia nueva, el submit no encontraría nada.
    expect(TestBed.inject(FileRegistryService)).toBe(objSvc);
  });
});

describe('FileRegistryService · el desplazamiento de DocSupportUploader', () => {
  it('reindexa los adjuntos al borrar una fila del medio', () => {
    // Reproduce el bucle de `DocSupportUploader`: al borrar el slot 0 de 3, los posteriores se
    // desplazan un lugar hacia arriba y el último queda vacío. Es el consumidor que usa
    // `obtener`/`registrar`/`quitar` en secuencia sobre el mismo mapa, y el que explica por qué
    // `obtener` existe: sin él el desplazamiento no puede leer el binario que va a re-registrar.
    const objB = archivo('b.pdf');
    const objC = archivo('c.pdf');
    objSvc.registrar('qd_docSoporte_1', archivo('a.pdf'));
    objSvc.registrar('qd_docSoporte_2', objB);
    objSvc.registrar('qd_docSoporte_3', objC);

    const lstClaves = ['qd_docSoporte_1', 'qd_docSoporte_2', 'qd_docSoporte_3'];
    for (let intI = 0; intI < lstClaves.length - 1; intI++) {
      const objSiguiente = objSvc.obtener(lstClaves[intI + 1]!);
      if (objSiguiente) objSvc.registrar(lstClaves[intI]!, objSiguiente);
      else objSvc.quitar(lstClaves[intI]!);
    }
    objSvc.quitar(lstClaves[lstClaves.length - 1]!);

    expect(objSvc.obtener('qd_docSoporte_1')).toBe(objB);
    expect(objSvc.obtener('qd_docSoporte_2')).toBe(objC);
    expect(objSvc.obtener('qd_docSoporte_3')).toBeUndefined();
    expect(objSvc.intCantidad).toBe(2);
  });

  it('deja el registro vacío al borrar la única fila', () => {
    objSvc.registrar('qd_docSoporte_1', archivo('a.pdf'));
    objSvc.quitar('qd_docSoporte_1');
    expect(objSvc.intCantidad).toBe(0);
  });
});
