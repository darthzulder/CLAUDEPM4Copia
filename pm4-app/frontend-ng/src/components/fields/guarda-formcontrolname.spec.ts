import { Component, ErrorHandler } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZdsInput } from './zds-input';

/**
 * Guarda cross-pantalla de `campo-base.ts`: **un `zds-*` dentro de un form reactivo sin
 * `formControlName` es un campo muerto**, y esto es lo que lo grita.
 *
 * ── Por qué esta guarda existe en la fachada y no en el spec de cada pantalla ────────────────
 * La SCR-008 se portó con `[formGroup]` y `name="qd_*"` en sus 9 campos y **sin `formControlName`
 * en ninguno**. Los 9 quedaron muertos en las dos direcciones y los 10 casos de su spec estaban
 * **verdes**, porque todos empujaban el `FormGroup` a mano y ninguno preguntaba si el valor llegaba
 * al componente renderizado.
 *
 * La lección: **un spec por pantalla asevera lo que la pantalla declara; no puede aseverar lo que la
 * pantalla olvidó declarar.** Sumar un caso más por pantalla no cierra eso — lo escribe la misma
 * persona que acaba de olvidar el binding. La condición sí es universal (todo `zds-*` dentro de un
 * form necesita `formControlName`), así que se decide en la fachada, sin saber nada de la pantalla.
 *
 * ── ⚠ Por qué se asevera sobre el `ErrorHandler` y NO esperando que el caso se ponga rojo ────
 * Esto se midió, y contradice la intuición con la que se escribió la guarda. El `throw` vive dentro
 * de un `afterNextRender`, y Angular **enruta esa excepción al `ErrorHandler` global**: Vitest la
 * imprime (`ERROR Error: [fachada ZDS] …`) pero **no** falla el caso. O sea que la guarda por sí
 * sola pone ruido en la consola del navegador, no rojo en la suite.
 *
 * Comprobado con la mutación de la SCR-008 (quitarle el `formControlName` a `qd_strClientResponse`):
 * el mensaje salía impreso y los únicos 2 casos rojos eran los dos guardas-puente preexistentes de
 * esa pantalla. Sin este archivo, entonces, la guarda **no tiene ningún test que la cubra**.
 *
 * Es el mismo canal —y la misma razón— que ya documenta el caso "un modelChange sin
 * `formControlName` no tira" de [zds-input.spec.ts](./zds-input.spec.ts): Angular se come lo que
 * tira un hook, y el `ErrorHandler` es el único punto observable.
 */
describe('guarda de formControlName (campo-base)', () => {
  /** El wrapper adentro de un `[formGroup]` **sin** `formControlName`: el defecto de la SCR-008. */
  @Component({
    standalone: true,
    imports: [ZdsInput, ReactiveFormsModule],
    template: `
      <form [formGroup]="form">
        <zds-input name="qd_strSfcCode" label="ID Caso" />
      </form>
    `,
  })
  class HostSinFormControlName {
    readonly form = new FormGroup({ qd_strSfcCode: new FormControl('') });
  }

  /** El mismo host, bien cableado. Es el control negativo del caso de arriba. */
  @Component({
    standalone: true,
    imports: [ZdsInput, ReactiveFormsModule],
    template: `
      <form [formGroup]="form">
        <zds-input formControlName="qd_strSfcCode" name="qd_strSfcCode" label="ID Caso" />
      </form>
    `,
  })
  class HostBienCableado {
    readonly form = new FormGroup({ qd_strSfcCode: new FormControl('') });
  }

  /**
   * Uso **suelto**: sin ningún form alrededor. Es legítimo y está aseverado en varios specs de la
   * fachada (los usos de solo lectura caen a `grupoPropio()`), así que la guarda NO debe disparar.
   */
  @Component({
    standalone: true,
    imports: [ZdsInput],
    template: `<zds-input name="qd_strSuelto" label="Suelto" />`,
  })
  class HostSuelto {}

  let cllErrores: string[];

  beforeEach(() => {
    cllErrores = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ErrorHandler,
          useValue: { handleError: (in_objError: Error) => cllErrores.push(String(in_objError)) },
        },
      ],
    });
  });

  /** El `afterNextRender` corre después del primer render; `whenStable` es lo que lo drena. */
  async function montar(in_objTipo: unknown): Promise<ComponentFixture<unknown>> {
    const objFixture = TestBed.createComponent(in_objTipo as never);
    await objFixture.whenStable();
    objFixture.detectChanges();

    return objFixture;
  }

  it('⚠ un zds-* dentro de un [formGroup] SIN formControlName dispara la guarda, nombrando el campo', async () => {
    await montar(HostSinFormControlName);

    // Un solo error, y tiene que nombrar el campo: un mensaje genérico obligaría a buscar a mano
    // cuál de los 9 campos de una pantalla es el roto, que es justo el trabajo que la guarda ahorra.
    expect(cllErrores).toHaveLength(1);
    expect(cllErrores[0]).toContain('[fachada ZDS]');
    expect(cllErrores[0]).toContain('qd_strSfcCode');
    expect(cllErrores[0]).toContain('formControlName');
  });

  it('con formControlName la guarda NO dispara', async () => {
    await montar(HostBienCableado);

    // Sin este caso, una guarda que tira SIEMPRE pasaría el caso de arriba y se vería idéntica a una
    // que funciona — el mismo falso verde de dos direcciones que ya costó el gate 4.
    expect(cllErrores).toEqual([]);
  });

  it('el uso suelto (sin form ancestro) NO dispara la guarda', async () => {
    await montar(HostSuelto);

    // La condición "hay un ControlContainer ancestro" es lo que separa el defecto del uso legítimo.
    // Sin ella la guarda rompería media suite de la fachada, que monta wrappers sueltos a propósito.
    expect(cllErrores).toEqual([]);
  });

  it('⚠ el <form> renderizado NO tiene atributo formGroup: por eso la detección va por DI', async () => {
    // Este caso no cubre una rama de la guarda; **fija el hecho del DOM** por el que la primera
    // versión no servía, y se pone rojo si alguien vuelve a la detección por atributo.
    //
    // La v1 preguntaba `closest('[formGroup],[formGroupName],form[ngForm]')` y **falló abierto**: con
    // la mutación de la SCR-008 aplicada, el callback corría, el `ngControl` era `null`, y el
    // `closest()` devolvía `false` — así que perdonaba justo el defecto para el que se escribió.
    // El motivo es este: `[formGroup]="form"` es un binding de **propiedad**, y Angular no lo deja
    // en el DOM.
    const objFixture = await montar(HostSinFormControlName);
    const objForm = (objFixture.nativeElement as HTMLElement).querySelector('form')!;

    expect(objForm).not.toBeNull();
    expect(objForm.hasAttribute('formGroup')).toBe(false);
    expect(objForm.getAttributeNames()).not.toContain('formgroup');

    // Y la contracara: por DI el contenedor sí está. Es el mismo canal que usa `formControlName`
    // para encontrar su group, así que no depende de que nada quede escrito en el DOM.
    const objWrapper = objFixture.debugElement.query(
      (in_objNodo) => in_objNodo.componentInstance instanceof ZdsInput,
    );
    expect(objWrapper.injector.get(ControlContainer, null)).not.toBeNull();
  });
});
