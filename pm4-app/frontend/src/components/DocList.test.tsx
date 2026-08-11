import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DocList from './DocList';

describe('DocList', () => {
  it('modo validation agrega la cabecera de columnas', () => {
    render(<DocList mode="validation"><span>Fila 1</span></DocList>);

    expect(screen.getByText('Descripción')).toBeInTheDocument();
    expect(screen.getByText('Archivo')).toBeInTheDocument();
    expect(screen.getByText('Validación')).toBeInTheDocument();
    expect(screen.getByText('Fila 1')).toBeInTheDocument();
  });

  it('modo upload NO agrega la cabecera de columnas', () => {
    render(<DocList mode="upload"><span>Fila 1</span></DocList>);

    expect(screen.queryByText('Descripción')).not.toBeInTheDocument();
    expect(screen.getByText('Fila 1')).toBeInTheDocument();
  });
});
