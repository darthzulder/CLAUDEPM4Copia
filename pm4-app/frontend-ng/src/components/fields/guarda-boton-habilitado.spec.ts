import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guarda cross-pantalla: **todo componente que declare `ZrButton` en sus `imports` declara también
 * `BotonHabilitado`**.
 *
 * ── Por qué hace falta ────────────────────────────────────────────────────────────────────────
 * La directiva de [`boton-habilitado.ts`](./boton-habilitado.ts) no se escribe en la plantilla: su
 * selector es `lib-button-z` a secas, así que aplica sola. La contrapartida es que **solo aplica si la
 * pantalla la tiene en `imports`**, y olvidarla no produce ningún error: los botones vuelven al default
 * `disabled = true` del vendor y quedan inertes, pintados y silenciosos. Es exactamente el mismo fallo
 * silencioso que la directiva existe para eliminar, reintroducido por omisión.
 *
 * Es la misma clase de guarda que [`guarda-ngmodel.spec.ts`](./guarda-ngmodel.spec.ts) y
 * [`guarda-formcontrolname.spec.ts`](./guarda-formcontrolname.spec.ts), y por el mismo motivo: *un spec
 * por pantalla asevera lo que la pantalla declara; no puede aseverar lo que la pantalla olvidó
 * declarar*. Una pantalla nueva con un botón muerto tiene su propio spec en verde —su smoke test monta
 * y pasa— hasta que alguien la abre y el botón no responde.
 *
 * ── Por qué se lee el disco ───────────────────────────────────────────────────────────────────
 * Igual que en `guarda-ngmodel.spec.ts`: la fuente de verdad son los `.ts` de este repo. Medido: `fs`
 * funciona en este runner y el cwd es la raíz del proyecto.
 *
 * ── El límite honesto de esta guarda ──────────────────────────────────────────────────────────
 * Es textual, no semántica: mira el array `imports` con una regex. Un consumidor que armara sus
 * `imports` por una constante externa (`imports: CLL_COMUNES`) la esquivaría. Hoy no hay ninguno
 * —verificado: los 25 consumidores escriben el array literal— y la convención del proyecto es
 * declararlo inline, así que el agujero es teórico. Se documenta en vez de fingir cobertura total.
 */
