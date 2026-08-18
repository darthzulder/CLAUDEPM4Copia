import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guarda cross-pantalla: **`[ngModel]` no vuelve a aparecer en ninguna plantilla del proyecto**.
 *
 * ── Por qué esto no puede ser un caso más de `modelo-za.spec.ts` ───────────────────────────────
 * `modelo-za.spec.ts` prueba que la directiva funciona. Esta guarda prueba algo distinto y que ningún
 * spec de componente puede cubrir: que **nadie eluda la directiva**. Es la misma lección que ya dejó
 * escrita [`guarda-formcontrolname.spec.ts`](./guarda-formcontrolname.spec.ts) — *un spec por pantalla
 * asevera lo que la pantalla declara; no puede aseverar lo que la pantalla olvidó declarar*. Una
 * pantalla futura que escriba `[ngModel]="algo"` sobre un `za-tabs` tiene su propio spec en verde
 * hasta que alguien la abre en un navegador y no monta: el `NG0201` se lo come el `ErrorHandler`.
 *
 * ── Por qué se lee el disco y no un dataset generado ──────────────────────────────────────────
 * `paridad-react.spec.ts` compara contra un `.json` congelado porque su fuente de verdad (el `.tsx`
 * de React) **desaparece en la Fase 7**. Acá es al revés: la fuente de verdad son los `.html` que
 * viven en este repo, así que leerlos directo es lo correcto — un dataset intermedio solo agregaría
 * un archivo que se desincroniza en silencio. Medido: `node:fs` funciona en este runner y el cwd es
 * la raíz del proyecto.
 *
 * ── Qué se prohíbe exactamente, y qué NO ──────────────────────────────────────────────────────
 * Solo el **binding de entrada** `[ngModel]`, que es el que crea el atributo que `NgControlStatus`
 * matchea. `(ngModelChange)` es legítimo y sigue permitido: un binding de salida no crea atributo, y
 * de hecho es la mitad de vuelta que la directiva usa internamente. Un `[(ngModel)]` de Angular sobre
 * un campo propio también caería en la prohibición; hoy no hay ninguno (la casa usa formularios
 * reactivos, `FormsModule` no está en ningún `imports`), así que la regla no le quita nada a nadie.
 */
describe('guarda de [ngModel] en plantillas (modelo-za)', () => {
  /** Recorre `src` juntando todos los `.html`. Sin dependencias: `readdirSync` recursivo y listo. */
  function cllPlantillas(in_strDir: string): string[] {
    const cllSalida: string[] = [];
    for (const objEntrada of readdirSync(in_strDir, { withFileTypes: true })) {
      const strRuta = join(in_strDir, objEntrada.name);
      if (objEntrada.isDirectory()) cllSalida.push(...cllPlantillas(strRuta));
      else if (objEntrada.name.endsWith('.html')) cllSalida.push(strRuta);
    }

    return cllSalida;
  }

  /**
   * `[ngModel]` y `[(ngModel)]`, con o sin espacios. No matchea `(ngModelChange)` ni `[modeloZa]`
   * porque exige el corchete de apertura pegado al nombre.
   */
  const RGX_PROHIBIDO = /\[\(?ngModel\)?\]\s*=/;

  it('⚠ ninguna plantilla de src escribe [ngModel] — se usa [(modeloZa)]', () => {
    const cllRutas = cllPlantillas('src');

    // Que el barrido encuentre algo. Sin esto, un cambio de cwd o de extensión dejaría la guarda
    // recorriendo cero archivos y pasando vacía — el falso verde que ya costó dos gates en este
    // proyecto.
    expect(cllRutas.length).toBeGreaterThan(10);

    const cllInfractoras = cllRutas.filter((in_strRuta) =>
      RGX_PROHIBIDO.test(readFileSync(in_strRuta, 'utf8')),
    );

    // El mensaje nombra el archivo y el arreglo: un `toHaveLength(0)` pelado obligaría a buscar a mano
    // cuál de las ~40 plantillas es la rota.
    expect(
      cllInfractoras,
      `Estas plantillas escriben [ngModel], que tira NG0201 y deja la pantalla sin montar. ` +
        `Van con [(modeloZa)] — ver components/fields/modelo-za.ts:\n  ${cllInfractoras.join('\n  ')}`,
    ).toEqual([]);
  });

  it('la guarda detecta el patrón que prohíbe (y no confunde el que permite)', () => {
    // Sin este caso, una regex que no matchea nada haría pasar el caso de arriba para siempre y se
    // vería idéntica a una guarda que funciona.
    expect(RGX_PROHIBIDO.test('<za-tabs [ngModel]="sigTab()" />')).toBe(true);
    expect(RGX_PROHIBIDO.test('<za-tabs [(ngModel)]="sigTab" />')).toBe(true);
    expect(RGX_PROHIBIDO.test('<za-tabs [ ngModel ]="x" />')).toBe(false); // forma que Angular no acepta

    // Los tres que SÍ son legítimos y no deben disparar.
    expect(RGX_PROHIBIDO.test('<za-tabs (ngModelChange)="f($event)" />')).toBe(false);
    expect(RGX_PROHIBIDO.test('<za-tabs [(modeloZa)]="sigTab" />')).toBe(false);
    expect(RGX_PROHIBIDO.test('<za-tabs [modeloZa]="x" (modeloZaChange)="f($event)" />')).toBe(false);
  });
});
