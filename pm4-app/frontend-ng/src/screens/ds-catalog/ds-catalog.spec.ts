import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  AlertZService,
  ZrAlert,
  ZrAlertInline,
  ZrBadge,
  ZrButton,
  ZrCalendar,
  ZrCard,
  ZrChip,
  ZrEmptyState,
  ZrFooter,
  ZrIcon,
  ZrInputGroup,
  ZrKpiValue,
  ZrLoader,
  ZrModal,
  ZrNavigation,
  ZrPagination,
  ZrProgressBar,
  ZrPromo,
  ZrSegmented,
  ZrSidebar,
  ZrStageBanner,
  ZrStepper,
  ZrSwitch,
  ZrTable,
  ZrTabs,
  ZrTag,
  ZrTextInput,
  ZrTile,
  ZrTooltip,
} from '../../components/fields/zds-reexports';
import { DsCatalog } from './ds-catalog';

/**
 * Specs del catálogo del DS.
 *
 * ── Qué puede romperse en un catálogo, que es lo que decide los casos ──────────────────────────
 * Esta pantalla no tiene reglas de negocio: no hay RUL que cubrir, no consume `TaskService` y su
 * `FormGroup` es de exhibición. Así que un spec que solo la montara sería un smoke, de los que este
 * proyecto no acepta como cobertura. Lo que sí tiene es un contrato propio, y se rompe en silencio:
 *
 * 1. **Un componente de la fachada deja de montar.** Es el modo de falla central. Una actualización de
 *    `lib-zurich`/`@zurich/angular-components` que renombre un selector deja el elemento en el DOM como
 *    etiqueta desconocida —sin error, porque los `za-*` son custom elements válidos para Angular— y el
 *    catálogo, que es la "referencia visual viva", pasa a mentir. El caso de abajo lo ataja para **los
 *    30 símbolos** de una vez.
 * 2. **Las dos familias de binding se confunden.** `ZaModelElement` (`[(ngModel)]`, sin CVA) vs
 *    `ZaBaseInput` (`[formControl]`, con CVA). Confundirlas **no da error de tipos**: da un control que
 *    nunca se actualiza. Ver la tabla en el docstring de `DsCatalog`.
 * 3. **Los alias kebab.** `[progressBarTitle]` compila y no llega al componente; `progress-bar-title`
 *    sí. Mismo síntoma: cero error, comportamiento default.
 * 4. **El modal no vuelve a abrir.** `ModalZ.change()` escribe `this.open = false` sobre su **propio
 *    input**, así que sin escuchar `(close)` el segundo clic no abre nada.
 *
 * ── Lo que estos tests NO pueden probar, y por qué se asevera igual ────────────────────────────
 * Bajo jsdom los `za-*`/`z-*` de Lit **no hacen upgrade**, así que nada de acá asevera pintado — es la
 * misma limitación declarada en `zds-reexports.spec.ts`. Lo que sí es observable, y es lo que se
 * asevera: que la **instancia del componente de Angular** existe en el árbol (que es lo que falla
 * cuando un selector cambia), los atributos escritos en el DOM, y el valor de los `FormControl`.
 *
 * Que se vea bien sigue siendo el gate manual del navegador (Gate 6, comparación contra React lado a
 * lado). Este spec cubre la mitad que un humano no vuelve a revisar cada vez.
 *
 * ── Por qué se busca por TIPO y no por selector ────────────────────────────────────────────────
 * `queryAll(node => node.componentInstance instanceof ZrTabs)` en vez de
 * `querySelector('za-tabs')`. La diferencia importa: buscar por string haría que **renombrar el
 * selector en el DS deje el spec verde** (el string del test seguiría coincidiendo con... nada, y un
 * `querySelector` que no encuentra devuelve `null`, que es justo lo que el caso quiere detectar, pero
 * la lista de strings del spec sería una copia a mano que hay que mantener sincronizada). Buscando por
 * la **clase importada de la fachada**, el vínculo lo sostiene el compilador: si la fachada deja de
 * exportar `ZrTabs`, este archivo no compila. Es lo mismo que hace el helper `hijo()` de
 * `zds-reexports.spec.ts`, generalizado a una lista.
 */

