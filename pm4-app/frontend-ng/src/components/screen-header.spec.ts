import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScreenHeaderComponent, type SubtituloScreenHeader } from './screen-header';

/**
 * Port de `components/ScreenHeader.test.tsx` (6 casos), más 1 caso propio.
 *
 * Los 6 de React van 1:1: título + logo con `alt="Zurich"` · sin subtítulo no hay bloque `.subtitle` ·
 * un string se envuelve en UN span · la lista filtra los falsy · una lista toda falsy no arma bloque ·
 * el markup propio se pinta tal cual, SIN el wrapper `.subtitle`.
 *
 * ── El caso nuevo: el `0` se descarta, y es a propósito ──────────────────────────────────────────
 * `.filter(Boolean)` se hereda textual de React, así que un fragmento que sea el número `0` no se
 * pinta. El componente lo documenta como decisión (es una migración de framework, no un rediseño) y
 * este caso es la contraparte ejecutable de esa nota: el día que alguien lo "arregle" a un filtro de
 * `null`/`undefined`/`false`, el test se pone rojo y le cuenta que era deliberado — en vez de que el
 * cambio de comportamiento entre en silencio.
 *
 * ── Sobre el logo: se asevera el `alt`, no la ruta exacta ────────────────────────────────────────
 * React lo aseveraba con `getByAltText('Zurich')`, y el `alt` es lo que importa (accesibilidad y el
 * contrato con el lector de pantalla). La ruta sí se asevera, pero por su cola (`endsWith`): jsdom
 * resuelve el `src` de un `<img>` a URL absoluta contra `location.href`, así que comparar el string
 * completo aseveraría el host del runner, que no es parte del contrato.
 */

@Component({
  standalone: true,
  imports: [ScreenHeaderComponent],
  template: `
    <ng-template #plantillaPropia>
      <div class="subtitulo-propio">Markup de la pantalla</div>
    </ng-template>
    <app-screen-header [title]="titulo()" [subtitle]="subtitulo()" />
  `,
})
class Host {
  readonly plantilla = viewChild.required<TemplateRef<unknown>>('plantillaPropia');
  readonly titulo = signal('Crear/Recibir queja');
  readonly subtitulo = signal<SubtituloScreenHeader | undefined>(undefined);
}

