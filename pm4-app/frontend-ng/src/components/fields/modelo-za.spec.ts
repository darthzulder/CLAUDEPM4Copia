import { Component, ErrorHandler, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { ModeloZa } from './modelo-za';
import { ZrPagination, ZrSidebar, ZrTabs } from './zds-reexports';

/**
 * Guarda de [`ModeloZa`](./modelo-za.ts), la directiva que envuelve el defecto del `ngModel` de
 * `ZaModelElement`.
 *
 * El caso que da sentido a todo el archivo es el primero: **montar bajo `ReactiveFormsModule` sin
 * `NG0201`**. Es la falla que la directiva existe para hacer imposible, y también la que un smoke test
 * ingenuo no detecta, porque el `NG0201` no lo lanza el `createComponent` sino la creación del nodo, y
 * termina en el `ErrorHandler` global si nadie lo intercepta.
 */

/** Tabs, con el two-way completo. `ZTabs_Tab` pide `name` (no `title`/`key`, que es la forma de `TabsZ`). */
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZrTabs, ModeloZa],
  template: `<za-tabs [(modeloZa)]="sigTab" [tabs]="cllTabs"></za-tabs>`,
})
class AnfitrionTabs {
  readonly cllTabs = [{ name: 'uno' }, { name: 'dos' }];
  readonly sigTab = signal<unknown>(0);
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZrPagination, ModeloZa],
  template: `<za-pagination [(modeloZa)]="sigPagina" [pages]="5"></za-pagination>`,
})
class AnfitrionPaginacion {
  readonly sigPagina = signal<unknown>(1);
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZrSidebar, ModeloZa],
  template: `<za-sidebar [(modeloZa)]="sigAbierto"></za-sidebar>`,
})
class AnfitrionSidebar {
  readonly sigAbierto = signal<unknown>(false);
}

/** Un elemento que NO es `ZaModelElement`: tiene que fallar nombrando el problema. */
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ModeloZa],
  template: `<div modeloZa></div>`,
})
class AnfitrionInvalido {}

describe('ModeloZa · two-way sobre los ZaModelElement del DS', () => {
  /**
   * Recolector de errores del `ErrorHandler` global.
   *
   * Hace falta porque **un `throw` durante el render no pone rojo el spec por sí solo**: Angular lo
   * deriva al `ErrorHandler`, cuya implementación por defecto lo escribe en consola y sigue. O sea que
   * sin esto el caso del `NG0201` pasaría en verde con la pantalla rota, que es el peor resultado
   * posible para una guarda. Ya está aprendido en este proyecto (ver el docstring de
   * `throw-en-afterrender`).
   */
  let cllErrores: unknown[];

  beforeEach(() => {
    cllErrores = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ErrorHandler,
          useValue: { handleError: (in_err: unknown) => cllErrores.push(in_err) },
        },
      ],
    });
  });

  /** Concatena los mensajes recolectados, para poder aseverar por contenido. */
  const textoDeErrores = (): string =>
    cllErrores.map((in_err) => (in_err instanceof Error ? in_err.message : String(in_err))).join(' | ');

  it('monta bajo ReactiveFormsModule SIN NG0201 — la razón de existir de la directiva', () => {
    const objFix = TestBed.createComponent(AnfitrionTabs);
    objFix.detectChanges();

    // `NG0201: No provider for NgControl` es lo que tira `NgControlStatus` cuando el atributo
    // `ngModel` lo hace matchear. Con nuestro atributo propio no puede pasar.
    expect(textoDeErrores()).not.toContain('NG0201');
    expect(cllErrores).toEqual([]);
    expect(objFix.nativeElement.querySelector('za-tabs')).toBeTruthy();
  });

  it('la mitad de IDA escribe el ngModel del componente del DS por instancia', () => {
    const objFix = TestBed.createComponent(AnfitrionTabs);
    objFix.detectChanges();

    // ⚠ Se busca la INSTANCIA por tipo, no se cuentan nodos: cada `za-*` da **dos** `DebugElement`
    // que comparten una instancia (el host de Angular y el custom element de Lit), así que un
    // `queryAll` contaría doble.
    const objTabs = objFix.debugElement.children[0].componentInstance as ZrTabs;
    expect(objTabs.ngModel).toBe(0);

    objFix.componentInstance.sigTab.set(1);
    objFix.detectChanges();
    expect(objTabs.ngModel).toBe(1);
  });

  it('la mitad de VUELTA propaga el ngModelChange del DS al signal de la pantalla', () => {
    const objFix = TestBed.createComponent(AnfitrionTabs);
    objFix.detectChanges();
    const objTabs = objFix.debugElement.children[0].componentInstance as ZrTabs;

    // Se emite por el `EventEmitter` del componente, que es el canal real: `ngModelChange` es un
    // `@Output()`, no un evento del DOM que burbujee (medido). Es también lo que hace que la vuelta
    // sea testeable bajo jsdom, donde los custom elements de Lit no se ejecutan.
    objTabs.ngModelChange.emit(1);
    objFix.detectChanges();

    expect(objFix.componentInstance.sigTab()).toBe(1);
  });

  it('⚠ el ciclo completo: cambia por el DS y vuelve a cambiar desde la pantalla', () => {
    // Es el caso que cubre el defecto del `_onChange` del vendor, que pisa el atributo `model` del
    // elemento interno por su cuenta. Sin la mitad de vuelta el signal se queda viejo y el segundo
    // cambio desde la pantalla no mueve nada, SIN ningún error — el sidebar que no vuelve a abrir.
    const objFix = TestBed.createComponent(AnfitrionSidebar);
    objFix.detectChanges();
    const objSidebar = objFix.debugElement.children[0].componentInstance as ZrSidebar;

    objSidebar.ngModelChange.emit(true);
    objFix.detectChanges();
    expect(objFix.componentInstance.sigAbierto()).toBe(true);

    objFix.componentInstance.sigAbierto.set(false);
    objFix.detectChanges();
    expect(objSidebar.ngModel).toBe(false);

    objFix.componentInstance.sigAbierto.set(true);
    objFix.detectChanges();
    expect(objSidebar.ngModel).toBe(true);
  });

  it('sirve en los tres ZaModelElement, no solo en tabs', () => {
    const objPag = TestBed.createComponent(AnfitrionPaginacion);
    objPag.detectChanges();
    const objPaginacion = objPag.debugElement.children[0].componentInstance as ZrPagination;
    expect(objPaginacion.ngModel).toBe(1);
    objPag.componentInstance.sigPagina.set(3);
    objPag.detectChanges();
    expect(objPaginacion.ngModel).toBe(3);
    expect(cllErrores).toEqual([]);
  });

  it('sobre un elemento que no es ZaModelElement falla nombrando el problema', () => {
    const objFix = TestBed.createComponent(AnfitrionInvalido);

    // ⚠ Se asevera con `toThrow` y **no** por el `ErrorHandler`, y la diferencia se midió: un throw
    // desde `ngOnInit` sale **sincrónico por `detectChanges()`**, no se deriva al `ErrorHandler`
    // global. El primer intento de este caso miraba `cllErrores` y salía rojo con el error ya
    // lanzado. Lo que sí va al `ErrorHandler` es un throw de `afterRender`, que es otro momento del
    // ciclo — de ahí que el recolector siga haciendo falta para el caso del `NG0201`, donde el fallo
    // ocurre creando el nodo.
    expect(() => objFix.detectChanges()).toThrow(/`modeloZa` se puso sobre un elemento que no es/);
    expect(() => TestBed.createComponent(AnfitrionInvalido).detectChanges()).toThrow(/modelo-za\.ts/);
  });
});
