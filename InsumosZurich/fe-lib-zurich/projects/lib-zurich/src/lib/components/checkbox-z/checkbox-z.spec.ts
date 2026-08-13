// checkbox-z.class-only.spec.ts
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CheckboxZ } from './checkbox-z';
import { UtilService } from '../../core/utils/services/util.service';

describe('CheckboxZ (class-only)', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('defaults', () => {
    const c = new CheckboxZ(fb);
    expect(c.name).toBe('');
    expect(c.label).toBe('');
    expect(c.group instanceof FormGroup).toBeTrue(); // por el default del @Input
    expect(c.model).toBeUndefined();
    expect(c.required).toBeFalse();
    expect(c.disabled).toBeFalse();
    expect(c.valid).toBeFalse(); // default
    expect(c.helpText).toBe('');
    expect(c.showHelpText).toBeFalse();
  });

  it('ngOnInit: crea group/control cuando no existen y arma validaciones', () => {
    const c = new CheckboxZ(fb);
    // Forzamos que no haya grupo para cubrir generateGroup()
    c.group = null as unknown as FormGroup;

    const spyName = spyOn(UtilService, 'getControlName').and.returnValue('ctrl123');
    const spyUpd  = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.ngOnInit();

    expect(c.group).toBeTruthy();
    const ctrl = c.group.get('ctrl123');
    expect(ctrl).toBeTruthy();
    expect(spyName).toHaveBeenCalled();
    expect(spyUpd).toHaveBeenCalledWith(c.group, 'ctrl123');

    // El control debe tener un validador compuesto (el original + generateValidation)
    ctrl!.setValue(true);
    ctrl!.updateValueAndValidity();
    // No esperamos errorRequired por defecto (required=false => generateValidation=null)
    expect(ctrl!.errors).toBeNull();
  });

  it('generateControl: si ya existe control con name, NO pide nuevo nombre', () => {
    const c = new CheckboxZ(fb);
    c.name = 'myChk';
    c.group = fb.group({ myChk: fb.control(null) });

    const spyName = spyOn(UtilService, 'getControlName').and.returnValue('shouldNotBeUsed');
    const spyUpd  = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.generateControl();

    expect(spyName).not.toHaveBeenCalled();
    expect(c.group.get('myChk')).toBeTruthy();
    expect(spyUpd).toHaveBeenCalledWith(c.group, 'myChk');
  });

  it('generateValidation / validRequired: retorna error cuando required=true y model=true', () => {
    const c = new CheckboxZ(fb);
    c.required = true;
    c.model = true;

    expect(c.validRequired()).toBeTrue();
    expect(c.generateValidation()).toEqual({ errorRequired: true });
  });

  it('generateValidation: retorna null cuando no aplica la regla', () => {
    const c = new CheckboxZ(fb);

    c.required = false; c.model = true;
    expect(c.generateValidation()).toBeNull();

    c.required = true; c.model = false as any;
    expect(c.generateValidation()).toBeNull();
  });

  it('updateControl: setea el valor del control si existe', () => {
    const c = new CheckboxZ(fb);
    c.name = 'myChk';
    c.group = fb.group({ myChk: fb.control(false) });
    c.model = true;

    c.updateControl();

    expect(c.group.get('myChk')!.value).toBe(true);
  });

  it('updateControl: no lanza error si no hay group/control', () => {
    const c = new CheckboxZ(fb);
    c.group = null as unknown as FormGroup;
    c.model = true;
    expect(() => c.updateControl()).not.toThrow();

    c.group = fb.group({});
    c.name = 'missing';
    expect(() => c.updateControl()).not.toThrow();
  });

  it('ngOnChanges(model): ejecuta updateControl con setTimeout', () => {
    const c = new CheckboxZ(fb);
    c.name = 'myChk';
    c.group = fb.group({ myChk: fb.control(false) });
    c.model = true;

    spyOn(c, 'updateControl').and.callThrough();

    // Controlamos timers con Jasmine
    jasmine.clock().install();
    try {
      c.ngOnChanges({ model: {} as any });
      expect(c.updateControl).not.toHaveBeenCalled();

      // corre el setTimeout
      jasmine.clock().tick(0);
      expect(c.updateControl).toHaveBeenCalled();

      // valor actualizado
      expect(c.group.get('myChk')!.value).toBe(true);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  

  it('generateControl: compone validador existente + generateValidation', () => {
    const c = new CheckboxZ(fb);
    c.name = 'x';
    // Arrancamos con un validador existente (requerido nativo) para comprobar composición
    c.group = fb.group({ x: fb.control(null, Validators.required) });

    const spyUpd = spyOn(UtilService, 'updateControlValitor').and.callThrough();

    c.generateControl();

    const ctrl = c.group.get('x')!;
    // 1) Solo required nativo → error 'required'
    ctrl.setValue(null);
    ctrl.updateValueAndValidity();
    expect(ctrl.errors).toEqual({ required: true });

    // 2) Activamos tu regla generateValidation (required=true y model=true => errorRequired)
    c.required = true;
    c.model = true;
    ctrl.updateValueAndValidity();
    expect(ctrl.errors).toEqual({ required: true, errorRequired: true });

    expect(spyUpd).toHaveBeenCalledWith(c.group, 'x');
  });
});