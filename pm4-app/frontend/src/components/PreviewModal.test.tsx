import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PreviewModal from './PreviewModal';

// PdfViewer tiene su propia suite (PdfViewer.test.tsx) que cubre la descarga del
// binario vía PM4 — acá se mockea para aislar PreviewModal de esa red y solo verificar
// que lo monta con el fileId correcto cuando corresponde.
vi.mock('./PdfViewer', () => ({
  default: ({ fileId, height }: { fileId: number; height: number }) => (
    <div data-testid="pdf-viewer-mock" data-file-id={fileId} data-height={height} />
  ),
}));

describe('PreviewModal', () => {
  it('con isOpen=false no renderiza nada (se desmonta por completo)', () => {
    const { container } = render(<PreviewModal isOpen={false} onClose={vi.fn()} previewDoc={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('con fileId monta el PdfViewer con ese id', () => {
    render(
      <PreviewModal
        isOpen
        onClose={vi.fn()}
        previewDoc={{ fileName: 'anexo.pdf', fileId: 42 }}
      />,
    );

    expect(screen.getByText('anexo.pdf')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-viewer-mock')).toHaveAttribute('data-file-id', '42');
  });

  it('sin fileId pero con blobUrl renderiza un <iframe> con ese blob URL', () => {
    render(
      <PreviewModal
        isOpen
        onClose={vi.fn()}
        previewDoc={{ fileName: 'temporal.pdf', blobUrl: 'blob:local-preview' }}
      />,
    );

    expect(screen.queryByTestId('pdf-viewer-mock')).not.toBeInTheDocument();
    expect(screen.getByTitle('temporal.pdf')).toHaveAttribute('src', 'blob:local-preview');
  });

  it('sin fileName cae al título por defecto "Vista previa"', () => {
    render(<PreviewModal isOpen onClose={vi.fn()} previewDoc={{ fileName: '' }} />);
    expect(screen.getByText('Vista previa')).toBeInTheDocument();
  });

  it('con descripcion la muestra bajo el nombre del archivo', () => {
    render(
      <PreviewModal
        isOpen
        onClose={vi.fn()}
        previewDoc={{ fileName: 'a.pdf', descripcion: 'Cédula del titular', fileId: 1 }}
      />,
    );
    expect(screen.getByText('Cédula del titular')).toBeInTheDocument();
  });
});
