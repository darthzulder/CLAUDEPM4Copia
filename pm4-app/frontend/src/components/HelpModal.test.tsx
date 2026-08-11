import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HelpModal from './HelpModal';

describe('HelpModal', () => {
  it('renderiza el título y los children', () => {
    render(<HelpModal title="¿Cómo radicar una queja?"><p>Contenido de ayuda</p></HelpModal>);

    expect(screen.getByText('¿Cómo radicar una queja?')).toBeInTheDocument();
    expect(screen.getByText('Contenido de ayuda')).toBeInTheDocument();
  });

  it('renderiza el subtitle cuando se pasa', () => {
    render(<HelpModal title="Título" subtitle="Subtítulo"><span>Body</span></HelpModal>);
    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
  });

  it('sin subtitle no renderiza ningún span extra en el bloque de título', () => {
    render(<HelpModal title="Título"><span>Body</span></HelpModal>);
    // Solo el <strong> del título y el children — nada más en el primer z-flex.
    expect(screen.queryByText('Subtítulo')).not.toBeInTheDocument();
  });
});
