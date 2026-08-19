import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rutasDeControlesInvalidos, scrollToFirstError } from './scroll-to-first-error';

/**
 * Spec **nuevo**, no portado: `frontend/src/core/scrollToFirstError.ts` nunca tuvo test (no existe
 * `scrollToFirstError.test.ts` en React). Se escribe acá porque este es el único archivo de la
 * lógica pura de la Fase 3a que se **reescribió** en vez de copiarse, y un port sin test es
 * exactamente donde un cambio de comportamiento pasa inadvertido.
 *
 * ── Dos trampas de jsdom que hay que neutralizar, o el test miente ─────────────────────────────
 * 1. **`scrollIntoView` no existe en jsdom.** Sin stub, la función tira `TypeError` y el test falla
 *    por el motivo equivocado (parecería un bug de la implementación). Se stubea en el prototipo.
 * 2. **`getBoundingClientRect()` devuelve todo en 0** para cualquier elemento — jsdom no hace
 *    layout. O sea que el `sort()` por posición vertical **no se puede probar con CSS**: hay que
 *    stubear el rect de cada elemento a mano. Sin eso, el test del orden visual pasaría igual con un
 *    sort roto (todos los tops en 0 → cualquier orden "está ordenado"), que es justo el caso donde
 *    un verde no significa nada.
 *
 * El `setTimeout(0)` de la implementación se resuelve con temporizadores falsos, no esperando: así
 * el test es determinista y no depende de que la máquina alcance el tick.
 */

/** Crea un div con el id que la fachada emite y le fija un `top` medible bajo jsdom. */
function crearCampo(in_strRuta: string, in_intTop: number): HTMLElement {
  const objDiv = document.createElement('div');
  objDiv.id = `field-${in_strRuta}`;
  // jsdom no hace layout: sin este stub todos los rects son 0 y el sort no se estaría probando.
  objDiv.getBoundingClientRect = () => ({ top: in_intTop }) as DOMRect;
  document.body.appendChild(objDiv);
  return objDiv;
}

let fnScrollStub: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  fnScrollStub = vi.fn();
  // No existe en jsdom; sin esto la implementación tira TypeError.
  Element.prototype.scrollIntoView = fnScrollStub as unknown as Element['scrollIntoView'];
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('rutasDeControlesInvalidos', () => {
  it('devuelve la ruta de los controles inválidos, y solo de ellos', () => {
    const objForm = new FormGroup({
      qd_strChannel: new FormControl('', Validators.required),
      qd_strCity: new FormControl('05001'), // válido: no debe aparecer
    });
    expect(rutasDeControlesInvalidos(objForm)).toEqual(['qd_strChannel']);
  });

  it('devuelve un array vacío cuando el form entero es válido', () => {
    const objForm = new FormGroup({ qd_strChannel: new FormControl('13', Validators.required) });
    expect(rutasDeControlesInvalidos(objForm)).toEqual([]);
  });

  it('arma la ruta con puntos para grupos anidados', () => {
    const objForm = new FormGroup({
      objCliente: new FormGroup({
        qd_strIdType: new FormControl('', Validators.required),
        qd_strName: new FormControl('Ana'),
      }),
    });
    expect(rutasDeControlesInvalidos(objForm)).toEqual(['objCliente.qd_strIdType']);
  });

  it('usa el índice numérico para FormArray, igual que las rutas de array de RHF', () => {
    // El formato importa: es el mismo id (`field-productos.1.qd_strCode`) que ya usaba la versión
    // React, así que un markup que funcionaba allá sigue funcionando acá.
    const objForm = new FormGroup({
      productos: new FormArray([
        new FormGroup({ qd_strCode: new FormControl('001', Validators.required) }),
        new FormGroup({ qd_strCode: new FormControl('', Validators.required) }),
      ]),
    });
    expect(rutasDeControlesInvalidos(objForm)).toEqual(['productos.1.qd_strCode']);
  });

  it('poda los subgrupos válidos en vez de recorrerlos', () => {
    // Esta es la diferencia real con el original: en RHF `errors` YA venía filtrado; acá hay que
    // podar a mano. Sin la poda, este test devolvería también los 2 campos del grupo válido.
    const objForm = new FormGroup({
      objValido: new FormGroup({
        qd_strA: new FormControl('a', Validators.required),
        qd_strB: new FormControl('b', Validators.required),
      }),
      objRoto: new FormGroup({ qd_strC: new FormControl('', Validators.required) }),
    });
    expect(rutasDeControlesInvalidos(objForm)).toEqual(['objRoto.qd_strC']);
  });

  it('devuelve TODOS los inválidos, no solo el primero', () => {
    // La selección del "primero" es responsabilidad del sort por posición, no de esta función:
    // si acá cortara en el primero, el orden visual quedaría a merced del orden de claves.
    const objForm = new FormGroup({
      qd_strA: new FormControl('', Validators.required),
      qd_strB: new FormControl('ok', Validators.required),
      qd_strC: new FormControl('', Validators.required),
    });
    expect(rutasDeControlesInvalidos(objForm)).toEqual(['qd_strA', 'qd_strC']);
  });
});

