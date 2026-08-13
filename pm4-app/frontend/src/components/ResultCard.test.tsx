import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ResultCard from './ResultCard';

describe('ResultCard', () => {
  it('renderiza el título y los children', () => {
    render(<ResultCard title="Queja radicada con éxito"><p>Detalle</p></ResultCard>);

    expect(screen.getByText('Queja radicada con éxito')).toBeInTheDocument();
    expect(screen.getByText('Detalle')).toBeInTheDocument();
  });

  it('sin children solo muestra el título, sin bloque de detalle', () => {
    // Antes se contaba `div > div` con `<= 1`, que se satisface con 0 y por tanto pasa
    // incluso con un componente vacío. El texto renderizado es la evidencia directa: si el
    // bloque de children se montara igual, aparecería contenido extra.
    const { container } = render(<ResultCard title="Título" />);
    expect(container.textContent).toBe('Título');
  });

  it('con children monta el bloque de detalle además del título', () => {
    const { container } = render(<ResultCard title="Título">Detalle</ResultCard>);
    expect(container.textContent).toContain('Título');
    expect(container.textContent).toContain('Detalle');
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