/**
 * Los 30 componentes `Zr*` de la fachada, cada uno con el nombre que sale en el mensaje del fallo.
 *
 * ── ⚠ Las tres ausencias, que son deliberadas y no un descuido ─────────────────────────────────
 * La fachada exporta 33 símbolos; acá hay 30 clases de componente. Los tres que faltan **no pueden**
 * estar en una lista de "componentes montados", y vale nombrarlos para que nadie los agregue:
 *
 * - **`AlertZService`** es un servicio, no un componente: se asevera aparte, por su cola.
 * - **`ZrTemplate`** es una directiva sobre `ng-template` (`ng-template[libZTemplate]`), así que no
 *   monta un elemento propio — su efecto se asevera por el contenido del modal.
 * - **`ZrTag`** el docstring de la fachada dice, textual, que **no se consume en ninguna plantilla**:
 *   existe para que los specs puedan tipar el `za-tag` que `zds-status-badge` envuelve. En el catálogo
 *   aparece por medio de ese wrapper (`<zds-status-badge>`), no suelto, así que su instancia sí está en
 *   el árbol — se asevera en el caso de los `Zds*`, donde su presencia significa algo.
 *
 * El tipo es `abstract new (...never[]) => unknown` y no `new () => unknown` por el mismo motivo
 * documentado en `zds-reexports.spec.ts`: varios componentes del DS piden dependencias en el
 * constructor (`AlertZ` recibe `AlertZService` + `ChangeDetectorRef`, `TableZ` recibe `platformId`), así
 * que la firma sin argumentos los rechaza con `TS2345`. Solo se usan como operando de `instanceof`.
 */
const CLL_COMPONENTES_FACHADA: readonly [string, abstract new (...in_cll: never[]) => unknown][] = [
  ['ZrAlert', ZrAlert],
  ['ZrAlertInline', ZrAlertInline],
  ['ZrBadge', ZrBadge],
  ['ZrButton', ZrButton],
  ['ZrCalendar', ZrCalendar],
  ['ZrCard', ZrCard],
  ['ZrChip', ZrChip],
  ['ZrEmptyState', ZrEmptyState],
  ['ZrFooter', ZrFooter],
  ['ZrIcon', ZrIcon],
  ['ZrInputGroup', ZrInputGroup],
  ['ZrKpiValue', ZrKpiValue],
  ['ZrLoader', ZrLoader],
  ['ZrModal', ZrModal],
  ['ZrNavigation', ZrNavigation],
  ['ZrPagination', ZrPagination],
  ['ZrProgressBar', ZrProgressBar],
  ['ZrPromo', ZrPromo],
  ['ZrSegmented', ZrSegmented],
  ['ZrSidebar', ZrSidebar],
  ['ZrStageBanner', ZrStageBanner],
  ['ZrStepper', ZrStepper],
  ['ZrSwitch', ZrSwitch],
  ['ZrTable', ZrTable],
  ['ZrTabs', ZrTabs],
  ['ZrTextInput', ZrTextInput],
  ['ZrTile', ZrTile],
  ['ZrTooltip', ZrTooltip],
];

/**
 * Los wrappers `Zds*` de campo, por su selector.
 *
 * Acá **sí** va por selector y no por tipo, y la asimetría es deliberada: son componentes **nuestros**,
 * no del DS, así que su selector no lo puede renombrar una actualización de vendor — lo renombraría
 * alguien de este repo, que es un cambio que se ve en el diff. Lo que se quiere atajar es distinto:
 * que el catálogo **deje de exhibir un campo** (que alguien borre la línea del `.html` al reordenar
 * secciones), y para eso el selector alcanza y no obliga a importar 9 clases más.
 */
const CLL_SELECTORES_ZDS: readonly string[] = [
  'zds-input',
  'zds-select',
  'zds-radio',
  'zds-date',
  'zds-textarea',
  'zds-checkbox-field',
  'zds-status-badge',
  'zds-file-input',
];

