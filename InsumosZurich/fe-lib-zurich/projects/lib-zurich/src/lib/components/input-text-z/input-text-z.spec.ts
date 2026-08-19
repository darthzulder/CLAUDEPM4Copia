// input-text-z.class-only.spec.ts
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextZ } from './input-text-z';
import { UtilService } from '../../core/utils/services/util.service';

describe('InputTextZ (class-only)', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('defaults', () => {
    const c = new InputTextZ(fb);
    expect(c.label).toBe('');
    expect(c.inputType).toBe('text');
    expect(c.lineType).toBeFalse();
    expect(c.name).toBe('');
    expect(c.model).toBeUndefined();
    expect(c.group instanceof FormGroup).toBeTrue(); // default @Input
    expect(c.helpText).toBe('');
    expect(c.valid).toBeFalse();
    expect(c.required).toBeFalse();
    expect(c.readonly).toBeFalse();
    expect(c.maxLength).toBeFalse();
    expect(c.maxNumber).toBe(0);
    // outputs existen
    expect(c.modelChange).toBeTruthy();
    expect(c.validChange).toBeTruthy();
  });

  it('ngOnInit: crea group/control cuando no existen y compone validadores', () => {
    const c = new InputTextZ(fb);
    // Forzamos que no haya grupo para cubrir generateGroup()
    c.group = null as unknown as FormGroup;

    const spyName = spyOn(UtilService, 'getControlName').and.returnValue('txt123');
    const spyUpd  = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.ngOnInit();

    expect(c.group).toBeTruthy();
    const ctrl = c.group.get('txt123');
    expect(ctrl).toBeTruthy();
    expect(spyName).toHaveBeenCalled();
    expect(spyUpd).toHaveBeenCalledWith(c.group, 'txt123');

    // Por defecto required=false y model undefined ⇒ generateValidation devuelve null
    ctrl!.setValue('hola');
    ctrl!.updateValueAndValidity();
    expect(ctrl!.errors).toBeNull();
  });

  it('generateControl: si ya existe control con name, NO pide nuevo nombre', () => {
    const c = new InputTextZ(fb);
    c.name = 'username';
    c.group = fb.group({ username: fb.control(null) });

    const spyName = spyOn(UtilService, 'getControlName').and.returnValue('shouldNotUse');
    const spyUpd  = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.generateControl();

    expect(spyName).not.toHaveBeenCalled();
    expect(c.group.get('username')).toBeTruthy();
    expect(spyUpd).toHaveBeenCalledWith(c.group, 'username');
  });

  it('generateValidation / validateRequired: retorna errorRequired cuando required=true y model vacío/espacios/null', () => {
    const c = new InputTextZ(fb);
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
  });

 

  it('generateControl: compone validador existente + generateValidation', () => {
    const c = new InputTextZ(fb);
    c.name = 'fullname';
    // Validador previo: required nativo
    c.group = fb.group({ fullname: fb.control(null, Validators.required) });

    const spyUpd = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.generateControl();

    const ctrl = c.group.get('fullname')!;
    // 1) Solo required nativo
    ctrl.setValue(null);
    ctrl.updateValueAndValidity();
    expect(ctrl.errors).toEqual({ required: true });

    // 2) Activamos tu regla custom (required + model vacío)
    c.required = true;
    c.model = '';
    ctrl.updateValueAndValidity();
    expect(ctrl.errors).toEqual({ required: true, errorRequired: true });

    // 3) Con valor para tu regla (pero el control sigue null, por lo que required persiste)
    c.model = 'John';
    ctrl.updateValueAndValidity();
    expect(ctrl.errors).toEqual({ required: true });

    expect(spyUpd).toHaveBeenCalledWith(c.group, 'fullname');
  });

  it('updateControl: asigna el valor del control si existe', () => {
    const c = new InputTextZ(fb);
    c.name = 'email';
    c.group = fb.group({ email: fb.control(null) });
    c.model = 'x@y.com';

    c.updateControl();

    expect(c.group.get('email')!.value).toBe('x@y.com');
  });

  it('updateControl: no lanza error si no hay group o el control no existe', () => {
    const c = new InputTextZ(fb);
    c.group = null as unknown as FormGroup;
    c.model = 'abc';
    expect(() => c.updateControl()).not.toThrow();

    c.group = fb.group({});
    c.name = 'missing';
    expect(() => c.updateControl()).not.toThrow();
  });

  it('ngOnChanges(model): ejecuta updateControl con setTimeout', () => {
    const c = new InputTextZ(fb);
    c.name = 'phone';
    c.group = fb.group({ phone: fb.control('') });
    c.model = '+57 123';

    spyOn(c, 'updateControl').and.callThrough();

    jasmine.clock().install();
    try {
      c.ngOnChanges({ model: {} as any });
      expect(c.updateControl).not.toHaveBeenCalled();

      jasmine.clock().tick(0); // corre el setTimeout
      expect(c.updateControl).toHaveBeenCalled();
      expect(c.group.get('phone')!.value).toBe('+57 123');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('ngOnChanges: cuando group.status es INVALID, marca valid=true y emite validChange', () => {
    const c = new InputTextZ(fb);
    c.name = 'n';
    c.group = fb.group({ n: fb.control(null, Validators.required) });

    const spyValid = spyOn(c.validChange, 'emit');

    // Aseguramos estado INVALID
    c.group.updateValueAndValidity();
    expect(c.group.status).toBe('INVALID');

    c.ngOnChanges({});

    expect(c.valid).toBeTrue(); // ojo: en tu template [invalid]="valid"
    expect(spyValid).toHaveBeenCalledWith(true);
  });

  it('ngOnChanges: cuando group.status es VALID, no cambia valid ni emite', () => {
    const c = new InputTextZ(fb);
    c.name = 'n';
    c.group = fb.group({ n: fb.control('ok', Validators.required) });
    c.valid = false;

    const spyValid = spyOn(c.validChange, 'emit');

    c.group.updateValueAndValidity();
    expect(c.group.status).toBe('VALID');

    c.ngOnChanges({});

    expect(c.valid).toBeFalse();
    expect(spyValid).not.toHaveBeenCalled();
  });

  it('modelChange EventEmitter: puede emitir valores (usado en template)', (done) => {
    const c = new InputTextZ(fb);
    const value = 'nuevo texto';
    c.modelChange.subscribe(v => { expect(v).toBe(value); done(); });
    c.modelChange.emit(value);
  });

  it('simula la lógica del template para [config] según lineType', () => {
    const c = new InputTextZ(fb);
    const resolveConfig = () => (c.lineType ? 'line' : '');

    c.lineType = false; expect(resolveConfig()).toBe('');
    c.lineType = true;  expect(resolveConfig()).toBe('line');
  });

  it('simula la lógica del template para [input-type]', () => {
    const c = new InputTextZ(fb);

    const resolveInputType = (t: string) => {
      c.inputType = t;
      return c.inputType === 'text'
        ? 'text'
        : c.inputType === 'tel'
        ? 'tel'
        : c.inputType === 'email'
        ? 'email'
        : c.inputType === 'url'
        ? 'url'
        : 'text';
    };

    expect(resolveInputType('text')).toBe('text');
    expect(resolveInputType('tel')).toBe('tel');
    expect(resolveInputType('email')).toBe('email');
    expect(resolveInputType('url')).toBe('url');
    expect(resolveInputType('otro')).toBe('text'); // fallback
  });

  it('permite setear helpText, readonly, maxLength y maxNumber sin afectar lógica ts', () => {
    const c = new InputTextZ(fb);
    c.helpText = 'Ingrese su nombre';
    c.readonly = true;
    c.maxLength = true;
    c.maxNumber = 100;
    expect(c.helpText).toBe('Ingrese su nombre');
    expect(c.readonly).toBeTrue();
    expect(c.maxLength).toBeTrue();
    expect(c.maxNumber).toBe(100);
  });
});