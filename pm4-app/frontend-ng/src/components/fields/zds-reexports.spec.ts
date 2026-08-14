import { Component, inject } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AlertZService,
  type ModeloTablaZr,
  ZrAlert,
  ZrButton,
  ZrIcon,
  ZrKpiValue,
  ZrLoader,
  ZrModal,
  ZrNavigation,
  ZrPagination,
  ZrStageBanner,
  ZrSwitch,
  ZrTable,
  ZrTemplate,
} from './zds-reexports';

/**
 * Los re-exports son **alias**, así que no hay lógica propia que testear: lo que puede romperse es el
 * **contrato del DS** en el que las pantallas se van a apoyar. Estos specs fijan por lo tanto los
 * gotchas medidos, para que una actualización de `lib-zurich` que los cambie salga en rojo acá en vez
 * de en una pantalla.
 *
 * Es una decisión deliberada distinta a la de los wrappers de campo: allá el spec asevera *nuestro*
 * código; acá asevera una **dependencia**. Vale la pena igual porque estos cinco defectos ya nos
 * costaron tiempo una vez, y porque un default que cambia (el `disabled` de `ButtonZ`) es
 * indistinguible de un bug propio cuando aparece en una pantalla.
 *
 * ── Lo que estos tests NO pueden probar ───────────────────────────────────────────────────────
 * Bajo jsdom los `za-*` de Lit no hacen upgrade, así que nada de esto asevera **pintado**. Se asevera
 * lo que sí es observable: defaults de campos de clase, atributos escritos en el DOM, y la cola del
 * `AlertZService`. El render real sigue siendo el gate manual en Docker.
 */

/** El caso que toda pantalla tiene que recordar: sin `[disabled]="false"` el botón monta inerte. */
@Component({
  standalone: true,
  imports: [ZrButton],
  template: `
    <lib-button-z label="Sin tocar el disabled" />
    <lib-button-z label="Explícito" [disabled]="false" />
  `,
})
class HostBoton {}

@Component({
  standalone: true,
  imports: [ZrLoader],
  template: `<lib-loader-z customStr="color:#ff0000; size: 99px;" label="Cargando" />`,
})
class HostLoader {}

@Component({
  standalone: true,
  imports: [ZrModal, ZrTemplate],
  template: `
    <lib-modal-z [open]="blnAbierto" (close)="blnAbierto = $event">
      <ng-template libZTemplate id="title">Título</ng-template>
      <ng-template libZTemplate id="content">Contenido</ng-template>
      <ng-template libZTemplate id="buttons">Botones</ng-template>
    </lib-modal-z>
  `,
})
class HostModal {
  blnAbierto = true;
}

@Component({
  standalone: true,
  imports: [ZrAlert],
  template: `<lib-alert-z />`,
})
class HostAlerta {
  readonly objAlertas = inject(AlertZService);
}

@Component({
  standalone: true,
  imports: [ZrTable],
  template: `<lib-table-z [headers]="cllCabeceras" [data]="cllDatos" />`,
})
class HostTabla {
  /**
   * `headers` NO es `string[]`: es `TableModel[]`, donde `title` es la etiqueta visible y `key` la
   * propiedad que se lee de cada fila de `data`. Pasar strings falla en compilación con `TS2322`, que
   * es la forma correcta de enterarse.
   */
  readonly cllCabeceras: ModeloTablaZr[] = [
    { title: 'Documento', key: 'strDocumento' },
    { title: 'Estado', key: 'strEstado' },
  ];
  readonly cllDatos = [{ strDocumento: 'cedula.pdf', strEstado: 'Cargado' }];
}

/**
 * El tipo del parámetro es `abstract new (...args: never[]) => T` y no `new () => T` a propósito:
 * varios componentes del DS **tienen dependencias en el constructor** (`AlertZ` recibe
 * `AlertZService` + `ChangeDetectorRef`; `TableZ` recibe `platformId`), así que la firma sin
 * argumentos no los acepta y el compilador lo rechaza con `TS2345`. Solo se los usa como operando de
 * `instanceof`, que no construye nada.
 */
