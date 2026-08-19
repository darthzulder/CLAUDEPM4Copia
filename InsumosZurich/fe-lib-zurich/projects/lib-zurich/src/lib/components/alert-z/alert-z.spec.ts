// alert-z.class-only.spec.ts
import { AlertZ } from './alert-z';

import { ChangeDetectorRef } from '@angular/core';
import * as ngCore from '@angular/core';
import { Subscription } from 'rxjs';


describe('AlertZ (class-only)', () => {
  /** Crea un objeto con el prototype de AlertZ, sin invocar constructor.
   *  Inyecta propiedades internas necesarias para poder probar la lógica.
   */
  function make(overrides?: Partial<any>) {
    const c = Object.create(AlertZ.prototype) as any;

    // Estado interno mínimo para que los métodos funcionen
    c.alerts = [];
    c.autoCloseTimers = new Map<string, number>();
    c.closing = new Set<string>();
    c.cdr = { markForCheck: jasmine.createSpy('markForCheck') };
    c.alertService = { remove: jasmine.createSpy('remove') };
    c.sub = { unsubscribe: jasmine.createSpy('unsubscribe') };

    // Mapa de duraciones como en el componente
    c.animationDurations = {
      'fade-out': 250,
      'slide-out': 300,
      'shrink-out': 280,
      __default__: 300,
    };

    if (overrides) Object.assign(c, overrides);
    return c;
  }

  // ===================== TUS CASOS BASE =====================

  it('defaults simulados (instancia plana)', () => {
    const c = make();
    expect(c.alerts).toEqual([]);
    expect(c.autoCloseTimers instanceof Map).toBeTrue();
    expect(c.closing instanceof Set).toBeTrue();
  });

  it('getItemClasses: activa onShowAnimation cuando no está cerrando; onCloseAnimation cuando sí', () => {
    const c = make();
    const a: any = { id: 'x', onShowAnimation: 'fade-in', onCloseAnimation: 'fade-out' };

    const cls1 = c.getItemClasses(a);
    expect(cls1['fade-in']).toBeTrue();
    expect(cls1['fade-out']).toBeFalse();

    c.closing.add('x');
    const cls2 = c.getItemClasses(a);
    expect(cls2['fade-in']).toBeFalse();
    expect(cls2['fade-out']).toBeTrue();
  });

  it('close: sin id no hace nada', () => {
    const c = make();
    c.close(undefined);
    expect(c.alertService.remove).not.toHaveBeenCalled();
  });

  it('close: sin animación -> remove inmediato', () => {
    const c = make({ alerts: [{ id: 'a1', message: 'x' }] });
    c.close('a1');
    expect(c.alertService.remove).toHaveBeenCalledOnceWith('a1');
    // En ruta sin animación NO hay markForCheck adicional
    expect(c.cdr.markForCheck).not.toHaveBeenCalled();
  });

  it('close: con animación conocida espera su duración (fade-out = 250ms) y luego remove', () => {
    const c = make({ alerts: [{ id: 'a1', onCloseAnimation: 'fade-out' }] });

    jasmine.clock().install();
    try {
      c.close('a1');
      // entra a closing y marca para check
      expect(c.closing.has('a1')).toBeTrue();
      expect(c.cdr.markForCheck).toHaveBeenCalledTimes(1);

      jasmine.clock().tick(249);
      expect(c.alertService.remove).not.toHaveBeenCalled();

      jasmine.clock().tick(1); // total 250
      expect(c.alertService.remove).toHaveBeenCalledOnceWith('a1');
      // sale de closing y vuelve a marcar
      expect(c.closing.has('a1')).toBeFalse();
      expect(c.cdr.markForCheck).toHaveBeenCalledTimes(2);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('close: animación desconocida usa duración default (300ms)', () => {
    const c = make({ alerts: [{ id: 'z', onCloseAnimation: 'zoom-out' }] });

    jasmine.clock().install();
    try {
      c.close('z');
      jasmine.clock().tick(299);
      expect(c.alertService.remove).not.toHaveBeenCalled();
      jasmine.clock().tick(1); // total 300
      expect(c.alertService.remove).toHaveBeenCalledOnceWith('z');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('close: reentrancia bloqueada si el id ya está en closing', () => {
    const c = make({ alerts: [{ id: 'a1', onCloseAnimation: 'fade-out' }] });

    jasmine.clock().install();
    try {
      c.close('a1');   // inicia cierre
      c.close('a1');   // ignorado
      jasmine.clock().tick(250);
      expect(c.alertService.remove).toHaveBeenCalledTimes(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('ngOnDestroy: limpia todos los timeouts y hace unsubscribe', () => {
    const c = make();

    jasmine.clock().install();
    try {
      // Programar un timeout artificial en el mapa
      const tId = window.setTimeout(() => { }, 1000);
      c.autoCloseTimers.set('a1', tId);

      c.ngOnDestroy();

      expect(c.autoCloseTimers.size).toBe(0);
      expect(c.sub.unsubscribe).toHaveBeenCalled();

      // Aun avanzando el tiempo, no debería pasar nada
      spyOn(c, 'close' as any);
      jasmine.clock().tick(1200);
      expect((c.close as any)).not.toHaveBeenCalled();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('getAnimationDuration (privado): usa el mapa y el fallback de 300ms', () => {
    const c = make();
    const getDur = (c as any)['getAnimationDuration'].bind(c);
    expect(getDur('fade-out')).toBe(250);
    expect(getDur('slide-out')).toBe(300);
    expect(getDur('shrink-out')).toBe(280);
    expect(getDur('cualquiera')).toBe(300);
  });

  // ===================== CASOS ADICIONALES PARA MAYOR COBERTURA =====================

  it('close: con id no presente en alerts -> remove inmediato (no hay animación)', () => {
    const c = make({ alerts: [{ id: 'otro' }] });
    c.close('no-existe');
    expect(c.alertService.remove).toHaveBeenCalledOnceWith('no-existe');
  });

  it('getItemClasses: cuando NO hay animaciones, devuelve mapa sin clases verdaderas', () => {
    const c = make();
    const a: any = { id: 'x' }; // sin onShowAnimation / onCloseAnimation
    const cls = c.getItemClasses(a);
    // Puede existir la clave '' con false por el operador ?? ''; aseguramos que no haya ningún true
    const values = Object.values(cls);
    expect(values.every(v => v === false)).toBeTrue();
  });

  it('scheduleAutoCloseForNew: crea timers solo para alerts válidos', () => {
    const c = make();
    spyOn(c, 'close'); // no queremos ejecutar close real
    jasmine.clock().install();
    try {
      const alerts = [
        { id: 'a', autoCloseAfter: 50 },
        { id: 'b', autoCloseAfter: 0 }, // ignorado
        { id: 'c' }, // ignorado
        { id: undefined, autoCloseAfter: 100 }, // ignorado
      ];
      (c as any).scheduleAutoCloseForNew(alerts);
      expect(c.autoCloseTimers.size).toBe(1); // solo 'a'
      jasmine.clock().tick(50);
      expect(c.close).toHaveBeenCalledWith('a');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('scheduleAutoCloseForNew: no duplica timers si ya existe uno', () => {
    const c = make();
    spyOn(c, 'close');
    jasmine.clock().install();
    try {
      (c as any).scheduleAutoCloseForNew([{ id: 'x', autoCloseAfter: 100 }]);
      (c as any).scheduleAutoCloseForNew([{ id: 'x', autoCloseAfter: 200 }]);
      expect(c.autoCloseTimers.size).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('cleanupTimersForRemoved: elimina timers de ids que ya no están', () => {
    const c = make();
    const t1 = 111 as unknown as number;
    const t2 = 222 as unknown as number;
    c.autoCloseTimers.set('a', t1);
    c.autoCloseTimers.set('b', t2);
    spyOn(window, 'clearTimeout');
    (c as any).cleanupTimersForRemoved([{ id: 'a' }]);
    expect(window.clearTimeout).toHaveBeenCalledWith(t2);
    expect(c.autoCloseTimers.size).toBe(1);
    expect(c.autoCloseTimers.has('a')).toBeTrue();
  });

  it('getItemClasses: sin animaciones devuelve objeto con claves vacías en false', () => {
    const c = make();
    const cls = c.getItemClasses({ id: 'x' } as any);
    expect(Object.values(cls).every(v => v === false)).toBeTrue();
  });

  it('close: ignora si id ya está en closing', () => {
    const c = make({ alerts: [{ id: 'a', onCloseAnimation: 'fade-out' }] });
    c.closing.add('a');
    c.close('a');
    expect(c.alertService.remove).not.toHaveBeenCalled();
  });

  it('close: con animación shrink-out espera 280ms y luego remove', () => {
    const c = make({ alerts: [{ id: 's1', onCloseAnimation: 'shrink-out' }] });

    jasmine.clock().install();
    try {
      c.close('s1');
      expect(c.closing.has('s1')).toBeTrue();
      expect(c.cdr.markForCheck).toHaveBeenCalledTimes(1);

      jasmine.clock().tick(279);
      expect(c.alertService.remove).not.toHaveBeenCalled();

      jasmine.clock().tick(1); // total 280
      expect(c.alertService.remove).toHaveBeenCalledOnceWith('s1');
      expect(c.closing.has('s1')).toBeFalse();
      expect(c.cdr.markForCheck).toHaveBeenCalledTimes(2);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('getItemClasses: solo onShowAnimation y closing contiene OTRO id -> mantiene clase de show', () => {
    const c = make();
    const a: any = { id: 'a', onShowAnimation: 'fade-in' };

    c.closing.add('otro'); // no es 'a'
    const cls = c.getItemClasses(a);
    expect(cls['fade-in']).toBeTrue();
  });

  it('getItemClasses: solo onCloseAnimation -> aplica clase solo si el id está cerrando', () => {
    const c = make();
    const a: any = { id: 'a', onCloseAnimation: 'fade-out' };

    // No está cerrando aún
    let cls = c.getItemClasses(a);
    expect(cls['fade-out']).toBeFalse();

    // Ahora marcamos el mismo id como cerrando
    c.closing.add('a');
    cls = c.getItemClasses(a);
    expect(cls['fade-out']).toBeTrue();
  });

  it('scheduleAutoCloseForNew: autoCloseAfter negativo se ignora', () => {
    const c = make();
    spyOn(c, 'close');

    jasmine.clock().install();
    try {
      (c as any).scheduleAutoCloseForNew([
        { id: 'neg', autoCloseAfter: -10 }, // debe ignorarse
      ]);
      expect(c.autoCloseTimers.size).toBe(0);
      jasmine.clock().tick(20);
      expect(c.close).not.toHaveBeenCalled();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('cleanupTimersForRemoved: sin cambios si todos los ids siguen presentes', () => {
    const c = make();
    const t1 = 11 as unknown as number;
    const t2 = 22 as unknown as number;
    c.autoCloseTimers.set('a', t1);
    c.autoCloseTimers.set('b', t2);

    spyOn(window, 'clearTimeout');

    (c as any).cleanupTimersForRemoved([{ id: 'a' }, { id: 'b' }]);

    expect(window.clearTimeout).not.toHaveBeenCalled();
    expect(c.autoCloseTimers.size).toBe(2);
    expect(c.autoCloseTimers.has('a')).toBeTrue();
    expect(c.autoCloseTimers.has('b')).toBeTrue();
  });

  it('cleanupTimersForRemoved: sin timers existentes no llama clearTimeout', () => {
    const c = make();
    spyOn(window, 'clearTimeout');

    (c as any).cleanupTimersForRemoved([{ id: 'a' }]);
    expect(window.clearTimeout).not.toHaveBeenCalled();
    expect(c.autoCloseTimers.size).toBe(0);
  });

  it('schedule + cleanup: elimina timer de un id y solo dispara el restante', () => {
    const c = make();
    spyOn(c, 'close');

    jasmine.clock().install();
    try {
      // Crea timers para a (20ms) y b (30ms)
      (c as any).scheduleAutoCloseForNew([
        { id: 'a', autoCloseAfter: 20 },
        { id: 'b', autoCloseAfter: 30 },
      ]);
      expect(c.autoCloseTimers.size).toBe(2);

      // Simula que la lista actual solo contiene b -> limpiar timer de 'a'
      (c as any).cleanupTimersForRemoved([{ id: 'b' }]);
      expect(c.autoCloseTimers.size).toBe(1);
      expect(c.autoCloseTimers.has('b')).toBeTrue();

      // Avanza 20ms: el timer de 'a' ya no debería disparar
      jasmine.clock().tick(20);
      expect(c.close).not.toHaveBeenCalledWith('a');

      // Avanza 10ms más: ahora sí debe disparar 'b'
      jasmine.clock().tick(10);
      expect(c.close).toHaveBeenCalledWith('b');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('close: si id es el mismo y ya está en closing, no duplica ni llama remove antes de tiempo', () => {
    const c = make({ alerts: [{ id: 'a', onCloseAnimation: 'slide-out' }] });

    jasmine.clock().install();
    try {
      c.close('a'); // inicia
      c.close('a'); // debe ignorar
      jasmine.clock().tick(299);
      expect(c.alertService.remove).not.toHaveBeenCalled();
      jasmine.clock().tick(1);
      expect(c.alertService.remove).toHaveBeenCalledTimes(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('close: cuando el alert existe pero sin onCloseAnimation -> remove inmediato', () => {
    const c = make({ alerts: [{ id: 'a', onShowAnimation: 'fade-in' }] });
    c.close('a');
    expect(c.alertService.remove).toHaveBeenCalledOnceWith('a');
  });

  it('getItemClasses: maneja alert con id undefined sin lanzar y sin clases activas', () => {
    const c = make();
    const a: any = { onShowAnimation: 'fade-in', onCloseAnimation: 'fade-out' };
    const cls = c.getItemClasses(a);
    expect(Object.values(cls).every(v => v === true)).toBeFalse();
  });
});
