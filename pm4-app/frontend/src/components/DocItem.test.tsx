import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DocItem from './DocItem';

describe('DocItem — modo upload', () => {
  it('sin archivo muestra el índice y el estado "danger" (Pendiente) si es editable', () => {
    render(
      <DocItem index={1} descripcion="Cédula" mode="upload" onPreview={vi.fn()} onFileChange={vi.fn()} />,
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Seleccionar archivo')).toBeInTheDocument();
  });

  it('sin archivo y sin onFileChange (modo solo lectura) muestra "Sin documento"', () => {
    render(<DocItem index={2} descripcion="Cédula" mode="upload" onPreview={vi.fn()} />);
    expect(screen.getByText('Sin documento')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('con archivo en state marca "Cargado" y habilita "Ver"/"Cambiar"', () => {
    const objFile = new File(['contenido'], 'cedula.pdf', { type: 'application/pdf' });
    render(
      <DocItem
        index={1}
        descripcion="Cédula"
        mode="upload"
        onPreview={vi.fn()}
        onFileChange={vi.fn()}
        state={{ file: objFile, blobUrl: null }}
      />,
    );

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('Cargado')).toBeInTheDocument();
    expect(screen.getByText('Cambiar')).toBeInTheDocument();
    expect(screen.getByText('cedula.pdf')).toBeInTheDocument();
  });

  it('el botón "Ver" (vista previa) está deshabilitado sin archivo cargado', () => {
    render(
      <DocItem index={1} descripcion="Cédula" mode="upload" onPreview={vi.fn()} onFileChange={vi.fn()} />,
    );

    const objBtn = screen.getByText('Vista previa').closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
  });
});

describe('DocItem — modo validation', () => {
  it('sin fileId muestra "Sin documento" y deshabilita "Ver"', () => {
    render(<DocItem index={1} descripcion="RUT" mode="validation" onPreview={vi.fn()} fileId={null} />);

    expect(screen.getByText('Sin documento')).toBeInTheDocument();
    const objBtn = screen.getByText('Ver').closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).toBe(true);
  });

  it('con fileId muestra el nombre del archivo y habilita "Ver"', () => {
    render(
      <DocItem index={1} descripcion="RUT" mode="validation" onPreview={vi.fn()} fileId={42} fileName="rut.pdf" />,
    );

    expect(screen.getByText('rut.pdf')).toBeInTheDocument();
    // `disabled={false}` en el mount inicial: React no siempre asigna la propiedad
    // explícitamente cuando coincide con el default del custom element (queda
    // `undefined`, no `false`) — lo verificable es que NO quedó en `true`.
    const objBtn = screen.getByText('Ver').closest('z-button');
    expect((objBtn as unknown as { disabled?: boolean })?.disabled).not.toBe(true);
  });

  it('sin onValidacion no renderiza el select de validación', () => {
    const { container } = render(
      <DocItem index={1} descripcion="RUT" mode="validation" onPreview={vi.fn()} fileId={42} fileName="rut.pdf" />,
    );
    expect(container.querySelector('z-select')).toBeNull();
  });
});
