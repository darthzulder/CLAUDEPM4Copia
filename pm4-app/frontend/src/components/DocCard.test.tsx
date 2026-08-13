import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DocCard from './DocCard';

describe('DocCard', () => {
  it('renderiza nombre, meta y acciones', () => {
    render(<DocCard fileName="anexo.pdf" meta="120 KB" actions={<button>Descargar</button>} />);

    expect(screen.getByText('anexo.pdf')).toBeInTheDocument();
    expect(screen.getByText('120 KB')).toBeInTheDocument();
    expect(screen.getByText('Descargar')).toBeInTheDocument();
  });

  it('sin isOpen no renderiza el cuerpo expandible aunque haya children', () => {
    render(
      <DocCard fileName="a.pdf" meta="1 KB" actions={null}>
        <span>Cuerpo expandido</span>
      </DocCard>,
    );
    expect(screen.queryByText('Cuerpo expandido')).not.toBeInTheDocument();
  });

  it('con isOpen y children SÍ renderiza el cuerpo expandible y la clase is-open', () => {
    const { container } = render(
      <DocCard fileName="a.pdf" meta="1 KB" actions={null} isOpen>
        <span>Cuerpo expandido</span>
      </DocCard>,
    );

    expect(screen.getByText('Cuerpo expandido')).toBeInTheDocument();
    expect(container.querySelector('.doc-card.is-open')).not.toBeNull();
  });

  it('con isOpen pero sin children no renderiza el div .doc-viewer', () => {
    const { container } = render(<DocCard fileName="a.pdf" meta="1 KB" actions={null} isOpen />);
    expect(container.querySelector('.doc-viewer')).toBeNull();
  });
});
