// input-date-z.class-only.spec.ts
import { InputDateZ } from './input-date-z';

describe('InputDateZ (class-only)', () => {
  it('defaults', () => {
    const c = new InputDateZ();
    expect(c.label).toBe('');
    expect(c.inputType).toBe('date');
    expect(c.modelOb).toBeUndefined();
    expect(c.invalid).toBeFalse();
    expect(c.disabled).toBeFalse();
    expect(c.readonly).toBeFalse();
    expect(c.max).toBe('');
    expect(c.min).toBe('');
    expect(c.required).toBeFalse();
  });

  it('ngOnInit no lanza errores', () => {
    const c = new InputDateZ();
    expect(() => c.ngOnInit()).not.toThrow();
  });

  it('permite setear todos los @Input', () => {
    const c = new InputDateZ();
    c.label = 'Fecha';
    c.inputType = 'month';
    c.modelOb = '2025-09';
    c.invalid = true;
    c.disabled = true;
    c.readonly = true;
    c.max = '2025-12-31';
    c.min = '2025-01-01';
    c.required = true;

    expect(c.label).toBe('Fecha');
    expect(c.inputType).toBe('month');
    expect(c.modelOb).toBe('2025-09');
    expect(c.invalid).toBeTrue();
    expect(c.disabled).toBeTrue();
    expect(c.readonly).toBeTrue();
    expect(c.max).toBe('2025-12-31');
    expect(c.min).toBe('2025-01-01');
    expect(c.required).toBeTrue();
  });

  it('simula la lógica del template para input-type', () => {
    const c = new InputDateZ();

    const resolveType = (type: string) => {
      c.inputType = type;
      return c.inputType === 'date'
        ? 'date'
        : c.inputType === 'month'
        ? 'month'
        : c.inputType === 'datetime-local'
        ? 'datetime-local'
        : c.inputType === 'week'
        ? 'week'
        : 'date';
    };

    expect(resolveType('date')).toBe('date');
    expect(resolveType('month')).toBe('month');
    expect(resolveType('datetime-local')).toBe('datetime-local');
    expect(resolveType('week')).toBe('week');
    expect(resolveType('otro')).toBe('date'); // fallback
  });
});