describe('ScreenHeaderComponent', () => {
  let objFixture: ComponentFixture<Host>;

  /** Fija el subtítulo y espera el render. */
  async function conSubtitulo(in_genSubtitulo: SubtituloScreenHeader | undefined): Promise<void> {
    objFixture.componentInstance.subtitulo.set(in_genSubtitulo);
    await objFixture.whenStable();
  }

  /** El bloque `.subtitle`, o `null` si no se montó. */
  function bloqueSubtitulo(): HTMLElement | null {
    return objFixture.nativeElement.querySelector('.subtitle');
  }

  /** Los spans de fragmento, en orden. */
  function fragmentos(): string[] {
    return Array.from(bloqueSubtitulo()?.querySelectorAll('span') ?? []).map(
      (in_objSpan) => (in_objSpan as HTMLElement).textContent!.trim(),
    );
  }

  beforeEach(async () => {
    objFixture = TestBed.createComponent(Host);
    await objFixture.whenStable();
  });

  it('renderiza el título y el logo de Zurich', () => {
    expect(objFixture.nativeElement.querySelector('h1')!.textContent).toContain(
      'Crear/Recibir queja',
    );

    const objLogo = objFixture.nativeElement.querySelector('img') as HTMLImageElement;
    // El `alt` es el contrato accesible, y era la aserción del baseline (`getByAltText('Zurich')`).
    expect(objLogo.alt).toBe('Zurich');
    // La ruta por su cola: jsdom resuelve el `src` contra `location.href`, así que el string completo
    // llevaría el host del runner adentro.
    expect(objLogo.src).toContain('resources/zurich/');
    expect(objLogo.src.endsWith('.png')).toBe(true);
  });

  it('sin subtítulo no monta el bloque .subtitle', () => {
    // Importa porque un contenedor vacío igual ocupa espacio y desalinea la cabecera.
    expect(bloqueSubtitulo()).toBeNull();
    // Y el título sigue estando: la ausencia no se logró dejando la cabecera vacía.
    expect(objFixture.nativeElement.querySelector('h1')).not.toBeNull();
  });

  it('un subtítulo string se envuelve en UN solo span', async () => {
    await conSubtitulo('Radicado 12345');

    expect(bloqueSubtitulo()).not.toBeNull();
    // Se asevera el conteo, no solo que el texto exista: un string es UN fragmento, y si se
    // normalizara mal (por ejemplo iterando sus caracteres) el texto igual estaría presente.
    expect(fragmentos()).toEqual(['Radicado 12345']);
  });

  it('un subtítulo string vacío NO monta el bloque', async () => {
    // Es el mismo `if (subtitle)` de React: `''` es falsy, así que no arma cabecera con un span vacío.
    await conSubtitulo('');

    expect(bloqueSubtitulo()).toBeNull();
  });

  it('una lista de fragmentos filtra los falsy y conserva el orden', async () => {
    // Es la forma normal de uso: las pantallas arman el subtítulo con fragmentos condicionales, y los
    // que no aplican quedan en `false`/`undefined`/`null`. Sin el filtro se pintarían spans vacíos —o
    // peor, la palabra `false`.
    await conSubtitulo([
      'Caso #4821',
      false,
      'Estado: En gestión',
      undefined,
      null,
      'VENCIDO',
      '',
    ]);

    expect(fragmentos()).toEqual(['Caso #4821', 'Estado: En gestión', 'VENCIDO']);
    // Explícito: ninguna forma de falsy se filtró al DOM como texto.
    expect(bloqueSubtitulo()!.textContent).not.toContain('false');
    expect(bloqueSubtitulo()!.textContent).not.toContain('undefined');
    expect(bloqueSubtitulo()!.textContent).not.toContain('null');
  });

  it('una lista TODA falsy no monta el bloque', async () => {
    // Caso real: todas las condiciones del subtítulo dan false a la vez (un caso recién creado, sin
    // estado ni vencimiento). El bloque no debe quedar montado y vacío.
    await conSubtitulo([false, undefined, null, '']);

    expect(bloqueSubtitulo()).toBeNull();
  });

  it('⚠ un fragmento 0 se DESCARTA, y es deliberado', async () => {
    // Caso propio, no está en el baseline. `.filter(Boolean)` se heredó textual de React, así que el
    // número `0` cae con los falsy. Se preserva a propósito: cambiarlo sería un cambio de
    // comportamiento respecto de la app que se está migrando.
    //
    // Este caso existe para que el cambio no pueda entrar en silencio: quien "arregle" el filtro a
    // `!= null && !== false` verá este test rojo y el comentario que explica por qué estaba así. Si
    // alguna pantalla necesitara mostrar un cero, pasa el string `'0'` — que sí sobrevive, y por eso
    // va aseverado en el mismo caso.
    await conSubtitulo(['Reclamos previos:', 0, '0']);

    expect(fragmentos()).toEqual(['Reclamos previos:', '0']);
  });

  it('un TemplateRef se pinta tal cual, SIN el wrapper .subtitle', async () => {
    // Port del caso `renderiza un ReactNode como subtítulo`. El `.subtitle` de la lib aporta su propio
    // layout (spans en fila) y aplicarlo a markup ajeno le rompería el diseño a quien lo pasó — es el
    // mismo reparto que hacía la rama `else` de React.
    await conSubtitulo(objFixture.componentInstance.plantilla());

    expect(objFixture.nativeElement.querySelector('.subtitulo-propio')).not.toBeNull();
    expect(objFixture.nativeElement.textContent).toContain('Markup de la pantalla');
    // La aserción que le da valor al caso: el markup NO quedó envuelto.
    expect(bloqueSubtitulo()).toBeNull();
  });

  it('un TemplateRef no se imprime como objeto ni como texto', async () => {
    // La trampa concreta: un `TemplateRef` no es falsy, así que si el `@if (esPlantilla())` se
    // rompiera, `fragmentos` lo tomaría por "otra cosa" y el binding de texto podría imprimir su
    // `toString()`. Se asevera la ausencia de esa forma de fallar.
    await conSubtitulo(objFixture.componentInstance.plantilla());

    expect(objFixture.nativeElement.textContent).not.toContain('object');
  });

  it('cambiar de subtítulo string a lista y a plantilla no deja restos del anterior', async () => {
    // Las pantallas cambian el subtítulo al llegar la respuesta de PM4 (de vacío a "Caso #N"), así que
    // las tres formas se alternan en vivo. Sin este caso, los anteriores pasarían igual si el
    // componente solo supiera resolver la forma con la que se montó.
    await conSubtitulo('Cargando…');
    expect(fragmentos()).toEqual(['Cargando…']);

    await conSubtitulo(['Caso #4821', 'Estado: En gestión']);
    expect(fragmentos()).toEqual(['Caso #4821', 'Estado: En gestión']);
    expect(objFixture.nativeElement.textContent).not.toContain('Cargando…');

    await conSubtitulo(objFixture.componentInstance.plantilla());
    expect(bloqueSubtitulo()).toBeNull();
    expect(objFixture.nativeElement.textContent).not.toContain('Caso #4821');

    await conSubtitulo(undefined);
    expect(bloqueSubtitulo()).toBeNull();
    expect(objFixture.nativeElement.querySelector('.subtitulo-propio')).toBeNull();
  });
});
