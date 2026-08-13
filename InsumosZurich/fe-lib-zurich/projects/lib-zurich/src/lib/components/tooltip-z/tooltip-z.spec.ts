import { TooltipZ } from './tooltip-z';
import type { ZTooltip_Props } from '@zurich/dev-utils/code/Tooltip';

describe('TooltipZ (class-only)', () => {
  let component: TooltipZ;

  beforeEach(() => {
    component = new TooltipZ();
  });

  it('debe inicializar con valores por defecto', () => {
    expect(component.text).toBe('');
    expect(component.customStr).toBe('');
    expect(component.config).toBeUndefined();
  });

  it('debe permitir asignar text y customStr', () => {
    component.text = 'Hola tooltip';
    component.customStr = 'X-CUSTOM';

    expect(component.text).toBe('Hola tooltip');
    expect(component.customStr).toBe('X-CUSTOM');
  });

  it('debe permitir asignar config tipada', () => {
    // Mock sencillo del tipo ZTooltip_Props['config'].
    // Ajusta la forma según tu definición real del tipo en el paquete.
    const mockConfig: ZTooltip_Props['config'] = {
      position: 'top',
      delay: 200,
      // agrega aquí cualquier otra propiedad requerida por tu tipo
    } as any;

    component.config = mockConfig;

    expect(component.config).toBe(mockConfig);

  });

  it('debe permitir config undefined (opcional)', () => {
    component.config = undefined;
    expect(component.config).toBeUndefined();
  });
});