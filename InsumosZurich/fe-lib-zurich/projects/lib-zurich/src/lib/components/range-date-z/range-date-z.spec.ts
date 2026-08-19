// range-date-z.class-only.spec.ts
import { RangeDateZ } from './range-date-z';

describe('RangeDateZ (class-only)', () => {

  function make(overrides?: Partial<RangeDateZ>) {
    const c = new RangeDateZ();
    if (overrides) Object.assign(c, overrides);
    return c;
  }

  // ===================== Defaults =====================
  it('inicializa @Input con valores por defecto', () => {
    const c = make();
    expect(c.label).toBe('content');
    expect(c.config).toBe('teal');
    expect(c.helpText).toBe('Rango de fechas de filtro');
    expect(c.min).toBe('date');
    expect(c.required).toBeFalse();
    expect(c.ztheme).toBe('dark');
    expect(c.modelo).toEqual([null, null]);
  });

  it('permite asignar @Input manualmente (incluyendo modelo y ztheme)', () => {
    const c = make();

    c.label = 'Fechas';
    c.config = 'blue';
    c.helpText = 'Seleccione un rango';
    c.min = '2025-01-01';
    c.required = true;
    c.ztheme = 'light';
    c.modelo = ['2025-01-01', '2025-01-31'];

    expect(c.label).toBe('Fechas');
    expect(c.config).toBe('blue');
    expect(c.helpText).toBe('Seleccione un rango');
    expect(c.min).toBe('2025-01-01');
    expect(c.required).toBeTrue();
    expect(c.ztheme).toBe('light');
    expect(c.modelo).toEqual(['2025-01-01', '2025-01-31']);
  });

  // ===================== onModeloChange =====================
  describe('onModeloChange', () => {
    it('actualiza modelo y emite cuando detail es [string, string]', () => {
      const c = make();
      const emitSpy = spyOn(c.modeloChange, 'emit');
      const logSpy = spyOn(console, 'log');

      const evt = { detail: ['2025-01-01', '2025-01-31'] } as any as Event;
      c.onModeloChange(evt);

      expect(c.modelo).toEqual(['2025-01-01', '2025-01-31']);
      expect(logSpy).toHaveBeenCalledWith('Fechas seleccionadas:', c.modelo);
      expect(emitSpy).toHaveBeenCalledWith(['2025-01-01', '2025-01-31']);
    });

    it('acepta nulls en el rango y emite ([null, string] y [null, null])', () => {
      const c = make();
      const emitSpy = spyOn(c.modeloChange, 'emit');
      spyOn(console, 'log');

      // Caso [null, string]
      let evt = { detail: [null, '2025-02-15'] } as any as Event;
      c.onModeloChange(evt);
      expect(c.modelo).toEqual([null, '2025-02-15']);
      expect(emitSpy).toHaveBeenCalledWith([null, '2025-02-15']);

      // Caso [null, null]
      evt = { detail: [null, null] } as any as Event;
      c.onModeloChange(evt);
      expect(c.modelo).toEqual([null, null]);
      expect(emitSpy).toHaveBeenCalledWith([null, null]);
    });

    it('cuando detail NO es array -> warning y NO emite ni cambia modelo', () => {
      const c = make({ modelo: ['X', 'Y'] });
      const emitSpy = spyOn(c.modeloChange, 'emit');
      const warnSpy = spyOn(console, 'warn');

      const evt = { detail: 'no-array' } as any as Event; // no es array
      c.onModeloChange(evt);

      expect(warnSpy).toHaveBeenCalledWith('Formato inesperado del evento:', evt);
      expect(emitSpy).not.toHaveBeenCalled();
      expect(c.modelo).toEqual(['X', 'Y']); // permanece igual
    });

    it('cuando detail tiene longitud distinta de 2 -> warning y NO emite', () => {
      const c = make({ modelo: ['A', 'B'] });
      const emitSpy = spyOn(c.modeloChange, 'emit');
      const warnSpy = spyOn(console, 'warn');

      const evt = { detail: ['solo-uno'] } as any as Event; // length 1
      c.onModeloChange(evt);

      expect(warnSpy).toHaveBeenCalledWith('Formato inesperado del evento:', evt);
      expect(emitSpy).not.toHaveBeenCalled();
      expect(c.modelo).toEqual(['A', 'B']);
    });

    it('cuando hay tipos inválidos en detail -> warning y NO emite', () => {
      const c = make({ modelo: ['prev-start', 'prev-end'] });
      const emitSpy = spyOn(c.modeloChange, 'emit');
      const warnSpy = spyOn(console, 'warn');

      const evt = { detail: [123, true] } as any as Event; // tipos inválidos
      c.onModeloChange(evt);

      expect(warnSpy).toHaveBeenCalledWith('Valores no válidos en el rango:', (evt as any).detail);
      expect(emitSpy).not.toHaveBeenCalled();
      expect(c.modelo).toEqual(['prev-start', 'prev-end']);
    });

    it('secuencia: válido -> inválido (modelo conserva el último válido)', () => {
      const c = make({ modelo: [null, null] });
      const emitSpy = spyOn(c.modeloChange, 'emit');
      const warnSpy = spyOn(console, 'warn');
      spyOn(console, 'log');

      // 1) válido
      const evtOk = { detail: ['2025-03-01', '2025-03-31'] } as any as Event;
      c.onModeloChange(evtOk);
      expect(c.modelo).toEqual(['2025-03-01', '2025-03-31']);
      expect(emitSpy).toHaveBeenCalledWith(['2025-03-01', '2025-03-31']);

      // 2) inválido (no array)
      const evtBad = { detail: undefined } as any as Event;
      c.onModeloChange(evtBad);

      expect(warnSpy).toHaveBeenCalled(); // al menos una vez
      expect(emitSpy).toHaveBeenCalledTimes(1); // no se emitió de nuevo
      expect(c.modelo).toEqual(['2025-03-01', '2025-03-31']); // conserva el último válido
    });
  });
});
