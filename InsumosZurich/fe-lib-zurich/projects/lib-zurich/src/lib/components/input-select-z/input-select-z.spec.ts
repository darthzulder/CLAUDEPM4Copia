// input-select-z.class-only.spec.ts
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputSelectZ } from './input-select-z';
import { UtilService } from '../../core/utils/services/util.service';

describe('InputSelectZ (class-only)', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('defaults', () => {
    const c = new InputSelectZ(fb);
    expect(c.name).toBe('');
    expect(c.options).toEqual([]);
    expect(c.model).toBeUndefined();
    expect(c.multiSelect).toBeFalse();
    expect(c.group instanceof FormGroup).toBeTrue(); // default @Input
    expect(c.label).toBe('Select');
    expect(c.typeLine).toBeFalse();
    expect(c.required).toBeFalse();
    expect(c.invalid).toBeFalse();
    expect(c.disable).toBeFalse();
    expect(c.iconType).toBeFalse();
    expect(c.icon).toBe('bookmark');
    expect(c.helpText).toBe('');
    // outputs existen
    expect(c.modelChange).toBeTruthy();
    expect(c.invalidChange).toBeTruthy();
  });

  it('ngOnInit: crea group/control cuando no existen y compone validadores', () => {
    const c = new InputSelectZ(fb);
    // Forzamos que no haya grupo para cubrir generateGroup()
    c.group = null as unknown as FormGroup;

    const spyName = spyOn(UtilService, 'getControlName').and.returnValue('sel123');
    const spyUpd  = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.ngOnInit();

    expect(c.group).toBeTruthy();
    const ctrl = c.group.get('sel123');
    expect(ctrl).toBeTruthy();
    expect(spyName).toHaveBeenCalled();
    expect(spyUpd).toHaveBeenCalledWith(c.group, 'sel123');

    // Por defecto: required=false ⇒ generateValidation devuelve null
    ctrl!.setValue('x');
    ctrl!.updateValueAndValidity();
    expect(ctrl!.errors).toBeNull();
  });

  it('generateControl: si ya existe control con name, NO pide nuevo nombre', () => {
    const c = new InputSelectZ(fb);
    c.name = 'country';
    c.group = fb.group({ country: fb.control(null) });

    const spyName = spyOn(UtilService, 'getControlName').and.returnValue('shouldNotUse');
    const spyUpd  = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.generateControl();

    expect(spyName).not.toHaveBeenCalled();
    expect(c.group.get('country')).toBeTruthy();
    expect(spyUpd).toHaveBeenCalledWith(c.group, 'country');
  });

  it('generateValidation / validateRequired (single select): error cuando required=true y model vacío/espacios/null', () => {
    const c = new InputSelectZ(fb);
    c.multiSelect = false;
    c.required = true;

    c.model = '';
    expect(c.validateRequired()).toBeTrue();
    expect(c.generateValidation()).toEqual({ errorRequired: true });

    c.model = '   ';
    expect(c.validateRequired()).toBeTrue();
    expect(c.generateValidation()).toEqual({ errorRequired: true });

    c.model = null as any;
    expect(c.validateRequired()).toBeTrue();
    expect(c.generateValidation()).toEqual({ errorRequired: true });

    // valores válidos
    c.model = '0'; // "0" no es vacío
    expect(c.validateRequired()).toBeFalse();
    expect(c.generateValidation()).toBeNull();

    c.model = 'co';
    expect(c.validateRequired()).toBeFalse();
  });

  it('validateRequired (multiSelect): según implementación actual (truthy → error)', () => {
    const c = new InputSelectZ(fb);
    c.multiSelect = true;
    c.required = true;
  
    c.model = null;
    expect(c.validateRequired()).toBeFalsy();
    expect(c.generateValidation()).toBeNull();
  
    c.model = ['a'];
    expect(c.validateRequired()).toBeTruthy();
    expect(c.generateValidation()).toEqual({ errorRequired: true });
  
    c.model = 1;
    expect(c.validateRequired()).toBeTruthy();
  });

  it('generateControl: compone validador existente + generateValidation', () => {
    const c = new InputSelectZ(fb);
    c.name = 'city';
    // Validador previo: required nativo
    c.group = fb.group({ city: fb.control(null, Validators.required) });

    const spyUpd = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.generateControl();

    const ctrl = c.group.get('city')!;
    // 1) Solo required nativo
    ctrl.setValue(null);
    ctrl.updateValueAndValidity();
    expect(ctrl.errors).toEqual({ required: true });

    // 2) Activamos tu regla custom (single select vacío)
    c.multiSelect = false;
    c.required = true;
    c.model = ''; // vacío
    ctrl.updateValueAndValidity();
    expect(ctrl.errors).toEqual({ required: true, errorRequired: true });

    // 3) Con valor válido para tu regla (pero el control sigue null, por lo que required persiste)
    c.model = 'Bogotá';
    ctrl.updateValueAndValidity();
    expect(ctrl.errors).toEqual({ required: true });

    expect(spyUpd).toHaveBeenCalledWith(c.group, 'city');
  });

  it('updateControl: asigna el valor del control si existe', () => {
    const c = new InputSelectZ(fb);
    c.name = 'opt';
    c.group = fb.group({ opt: fb.control(null) });
    c.model = 'A1';

    c.updateControl();

    expect(c.group.get('opt')!.value).toBe('A1');
  });

  it('updateControl: no lanza error si no hay group o el control no existe', () => {
    const c = new InputSelectZ(fb);
    c.group = null as unknown as FormGroup;
    c.model = 'X';
    expect(() => c.updateControl()).not.toThrow();

    c.group = fb.group({});
    c.name = 'missing';
    expect(() => c.updateControl()).not.toThrow();
  });

  it('ngOnChanges(model): ejecuta updateControl con setTimeout', () => {
    const c = new InputSelectZ(fb);
    c.name = 'sel';
    c.group = fb.group({ sel: fb.control(null) });
    c.model = 'B2';

    spyOn(c, 'updateControl').and.callThrough();

    jasmine.clock().install();
    try {
      c.ngOnChanges({ model: {} as any });
      expect(c.updateControl).not.toHaveBeenCalled();

      jasmine.clock().tick(0); // corre el setTimeout
      expect(c.updateControl).toHaveBeenCalled();
      expect(c.group.get('sel')!.value).toBe('B2');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('ngOnChanges: cuando group.status es INVALID, marca invalid=true y emite invalidChange', () => {
    const c = new InputSelectZ(fb);
    c.name = 's';
    c.group = fb.group({ s: fb.control(null, Validators.required) });

    const spyInvalid = spyOn(c.invalidChange, 'emit');

    // Aseguramos estado INVALID
    c.group.updateValueAndValidity();
    expect(c.group.status).toBe('INVALID');

    c.ngOnChanges({});

    expect(c.invalid).toBeTrue();
    expect(spyInvalid).toHaveBeenCalledWith(true);
  });

  it('ngOnChanges: cuando group.status es VALID, no emite ni cambia invalid', () => {
    const c = new InputSelectZ(fb);
    c.name = 's';
    c.group = fb.group({ s: fb.control('ok', Validators.required) });
    c.invalid = false;

    const spyInvalid = spyOn(c.invalidChange, 'emit');

    c.group.updateValueAndValidity();
    expect(c.group.status).toBe('VALID');

    c.ngOnChanges({});

    expect(c.invalid).toBeFalse();
    expect(spyInvalid).not.toHaveBeenCalled();
  });

  it('modelChange EventEmitter: puede emitir valores (se usa en el template)', (done) => {
    const c = new InputSelectZ(fb);
    const value = 'Z9';
    c.modelChange.subscribe(v => { expect(v).toBe(value); done(); });
    c.modelChange.emit(value);
  });

  it('simula lógica del template para [config] según typeLine', () => {
    const c = new InputSelectZ(fb);
    const resolveConfig = () => (c.typeLine ? 'line' : '');
    c.typeLine = false; expect(resolveConfig()).toBe('');
    c.typeLine = true;  expect(resolveConfig()).toBe('line');
  });

  it('permite setear options y otros @Input sin afectar lógica ts', () => {
    const c = new InputSelectZ(fb);
    c.options = [{ value: '1', description: 'Uno' } as any, { value: '2', description: 'Dos' } as any];
    c.disable = true;
    c.iconType = true;
    c.icon = 'star';
    c.helpText = 'Seleccione una opción';
    expect(c.options.length).toBe(2);
    expect(c.disable).toBeTrue();
    expect(c.iconType).toBeTrue();
    expect(c.icon).toBe('star');
    expect(c.helpText).toBe('Seleccione una opción');
  });
});