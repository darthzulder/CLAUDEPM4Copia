import { TableZ } from './table-z';

describe('TableZ (class-only)', () => {
  // Helper: QueryList<ZTemplate> minimal que solo implementa forEach
  function ql(items: Array<{ id: string; template: any }>) {
    return {
      forEach: (fn: (item: { id: string; template: any }) => void) => {
        items.forEach(fn);
      },
    } as any;
  }

  // Helper: crea estructura DOM para .checkAll con shadowRoot->input
  function mountCheckAll(): { host: HTMLElement; input: HTMLInputElement } {
    const host = document.createElement('div');
    host.className = 'checkAll'; // querySelector('.checkAll')

    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    const input = document.createElement('input');

    // fake shadowRoot con querySelector que devuelve el input
    (child2 as any).shadowRoot = {
      querySelector: (sel: string) => (sel === 'input' ? input : null),
    };

    child1.appendChild(child2);
    host.appendChild(child1);
    document.body.appendChild(host);
    return { host, input };
  }

  // Helper: crea N nodos .singleCheck con shadowRoot->input
  function mountSingleChecks(count: number, initialChecked = false): {
    hosts: HTMLElement[];
    inputs: HTMLInputElement[];
  } {
    const hosts: HTMLElement[] = [];
    const inputs: HTMLInputElement[] = [];
    for (let i = 0; i < count; i++) {
      const host = document.createElement('div');
      host.className = 'singleCheck';
      // Estructura: host.childNodes.forEach(subI) => subI.childNodes[0] => HTMLElement con shadowRoot.querySelector('input')
      const subI = document.createElement('div');
      const inner = document.createElement('div');
      const input = document.createElement('input');
      input.checked = initialChecked;
      (inner as any).shadowRoot = {
        querySelector: (sel: string) => (sel === 'input' ? input : null),
      };
      subI.appendChild(inner);
      host.appendChild(subI);
      document.body.appendChild(host);
      hosts.push(host);
      inputs.push(input);
    }
    return { hosts, inputs };
  }

  // Limpia todos los nodos agregados al body para evitar fugas entre tests
  function cleanupNodes(nodes: HTMLElement[]) {
    nodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
  }

  it('defaults', () => {
    const c = new TableZ('browser' as any);
    expect(c.headers).toEqual([]);
    expect(c.data).toEqual([]);
    expect(c.typeStyle).toBe('');
    expect(c.pages).toBe(0);
    expect(c.disablePage).toBeFalse();
    expect(c.showGenericStart).toBeFalse();
    expect(c.genericStartName).toBe('');
    expect(c.showGenericEnd).toBeFalse();
    expect(c.generciEndName).toBe('');
    expect(c.hideHeader).toBeFalse();
    expect(c.page).toBe(1);
    expect(c.selectedItems).toEqual([]);
    expect(c.selectAllItems).toBeFalse();
    expect(c.columnTemplates).toEqual({});
    expect(c.viewData).toEqual([]);
    // Emitters definidos
    expect(c.eventChangePages).toBeTruthy();
    expect(c.selectedItemsList).toBeTruthy();
    // Templates indefinidos al inicio
    expect(c.genericStartT).toBeUndefined();
    expect(c.genericEndT).toBeUndefined();
  });

  it('ngOnInit llama orderData', () => {
    const c = new TableZ('browser' as any);
    (c as any).orderData = jasmine.createSpy('orderData');
    c.ngOnInit();
    expect((c as any).orderData).toHaveBeenCalled();
  });

  it('ngOnChanges: cuando cambia data, llama orderData', () => {
    const c = new TableZ('browser' as any);
    const spy = spyOn<any>(c, 'orderData');
    c.ngOnChanges({
      data: {
        previousValue: [],
        currentValue: [{ id: 1 }],
        firstChange: false,
        isFirstChange: () => false,
      },
    } as any);
    expect(spy).toHaveBeenCalled();
  });

  it('orderData: sin groupLabel, conserva el arreglo (clonado) sin ordenar', () => {
    const c = new TableZ('browser' as any);
    c.headers = [
      { key: 'id', title: 'ID', id: true } as any,
      { key: 'name', title: 'Name' } as any,
    ];
    const original = [{ id: 10 }, { id: 5 }, { id: 7 }] as any;
    c.data = original;
    c.ngOnInit(); // llama orderData
    expect(c.viewData).toEqual(original);
    expect(c.viewData).not.toBe(original); // clonado
  });

  it('orderData + buildGroupingMeta: ordena por clave de grupo y establece _showGroup/_rowspan', () => {
    const c = new TableZ('browser' as any);
    c.headers = [
      { key: 'id', title: 'ID', id: true } as any,
      { key: 'group', title: 'Group', groupLabel: true } as any,
      { key: 'name', title: 'Name' } as any,
    ];
    c.data = [
      { id: 4, group: 'C', name: 'c-1' },
      { id: 2, group: 'A', name: 'a-1' },
      { id: 3, group: 'A', name: 'a-2' },
      { id: 1, group: 'B', name: 'b-1' },
    ] as any;

    c.ngOnInit(); // -> orderData -> buildGroupingMeta

    // Debe quedar ordenado por group: A,A,B,C
    expect(c.viewData.map(r => r.group)).toEqual(['A', 'A', 'B', 'C']);

    // Metadatos de agrupación
    expect(c.viewData[0]._showGroup).toBeTrue();
    expect(c.viewData[0]._rowspan).toBe(2); // Grupo 'A' tiene 2 filas
    expect(c.viewData[1]._showGroup).toBeFalse();

    // Los grupos B y C deben tener rowspan=1
    const groupBIndex = 2;
    const groupCIndex = 3;
    expect(c.viewData[groupBIndex]._showGroup).toBeTrue();
    expect(c.viewData[groupBIndex]._rowspan).toBe(1);
    expect(c.viewData[groupCIndex]._showGroup).toBeTrue();
    expect(c.viewData[groupCIndex]._rowspan).toBe(1);
  });

  it('ngAfterContentInit: asigna genericStartT/genericEndT y columnTemplates (vía QueryList fake)', () => {
    const c = new TableZ('browser' as any);
    const start = { tpl: 'START' };
    const end = { tpl: 'END' };
    const status = { tpl: 'STATUS' };
    (c as any).template = ql([
      { id: 'start', template: start as any },
      { id: 'end', template: end as any },
      { id: 'status', template: status as any },
    ]);
    c.ngAfterContentInit();

    expect(c.genericStartT).toBe(start as any);
    expect(c.genericEndT).toBe(end as any);
    expect(c.columnTemplates['status']).toBe(status as any);
  });

 

  it('ngAfterViewInit (server): no intenta acceder al DOM cuando no es browser', () => {
    const c = new TableZ('server' as any);
    jasmine.clock().install();
    try {
      expect(() => c.ngAfterViewInit()).not.toThrow();
      jasmine.clock().tick(0);
      expect(c.checkAllItem).toBeUndefined();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('eventChangePage: actualiza page y emite eventChangePages', (done) => {
    const c = new TableZ('browser' as any);
    c.eventChangePages.subscribe((p) => {
      expect(p).toBe(3);
      done();
    });
    c.eventChangePage({ detail: 3 });
    expect(c.page).toBe(3);
  });

  it('getIdItem: devuelve los headers con id=true', () => {
    const c = new TableZ('browser' as any);
    c.headers = [
      { key: 'id', title: 'ID', id: true } as any,
      { key: 'name', title: 'Name' } as any,
    ];
    const ids = c.getIdItem();
    expect(ids.length).toBe(1);
    expect(ids[0].key).toBe('id');
  });

  it('simpleCheck: agrega y quita ítems cuando selectAllItems=false, emite lista y llama validIsCheck', () => {
    const c = new TableZ('browser' as any);
    c.headers = [{ key: 'id', title: 'ID', id: true } as any];
    c.data = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    c.selectAllItems = false;

    // Evita crash en validIsCheck: checkAllItem definido y no marcado
    c.checkAllItem = document.createElement('input');
    (c.checkAllItem as HTMLInputElement).checked = false;

    const emitted: any[] = [];
    c.selectedItemsList.subscribe((arr) => emitted.push(arr));

    const spyValid = spyOn<any>(c, 'validIsCheck').and.callThrough();

    // Marca el 1
    c.simpleCheck({ detail: true }, c.data[0], 0);
    expect(c.selectedItems).toEqual([c.data[0]]);
    expect(emitted[0]).toEqual([c.data[0]]);
    expect(spyValid).toHaveBeenCalledWith(0);

    // Desmarca el 1
    c.simpleCheck({ detail: false }, c.data[0], 0);
    expect(c.selectedItems).toEqual([]);
    expect(emitted[1]).toEqual([]);
  });

  it('validIsCheck: si checkAllItem.checked=true, lo desmarca, apaga selectAllItems y emite lista filtrada', () => {
    const c = new TableZ('browser' as any);
    c.headers = [{ key: 'id', title: 'ID', id: true } as any];
    c.data = [
      { id: 10, name: 'X' },
      { id: 11, name: 'Y' },
    ];
    c.selectedItems = [...c.data];

    const input = document.createElement('input');
    input.checked = true; // forza rama
    c.checkAllItem = input;

    let last: any[] = [];
    c.selectedItemsList.subscribe((arr) => (last = arr));

    c.validIsCheck(0); // quita el índice 0

    expect((c.checkAllItem as HTMLInputElement).checked).toBeFalse();
    expect(c.selectAllItems).toBeFalse();
    expect(c.selectedItems).toEqual([c.data[1]]);
    expect(last).toEqual([c.data[1]]);
  });


  it('simula lógica de zebra (template): typeStyle=="odd" => "odd", otro => true', () => {
    const c = new TableZ('browser' as any);
    const resolveZebra = () => (c.typeStyle === 'odd' ? 'odd' : true);
    c.typeStyle = 'odd';
    expect(resolveZebra()).toBe('odd');
    c.typeStyle = 'striped';
    expect(resolveZebra()).toBeTrue();
    c.typeStyle = '';
    expect(resolveZebra()).toBeTrue();
  });

  // Helper adicional: crea N .singleCheck SIN shadowRoot/input (para cubrir rama "if (sC) { ... } else skip")
  function mountBadSingleChecks(count: number): { hosts: HTMLElement[] } {
    const hosts: HTMLElement[] = [];
    for (let i = 0; i < count; i++) {
      const host = document.createElement('div');
      host.className = 'singleCheck';
      // Estructura mínima pero sin shadowRoot ni input
      const subI = document.createElement('div');
      const inner = document.createElement('div');
      // Aquí NO inyectamos shadowRoot ni input
      subI.appendChild(inner);
      host.appendChild(subI);
      document.body.appendChild(host);
      hosts.push(host);
    }
    return { hosts };
  }

  it('ngAfterViewInit (browser): si no existe .checkAll, no setea checkAllItem', () => {
    const c = new TableZ('browser' as any);
    // asegurarnos de que no hay .checkAll en el DOM
    const existing = Array.from(document.querySelectorAll('.checkAll')) as HTMLElement[];
    cleanupNodes(existing);

    jasmine.clock().install();
    try {
      c.ngAfterViewInit();
      jasmine.clock().tick(0);
      expect(c.checkAllItem).toBeUndefined();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('selectAll(true) tolera .singleCheck sin shadowRoot/input (no truena y emite data)', () => {
    const c = new TableZ('browser' as any);
    c.data = [{ id: 1 }, { id: 2 }] as any;

    // Montamos dos nodos "mal formados" (sin shadowRoot/input)
    const { hosts } = mountBadSingleChecks(2);

    let last: any;
    c.selectedItemsList.subscribe((arr) => (last = arr));

    jasmine.clock().install();
    try {
      expect(() => c.selectAll({ detail: true })).not.toThrow();
      jasmine.clock().tick(20);
      // Aunque no pudo marcar inputs (no existen), IGUAL emite data completa
      expect(last).toEqual(c.data);
      expect(c.selectAllItems).toBeTrue();
    } finally {
      jasmine.clock().uninstall();
      cleanupNodes(hosts);
    }
  });

  it('selectAll(false) tolera DOM sin .singleCheck (emite [])', () => {
    const c = new TableZ('browser' as any);
    c.data = [{ id: 1 }] as any;

    // Aseguramos que no existan .singleCheck
    const existing = Array.from(document.querySelectorAll('.singleCheck')) as HTMLElement[];
    cleanupNodes(existing);

    let last: any = 'unset';
    c.selectedItemsList.subscribe((arr) => (last = arr));

    jasmine.clock().install();
    try {
      expect(() => c.selectAll({ detail: false })).not.toThrow();
      jasmine.clock().tick(20);
      expect(last).toEqual([]);
      expect(c.selectAllItems).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('simpleCheck con selectAllItems = true: no modifica selectedItems pero llama validIsCheck', () => {
    const c = new TableZ('browser' as any);
    c.headers = [{ key: 'id', title: 'ID', id: true } as any];
    c.data = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] as any;
    c.selectedItems = [c.data[1]];
    c.selectAllItems = true; // rama que salta la mutación

    // validIsCheck se llama SIEMPRE al final
    c.checkAllItem = document.createElement('input'); // no checked -> rama "no hace nada"
    (c.checkAllItem as HTMLInputElement).checked = false;

    const spyValid = spyOn<any>(c, 'validIsCheck').and.callThrough();

    c.simpleCheck({ detail: false }, c.data[0], 0);

    // No cambia la selección
    expect(c.selectedItems).toEqual([c.data[1]]);
    // Pero sí invoca validIsCheck
    expect(spyValid).toHaveBeenCalledWith(0);
  });

  it('validIsCheck con checkAllItem.checked = false: no emite ni modifica selectedItems', () => {
    const c = new TableZ('browser' as any);
    c.headers = [{ key: 'id', title: 'ID', id: true } as any];
    c.data = [{ id: 1 }, { id: 2 }] as any;
    c.selectedItems = [c.data[0]];

    c.checkAllItem = document.createElement('input');
    (c.checkAllItem as HTMLInputElement).checked = false; // rama "no-op"

    let emissions = 0;
    c.selectedItemsList.subscribe(() => emissions++);

    c.validIsCheck(1);
    // No cambia selección
    expect(c.selectedItems).toEqual([c.data[0]]);
    // No emite
    expect(emissions).toBe(0);
  });

  it('orderData: si existe header con groupLabel pero SIN key, no agrupa (clona tal cual)', () => {
    const c = new TableZ('browser' as any);
    c.headers = [
      { key: 'id', id: true } as any,
      { title: 'Group', groupLabel: true } as any, // <- sin key
    ];
    c.data = [{ id: 2 }, { id: 1 }, { id: 3 }] as any;

    c.ngOnInit();
    expect(c.viewData).toEqual(c.data);
    expect(c.viewData).not.toBe(c.data); // clonado
  });

  it('buildGroupingMeta: con [] no truena; con 1 elemento pone _rowspan=1 y _showGroup=true', () => {
    const c = new TableZ('browser' as any);

    // [] no debe lanzar
    expect(() => (c as any).buildGroupingMeta([], 'group')).not.toThrow();

    // 1 elemento
    const one = [{ group: 'X' }] as any;
    (c as any).buildGroupingMeta(one, 'group');

    expect(one[0]._showGroup).toBeTrue();
    expect(one[0]._rowspan).toBe(1);
    expect(one[0]._groupValue).toBe('X');
  });

  it('orderData: agrupación por clave numérica usa el fallback de comparación y agrupa correctamente', () => {
    const c = new TableZ('browser' as any);
    c.headers = [
      { key: 'id', id: true } as any,
      { key: 'bucket', groupLabel: true } as any, // numérico
      { key: 'name' } as any,
    ];
    c.data = [
      { id: 1, bucket: 2, name: 'b' },
      { id: 2, bucket: 1, name: 'a1' },
      { id: 3, bucket: 1, name: 'a2' },
    ] as any;

    c.ngOnInit();

    // Orden numérico: 1,1,2
    expect(c.viewData.map(r => r.bucket)).toEqual([1, 1, 2]);
    // rowspan del bucket=1 debe ser 2, y el del bucket=2 debe ser 1
    expect(c.viewData[0]._rowspan).toBe(2);
    expect(c.viewData[2]._rowspan).toBe(1);
  });

  it('getIdItem: cuando no hay headers con id=true devuelve []', () => {
    const c = new TableZ('browser' as any);
    c.headers = [{ key: 'code' } as any, { key: 'name' } as any];
    const ids = c.getIdItem();
    expect(ids).toEqual([]);
  });

  it('eventChangePage: múltiples emisiones actualizan page y orden de emisiones se conserva', () => {
    const c = new TableZ('browser' as any);
    const received: number[] = [];
    c.eventChangePages.subscribe((p) => received.push(p));

    c.eventChangePage({ detail: 2 });
    c.eventChangePage({ detail: 5 });
    c.eventChangePage({ detail: 1 });

    expect(c.page).toBe(1);
    expect(received).toEqual([2, 5, 1]);
  });

  it('simpleCheck: desmarcar un item no seleccionado no rompe ni cambia el estado', () => {
    const c = new TableZ('browser' as any);
    c.headers = [{ key: 'id', id: true } as any];
    c.data = [{ id: 1 }, { id: 2 }] as any;

    // checkAllItem definido y no marcado para que validIsCheck sea no-op
    c.checkAllItem = document.createElement('input');
    (c.checkAllItem as HTMLInputElement).checked = false;

    c.selectedItems = [c.data[1]]; // solo el id:2
    const before = [...c.selectedItems];

    let emissions = 0;
    c.selectedItemsList.subscribe(() => emissions++);

    // Emitimos "desmarcar" el id:1 que NO estaba seleccionado
    c.simpleCheck({ detail: false }, c.data[0], 0);

    expect(c.selectedItems).toEqual(before); // sin cambios
    // sí emite (porque la rama selectAllItems=false emite la lista actual),
    // pero el contenido no cambia
    expect(emissions).toBeGreaterThan(0);
  });



});
