import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { IndicePantallas } from './indice-pantallas';
import { listarSlugsEnrutables } from './pantallas';
import { STR_COMMIT_HASH } from '../env.generated';

/**
 * Specs del índice de desarrollo (la raíz **sin** `?screen=`).
 *
 * No es una pantalla de negocio y ningún usuario de PM4 la ve —el BPM siempre manda un `?screen=`—
 * pero sí es la puerta de entrada de **cada verificación manual de un gate**, así que si se rompe,
 * lo que se rompe es la forma de revisar todo lo demás.
 *
 * ── Qué se asevera, y qué sería un test de relleno ───────────────────────────────────────────
 * Lo que importa son las dos cosas que pueden desincronizarse en silencio:
 * 1. **Que la lista salga del registro**, no escrita a mano. Un índice mantenido a mano se
 *    desincroniza en el primer descuido y pasa a ser una lista que miente.
 * 2. **Que los enlaces apunten a `?screen=<slug>`** y no a `/<slug>`. Es el contrato de URL de PM4:
 *    con un path directo el índice ejercitaría un camino que el BPM no usa, y la traducción del query
 *    param —el único lugar donde se pierden el `task_id` y el `token`— quedaría sin recorrer justo en
 *    la pasada manual que existe para recorrerla.
 *
 * Aseverar el `<h1>` o el conteo textual sería test de relleno: se rompe con cualquier cambio de
 * copy y no protege nada.
 *
 * ── ⚠ Los casos con slugs INYECTAN la lista; no leen el registro real, y hay motivo ──────────
 * `listarSlugsEnrutables()` devuelve **`[]`** desde que se eliminó la ex SCR-010 (ago-2026), su
 * único alias, y las pantallas de negocio llegan en la Fase 5. Un caso que itere sobre el registro
 * real pasa por vacuidad hoy: el `for` no corre, el `toEqual([])` se cumple solo, y el archivo se ve
 * sano mientras no asevera nada.
 *
 * Es el mismo modo de falla que el gate 2 encontró tres veces, y ya había mordido en este archivo:
 * el caso del estado vacío preguntaba `if (length === 0)` y **nunca** corría su aserción, porque el
 * alias hacía que la lista tuviera un elemento. Al borrar el alias el error se invierte de lado, así
 * que la respuesta no es leer el registro sino **no depender de su contenido**: cada caso pisa
 * `cllSlugs` en la instancia con los datos que necesita, y así los tres siguen valiendo tanto hoy
 * (registro vacío) como en la Fase 5 (registro lleno), sin tener que tocarlos.
 */
