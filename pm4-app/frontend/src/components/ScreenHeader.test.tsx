import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ScreenHeader from './ScreenHeader';

describe('ScreenHeader', () => {
  it('renderiza el título y el logo Zurich', () => {
    render(<ScreenHeader title="Mi pantalla" />);

    expect(screen.getByRole('heading', { name: 'Mi pantalla' })).toBeInTheDocument();
    expect(screen.getByAltText('Zurich')).toBeInTheDocument();
  });

  it('sin subtitle no renderiza el bloque .subtitle', () => {
    const { container } = render(<ScreenHeader title="Mi pantalla" />);
    expect(container.querySelector('.subtitle')).toBeNull();
  });

  it('subtitle como string se envuelve en un único span', () => {
    render(<ScreenHeader title="Mi pantalla" subtitle="Caso #123" />);
    expect(screen.getByText('Caso #123')).toBeInTheDocument();
  });

  it('subtitle como lista filtra los valores vacíos (false/null/undefined)', () => {
    render(<ScreenHeader title="Mi pantalla" subtitle={['Caso #123', false, null, undefined, 'Estado: Abierta']} />);

    expect(screen.getByText('Caso #123')).toBeInTheDocument();
    expect(screen.getByText('Estado: Abierta')).toBeInTheDocument();
  });

  it('una lista donde todos los elementos son falsy no renderiza el bloque .subtitle', () => {
    const { container } = render(<ScreenHeader title="Mi pantalla" subtitle={[false, null, undefined]} />);
    expect(container.querySelector('.subtitle')).toBeNull();
  });

  it('subtitle como nodo React se renderiza tal cual, sin envolver en .subtitle', () => {
    const { container } = render(<ScreenHeader title="Mi pantalla" subtitle={<strong>Nodo custom</strong>} />);

    expect(screen.getByText('Nodo custom')).toBeInTheDocument();
    expect(container.querySelector('.subtitle')).toBeNull();
  });
});
