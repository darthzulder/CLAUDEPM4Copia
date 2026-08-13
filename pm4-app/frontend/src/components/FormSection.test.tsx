import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FormSection from './FormSection';

describe('FormSection', () => {
  it('renderiza el título y el contenido', () => {
    render(<FormSection title="Datos del consumidor"><span>Contenido</span></FormSection>);

    expect(screen.getByText('Datos del consumidor')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('renderiza action y footer cuando se pasan', () => {
    render(
      <FormSection title="Título" action={<span>Ayuda</span>} footer={<div>Pie</div>}>
        <span>Body</span>
      </FormSection>,
    );

    expect(screen.getByText('Ayuda')).toBeInTheDocument();
    expect(screen.getByText('Pie')).toBeInTheDocument();
  });

  it('sin action/footer no los renderiza', () => {
    // Se asserta contra la ESTRUCTURA que el componente sí produce, no contra los strings
    // 'Ayuda'/'Pie': esos solo existían como props del test anterior, así que buscar su
    // ausencia pasaba igual con un <div/> vacío.
    // - `action` se monta como un 2º <span> dentro de .form-section-header.
    // - `footer` se monta como hermano de .form-section-body dentro de .form-section-card.
    const { container } = render(<FormSection title="Título"><span>Body</span></FormSection>);

    expect(container.querySelectorAll('.form-section-header span')).toHaveLength(1);
    expect(container.querySelector('.form-section-card')?.children).toHaveLength(2);
  });

  it('con action y footer sí los monta en su lugar', () => {
    // Contraparte del anterior: sin esto, el test de arriba no distingue "no se montan
    // porque no se pasaron" de "no se montan nunca".
    const { container } = render(
      <FormSection title="Título" action={<button>Ayuda</button>} footer={<div>Pie</div>}>
        <span>Body</span>
      </FormSection>,
    );

    expect(container.querySelectorAll('.form-section-header span')).toHaveLength(2);
    expect(container.querySelector('.form-section-card')?.children).toHaveLength(3);
  });

  it('usa el color por defecto (--z-blue) en el header si no se pasa color', () => {
    render(<FormSection title="Título"><span>Body</span></FormSection>);

    const objHeader = screen.getByText('Título').closest('.form-section-header') as HTMLElement;
    expect(objHeader.style.backgroundColor).toBe('var(--z-blue)');
  });
});
