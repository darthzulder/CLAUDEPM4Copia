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
    render(<FormSection title="Título"><span>Body</span></FormSection>);

    expect(screen.queryByText('Ayuda')).not.toBeInTheDocument();
    expect(screen.queryByText('Pie')).not.toBeInTheDocument();
  });

  it('usa el color por defecto (--z-blue) en el header si no se pasa color', () => {
    render(<FormSection title="Título"><span>Body</span></FormSection>);

    const objHeader = screen.getByText('Título').closest('.form-section-header') as HTMLElement;
    expect(objHeader.style.backgroundColor).toBe('var(--z-blue)');
  });
});
