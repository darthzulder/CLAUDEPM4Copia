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

  it('sin subtitle no renderiza el span del bloque de título', () => {
    // Se cuenta el <span> real dentro del bloque de título, en vez de buscar la ausencia del
    // string 'Subtítulo' (que el componente nunca puede emitir por sí solo, así que esa
    // aserción pasaba igual con un <div/> vacío).
    const { container } = render(<HelpModal title="Título"><span>Body</span></HelpModal>);
    const objBloqueTitulo = container.querySelector('[z-flex="col:50"]');

    expect(objBloqueTitulo?.querySelector('strong')?.textContent).toBe('Título');
    expect(objBloqueTitulo?.querySelectorAll('span')).toHaveLength(0);
  });

  it('con subtitle sí monta el span junto al título', () => {
    const { container } = render(
      <HelpModal title="Título" subtitle="Subtítulo"><span>Body</span></HelpModal>,
    );
    const objBloqueTitulo = container.querySelector('[z-flex="col:50"]');

    expect(objBloqueTitulo?.querySelectorAll('span')).toHaveLength(1);
    expect(objBloqueTitulo?.querySelector('span')?.textContent).toBe('Subtítulo');
  });
});
