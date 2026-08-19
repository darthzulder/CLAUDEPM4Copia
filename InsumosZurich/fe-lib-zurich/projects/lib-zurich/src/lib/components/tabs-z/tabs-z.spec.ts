import { TabsZ } from './tabs-z';
import {
  ChangeDetectorRef,
  TemplateRef,
  QueryList,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';

describe('TabsZ Component (sin TestBed)', () => {
  let component: TabsZ;
  let cdrMock: ChangeDetectorRef;

  beforeEach(() => {
    cdrMock = {
      detectChanges: jasmine.createSpy('detectChanges'),
    } as any as ChangeDetectorRef;
    component = new TabsZ(cdrMock);
  });

  it('debe inicializar tabs y activeKey en ngOnChanges', () => {
    component.headers = [
      { title: 'Tab 1', key: 't1' },
      { title: 'Tab 2', key: 't2', disabled: true },
    ];
    component.data = { t1: 'Contenido 1', t2: 'Contenido 2' };

    const changes: SimpleChanges = {
      headers: new SimpleChange([], component.headers, true),
      data: new SimpleChange({}, component.data, true),
    };

    component.ngOnChanges(changes);

    expect(component.tabs.length).toBe(2);
    expect(component.tabs[0].content).toBe('Contenido 1');
    expect(component.activeKey).toBe('t1');
    expect(cdrMock.detectChanges).toHaveBeenCalled();
  });

  it('debe construir templateMap en ngAfterContentInit', () => {
    // Mock TemplateRef con la metadata interna que usas
    const mockTemplate = {
      _declarationTContainer: { localNames: ['t1'] },
    } as any as TemplateRef<any>;

    // Crear un QueryList real y llenarlo
    const ql = new QueryList<TemplateRef<any>>();
    (component as any).templates = ql; // forzar asignación al campo @ContentChildren
    ql.reset([mockTemplate]); // poblarlo
    ql.notifyOnChanges(); // notificar cambios (opcional)

    component.ngAfterContentInit();

    expect(component.templateMap['t1']).toBe(mockTemplate);
    expect(cdrMock.detectChanges).toHaveBeenCalled();
  });

  it('debe cambiar activeKey en onTabChange', () => {
    component.tabs = [
      { key: 't1', title: 'Tab 1', content: 'C1' },
      { key: 't2', title: 'Tab 2', content: 'C2' },
    ];
    component.activeKey = 't1';

    component.onTabChange({ detail: 2 } as CustomEvent<number>);

    expect(component.activeKey).toBe('t2');
    expect(cdrMock.detectChanges).toHaveBeenCalled();
  });

  it('activeTab debe devolver el tab activo', () => {
    component.tabs = [
      { key: 't1', title: 'Tab 1', content: 'C1' },
      { key: 't2', title: 'Tab 2', content: 'C2' },
    ];
    component.activeKey = 't2';

    const active = component.activeTab;
    expect(active?.title).toBe('Tab 2');
  });

  it('activeTemplate debe devolver la plantilla activa', () => {
    const mockTemplate = {} as TemplateRef<any>;
    component.templateMap = { t1: mockTemplate };
    component.activeKey = 't1';

    expect(component.activeTemplate).toBe(mockTemplate);
  });
});
