// modal-z.class-only.spec.ts
import { ModalZ } from './modal-z';

describe('ModalZ (class-only)', () => {
  // Simula un QueryList<ZTemplate> mínimo (solo with forEach)
  function ql(items: Array<{ id: string; template: any }>) {
    return {
      forEach: (fn: (item: { id: string; template: any }) => void) => {
        items.forEach(fn);
      },
    } as any;
  }

  it('defaults', () => {
    const c = new ModalZ();
    expect(c.open).toBeFalse();
    expect(c.tamanio).toBe('');
    expect(c.ShowBackdrop).toBeTrue();

    expect(c.title).toBeUndefined();
    expect(c.content).toBeUndefined();
    expect(c.buttons).toBeUndefined();

    expect(c.close).toBeTruthy(); // EventEmitter existe
  });

  it('ngOnInit no lanza errores', () => {
    const c = new ModalZ();
    expect(() => c.ngOnInit()).not.toThrow();
  });

  it('ngAfterContentInit: asigna title, content y buttons según id', () => {
    const c = new ModalZ();
    const T = { tag: 'TITLE' };
    const C = { tag: 'CONTENT' };
    const B = { tag: 'BUTTONS' };

    (c as any).template = ql([
      { id: 'title', template: T },
      { id: 'content', template: C },
      { id: 'buttons', template: B },
    ]);

    c.ngAfterContentInit();

    expect(c.title).toBe(T);
    expect(c.content).toBe(C);
    expect(c.buttons).toBe(B);
  });

  it('ignora ids desconocidos (no asigna slots)', () => {
    const c = new ModalZ();
    (c as any).template = ql([
      { id: 'unknown', template: { x: 1 } },
      { id: 'otro', template: { y: 2 } },
    ]);

    c.ngAfterContentInit();

    expect(c.title).toBeUndefined();
    expect(c.content).toBeUndefined();
    expect(c.buttons).toBeUndefined();
  });

  it('IDs duplicados: el último prevalece', () => {
    const c = new ModalZ();
    const T1 = { tag: 'T1' },
      T2 = { tag: 'T2' };
    const C1 = { tag: 'C1' },
      C2 = { tag: 'C2' };
    const B1 = { tag: 'B1' },
      B2 = { tag: 'B2' };

    (c as any).template = ql([
      { id: 'title', template: T1 },
      { id: 'title', template: T2 },
      { id: 'content', template: C1 },
      { id: 'content', template: C2 },
      { id: 'buttons', template: B1 },
      { id: 'buttons', template: B2 },
    ]);

    c.ngAfterContentInit();

    expect(c.title).toBe(T2);
    expect(c.content).toBe(C2);
    expect(c.buttons).toBe(B2);
  });

  it('lista vacía o templates undefined: no rompe', () => {
    const c = new ModalZ();

    // Vacía
    (c as any).template = ql([]);
    c.ngAfterContentInit();
    expect(c.title).toBeUndefined();
    expect(c.content).toBeUndefined();
    expect(c.buttons).toBeUndefined();

    // Con undefined
    (c as any).template = ql([
      { id: 'title', template: undefined },
      { id: 'content', template: undefined },
      { id: 'buttons', template: undefined },
    ]);
    c.ngAfterContentInit();
    expect(c.title).toBeUndefined();
    expect(c.content).toBeUndefined();
    expect(c.buttons).toBeUndefined();
  });

  it('re-ejecutar ngAfterContentInit no limpia asignaciones previas (comportamiento actual)', () => {
    const c = new ModalZ();
    const T = { tag: 'T' };
    const C = { tag: 'C' };

    (c as any).template = ql([
      { id: 'title', template: T },
      { id: 'content', template: C },
    ]);

    c.ngAfterContentInit();
    expect(c.title).toBe(T);
    expect(c.content).toBe(C);
    expect(c.buttons).toBeUndefined();

    const B = { tag: 'B' };
    (c as any).template = ql([{ id: 'buttons', template: B }]);
    c.ngAfterContentInit();

    // T y C siguen "pegados", B se agrega
    expect(c.title).toBe(T);
    expect(c.content).toBe(C);
    expect(c.buttons).toBe(B);
  });

  it('change(event): cierra el modal y emite close(false)', (done) => {
    const c = new ModalZ();
    c.open = true;

    c.close.subscribe((v) => {
      expect(v).toBeFalse();
      done();
    });

    c.change({ type: 'click' } as any);

    expect(c.open).toBeFalse();
  });

  it('simula lógica de clase CSS según tamanio (ngClass del template)', () => {
    const c = new ModalZ();
    const resolveClass = () =>
      c.tamanio === 'l'
        ? 'modal-window--l'
        : c.tamanio === 'm'
        ? 'modal-window--m'
        : c.tamanio === 's'
        ? 'modal-window--s'
        : c.tamanio === 'xs'
        ? 'modal-window--xs'
        : 'modal-window--xs';

    c.tamanio = 'l';
    expect(resolveClass()).toBe('modal-window--l');
    c.tamanio = 'm';
    expect(resolveClass()).toBe('modal-window--m');
    c.tamanio = 's';
    expect(resolveClass()).toBe('modal-window--s');
    c.tamanio = 'xs';
    expect(resolveClass()).toBe('modal-window--xs');
    c.tamanio = '???';
    expect(resolveClass()).toBe('modal-window--xs'); // fallback
    c.tamanio = '';
    expect(resolveClass()).toBe('modal-window--xs'); // fallback
  });

  it('ShowBackdrop/ open son inputs simples (no afectan lógica TS)', () => {
    const c = new ModalZ();
    c.ShowBackdrop = false;
    c.open = true;
    expect(c.ShowBackdrop).toBeFalse();
    expect(c.open).toBeTrue();
  });
});