describe('scrollToFirstError', () => {
  it('scrollea y enfoca el campo más ARRIBA en pantalla, no el primero del objeto', () => {
    // El caso que justifica el sort: `qd_strA` está primero en el FormGroup pero abajo en pantalla.
    const objForm = new FormGroup({
      qd_strA: new FormControl('', Validators.required),
      qd_strB: new FormControl('', Validators.required),
    });
    crearCampo('qd_strA', 500);
    const objArriba = crearCampo('qd_strB', 120);
    const fnFocus = vi.spyOn(objArriba, 'focus');

    scrollToFirstError(objForm);
    vi.runAllTimers();

    expect(fnScrollStub).toHaveBeenCalledTimes(1);
    expect(fnScrollStub.mock.instances[0]).toBe(objArriba);
    expect(fnScrollStub).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(fnFocus).toHaveBeenCalledTimes(1);
  });

  it('no hace nada si el form es válido', () => {
    const objForm = new FormGroup({ qd_strA: new FormControl('ok', Validators.required) });
    crearCampo('qd_strA', 100);
    scrollToFirstError(objForm);
    vi.runAllTimers();
    expect(fnScrollStub).not.toHaveBeenCalled();
  });

  it('ignora en silencio los campos inválidos que no están en el DOM', () => {
    // Caso real: una sección condicional o una pestaña inactiva. `qd_strOculto` es inválido pero no
    // tiene elemento, así que el destino debe ser el que sí está — no un throw ni un no-op.
    const objForm = new FormGroup({
      qd_strOculto: new FormControl('', Validators.required),
      qd_strVisible: new FormControl('', Validators.required),
    });
    const objVisible = crearCampo('qd_strVisible', 300);

    scrollToFirstError(objForm);
    vi.runAllTimers();

    expect(fnScrollStub).toHaveBeenCalledTimes(1);
    expect(fnScrollStub.mock.instances[0]).toBe(objVisible);
  });

  it('no explota cuando NINGÚN campo inválido está en el DOM', () => {
    const objForm = new FormGroup({ qd_strOculto: new FormControl('', Validators.required) });
    scrollToFirstError(objForm);
    expect(() => vi.runAllTimers()).not.toThrow();
    expect(fnScrollStub).not.toHaveBeenCalled();
  });

  it('difiere el trabajo a un tick posterior (no scrollea en la misma vuelta)', () => {
    // El setTimeout(0) es lo que le da a Angular/Lit la vuelta para pintar el estado inválido antes
    // de medir posiciones. Si alguien lo saca, este test se pone rojo.
    const objForm = new FormGroup({ qd_strA: new FormControl('', Validators.required) });
    crearCampo('qd_strA', 100);

    scrollToFirstError(objForm);
    expect(fnScrollStub).not.toHaveBeenCalled(); // todavía no: el tick no corrió

    vi.runAllTimers();
    expect(fnScrollStub).toHaveBeenCalledTimes(1);
  });
});
