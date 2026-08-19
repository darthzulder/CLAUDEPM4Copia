// stage-z.ivy-meta.native.spec.ts
import { StageZ } from './stage-z';
import * as ngCore from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

function flatten<T>(arr: any): T[] {
  if (!Array.isArray(arr)) return [];
  const out: T[] = [];
  for (const el of arr) {
    if (Array.isArray(el)) out.push(...flatten<T>(el));
    else out.push(el as T);
  }
  return out;
}

describe('StageZ Ivy metadata (sin TestBed, robusto a versiones Angular)', () => {
  it('expone ɵcmp y es standalone', () => {
    const def: any = (StageZ as any).ɵcmp;
    expect(def).toBeDefined();

    // standalone puede existir como boolean true
    expect(!!def.standalone).toBeTrue();
  });

  it('tiene selector lib-stage-z', () => {
    const def: any = (StageZ as any).ɵcmp;
    const sels = flatten<string>(def.selectors || []);
    // buscar por igualdad o dentro de un array doble
    expect(sels).toContain('lib-stage-z');
  });

  it('usa ChangeDetection OnPush', () => {
    const def: any = (StageZ as any).ɵcmp;
    // Algunas versiones exponen onPush:boolean, otras changeDetection:1
    const isOnPush = def.onPush === true || def.changeDetection === 1;
    expect(isOnPush).toBeTrue();
  });

  it('mapea correctamente los @Input, incluyendo alias', () => {
    const def: any = (StageZ as any).ɵcmp;
    const inputs = def.inputs || {};
    const declared = def.declaredInputs || {};

    // Alias
    const customStrPublic = inputs['custom-str'] || (declared['customStr'] ? 'custom-str' : undefined);
    const imageSrcPublic  = inputs['image-src'] || (declared['imageSrc'] ? 'image-src' : undefined);

    expect(customStrPublic).toBeDefined();
    expect(imageSrcPublic).toBeDefined();

    // Sin alias (header/contentContext)
    // inputs['header'] → 'header' ó via declared
    expect(inputs['header'] || declared['header']).toBeDefined();
    expect(inputs['contentContext'] || declared['contentContext']).toBeDefined();

    // Chequeo cruzado razonable
    if (declared['customStr']) expect(declared['customStr']).toBe('custom-str');
    if (declared['imageSrc']) expect(declared['imageSrc']).toBe('image-src');
  });

  it('decls/vars/template están definidos', () => {
    const def: any = (StageZ as any).ɵcmp;
    expect(typeof def.decls).toBe('number');
    expect(typeof def.vars).toBe('number');
    expect(typeof def.template).toBe('function');
  });

  it('permite cubrir inicializador privado cdr = inject(ChangeDetectorRef) con fallback si no se puede espiar', () => {
    const fakeCdr = { markForCheck: () => {} };
    let spyOk = true;
    let injectSpy: jasmine.Spy | undefined;

    try {
      injectSpy = spyOn(ngCore as any, 'inject').and.returnValue(fakeCdr);
    } catch {
      spyOk = false;
    }

    if (!spyOk) {
      // En algunos entornos ESM no se puede espiar import bindings.
      // Validamos el comportamiento esperado: sin contexto DI, new StageZ lanza.
      expect(() => new StageZ()).toThrow();
      return;
    }

    const c = new StageZ();
    const cdr = Reflect.get(c as object, 'cdr');
    expect(cdr).toBe(fakeCdr);
    expect(injectSpy).toHaveBeenCalledWith(ChangeDetectorRef);
    injectSpy!.and.callThrough(); // restaurar
  });
});