import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { FormSectionComponent } from './form-section';

/**
 * Port de `components/FormSection.test.tsx` (5 casos), más 2 casos propios de Angular.
 *
 * ── ⚠ Dos casos de React NO se portan literal, y hay que decir por qué ───────────────────────────
 * El baseline aseveraba la estructura contando hijos: `.form-section-card` con **2** hijos sin
 * action/footer y **3** con ellos, y `.form-section-header span` con 1 o 2. Eso medía una propiedad de
 * **React**: que un `{action && <span>}` no monta nada cuando la prop no viene.
 *
 * En Angular la premisa no se sostiene. Con `ng-content` el wrapper del action **existe siempre**
 * (`.form-section-header span` da 2 aunque nadie proyecte nada) y el `ng-content select="[footer]"`
 * no emite un nodo propio, así que `.form-section-card` tiene 2 hijos en los dos casos. Portar el
 * conteo tal cual daría un test rojo por una diferencia de framework, y "arreglarlo" ajustando el
 * número esperado sería peor: quedaría un test que pasa sin aseverar nada de lo que importaba.
 *
 * Lo que importaba era **"el action y el footer aparecen donde corresponde, y no aparecen si no se
 * pasan"**, así que se asevera eso directamente: contenido presente/ausente y su ubicación (dentro
 * del header vs. hermano del body). Es la misma intención, medida sobre lo que este componente sí
 * controla — y de hecho es más fuerte, porque el conteo de hijos pasaba igual con el contenido en el
 * lugar equivocado.
 *
 * Los otros 3 casos del baseline (título + contenido · action y footer cuando se pasan · color por
 * defecto) se portan 1:1.
 */

@Component({
  standalone: true,
  imports: [FormSectionComponent],
  template: `
    <app-form-section [title]="titulo()" [color]="color()">
      @if (conAction()) {
        <button action>Ayuda</button>
      }
      <span>Contenido</span>
      @if (conFooter()) {
        <div footer>Pie</div>
      }
    </app-form-section>
  `,
})
class Host {
  readonly titulo = signal('Datos del consumidor');
  readonly color = signal('var(--z-blue)');
  readonly conAction = signal(false);
  readonly conFooter = signal(false);
}

