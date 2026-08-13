import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InfoBar from './InfoBar';

describe('InfoBar', () => {
  it('renderiza un par label/value por cada item', () => {
    render(<InfoBar items={[{ label: 'Caso', value: '123' }, { label: 'Estado', value: 'Abierta' }]} />);

    expect(screen.getByText('Caso')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Abierta')).toBeInTheDocument();
  });

  it('un value null/undefined cae al placeholder "—"', () => {
    render(<InfoBar items={[{ label: 'Responsable', value: null }, { label: 'Fecha', value: undefined }]} />);

    const lstPlaceholders = screen.getAllByText('—');
    expect(lstPlaceholders).toHaveLength(2);
  });

  it('lista vacía no lanza y no renderiza filas', () => {
    const { container } = render(<InfoBar items={[]} />);
    expect(container.querySelectorAll('.info-bar-item')).toHaveLength(0);
  });
});
