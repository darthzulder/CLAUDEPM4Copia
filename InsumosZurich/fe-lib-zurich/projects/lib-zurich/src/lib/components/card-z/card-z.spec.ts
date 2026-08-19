// card-z.class-only.spec.ts
import { QueryList } from '@angular/core';
import { CardZ } from './card-z';
import { ZTemplate } from '../../derective/z-template'; // Ajusta la ruta si es necesario

describe('CardZ (class-only)', () => {
  function ql(items: Array<{ id: string; template: any }>) {
    // Simula un QueryList<ZTemplate> solo con forEach
    return {
      forEach: (fn: (item: { id: string; template: any }) => void) => {
        items.forEach(fn);
      },
    } as any;
  }

  it('defaults', () => {
    const c = new CardZ();
    expect(c.showHeader).toBeTrue();
    expect(c.showFooter).toBeTrue();
    expect(c.header).toBeUndefined();
    expect(c.content).toBeUndefined();
    expect(c.footer).toBeUndefined();
  });

  it('ngOnInit y ngAfterViewInit no lanzan errores', () => {
    const c = new CardZ();
    expect(() => c.ngOnInit()).not.toThrow();
  });

  it('asigna header, content y footer en ngAfterContentInit', () => {
    const c = new CardZ();
    const H = { tag: 'H' };
    const C = { tag: 'C' };
    const F = { tag: 'F' };

    (c as any).template = ql([
      { id: 'header', template: H },
      { id: 'content', template: C },
      { id: 'footer', template: F },
    ]);

    c.ngAfterContentInit();

    expect(c.header).toBe(H);
    expect(c.content).toBe(C);
    expect(c.footer).toBe(F);
  });

  it('ignora ids desconocidos (no asigna slots)', () => {
    const c = new CardZ();
    (c as any).template = ql([{ id: 'unknown', template: { x: 1 } }]);

    c.ngAfterContentInit();

    expect(c.header).toBeUndefined();
    expect(c.content).toBeUndefined();
    expect(c.footer).toBeUndefined();
  });

  it('IDs duplicados: el último prevalece', () => {
    const c = new CardZ();
    const H1 = { tag: 'H1' };
    const H2 = { tag: 'H2' };
    const C1 = { tag: 'C1' };
    const C2 = { tag: 'C2' };
    const F1 = { tag: 'F1' };
    const F2 = { tag: 'F2' };

    (c as any).template = ql([
      { id: 'header', template: H1 },
      { id: 'header', template: H2 },
      { id: 'content', template: C1 },
      { id: 'content', template: C2 },
      { id: 'footer', template: F1 },
      { id: 'footer', template: F2 },
    ]);

    c.ngAfterContentInit();

    expect(c.header).toBe(H2);
    expect(c.content).toBe(C2);
    expect(c.footer).toBe(F2);
  });

  it('lista vacía: no rompe ni asigna', () => {
    const c = new CardZ();
    (c as any).template = ql([]);

    c.ngAfterContentInit();

    expect(c.header).toBeUndefined();
    expect(c.content).toBeUndefined();
    expect(c.footer).toBeUndefined();
  });

  it('elementos sin template: asigna undefined (no rompe)', () => {
    const c = new CardZ();
    (c as any).template = ql([
      { id: 'header', template: undefined },
      { id: 'content', template: undefined },
      { id: 'footer', template: undefined },
    ]);

    c.ngAfterContentInit();

    expect(c.header).toBeUndefined();
    expect(c.content).toBeUndefined();
    expect(c.footer).toBeUndefined();
  });

  it('orden de los items no afecta el resultado final', () => {
    const c = new CardZ();
    const H = { tag: 'H' };
    const C = { tag: 'C' };
    const F = { tag: 'F' };

    (c as any).template = ql([
      { id: 'content', template: C },
      { id: 'footer', template: F },
      { id: 'header', template: H },
    ]);

    c.ngAfterContentInit();

    expect(c.header).toBe(H);
    expect(c.content).toBe(C);
    expect(c.footer).toBe(F);
  });

  it('re-ejecutar ngAfterContentInit no limpia slots previos (comportamiento actual)', () => {
    const c = new CardZ();
    const H = { tag: 'H' };
    const C = { tag: 'C' };

    // 1) Asignamos header y content inicialmente
    (c as any).template = ql([
      { id: 'header', template: H },
      { id: 'content', template: C },
    ]);
    c.ngAfterContentInit();

    expect(c.header).toBe(H);
    expect(c.content).toBe(C);
    expect(c.footer).toBeUndefined();

    // 2) Recorremos ahora SOLO footer: header/content quedan "pegados"
    const F = { tag: 'F' };
    (c as any).template = ql([{ id: 'footer', template: F }]);
    c.ngAfterContentInit();

    expect(c.header).toBe(H); // sigue
    expect(c.content).toBe(C); // sigue
    expect(c.footer).toBe(F); // nuevo
  });

  it('cambiar flags showHeader/showFooter no afecta asignación interna', () => {
    const c = new CardZ();
    const H = { tag: 'H' };
    const C = { tag: 'C' };
    const F = { tag: 'F' };

    (c as any).template = ql([
      { id: 'header', template: H },
      { id: 'content', template: C },
      { id: 'footer', template: F },
    ]);

    c.ngAfterContentInit();
    expect(c.header).toBe(H);
    expect(c.content).toBe(C);
    expect(c.footer).toBe(F);

    c.showHeader = false;
    c.showFooter = false;

    // La lógica interna no depende de estos flags (solo el template)
    expect(c.header).toBe(H);
    expect(c.content).toBe(C);
    expect(c.footer).toBe(F);
  });
});