describe('guarda de BotonHabilitado (default de ButtonZ.disabled)', () => {
  /** Recorre `src` juntando los `.ts` que no son specs. */
  function cllFuentes(in_strDir: string): string[] {
    const cllSalida: string[] = [];
    for (const objEntrada of readdirSync(in_strDir, { withFileTypes: true })) {
      const strRuta = join(in_strDir, objEntrada.name);
      if (objEntrada.isDirectory()) cllSalida.push(...cllFuentes(strRuta));
      else if (objEntrada.name.endsWith('.ts') && !objEntrada.name.includes('.spec.'))
        cllSalida.push(strRuta);
    }

    return cllSalida;
  }

  /**
   * Quita comentarios de bloque y de línea antes de buscar. **No es cosmético:** el docstring de
   * `zds-reexports.ts` documenta el uso de la fachada con un ejemplo literal
   * —`// @Component({ imports: [ZrButton, ZrTable], ... })`— y sin este paso la guarda lo denunciaba
   * como pantalla infractora. La alternativa era mutilar la documentación para satisfacer una regex,
   * que es exactamente al revés de lo que corresponde.
   */
  function strSinComentarios(in_strFuente: string): string {
    return in_strFuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  }

  /**
   * Extrae el contenido de cada array `imports: [...]` del archivo. No es un parser: corta en el primer
   * `]`, que alcanza porque en este proyecto los `imports` son listas planas de identificadores (no hay
   * arrays anidados ni `...spread` de otro array).
   */
  function cllBloquesImports(in_strFuente: string): string[] {
    return [...strSinComentarios(in_strFuente).matchAll(/imports:\s*\[([^\]]*)\]/g)].map(
      (in_objM) => in_objM[1],
    );
  }

  it('⚠ toda pantalla que importa ZrButton importa también BotonHabilitado', () => {
    const cllRutas = cllFuentes('src');

    // Que el barrido encuentre algo, y que encuentre consumidores. Sin esto, un cambio de cwd dejaría
    // la guarda recorriendo cero archivos y pasando vacía — el falso verde que ya costó dos gates.
    expect(cllRutas.length).toBeGreaterThan(50);

    const cllInfractoras: string[] = [];
    let intConsumidores = 0;

    for (const strRuta of cllRutas) {
      const strFuente = readFileSync(strRuta, 'utf8');
      for (const strBloque of cllBloquesImports(strFuente)) {
        if (!/\bZrButton\b/.test(strBloque)) continue;
        intConsumidores++;
        if (!/\bBotonHabilitado\b/.test(strBloque)) cllInfractoras.push(strRuta);
      }
    }

    // La contraparte del piso de arriba: si `ZrButton` se renombrara, el bucle no encontraría un solo
    // consumidor y la guarda pasaría sin aseverar nada.
    expect(intConsumidores).toBeGreaterThan(10);

    expect(
      cllInfractoras,
      `Estos componentes declaran ZrButton sin BotonHabilitado, así que sus <lib-button-z> sin ` +
        `[disabled] montan INERTES (el default del vendor es true). Sumar BotonHabilitado a los ` +
        `imports — ver components/fields/boton-habilitado.ts:\n  ${cllInfractoras.join('\n  ')}`,
    ).toEqual([]);
  });

  it('la guarda detecta el patrón que exige (y no confunde el que permite)', () => {
    // Sin este caso, una regex que no matchea nada haría pasar el caso de arriba para siempre y se
    // vería idéntica a una guarda que funciona.
    const strRoto = `@Component({ imports: [ReactiveFormsModule, ZrButton, ZrLoader] })`;
    const strSano = `@Component({ imports: [ReactiveFormsModule, ZrButton, BotonHabilitado] })`;
    const strSinBoton = `@Component({ imports: [ReactiveFormsModule, ZdsInput] })`;

    expect(cllBloquesImports(strRoto).some((in_s) => /\bZrButton\b/.test(in_s))).toBe(true);
    expect(cllBloquesImports(strRoto).some((in_s) => /\bBotonHabilitado\b/.test(in_s))).toBe(false);
    expect(cllBloquesImports(strSano).some((in_s) => /\bBotonHabilitado\b/.test(in_s))).toBe(true);
    expect(cllBloquesImports(strSinBoton).some((in_s) => /\bZrButton\b/.test(in_s))).toBe(false);

    // Y que sepa leer un array multilínea, que es la forma real en las 25 pantallas.
    const strMultilinea = `@Component({\n  imports: [\n    ZrButton,\n    BotonHabilitado,\n  ],\n})`;
    expect(cllBloquesImports(strMultilinea).some((in_s) => /\bBotonHabilitado\b/.test(in_s))).toBe(
      true,
    );
  });

  it('un `imports` que vive en un COMENTARIO no cuenta como consumidor', () => {
    // El caso real que hizo falta: el docstring de `zds-reexports.ts` trae el ejemplo de uso
    // `// @Component({ imports: [ZrButton, ZrTable], ... })`, y sin despojar comentarios la guarda lo
    // denunciaba como pantalla con botones muertos. Si alguien saca `strSinComentarios` por
    // considerarlo de más, este caso se pone rojo antes de que el falso positivo vuelva.
    const strDocstring = `/**\n * @Component({ imports: [ZrButton, ZrTable] })\n */\nexport const X = 1;`;
    expect(cllBloquesImports(strDocstring)).toEqual([]);

    const strLinea = `// imports: [ZrButton]\nexport const Y = 2;`;
    expect(cllBloquesImports(strLinea)).toEqual([]);
  });
});