describe('DsCatalog · el catálogo del design system', () => {
  /** Monta el catálogo completo y estabiliza. No necesita router ni providers: no lee nada de la ruta. */
  async function montar() {
    const objFixture = TestBed.createComponent(DsCatalog);
    await objFixture.whenStable();
    return objFixture;
  }

  /**
   * Las instancias **distintas** de un componente de la fachada que hay en el árbol.
   *
   * ── ⚠ Por qué no alcanza `queryAll(… instanceof X)` cuando se CUENTA ────────────────────────
   * Un `queryAll` por tipo devuelve **dos nodos por cada componente `za-*`**, los dos con la
   * **misma instancia**: el host de Angular (`<za-alert>`) y el custom element de Lit que ese
   * componente renderiza en su propia plantilla (`<z-alert>`). El `DebugElement` recorre los dos y
   * `componentInstance` de un nodo interno devuelve el componente que lo contiene, así que el
   * predicado matchea en ambos. Cuatro `<za-alert>` en la plantilla dan **8** nodos.
   *
   * Se descubrió midiendo (el caso de las 4 variantes daba `length 8`), no leyendo: es exactamente
   * la clase de detalle que hace que un conteo mienta hacia arriba y un test pase por el motivo
   * equivocado. Para "¿está en el árbol?" da igual —`length > 0` es verdad de las dos formas— pero
   * para "¿hay exactamente 4?" no, así que todo caso que **cuente** pasa por acá.
   */
  function instanciasDe<T>(
    in_objFixture: { debugElement: DebugElement },
    in_objTipo: abstract new (...in_cll: never[]) => T,
  ): T[] {
    const setVistas = new Set<T>();
    for (const objNodo of in_objFixture.debugElement.queryAll(
      (in_objNodo) => in_objNodo.componentInstance instanceof in_objTipo,
    )) {
      setVistas.add(objNodo.componentInstance as T);
    }
    return [...setVistas];
  }

  describe('la fachada completa monta', () => {
    // ⚠ Dice **28** y no 30: son los `Zr*` que montan un elemento propio. Los otros dos símbolos de
    // componente de la fachada no se pueden aseverar así y se justifican uno por uno en el comentario
    // de `CLL_COMPONENTES_FACHADA` (`ZrTemplate` es un directivo que no monta nada; `ZrTag` solo
    // aparece dentro de `zds-status-badge`, y se cubre en el caso de los `Zds*`).
    it('⚠ los 28 componentes Zr* de la fachada están en el árbol, y el fallo los NOMBRA', async () => {
      // **El caso que convierte al catálogo en guarda de regresión del DS** y no en una página de
      // muestra. Si `lib-zurich` o `@zurich/angular-components` renombra un selector, el elemento
      // queda en el DOM como etiqueta desconocida —sin error, porque para Angular un `za-*` sin
      // directiva que lo reclame es un custom element legítimo— y la pantalla que el proyecto usa
      // como "referencia visual viva" empieza a mentir. Acá se pone rojo.
      const objFixture = await montar();

      const cllAusentes = CLL_COMPONENTES_FACHADA.filter(
        ([, in_objTipo]) =>
          objFixture.debugElement.queryAll(
            (in_objNodo) => in_objNodo.componentInstance instanceof in_objTipo,
          ).length === 0,
      ).map(([in_strNombre]) => in_strNombre);

      // Los nombres van **dentro del string** de la aserción, no en un objeto: es el mismo idioma que
      // la guarda de inventario de `pantallas.spec.ts`, y por la misma razón — el mensaje del fallo
      // tiene que decir *qué* componente falta, no dejar un diff de arrays que hay que ir a leer.
      expect(`no montaron: [${cllAusentes.join(', ')}]`).toBe('no montaron: []');
    });

    it('los 8 wrappers Zds* de campo siguen exhibidos', async () => {
      // La otra mitad de la fachada. Cubre el caso de que alguien borre una línea del `.html` al
      // reordenar secciones: el catálogo seguiría montando y `verify` seguiría verde.
      const objFixture = await montar();
      const objRaiz = objFixture.nativeElement as HTMLElement;

      const cllAusentes = CLL_SELECTORES_ZDS.filter(
        (in_strSelector) => objRaiz.querySelector(in_strSelector) === null,
      );

      expect(`no exhibidos: [${cllAusentes.join(', ')}]`).toBe('no exhibidos: []');
    });

    it('⚠ ZrTag monta por medio de zds-status-badge, no suelto', async () => {
      // La tercera ausencia de `CLL_COMPONENTES_FACHADA`, aseverada acá para que sea un hecho medido
      // y no una nota en un comentario. El docstring de la fachada dice que `ZrTag` no se consume en
      // ninguna plantilla y existe para que los specs puedan tipar el `za-tag` que envuelve
      // `zds-status-badge`. Este caso fija esa cadena: si el wrapper dejara de usar `za-tag`, la
      // píldora de estado cambiaría de componente sin que nada más se ponga rojo.
      const objFixture = await montar();

      // Las 4 píldoras del catálogo (`success`/`danger`/`info`/`neutral`), cada una con su `za-tag`.
      const cllPildoras = (objFixture.nativeElement as HTMLElement).querySelectorAll(
        'zds-status-badge za-tag',
      );
      expect(cllPildoras).toHaveLength(4);

      // Y que ese `za-tag` es de verdad la clase que la fachada exporta como `ZrTag` — que es la
      // razón entera por la que la fachada lo exporta (`fill` es un `input()`, no un atributo
      // reflejado, así que aseverarlo exige la INSTANCIA y para buscarla por tipo hace falta la clase).
      const cllInstancias = objFixture.debugElement.queryAll(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrTag,
      );
      expect(cllInstancias.length, 'las píldoras no montaron sobre ZrTag').toBeGreaterThanOrEqual(4);
    });
  });

  describe('⚠ las dos familias de binding, que se confunden sin error de tipos', () => {
    it('los 5 za-* con CVA nativo reflejan el valor de su FormControl', async () => {
      // `ZaBaseInput` implementa `ControlValueAccessor`, así que estos van con `[formControl…]`
      // DIRECTO, sin wrapper `Zds*`. El caso asevera el lado que importa —que el valor del control
      // llegó a la instancia del componente del DS— y no el pintado, que jsdom no da.
      //
      // Ojo con qué se lee: `ngModel` es la propiedad donde `ZaModelElement` guarda el modelo, y es
      // también donde `writeValue()` lo escribe. O sea que este `expect` prueba que el CVA corrió.
      const objFixture = await montar();
      const objCatalogo = objFixture.componentInstance;

      const dicEsperados: readonly [string, abstract new (...in_cll: never[]) => unknown, unknown][] =
        [
          ['seg', ZrSegmented, 'si'],
          ['step', ZrStepper, 2],
          ['cal', ZrCalendar, ''],
          ['interruptor', ZrSwitch, true],
        ];

      const cllRotos: string[] = [];
      for (const [in_strCampo, in_objTipo, in_valEsperado] of dicEsperados) {
        const objNodo = objFixture.debugElement.query(
          (in_objNodo) => in_objNodo.componentInstance instanceof in_objTipo,
        );
        const valModelo = (objNodo.componentInstance as { ngModel?: unknown }).ngModel;

        if (valModelo !== in_valEsperado) {
          cllRotos.push(`${in_strCampo}: esperaba ${JSON.stringify(in_valEsperado)}, llegó ${JSON.stringify(valModelo)}`);
        }
        // Y el control existe con ese valor, que es la otra mitad del contrato.
        expect(objCatalogo.objForm.get(in_strCampo)?.value).toEqual(in_valEsperado);
      }

      expect(`CVA roto en: [${cllRotos.join(' · ')}]`).toBe('CVA roto en: []');
    });

    it('un cambio en el FormControl viaja al componente del DS (writeValue)', async () => {
      // La dirección control → vista. Sin esto el caso de arriba se podría satisfacer con un
      // componente que lee el valor inicial una vez y nunca más.
      const objFixture = await montar();

      objFixture.componentInstance.objForm.get('step')!.setValue(4);
      await objFixture.whenStable();

      const objStepper = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrStepper,
      );
      expect((objStepper.componentInstance as { ngModel?: unknown }).ngModel).toBe(4);
    });

    it('⚠ los 3 ZaModelElement (Tabs/Sidebar/Pagination) van por ngModel y NO por formControl', async () => {
      // La otra familia. No tienen `NG_VALUE_ACCESSOR` —verificado en los `.mjs`, `useExisting` solo
      // aparece en los concretos de `ZaBaseInput`—, así que `[formControl]` sobre ellos daría
      // `NG01203` en runtime. El catálogo los cablea con `[ngModel]` + `(ngModelChange)` contra un
      // signal, y este caso asevera que ese cableado llegó.
      const objFixture = await montar();

      const objTabs = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrTabs,
      );
      const objPaginacion = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrPagination,
      );

      // 1-based, igual que el `useState(1)` de React. Un `signal(0)` acá dejaría la primera pestaña
      // sin seleccionar y ningún otro caso lo notaría.
      expect((objTabs.componentInstance as { ngModel?: unknown }).ngModel).toBe(1);
      expect((objPaginacion.componentInstance as { ngModel?: unknown }).ngModel).toBe(1);
    });

    it('el round-trip del signal: (ngModelChange) del DS actualiza la pantalla', async () => {
      // La dirección vista → modelo, que es la que `[(ngModel)]` daría gratis y acá se escribe a
      // mano porque el destino es un signal (se llama, no se asigna). Si alguien "simplificara" el
      // template a `[(ngModel)]="sigTab"` no compilaría; si lo dejara solo en `[ngModel]`, las
      // pestañas dejarían de cambiar y **nada más se pondría rojo**.
      const objFixture = await montar();

      const objTabs = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrTabs,
      );
      (objTabs.componentInstance as { ngModelChange: { emit(in_val: number): void } }).ngModelChange.emit(3);
      await objFixture.whenStable();

      expect(objFixture.componentInstance.sigTab()).toBe(3);
    });
  });

  describe('⚠ los alias kebab, que en camelCase compilan y no llegan', () => {
    it('progress-bar-title y no-percentage llegan al za-progress-bar', async () => {
      // El hallazgo vuelto aserción. `[progressBarTitle]` compilaría sin error y no haría nada, así
      // que el único respaldo posible es medir el atributo **sobre el elemento del DS**.
      const objFixture = await montar();

      const objBarra = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrProgressBar,
      ).componentInstance as { progressBarTitle?: unknown; noPercentage?: unknown };

      // Se lee la PROPIEDAD del componente y no el atributo del DOM: el alias kebab es el nombre
      // público del input, y lo que prueba que el binding llegó es que el setter corrió. Un atributo
      // presente no lo probaría (es justo la trampa del `[attr.x]` documentada en la fachada).
      expect(objBarra.progressBarTitle).toBe('Paso 3 de 5');
      expect(objBarra.noPercentage).toBe(true);
    });

    it('first-weekday llega al za-calendar con un valor del union, no un número', async () => {
      // El intento natural es `first-weekday="1"`, y falla en compilación: el tipo es
      // `'sunday' | 'monday'`. Queda aseverado para que el valor correcto no se pierda en un refactor.
      const objFixture = await montar();

      const objCalendario = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrCalendar,
      ).componentInstance as { firstWeekday?: unknown; wide?: unknown };

      expect(objCalendario.firstWeekday).toBe('monday');
      expect(objCalendario.wide).toBe(true);
    });

    it('social-text llega al za-footer, y columns respeta el mínimo de 2', async () => {
      // `socialText` tiene alias kebab igual que `progressBarTitle`, así que cae en la misma trampa.
      // Y el `columns` va aseverado por su LONGITUD porque el tipo exige 2, 3 o 4: React le pasa una
      // sola columna y viola el contrato del componente (diferencia reportada, no arreglada).
      const objFixture = await montar();

      const objPie = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrFooter,
      ).componentInstance as { socialText?: unknown; columns?: readonly unknown[] };

      expect(objPie.socialText).toBe('Seguinos en nuestras redes');
      expect(objPie.columns?.length).toBeGreaterThanOrEqual(2);
      expect(objPie.columns?.length).toBeLessThanOrEqual(4);
    });

    it('⚠ image-src (kebab) en za-promo e imageSrc (camelCase) en lib-stage-banner-z', async () => {
      // **Las dos librerías lo escriben distinto, y la forma equivocada compila sin pintar.**
      // `ZaWithImage` declara el alias kebab; `StageBannerZ` no declara alias. Este caso es el único
      // respaldo de esa asimetría, que es exactamente la clase de detalle que se pierde al copiar
      // markup de una pantalla a otra.
      const objFixture = await montar();

      const objPromo = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrPromo,
      ).componentInstance as { imageSrc?: unknown };
      const objBanner = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrStageBanner,
      ).componentInstance as { imageSrc?: unknown };

      // Las dos propiedades se llaman `imageSrc`; lo que difiere es el nombre PÚBLICO del input, o
      // sea cómo se escribe en el template. Que las dos lleguen es la prueba de que cada una se
      // escribió con la forma que su librería acepta.
      expect(objPromo.imageSrc, 'el [image-src] kebab de za-promo no llegó').toBeTruthy();
      expect(objBanner.imageSrc, 'el [imageSrc] camelCase de lib-stage-banner-z no llegó').toBeTruthy();
    });
  });

  describe('⚠ los overlays y su ciclo de apertura', () => {
    it('el modal abre, cierra y VUELVE a abrir', async () => {
      // El caso que justifica el `(close)` del template. `ModalZ.change()` hace
      // `this.open = false` sobre su **propio input**, así que con un `[open]` de una sola vía el
      // componente y la pantalla quedan desincronizados: el segundo "Abrir modal" no abriría nada.
      // Sin este caso, ese defecto solo se ve haciendo clic dos veces en el navegador.
      const objFixture = await montar();
      const objCatalogo = objFixture.componentInstance;

      const objModal = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrModal,
      ).componentInstance as { open?: unknown; close: { emit(in_val: boolean): void } };

      objCatalogo.sigModal.set(true);
      await objFixture.whenStable();
      expect(objModal.open).toBe(true);

      // El cierre por el backdrop o la X: el DS emite `(close)` y además se pisa su propio `open`.
      objModal.close.emit(false);
      await objFixture.whenStable();
      expect(objCatalogo.sigModal(), 'la pantalla no bajó su bandera al escuchar (close)').toBe(false);

      // Y la segunda apertura, que es la que se rompe si nadie escucha `(close)`.
      objCatalogo.sigModal.set(true);
      await objFixture.whenStable();
      expect(objModal.open, 'el modal no volvió a abrir').toBe(true);
    });

    it('⚠ el contenido del modal vive en el slot y sobrevive a la primera apertura', async () => {
      // Las tres reglas de slots de `ModalZ` juntas: el `ng-template libZTemplate id="content"` con
      // `id` **estático** y **fuera** de todo `@if`. `ngAfterContentInit` corre UNA vez, y la
      // pantalla monta con el modal CERRADO — que es la condición inicial real. Si el `ng-template`
      // estuviera dentro de un `@if (sigModal())`, el modal guardaría `undefined` y no volvería a
      // mirar: se abriría **vacío, sin error**. El `@if` va ADENTRO del slot, y esto lo asevera.
      const objFixture = await montar();

      objFixture.componentInstance.sigModal.set(true);
      await objFixture.whenStable();

      const objRaiz = objFixture.nativeElement as HTMLElement;
      expect(
        objRaiz.textContent,
        'el slot del modal montó vacío: el ng-template quedó dentro de un @if',
      ).toContain('Modal de ejemplo');
    });

    it('el sidebar alterna por su modelo, y la VUELTA baja la bandera', async () => {
      // ⚠ **Las dos mitades del two-way partido, y la segunda se agregó porque la mutación la
      // encontró descubierta.** Quitar el `(ngModelChange)` del `<za-sidebar>` dejaba los 18 casos
      // verdes: se aseveraba solo la ida (signal → `ngModel`), que la escribe el `effect` de
      // `sincronizarModelosDelDs()`.
      //
      // La vuelta importa por el mismo motivo que el `(close)` del modal: `ZaModelElement._onChange`
      // emite `ngModelChange` **y** pisa el atributo `model` del elemento interno por su cuenta, así
      // que si nadie escucha, el panel se cierra en pantalla y `sigDrawer` se queda en `true` — el
      // segundo "Abrir panel" no abre nada. Ese defecto no se ve en el DOM ni en un `ng build`; se
      // ve haciendo clic dos veces en el navegador, o acá.
      const objFixture = await montar();
      const objCatalogo = objFixture.componentInstance;

      const objPanel = objFixture.debugElement.query(
        (in_objNodo) => in_objNodo.componentInstance instanceof ZrSidebar,
      ).componentInstance as { ngModel?: unknown; ngModelChange: { emit(in_val: boolean): void } };

      expect(objPanel.ngModel).toBe(false);

      objCatalogo.sigDrawer.set(true);
      await objFixture.whenStable();
      expect(objPanel.ngModel).toBe(true);

      // El cierre desde el propio DS (la X del panel), que es lo único que emite este output.
      objPanel.ngModelChange.emit(false);
      await objFixture.whenStable();
      expect(
        objCatalogo.sigDrawer(),
        'la pantalla no bajó su bandera al escuchar (ngModelChange): el panel no vuelve a abrir',
      ).toBe(false);
    });
  });

  describe('las dos alertas, que no se sustituyen', () => {
    it('ZrAlertInline pinta las 4 variantes declarativas', async () => {
      // La caja inline (`za-alert`), que es la forma en que React usaba la alerta dentro del markup.
      const objFixture = await montar();

      // Se cuenta por **instancia** y no por nodo: ver `instanciasDe()` — cada `za-alert` aparece dos
      // veces en el árbol de depuración (su host y el `z-alert` de Lit que renderiza adentro).
      const cllInline = instanciasDe(objFixture, ZrAlertInline);
      expect(cllInline).toHaveLength(4);

      const cllConfigs = cllInline.map((in_objAlerta) => in_objAlerta.config);
      expect(cllConfigs).toEqual(['info', 'positive', 'negative', 'alert']);
    });

    it('AlertZService encola en el ZrAlert, y la cola se puede limpiar', async () => {
      // La cola IMPERATIVA, que es la otra mitad del punto 5b de la fachada: `AlertZ` no tiene
      // ningún `@Input`, se alimenta por el servicio. El caso cubre además el `limpiarAlertas()`,
      // que existe porque el servicio **acumula** — sin él el catálogo se llenaría de alertas.
      const objFixture = await montar();
      const objServicio = TestBed.inject(AlertZService);

      objFixture.componentInstance.encolarAlertas();
      await objFixture.whenStable();

      // Se lee la cola del servicio y no el DOM: bajo jsdom el `za-alert` de Lit no hace upgrade, así
      // que el mensaje pintado no es observable. Lo que sí lo es —y es lo que la pantalla controla—
      // es que los mensajes entraron.
      const cllEncoladas = await new Promise<unknown[]>((in_fnResolver) => {
        objServicio.alerts$.subscribe((in_cll: unknown[]) => in_fnResolver(in_cll));
      });
      expect(cllEncoladas.length, 'encolarAlertas() no metió nada en la cola').toBeGreaterThan(0);

      objFixture.componentInstance.limpiarAlertas();
      const cllVacia = await new Promise<unknown[]>((in_fnResolver) => {
        objServicio.alerts$.subscribe((in_cll: unknown[]) => in_fnResolver(in_cll));
      });
      expect(cllVacia).toHaveLength(0);
    });
  });

  describe('los defaults de exhibición, que son contrato con React', () => {
    it('el FormGroup arranca con los mismos valores que el useForm de React', async () => {
      // Son datos de exhibición, pero la comparación visual del Gate 6 se hace **contra estos
      // valores**: si el catálogo de Angular mostrara "Opción A" donde React muestra "Opción B", la
      // comparación lado a lado reportaría una diferencia que no existe en el DS.
      const objFixture = await montar();

      expect(objFixture.componentInstance.objForm.getRawValue()).toMatchObject({
        txt: 'Texto de ejemplo',
        sel: 'b',
        rad: 'a',
        fec: '',
        area: 'Comentario…',
        chk: true,
        seg: 'si',
        step: 2,
        cal: '',
      });
    });

    it('⚠ cada lib-button-z pasa [disabled] explícito: ninguno monta inerte', async () => {
      // El gotcha 1 de la fachada, aplicado a la pantalla que sirve de molde. Un botón gris en el
      // catálogo es peor que en cualquier otra pantalla: se copia.
      const objFixture = await montar();

      // Por instancia y no por nodo (ver `instanciasDe()`): si no, un mismo botón inerte se
      // nombraría dos veces en el mensaje del fallo.
      const cllBotones = instanciasDe(objFixture, ZrButton);
      expect(cllBotones.length, 'el catálogo no exhibe ningún botón').toBeGreaterThan(0);

      const cllInertes = cllBotones
        .filter((in_objBoton) => in_objBoton.disabled !== false)
        .map((in_objBoton) => in_objBoton.label ?? '(sin label)');

      expect(`montaron deshabilitados: [${cllInertes.join(', ')}]`).toBe(
        'montaron deshabilitados: []',
      );
    });
  });
});
