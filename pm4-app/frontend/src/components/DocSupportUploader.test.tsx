import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import DocSupportUploader from './DocSupportUploader';

// react-hook-form necesita vivir dentro de un componente (useForm es un hook) — este
// wrapper es el que arma el `form`/`fileRegistry` que el uploader recibe por props,
// igual que lo haría la pantalla real.
interface FormData {
  doc01: string;
  doc02: string;
  doc03: string;
}

function Wrapper() {
  const objForm = useForm<FormData>({ defaultValues: { doc01: '', doc02: '', doc03: '' } });
  const objFileRegistry = { current: new Map<string, File>() };
  return (
    <DocSupportUploader
      form={objForm}
      fileRegistry={objFileRegistry}
      docKeys={['doc01', 'doc02', 'doc03'] as const}
    />
  );
}

describe('DocSupportUploader', () => {
  it('renderiza el título, intro y un solo slot al montar', () => {
    render(<Wrapper />);

    expect(screen.getByText('Documento de soporte de las confirmaciones')).toBeInTheDocument();
    expect(screen.getByText('Documento 1')).toBeInTheDocument();
    expect(screen.queryByText('Documento 2')).not.toBeInTheDocument();
  });

  it('el botón "Agregar documento" está visible mientras no se llegue al límite', () => {
    render(<Wrapper />);
    expect(screen.getByText('Agregar documento')).toBeInTheDocument();
  });

  it('acepta título/intro/max personalizados', () => {
    function WrapperCustom() {
      const objForm = useForm<FormData>({ defaultValues: { doc01: '', doc02: '', doc03: '' } });
      const objFileRegistry = { current: new Map<string, File>() };
      return (
        <DocSupportUploader
          form={objForm}
          fileRegistry={objFileRegistry}
          docKeys={['doc01', 'doc02', 'doc03'] as const}
          title="Otro título"
          intro="Otra intro"
          max={1}
        />
      );
    }
    render(<WrapperCustom />);

    expect(screen.getByText('Otro título')).toBeInTheDocument();
    expect(screen.getByText('Otra intro')).toBeInTheDocument();
    // max=1 → ya se alcanzó el límite en el primer slot, no hay botón de agregar.
    expect(screen.queryByText('Agregar documento')).not.toBeInTheDocument();
  });
});
