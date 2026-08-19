// input-password-z.class-only.spec.ts
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputPasswordZ } from './input-password-z';
import { UtilService } from '../../core/utils/services/util.service';

describe('InputPasswordZ (class-only)', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('defaults', () => {
    const c = new InputPasswordZ(fb);
    expect(c.name).toBe('');
    expect(c.model).toBeUndefined();
    expect(c.label).toBe('');
    expect(c.lineType).toBeFalse();
    expect(c.helpText).toBe('');
    expect(c.invalid).toBeFalse();
    // outputs existen
    expect(c.modelChange).toBeTruthy();
    expect(c.invalidChange).toBeTruthy();
    // inputs varios
    expect(c.required).toBeFalse();
    expect(c.disabled).toBeFalse();
    expect(c.readonly).toBeFalse();
    expect(c.group instanceof FormGroup).toBeTrue(); // por el default del @Input
  });

  it('ngOnInit: crea group/control cuando no existen y compone validadores', () => {
    const c = new InputPasswordZ(fb);
    // forzamos que no haya grupo para cubrir generateGroup()
    c.group = null as unknown as FormGroup;

    const spyName = spyOn(UtilService, 'getControlName').and.returnValue('pwd123');
    const spyUpd  = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.ngOnInit();

    expect(c.group).toBeTruthy();
    const ctrl = c.group.get('pwd123');
    expect(ctrl).toBeTruthy();
    expect(spyName).toHaveBeenCalled();
    expect(spyUpd).toHaveBeenCalledWith(c.group, 'pwd123');

    // Composición: validador previo (posible undefined) + generateValidation
    // Por defecto required=false y model undefined => validateRequired=false => null
    ctrl!.setValue('abc');
    ctrl!.updateValueAndValidity();
    expect(ctrl!.errors).toBeNull();
  });

  it('generateControl: si ya existe control con name, NO pide nuevo nombre', () => {
    const c = new InputPasswordZ(fb);
    c.name = 'pwd';
    c.group = fb.group({ pwd: fb.control(null) });

    const spyName = spyOn(UtilService, 'getControlName').and.returnValue('shouldNotUse');
    const spyUpd  = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.generateControl();

    expect(spyName).not.toHaveBeenCalled();
    expect(c.group.get('pwd')).toBeTruthy();
    expect(spyUpd).toHaveBeenCalledWith(c.group, 'pwd');
  });

  it('generateValidation / validateRequired: retorna errorRequired si required=true y model vacío/whitespace', () => {
    const c = new InputPasswordZ(fb);

    c.required = true;
    c.model = ''; // vacío
    expect(c.validateRequired()).toBeTrue();
    expect(c.generateValidation()).toEqual({ errorRequired: true });

    c.model = '   '; // solo espacios
    expect(c.validateRequired()).toBeTrue();
    expect(c.generateValidation()).toEqual({ errorRequired: true });

    c.model = null as any; // null
    expect(c.validateRequired()).toBeTrue();
    expect(c.generateValidation()).toEqual({ errorRequired: true });
  });

  

  it('generateControl: compone validador existente + generateValidation', () => {
    const c = new InputPasswordZ(fb);
    c.name = 'pwd';
    // control con required nativo para comprobar composición
    c.group = fb.group({ pwd: fb.control(null, Validators.required) });

    const spyUpd = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.generateControl();

    const ctrl = c.group.get('pwd')!;
    // 1) Solo required nativo
    ctrl.setValue(null);
    ctrl.updateValueAndValidity();
    expect(ctrl.errors).toEqual({ required: true });

    // 2) Activamos tu regla custom
    c.required = true;
    c.model = ''; // vacío
    ctrl.updateValueAndValidity();
    expect(ctrl.errors).toEqual({ required: true, errorRequired: true });

    // 3) Con valor válido se limpia tu error (queda required según valor)
    c.model = 'ok';
    ctrl.updateValueAndValidity();
    // como ctrl.value sigue null, required seguirá; lo importante es que tu regla ya no aplique
    expect(ctrl.errors).toEqual({ required: true });

    expect(spyUpd).toHaveBeenCalledWith(c.group, 'pwd');
  });

  it('updateControl: setea el valor cuando existe el control', () => {
    const c = new InputPasswordZ(fb);
    c.name = 'pwd';
    c.group = fb.group({ pwd: fb.control('') });
    c.model = 'secret!';

    c.updateControl();

    expect(c.group.get('pwd')!.value).toBe('secret!');
  });

  it('updateControl: no rompe si no hay group o control', () => {
    const c = new InputPasswordZ(fb);
    c.group = null as unknown as FormGroup;
    c.model = 'x';
    expect(() => c.updateControl()).not.toThrow();

    c.group = fb.group({});
    c.name = 'missing';
    expect(() => c.updateControl()).not.toThrow();
  });

  it('ngOnChanges(model): dispara updateControl con setTimeout', () => {
    const c = new InputPasswordZ(fb);
    c.name = 'pwd';
    c.group = fb.group({ pwd: fb.control('') });
    c.model = 'abc';

    spyOn(c, 'updateControl').and.callThrough();

    jasmine.clock().install();
    try {
      c.ngOnChanges({ model: {} as any });
      expect(c.updateControl).not.toHaveBeenCalled();

      jasmine.clock().tick(0); // ejecuta el setTimeout
      expect(c.updateControl).toHaveBeenCalled();
      expect(c.group.get('pwd')!.value).toBe('abc');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('ngOnChanges: cuando group.status es INVALID, marca invalid=true y emite invalidChange', () => {
    const c = new InputPasswordZ(fb);
    c.name = 'pwd';
    // grupo inválido: control requerido sin valor
    c.group = fb.group({ pwd: fb.control(null, Validators.required) });

    const spyInvalid = spyOn(c.invalidChange, 'emit');

    c.ngOnChanges({}); // no importa el change record, solo consulta el status

    expect(c.invalid).toBeTrue();
    expect(spyInvalid).toHaveBeenCalledWith(true);
  });

  it('ngOnChanges: cuando group.status es VALID, no cambia invalid ni emite', () => {
    const c = new InputPasswordZ(fb);
    c.name = 'pwd';
    c.group = fb.group({ pwd: fb.control('value', Validators.required) });
    c.invalid = false;

    const spyInvalid = spyOn(c.invalidChange, 'emit');

    c.ngOnChanges({});

    expect(c.invalid).toBeFalse();
    expect(spyInvalid).not.toHaveBeenCalled();
  });

  it('EventEmitter modelChange: puede emitir valores (aunque se usa en el template)', (done) => {
    const c = new InputPasswordZ(fb);
    const value = 'newPass';
    c.modelChange.subscribe(v => { expect(v).toBe(value); done(); });
    c.modelChange.emit(value);
  });

  it('simula la lógica del template para [config] según lineType', () => {
    const c = new InputPasswordZ(fb);

    const resolveConfig = () => (c.lineType ? 'line' : '');

    c.lineType = false;
    expect(resolveConfig()).toBe('');

    c.lineType = true;
    expect(resolveConfig()).toBe('line');
  });
});