function hijo<T>(
  in_objFixture: ComponentFixture<unknown>,
  in_objTipo: abstract new (...in_cllArgs: never[]) => T,
): T {
  return in_objFixture.debugElement.query(
    (in_objNodo) => in_objNodo.componentInstance instanceof in_objTipo,
  ).componentInstance as T;
}

describe('re-exports de la fachada', () => {
  describe('ZrButton · el disabled arranca en true', () => {
    it('un lib-button-z sin [disabled] queda DESHABILITADO', async () => {
      // Es el gotcha del plan de migración, y es real. Este test existe para que la regla
      // "toda pantalla pasa [disabled] explícito" tenga un respaldo ejecutable.
      const objFixture = TestBed.createComponent(HostBoton);
      await objFixture.whenStable();

      const cllBotones = objFixture.debugElement.queryAll(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrButton,
      );
      expect(cllBotones).toHaveLength(2);
      expect((cllBotones[0].componentInstance as ZrButton).disabled).toBe(true);
      expect((cllBotones[1].componentInstance as ZrButton).disabled).toBe(false);
    });

    it('el default vive en el campo de la clase, no en la plantilla', () => {
      // Aseverado sobre una instancia pelada: si una versión futura mueve el default a un
      // `input(false)` idiomático, este test se pone rojo y el comentario de la fachada hay que
      // reescribirlo (sería una buena noticia, pero no una silenciosa).
      expect(new ZrButton().disabled).toBe(true);
    });
  });

  describe('ZrLoader · customStr es un input muerto', () => {
    it('el custom-str hardcodeado del DS gana sobre el binding', async () => {
      // Medido: la plantilla del DS pone `[custom-str]="customStr"` Y un `custom-str="..."` estático
      // sobre el mismo `<za-loader>`. El binding escribe una propiedad que Lit no lee; el atributo
      // estático es el que manda. Por eso el loader es verde y de 50px y no hay input que lo cambie.
      const objFixture = TestBed.createComponent(HostLoader);
      await objFixture.whenStable();

      const objZaLoader = objFixture.nativeElement.querySelector('za-loader') as HTMLElement;
      expect(objZaLoader.getAttribute('custom-str')).toBe(
        'color:#06e7a3; size: 50px; stroke: 10px; fill: #06e7a3;',
      );
      // Y el valor bindeado no aparece en ninguna parte del elemento.
      expect(objZaLoader.getAttribute('custom-str')).not.toContain('#ff0000');
    });
  });

  describe('ZrModal · no toca el scroll del body, y muta su propio input', () => {
    it('montar y destruir el modal NO escribe document.body.style.overflow', async () => {
      // El plan pedía portar el `ngOnDestroy` que restaura el overflow. Sería un bug: `lib-zurich`
      // nunca lo bloquea (0 ocurrencias de `body.style`), así que restaurarlo pisaría el de un
      // tercero. Este test fija que el componente es neutral respecto del scroll del documento.
      document.body.style.overflow = 'hidden'; // valor puesto por un tercero cualquiera
      const objFixture = TestBed.createComponent(HostModal);
      await objFixture.whenStable();
      expect(document.body.style.overflow).toBe('hidden');

      objFixture.destroy();
      // Si alguien agregara el `ngOnDestroy` del plan, acá quedaría `''` y el test se pondría rojo.
      expect(document.body.style.overflow).toBe('hidden');
      document.body.style.overflow = '';
    });

    it('ShowBackdrop lleva S mayúscula y arranca en true', () => {
      // El nombre no convencional es del DS. Escribirlo `showBackdrop` no da error de compilación
      // (Angular acepta atributos desconocidos en un componente propio solo si son inputs; acá
      // directamente no bindea nada), así que el default queda y el backdrop aparece igual.
      expect(new ZrModal().ShowBackdrop).toBe(true);
    });

    it('cerrar por la X emite (close) con false y baja su propio open', async () => {
      const objFixture = TestBed.createComponent(HostModal);
      await objFixture.whenStable();
      const objModal = hijo(objFixture, ZrModal);

      objModal.change(new Event('click'));
      await objFixture.whenStable();

      // Las dos caras del mismo gotcha: el componente muta su input además de emitir. La pantalla
      // tiene que escuchar `(close)` — con `[open]` de una sola vía se desincronizarían.
      expect(objModal.open).toBe(false);
      expect(objFixture.componentInstance.blnAbierto).toBe(false);
    });
  });

  describe('ZrTable · el typo de la lib es parte del contrato', () => {
    it('el input se llama generciEndName (typo), no genericEndName', async () => {
      // Su hermano `genericStartName` está bien escrito, que es lo que hace fácil equivocarse.
      // Aseverado sobre las claves de una instancia **montada**: `new ZrTable()` no compila porque el
      // componente recibe `platformId` por DI (es SSR-aware), y de paso montarlo prueba que instancia.
      const objFixture = TestBed.createComponent(HostTabla);
      await objFixture.whenStable();
      const cllClaves = Object.keys(hijo(objFixture, ZrTable));

      expect(cllClaves).toContain('generciEndName');
      expect(cllClaves).toContain('genericStartName');
      // Escribir el nombre correcto no bindea nada: el pie saldría vacío sin ningún error.
      expect(cllClaves).not.toContain('genericEndName');
    });
  });

  describe('ZrAlert · las alertas son imperativas, por servicio', () => {
    let objFixture: ComponentFixture<HostAlerta>;
    let objServicio: AlertZService;

    beforeEach(async () => {
      objFixture = TestBed.createComponent(HostAlerta);
      await objFixture.whenStable();
      objServicio = objFixture.componentInstance.objAlertas;
    });

    it('el componente no recibe el mensaje por input: lo toma de la cola del servicio', async () => {
      objServicio.negative('No se pudo guardar');
      await objFixture.whenStable();

      const cllAlertas = (objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrAlert,
      ).componentInstance as ZrAlert).alerts;
      expect(cllAlertas).toHaveLength(1);
      expect(cllAlertas[0].message).toBe('No se pudo guardar');
      // El `config` lo pone el método rápido, no la pantalla. Es lo que decide el color.
      expect(cllAlertas[0].config).toBe('negative');
      // Y el servicio le asigna un id solo, que es la clave con la que después se la saca.
      expect(cllAlertas[0].id).toBeTruthy();
    });

    it('clear() vacía la cola', async () => {
      objServicio.info('Una');
      objServicio.positive('Dos');
      await objFixture.whenStable();
      expect(hijo(objFixture, ZrAlert).alerts).toHaveLength(2);

      objServicio.clear();
      await objFixture.whenStable();
      expect(hijo(objFixture, ZrAlert).alerts).toHaveLength(0);
    });
  });

  describe('los cuatro que no existen como lib-*-z', () => {
    it('se toman de za-* (mismo nivel 1 de la jerarquía de fuentes)', () => {
      // `lib-zurich` exporta 26 selectores `lib-*-z` y ninguno es icon/switch/kpi-value/pagination.
      // No hubo que escalar a `vendor/zurich-angular` ni al usuario: `@zurich/angular-components`
      // está en el mismo nivel 1. Este test es la prueba de que los cuatro alias resuelven.
      expect([ZrIcon, ZrKpiValue, ZrPagination, ZrSwitch].every((in_objTipo) => !!in_objTipo)).toBe(
        true,
      );
    });
  });

  it('los alias de layout/navegación resuelven', () => {
    // `ZrNavigation` y `ZrStageBanner` no tienen gotchas medidos; el alias se asevera igual para que
    // un rename en la lib no se descubra al portar una pantalla.
    expect([ZrNavigation, ZrStageBanner, ZrTemplate].every((in_objTipo) => !!in_objTipo)).toBe(true);
  });
});
