import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BotonHabilitado } from './boton-habilitado';
import { ZrButton } from './zds-reexports';

/**
 * Specs de la directiva que invierte el default de `ButtonZ.disabled`. El detalle del defecto y de la
 * medición que decidió el diseño está en [`boton-habilitado.ts`](./boton-habilitado.ts).
 *
 * Lo que estos casos fijan, y que es más que "la directiva escribe `false`": que la plantilla **siga
 * ganando** en los tres casos que importan (`true` explícito, `false` explícito, expresión). Si la
 * directiva pisara un `[disabled]="true"` deliberado, sería peor que el defecto que arregla — un botón
 * que debía estar bloqueado quedaría activo, y eso sí rompe pantallas.
 *
 * Bajo jsdom los `za-*` de Lit no hacen upgrade, así que acá se asevera el **estado del componente de
 * Angular** (`ButtonZ.disabled`), que es donde vive el defecto. Que el `za-button` de adentro se pinte
 * gris es render y va al gate manual.
 */

@Component({
  standalone: true,
  imports: [ZrButton, BotonHabilitado],
  template: `
    <lib-button-z label="sin binding" />
    <lib-button-z label="bloqueado a mano" [disabled]="true" />
    <lib-button-z label="habilitado a mano" [disabled]="false" />
    <lib-button-z label="por expresión" [disabled]="blnEnviando" />
  `,
})
class HostConDirectiva {
  blnEnviando = true;
}

/** El mismo host sin la directiva: es el control de la medición y lo que la guarda evita. */
@Component({
  standalone: true,
  imports: [ZrButton],
  template: `<lib-button-z label="sin directiva" />`,
})
class HostSinDirectiva {}

/** Devuelve los botones de la fixture indexados por su `label`, que es más legible que por posición. */
async function dicBotones(in_objTipo: new () => unknown): Promise<Record<string, boolean>> {
  const objFixture = TestBed.createComponent(in_objTipo);
  await objFixture.whenStable();

  // Query por instancia y no por selector: cada `lib-button-z` deja el nodo del componente de Angular
  // y, más abajo, el `za-button`. Contar nodos daría el doble.
  const dicSalida: Record<string, boolean> = {};
  for (const objNodo of objFixture.debugElement.queryAll(
    (in_objNodo) => in_objNodo.componentInstance instanceof ZrButton,
  )) {
    const objBoton = objNodo.componentInstance as ZrButton;
    dicSalida[objBoton.label] = objBoton.disabled;
  }

  return dicSalida;
}

describe('BotonHabilitado · invierte el default de ButtonZ.disabled', () => {
  it('⚠ un botón SIN [disabled] queda HABILITADO — la razón de existir de la directiva', async () => {
    const dic = await dicBotones(HostConDirectiva);
    expect(dic['sin binding']).toBe(false);
  });

  it('el defecto que envuelve es real: sin la directiva, el mismo botón monta inerte', async () => {
    // El control de la medición. Sin este caso, el de arriba pasaría igual si el vendor arreglara el
    // default y la directiva se volviera innecesaria — y no habría forma de notarlo.
    const dic = await dicBotones(HostSinDirectiva);
    expect(dic['sin directiva']).toBe(true);
  });

  it('⚠ un [disabled]="true" explícito GANA — la directiva no pisa a la pantalla', async () => {
    // El caso que haría inservible a la directiva si fallara: un botón que la pantalla bloqueó a
    // propósito quedaría activo. Es el motivo por el que la escritura va en el constructor y no en
    // `ngOnInit` (ver el docstring de la directiva).
    const dic = await dicBotones(HostConDirectiva);
    expect(dic['bloqueado a mano']).toBe(true);
  });

  it('un [disabled] por expresión también gana, no solo un literal', async () => {
    // Un literal en la plantilla podría en teoría resolverse distinto que una expresión (el compilador
    // puede constant-foldear el primero). Medido: los dos pasan por el mismo `ɵɵproperty`.
    const dic = await dicBotones(HostConDirectiva);
    expect(dic['por expresión']).toBe(true);
  });

  it('los 43 [disabled]="false" que ya existen siguen funcionando igual', async () => {
    // No se borran de las plantillas (ver "Qué NO hace" en el docstring). Este caso fija que la
    // directiva es compatible con ellos en vez de redundante-pero-conflictiva.
    const dic = await dicBotones(HostConDirectiva);
    expect(dic['habilitado a mano']).toBe(false);
  });

  it('la directiva no necesita ningún atributo en la plantilla', () => {
    // El selector es el del componente, a secas. Si alguien lo cambiara a `lib-button-z[botonHabilitado]`
    // —que parece más explícito— las 65 plantillas dejarían de recibirla en silencio.
    const objMeta = Reflect.get(BotonHabilitado, 'ɵdir') as { selectors?: unknown[][] } | undefined;
    expect(objMeta?.selectors).toEqual([['lib-button-z']]);
  });
});