describe('IndicePantallas', () => {
  /**
   * Monta el índice y devuelve su elemento raíz, con `cllSlugs` **pisado** por `in_cllSlugs`.
   *
   * Se pisa la propiedad de la instancia en vez de mockear `./pantallas`: `vi.mock()` sobre un import
   * relativo está prohibido bajo Angular 21 (ver el `PM4_ENV_FALLBACKS` de `app.config.ts` por el
   * mismo motivo), y pisar el campo es más honesto además — ejercita el mismo camino de render que
   * corre en producción, solo con otro dato de entrada.
   */
  async function montarConSlugs(in_cllSlugs: string[]): Promise<HTMLElement> {
    const objFixture = TestBed.createComponent(IndicePantallas);
    (objFixture.componentInstance as { cllSlugs: string[] }).cllSlugs = in_cllSlugs;
    await objFixture.whenStable();
    return objFixture.nativeElement as HTMLElement;
  }

  /**
   * Dos slugs con la forma real de PM4 (mayúsculas, guiones, prefijo `COL_`), no `'a'`/`'b'`.
   *
   * Importa para el caso del texto del enlace: los slugs reales se distinguen por el **final**, así
   * que un recorte que los volviera indistinguibles pasaría desapercibido con nombres cortos.
   */
  const CLL_SLUGS_DE_PRUEBA = [
    'COL_QD_SCR-008_Revision_Respuesta_SAC',
    'COL_QD_SCR-009_Formulario_Superintendencia',
  ];

  /** Monta el índice y devuelve su elemento raíz. */
  async function montar(): Promise<HTMLElement> {
    const objFixture = TestBed.createComponent(IndicePantallas);
    await objFixture.whenStable();
    return objFixture.nativeElement as HTMLElement;
  }

  it('muestra el hash del commit del build', async () => {
    const objRaiz = await montar();

    // Es lo que permite saber **qué build** corre dentro del iframe, donde no hay barra de direcciones
    // ni forma de mirar el deploy. Se compara contra la constante generada y no contra un literal:
    // el valor cambia en cada commit, así que un literal haría rojo el spec en la próxima corrida.
    expect(objRaiz.textContent).toContain(STR_COMMIT_HASH);
  });

  describe('el estado vacío', () => {
    it('dice que no hay pantallas en vez de mostrar una grilla vacía', async () => {
      // ⚠ **Se inyecta `[]` en vez de guardar la aserción tras un `if`.** La versión original de este
      // caso preguntaba `if (listarSlugsEnrutables().length === 0)` y no probaba nada: entonces el
      // registro **no** estaba vacío (tenía el alias de la ex SCR-010), así que la aserción nunca
      // corría y el caso salía verde por vacuidad. Hoy el registro sí está vacío y el `if` correría —
      // pero volvería a no correr en la Fase 5, con la primera pantalla portada. Inyectando el array,
      // la rama del `@if` se ejercita **siempre**, sin depender del inventario.
      const objRaiz = await montarConSlugs([]);

      // Una grilla vacía se lee como "algo se rompió"; el mensaje se lee como "todavía no hay nada".
      // La diferencia es quién sale a buscar un bug que no existe.
      expect(objRaiz.textContent).toContain('Todavía no hay pantallas de negocio portadas');
      expect(objRaiz.querySelector('.pm4-indice-grilla')).toBeNull();
    });

    it('hoy el registro real ESTÁ vacío, así que la app arranca en ese estado', async () => {
      // El puente entre los casos inyectados y la realidad: fija que el estado vacío no es una
      // hipótesis de test sino **lo que se ve al abrir la raíz hoy**. Es lo que un revisor del gate 4
      // necesita saber antes de reportar el índice como roto, y se pone rojo en la Fase 5 con la
      // primera pantalla registrada — que es cuando conviene volver a leer este archivo.
      expect(listarSlugsEnrutables()).toEqual([]);
      expect((await montar()).querySelector('.pm4-indice-grilla')).toBeNull();
    });
  });

  describe('con slugs en el registro', () => {
    it('lista un enlace por cada slug enrutable', async () => {
      const objRaiz = await montarConSlugs(CLL_SLUGS_DE_PRUEBA);
      const cllEnlaces = [...objRaiz.querySelectorAll('.pm4-indice-item')];

      // Con `listarSlugsEnrutables()` real esto sería `toHaveLength(0)` — verde con la grilla entera
      // borrada. Con los slugs inyectados asevera que el `@for` de verdad emite un item por slug, que
      // es lo único que este caso existe para cubrir.
      expect(cllEnlaces).toHaveLength(CLL_SLUGS_DE_PRUEBA.length);
    });

    it('⚠ cada enlace apunta a ?screen=<slug>, no a /<slug>', async () => {
      const objRaiz = await montarConSlugs(CLL_SLUGS_DE_PRUEBA);
      const cllHrefs = [...objRaiz.querySelectorAll('.pm4-indice-item')].map((in_objEnlace) =>
        in_objEnlace.getAttribute('href'),
      );

      // El contrato de URL de PM4. Con `/<slug>` el índice saltearía el `redirectTo` de
      // `app.routes.ts`, o sea que la verificación manual recorrería un camino distinto del que usa el
      // BPM — y la traducción del query param (donde se pierden `task_id` y `token` si alguien la
      // simplifica a un string) quedaría sin ejercitar en la única pasada que la ejercita.
      //
      // **Es el caso que más perdía con el registro vacío:** `[].map(...)` es `[]`, así que
      // `toEqual([])` se cumplía contra una grilla sin un solo enlace, y un `/<slug>` mal escrito
      // habría pasado igual.
      expect(cllHrefs).toEqual(
        CLL_SLUGS_DE_PRUEBA.map((in_strSlug) => `?screen=${in_strSlug}`),
      );
    });

    it('el texto del enlace nombra el slug completo', async () => {
      const objRaiz = await montarConSlugs(CLL_SLUGS_DE_PRUEBA);
      const strTexto = objRaiz.textContent ?? '';

      // Los slugs de PM4 son largos y se distinguen por el **final** (`SCR-008_...SAC` vs
      // `SCR-009_...Superintendencia`), así que recortarlos convertiría el índice en una lista de
      // items indistinguibles. Los dos slugs de prueba comparten el prefijo `COL_QD_SCR-00` a
      // propósito: un recorte a los primeros caracteres los volvería iguales y este caso lo ve.
      for (const strSlug of CLL_SLUGS_DE_PRUEBA) {
        expect(strTexto).toContain(strSlug);
      }
    });
  });
});
