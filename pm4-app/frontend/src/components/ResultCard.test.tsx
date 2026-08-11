import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ResultCard from './ResultCard';

describe('ResultCard', () => {
  it('renderiza el título y los children', () => {
    render(<ResultCard title="Queja radicada con éxito"><p>Detalle</p></ResultCard>);

    expect(screen.getByText('Queja radicada con éxito')).toBeInTheDocument();
    expect(screen.getByText('Detalle')).toBeInTheDocument();
  });

  it('sin children no revienta y no renderiza el bloque de children', () => {
    const { container } = render(<ResultCard title="Título" />);
    // El div de children solo se monta cuando hay children (`children && (...)`).
    expect(container.querySelectorAll('div > div').length).toBeLessThanOrEqual(1);
  });

  it.each([
    ['success', 'check:line'],
    ['error', 'close:line'],
    ['info', 'info:line'],
    ['warning', 'alert-triangle:line'],
  ] as const)('variante %s usa el ícono %s', (strVariant, strIcon) => {
    // El wrapper del DS asigna `icon` como PROPIEDAD del custom element (igual que
    // `disabled` en ZrButton, ver testing-conventions.md), no como atributo HTML — no
    // se puede leer con un selector `[icon="..."]`.
    const { container } = render(<ResultCard variant={strVariant} title="Título" />);
    const objIcon = container.querySelector('z-icon');
    expect((objIcon as unknown as { icon?: string })?.icon).toBe(strIcon);
  });
});
