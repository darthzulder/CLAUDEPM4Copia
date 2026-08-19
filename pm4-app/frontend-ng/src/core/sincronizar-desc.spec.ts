import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CollectionOption } from './collection.types';
import { sincronizarDesc } from './sincronizar-desc';

/**
 * Specs de `sincronizarDesc`, el port de `useSyncDesc()` de React.
 *
 * ── Sin baseline de tests, como `CollectionService` ─────────────────────────────────────────────
 * `useSyncDesc` **no tenía ni un caso** en `core/useCollection.test.ts` (los 26 de ese archivo cubren
 * solo helpers puros, ya portados 1:1 en `collection-helpers.spec.ts`). Es cobertura nueva sobre
 * comportamiento portado, y vale registrarlo: la convención `_desc` es lo que hace que los reportes del
 * BPM muestren "Internet" en vez de "13", así que un desfase acá se ve en producción y no en la app.
 *
 * ── Por qué cada caso corre dentro de `runInInjectionContext` ───────────────────────────────────
 * La función hace `inject(DestroyRef)` para poder cerrar la suscripción con `takeUntilDestroyed`. Eso
 * la ata a un contexto de inyección — en la app es el `constructor` de la pantalla. En el spec se
 * reproduce con `TestBed.runInInjectionContext`, que es además la prueba de que el contrato de "llamame
 * desde el constructor" es real: sin él, `inject()` lanza.
 */

const LST_CANALES: CollectionOption[] = [
  { value: '13', label: 'Internet' },
  { value: '14', label: 'Sucursal' },
];

/** Corre `sincronizarDesc` en un contexto de inyección, como haría el constructor de una pantalla. */
function sincronizar(
  in_objForm: FormGroup,
  in_strCampo: string,
  in_fnOpciones: () => readonly CollectionOption[],
  in_objOpts?: { suffix?: string },
): void {
  TestBed.runInInjectionContext(() => {
    sincronizarDesc(in_objForm, in_strCampo, in_fnOpciones, in_objOpts);
  });
}

function armarForm(in_strValorInicial = ''): FormGroup {
  return new FormGroup({ qd_strChannel: new FormControl(in_strValorInicial) });
}

beforeEach(() => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
});

describe('sincronizarDesc · la escritura del campo compañero', () => {
  it('escribe la descripción del código cuando el campo cambia', () => {
    const objForm = armarForm();
    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);

    objForm.get('qd_strChannel')!.setValue('13');

    expect(objForm.get('qd_strChannel_desc')!.value).toBe('Internet');
  });

  it('actualiza la descripción en cada cambio, no solo el primero', () => {
    const objForm = armarForm();
    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);

    objForm.get('qd_strChannel')!.setValue('13');
    objForm.get('qd_strChannel')!.setValue('14');

    expect(objForm.get('qd_strChannel_desc')!.value).toBe('Sucursal');
  });

  it('crea el control compañero si el FormGroup no lo declaraba', () => {
    // El `_desc` no es un campo de UI, así que ninguna pantalla lo declara. En React `setValue` sobre
    // una clave no tipada alcanzaba; Reactive Forms devuelve null en el `get()` de un control
    // inexistente, así que sin crearlo la escritura se perdería EN SILENCIO.
    const objForm = armarForm();
    expect(objForm.get('qd_strChannel_desc')).toBeNull();

    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);
    objForm.get('qd_strChannel')!.setValue('13');

    expect(objForm.get('qd_strChannel_desc')).not.toBeNull();
    expect(objForm.get('qd_strChannel_desc')!.value).toBe('Internet');
  });

  it('reusa el control compañero si ya estaba declarado', () => {
    const objForm = new FormGroup({
      qd_strChannel: new FormControl(''),
      qd_strChannel_desc: new FormControl('valor viejo'),
    });
    const objControlDesc = objForm.get('qd_strChannel_desc');

    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);
    objForm.get('qd_strChannel')!.setValue('13');

    // Misma instancia: no se reemplaza el control, se le escribe. Reemplazarlo rompería cualquier
    // binding que la pantalla tuviera contra él.
    expect(objForm.get('qd_strChannel_desc')).toBe(objControlDesc);
    expect(objControlDesc!.value).toBe('Internet');
  });

  it('respeta un sufijo personalizado', () => {
    const objForm = armarForm();
    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES, { suffix: '_label' });

    objForm.get('qd_strChannel')!.setValue('13');

    expect(objForm.get('qd_strChannel_label')!.value).toBe('Internet');
    expect(objForm.get('qd_strChannel_desc')).toBeNull();
  });

  it('un campo que no existe en el form no lanza', () => {
    const objForm = armarForm();
    expect(() => sincronizar(objForm, 'qd_noExiste', () => LST_CANALES)).not.toThrow();
    expect(objForm.get('qd_noExiste_desc')).toBeNull();
  });
});

