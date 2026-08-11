import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DsCatalog from './DsCatalog';

// No depende de PM4 (ni useTask ni useCollection): es una vitrina estática de la fachada
// ZdsFields con estado 100% local, así que no hace falta mockear nada de red. El smoke
// test cubre lo que de verdad puede romperse acá: un import/prop mal escrito en alguna de
// las ~20 secciones de componentes del DS que renderiza.
describe('DsCatalog', () => {
  it('renderiza sin lanzar y muestra las secciones principales', () => {
    render(<DsCatalog />);

    expect(screen.getByText('Catálogo Zurich DS')).toBeInTheDocument();
    expect(screen.getByText('Botones')).toBeInTheDocument();
    expect(screen.getByText('Campos de formulario')).toBeInTheDocument();
    expect(screen.getByText('Tabla')).toBeInTheDocument();
    expect(screen.getByText('Overlays')).toBeInTheDocument();
  });

  it('el modal de ejemplo solo se monta después de abrirlo', () => {
    render(<DsCatalog />);

    expect(screen.queryByText('Modal de ejemplo')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Abrir modal'));

    expect(screen.getByText('Modal de ejemplo')).toBeInTheDocument();
  });
});
