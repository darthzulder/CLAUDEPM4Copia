import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RecaptchaModal from './RecaptchaModal';

// El widget real lo inyecta Google (script externo) — se stubea `window.grecaptcha` con
// `render` ya disponible para que `loadRecaptcha()` resuelva de inmediato (su primer check
// es `if (window.grecaptcha?.render) return Promise.resolve()`), sin esperar el timeout
// de 10s ni tocar la red.
beforeEach(() => {
  window.grecaptcha = { render: vi.fn(() => 1), reset: vi.fn() };
});

afterEach(() => {
  delete (window as { grecaptcha?: unknown }).grecaptcha;
});

describe('RecaptchaModal', () => {
  it('con open=false no renderiza nada', () => {
    const { container } = render(<RecaptchaModal open={false} onVerified={vi.fn()} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('con open=true renderiza el modal y termina en estado "ready" (grecaptcha.render se llamó)', async () => {
    render(<RecaptchaModal open onVerified={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText('Validación de seguridad')).toBeInTheDocument();
    await waitFor(() => expect(window.grecaptcha!.render).toHaveBeenCalledTimes(1));
  });

  it('el botón Cancelar dispara onClose', async () => {
    const fnClose = vi.fn();
    render(<RecaptchaModal open onVerified={vi.fn()} onClose={fnClose} />);
    await waitFor(() => expect(window.grecaptcha!.render).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('Cancelar'));
    expect(fnClose).toHaveBeenCalledTimes(1);
  });

  it('el callback registrado en grecaptcha.render invoca onVerified con el token', async () => {
    const fnVerified = vi.fn();
    render(<RecaptchaModal open onVerified={fnVerified} onClose={vi.fn()} />);
    await waitFor(() => expect(window.grecaptcha!.render).toHaveBeenCalledTimes(1));

    // Simulamos que Google resolvió el checkbox: toma el callback pasado a render().
    const objRenderArgs = (window.grecaptcha!.render as ReturnType<typeof vi.fn>).mock.calls[0][1];
    objRenderArgs.callback('token-de-prueba');

    expect(fnVerified).toHaveBeenCalledWith('token-de-prueba');
  });
});