describe('sincronizarDesc · el vacío es "" y no "—"', () => {
  it('con código vacío escribe cadena vacía, NO el guión de descOf', () => {
    // ES EL CASO CENTRAL. `descOf()` devuelve '—' porque PINTA en pantalla; acá el valor VIAJA a PM4,
    // y un guión literal terminaría guardado en la base del BPM apareciendo en reportes como si fuera
    // una descripción real. La asimetría entre las dos funciones es deliberada.
    const objForm = armarForm('13');
    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);
    expect(objForm.get('qd_strChannel_desc')!.value).toBe('Internet');

    objForm.get('qd_strChannel')!.setValue('');

    expect(objForm.get('qd_strChannel_desc')!.value).toBe('');
  });

  it('con null escribe cadena vacía', () => {
    const objForm = armarForm('13');
    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);

    objForm.get('qd_strChannel')!.setValue(null);

    expect(objForm.get('qd_strChannel_desc')!.value).toBe('');
  });

  it('un código sin match cae al propio código (contrato de descOf)', () => {
    const objForm = armarForm();
    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);

    objForm.get('qd_strChannel')!.setValue('999');

    // Preferible a vacío: si el catálogo cambió, el reporte muestra el código y no una celda en blanco.
    expect(objForm.get('qd_strChannel_desc')!.value).toBe('999');
  });

  it('convierte a texto un código numérico antes de resolverlo', () => {
    const objForm = armarForm();
    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);

    objForm.get('qd_strChannel')!.setValue(13);

    // Los value de las opciones son strings; sin el String() un 13 numérico no matchearía '13'.
    expect(objForm.get('qd_strChannel_desc')!.value).toBe('Internet');
  });
});

describe('sincronizarDesc · el valor inicial', () => {
  it('escribe el _desc del valor ya precargado, sin esperar un cambio', () => {
    // El `useEffect` de React corría al montar, así que la precarga desde `task.data` ya salía con su
    // `_desc`. `valueChanges` NO emite el valor actual al suscribirse: sin el `startWith`, un caso
    // precargado viajaría de vuelta a PM4 con el código nuevo y el `_desc` viejo.
    const objForm = armarForm('14');

    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);

    expect(objForm.get('qd_strChannel_desc')!.value).toBe('Sucursal');
  });

  it('con el form vacío al arrancar deja el _desc en cadena vacía', () => {
    const objForm = armarForm('');
    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);
    expect(objForm.get('qd_strChannel_desc')!.value).toBe('');
  });
});

describe('sincronizarDesc · las opciones se leen tarde, no se capturan', () => {
  it('resuelve contra las opciones del momento de la emisión, no las del registro', () => {
    // Es el motivo de que el parámetro sea una FUNCIÓN. Cuando la pantalla llama a `sincronizarDesc`
    // en su constructor, el `CollectionService` todavía no cargó: las opciones son []. Con un array
    // capturado, el `_desc` quedaría para siempre en el código crudo.
    let lstOpciones: CollectionOption[] = [];
    const objForm = armarForm();
    sincronizar(objForm, 'qd_strChannel', () => lstOpciones);

    objForm.get('qd_strChannel')!.setValue('13');
    expect(objForm.get('qd_strChannel_desc')!.value).toBe('13'); // sin catálogo todavía

    lstOpciones = LST_CANALES; // llega la colección
    objForm.get('qd_strChannel')!.setValue('13'); // mismo código, ahora sí resuelve
    // Ojo: `setValue` con el mismo valor SÍ emite en Reactive Forms, así que esto realmente re-resuelve.
    expect(objForm.get('qd_strChannel_desc')!.value).toBe('Internet');
  });
});

describe('sincronizarDesc · la escritura no emite eventos', () => {
  it('escribir el _desc no dispara el valueChanges del form', () => {
    // `emitEvent: false` es obligatorio, no una optimización: el `_desc` se escribe DESDE un
    // valueChanges, y SCR-000 tiene ~10 sincronizaciones sobre el mismo form. Sin esto, cada escritura
    // haría reaccionar a las otras nueve, y un `_desc` que por configuración apuntara a un campo
    // observado entraría en ciclo infinito.
    const objForm = armarForm();
    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);

    const fnEspia = vi.fn();
    objForm.valueChanges.subscribe(fnEspia);

    objForm.get('qd_strChannel')!.setValue('13');

    // Exactamente una emisión: la del campo que el usuario cambió. Si la escritura del `_desc`
    // emitiera, serían dos.
    expect(fnEspia).toHaveBeenCalledTimes(1);
    expect(objForm.get('qd_strChannel_desc')!.value).toBe('Internet');
  });

  it('el _desc viaja en form.value aunque se haya escrito sin emitir', () => {
    // Es la mitad que hace útil a la convención: los payloads a PM4 se arman con `{...form.value}`, así
    // que el `_desc` viaja solo, sin tocar el submit de ninguna pantalla.
    const objForm = armarForm('13');
    sincronizar(objForm, 'qd_strChannel', () => LST_CANALES);

    expect(objForm.value).toEqual({ qd_strChannel: '13', qd_strChannel_desc: 'Internet' });
  });
});
