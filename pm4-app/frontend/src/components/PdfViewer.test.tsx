import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import pm4 from '../api/pm4Client';
import PdfViewer from './PdfViewer';

// El visor pega a PM4 vía el proxy (`GET /files/{id}/contents`) para traer el binario
// como blob — se mockea el cliente axios y las APIs de blob de jsdom (no implementadas).
vi.mock('../api/pm4Client', () => ({
  default: { get: vi.fn() },
}));

const fnGet = vi.mocked(pm4.get);

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom no implementa createObjectURL/revokeObjectURL — se estuban para que el
  // componente pueda construir el blob URL sin lanzar.
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
});

describe('PdfViewer', () => {
  it('sin fileId no renderiza nada', () => {
    const { container } = render(<PdfViewer fileId={null} />);
    expect(container).toBeEmptyDOMElement();
    expect(fnGet).not.toHaveBeenCalled();
  });

  it('con fileId descarga el binario y muestra el <iframe> con el blob URL', async () => {
    fnGet.mockResolvedValueOnce({ data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }) });

    render(<PdfViewer fileId={42} label="Anexo" />);

    expect(fnGet).toHaveBeenCalledWith('/files/42/contents', { responseType: 'blob' });
    await waitFor(() => expect(screen.getByTitle('Anexo')).toBeInTheDocument());
    expect(screen.getByTitle('Anexo')).toHaveAttribute('src', 'blob:mock-url');
  });

  it('un archivo image/* se muestra con <img>, no <iframe>', async () => {
    fnGet.mockResolvedValueOnce({ data: new Blob(['binario'], { type: 'image/png' }) });

    render(<PdfViewer fileId={7} label="Foto" />);

    await waitFor(() => expect(screen.getByAltText('Foto')).toBeInTheDocument());
    expect(screen.queryByTitle('Foto')).not.toBeInTheDocument();
  });

  it('un error de red muestra el mensaje de PM4', async () => {
    fnGet.mockRejectedValueOnce({ response: { data: { message: 'Archivo no encontrado' } }, message: 'fallback' });

    render(<PdfViewer fileId={99} />);

    await waitFor(() => expect(screen.getByText(/Archivo no encontrado/)).toBeInTheDocument());
  });
});
