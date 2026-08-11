import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ZrButton } from './fields/ZdsFields';
import { ActionBar } from './ActionBar';

// Spike de convención de testing (docs/guides/testing-conventions.md): confirma que un
// custom element real de @zurich/web-components (ZrButton) se registra y renderiza bajo
// jsdom con React Testing Library. Es la prueba de concepto mínima antes de mandatar RTL
// para componentes/pantallas — no cubre interacción (click), solo registro + contenido.
describe('ActionBar', () => {
  it('renderiza un ZrButton hijo con su texto', () => {
    render(
      <ActionBar>
        <ZrButton content="Enviar" />
      </ActionBar>
    );

    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });
});