describe('FormSectionComponent', () => {
  let objFixture: ComponentFixture<Host>;

  /** El card, que es la raíz de lo que pinta el componente. */
  function card(): HTMLElement {
    return objFixture.nativeElement.querySelector('.form-section-card') as HTMLElement;
  }

  beforeEach(async () => {
    objFixture = TestBed.createComponent(Host);
    await objFixture.whenStable();
  });

  it('renderiza el título y el contenido proyectado', () => {
    expect(objFixture.nativeElement.textContent).toContain('Datos del consumidor');
    expect(objFixture.nativeElement.textContent).toContain('Contenido');
    // El título va en el header, no suelto en el body.
    expect(
      objFixture.nativeElement.querySelector('.form-section-header')!.textContent,
    ).toContain('Datos del consumidor');
    // Y el contenido va en el body.
    expect(objFixture.nativeElement.querySelector('.form-section-body')!.textContent).toContain(
      'Contenido',
    );
  });

  it('monta el action DENTRO del header y el footer FUERA del body', async () => {
    // Port del caso `renderiza action y footer cuando se pasan`, reforzado con la ubicación (ver el
    // docstring: el conteo de hijos de React pasaba igual con el contenido en el lugar equivocado).
    objFixture.componentInstance.conAction.set(true);
    objFixture.componentInstance.conFooter.set(true);
    await objFixture.whenStable();

    const objHeader = objFixture.nativeElement.querySelector('.form-section-header') as HTMLElement;
    const objBody = objFixture.nativeElement.querySelector('.form-section-body') as HTMLElement;

    expect(objHeader.textContent).toContain('Ayuda');
    // El action NO puede caer en el body: si el `ng-content` sin `select` estuviera declarado primero,
    // se comería el `[action]` y terminaría acá. Es la aserción que detecta ese error de orden.
    expect(objBody.textContent).not.toContain('Ayuda');

    expect(card().textContent).toContain('Pie');
    // El footer es hermano del body, no parte de él.
    expect(objBody.textContent).not.toContain('Pie');
  });

  it('sin action ni footer, su contenido no aparece en ninguna parte', () => {
    // Port del caso `sin action/footer no los renderiza`. Se asevera la ausencia del CONTENIDO (no el
    // conteo de nodos, ver el docstring): con los `@if` del host en false, ni 'Ayuda' ni 'Pie' existen.
    expect(card().textContent).not.toContain('Ayuda');
    expect(card().textContent).not.toContain('Pie');
    // El body sigue teniendo su contenido: la ausencia de los otros dos no se logró vaciando todo.
    expect(objFixture.nativeElement.querySelector('.form-section-body')!.textContent).toContain(
      'Contenido',
    );
  });

  it('usa el color por defecto (--z-blue) en el header si la pantalla no pasa color', async () => {
    // Port 1:1 del caso de React. El default se preserva textual porque hay pantallas que no pasan
    // color y su header tiene que seguir saliendo azul.
    @Component({
      standalone: true,
      imports: [FormSectionComponent],
      template: `<app-form-section title="T"><span>B</span></app-form-section>`,
    })
    class HostSinColor {}

    const objSinColor = TestBed.createComponent(HostSinColor);
    await objSinColor.whenStable();

    const objHeader = objSinColor.nativeElement.querySelector(
      '.form-section-header',
    ) as HTMLElement;
    expect(objHeader.style.backgroundColor).toBe('var(--z-blue)');
  });

  it('respeta el color que le pasa la pantalla', async () => {
    // Contraparte del anterior: sin esto, el test del default no distingue "toma el default" de
    // "ignora el input y siempre pinta azul".
    objFixture.componentInstance.color.set('var(--z-red)');
    await objFixture.whenStable();

    const objHeader = objFixture.nativeElement.querySelector('.form-section-header') as HTMLElement;
    expect(objHeader.style.backgroundColor).toBe('var(--z-red)');
  });

  it('el wrapper del action queda vacío cuando no se proyecta nada (lo colapsa el :empty)', () => {
    // ── Caso propio de Angular, no hay equivalente en React ──
    // React montaba el span del action solo si venía la prop; con `ng-content` el wrapper existe
    // siempre y lleva `margin-left: auto`, así que uno vacío **seguiría empujando el layout del flex**
    // y desalinearía el título en todas las secciones sin action (la mayoría). La neutralización es
    // `.form-section-action:empty { display: none }`.
    //
    // Lo que se asevera es la PRECONDICIÓN de esa regla CSS —que `:empty` matchee—, porque jsdom no
    // aplica los estilos del componente y `getComputedStyle().display` no diría nada útil.
    //
    // ⚠ Se asevera `matches(':empty')` y NO `childNodes.length === 0`, y la diferencia es el punto
    // del caso. Cuando la pantalla condiciona el action con un `@if`, Angular deja su ancla de
    // control de flujo —un nodo COMENTARIO, `<!--container-->`— dentro del wrapper, así que
    // `childNodes` da 1 incluso sin action visible. Medido: con host estático el wrapper queda en 0
    // nodos; con `@if` apagado queda en 1 (tipo 8, comentario). **`:empty` sigue matcheando en los
    // dos casos**, porque la spec de CSS ignora los comentarios y solo mira elementos y texto — que
    // es exactamente el motivo por el que el arreglo funciona igual con `@if`, que es como las
    // pantallas reales van a condicionar el action. Aseverar el conteo de nodos habría dado rojo con
    // el componente perfectamente sano.
    const objWrapper = objFixture.nativeElement.querySelector(
      '.form-section-action',
    ) as HTMLElement;

    expect(objWrapper).not.toBeNull();
    expect(objWrapper.matches(':empty')).toBe(true);
    // Sin texto tampoco: un espacio suelto en el template SÍ rompería `:empty` (a diferencia del
    // comentario), y esa es la forma realista de que el arreglo deje de aplicar.
    expect(objWrapper.textContent).toBe('');

    // ── Y la regla CSS tiene que EXISTIR, no solo poder aplicar ──
    // La mutación lo dejó en evidencia: borrando `.form-section-action:empty { display: none }` del
    // componente, todo lo de arriba seguía verde (el wrapper igual queda `:empty`) y el arreglo del
    // layout desaparecía sin que la suite dijera nada. jsdom no computa los estilos de un componente
    // Angular, así que `getComputedStyle` no sirve: la única forma de aseverar la regla es leer la
    // hoja que el componente inyecta en el `<head>`.
    //
    // El `[^{]*` del medio no es holgura de más: Angular emite la regla **con su atributo de
    // encapsulación intercalado** (`.form-section-action[_ngcontent-a-c123]:empty`), así que un patrón
    // que pegue la clase al `:empty` no matchea nunca — da rojo con el componente sano, que es
    // justamente lo que pasó al escribir este caso la primera vez.
    const strEstilos = Array.from(document.querySelectorAll('style'))
      .map((in_objEstilo) => in_objEstilo.textContent ?? '')
      .join('\n')
      .replace(/\s+/g, ' ');
    expect(strEstilos).toMatch(/\.form-section-action[^{]*:empty\s*\{[^}]*display:\s*none/);
  });

  it('el wrapper del action deja de estar vacío al proyectar (el :empty ya no aplica)', async () => {
    // Contraparte del anterior, y es la que le da valor: sin ella, el test de arriba pasaría igual si
    // el wrapper estuviera vacío SIEMPRE (o sea, si la proyección del action estuviera rota), y el
    // action nunca se vería.
    objFixture.componentInstance.conAction.set(true);
    await objFixture.whenStable();

    const objWrapper = objFixture.nativeElement.querySelector(
      '.form-section-action',
    ) as HTMLElement;

    expect(objWrapper.matches(':empty')).toBe(false);
    expect(objWrapper.textContent).toContain('Ayuda');
  });
});
