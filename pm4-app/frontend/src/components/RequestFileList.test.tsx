import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRequestFiles } from '../core/useRequestFiles';
import RequestFileList from './RequestFileList';

// Se mockea SOLO useRequestFiles (el hook que pega a PM4) para aislar el componente de
// la red — igual patrón que useTask/useCollection en las pantallas (ver
// testing-conventions.md): referencias ESTABLES por test para no reactivar el
// `useMemo`/efectos internos entre renders.
vi.mock('../core/useRequestFiles', () => ({ useRequestFiles: vi.fn() }));

const fnUseRequestFiles = vi.mocked(useRequestFiles);

describe('RequestFileList', () => {
  it('mientras carga muestra el loadingText', () => {
    fnUseRequestFiles.mockReturnValue({ files: [], loading: true, error: null });
    render(<RequestFileList requestId={1} />);

    expect(screen.getByText('Buscando documentos del caso…')).toBeInTheDocument();
  });

  it('con error muestra el mensaje de error, no la lista', () => {
    fnUseRequestFiles.mockReturnValue({ files: [], loading: false, error: 'Falla de red' });
    render(<RequestFileList requestId={1} />);

    expect(screen.getByText(/No se pudieron cargar los documentos: Falla de red/)).toBeInTheDocument();
  });

  it('sin archivos que matcheen muestra el emptyText', () => {
    fnUseRequestFiles.mockReturnValue({ files: [], loading: false, error: null });
    render(<RequestFileList requestId={1} docKeys={['qd_strAttach01']} />);

    expect(screen.getByText('No hay documentos adjuntos.')).toBeInTheDocument();
  });

  it('filtra por docKeys (custom_properties.data_name) y formatea el tamaño en KB', () => {
    const lstFiles = [
      { id: 1, file_name: 'anexo.pdf', mime_type: 'application/pdf', size: 2048, created_at: '', updated_at: '', custom_properties: { data_name: 'qd_strAttach01' } },
      { id: 2, file_name: 'otro.pdf', mime_type: 'application/pdf', size: 500, created_at: '', updated_at: '', custom_properties: { data_name: 'qd_strOtro' } },
    ];
    fnUseRequestFiles.mockReturnValue({ files: lstFiles, loading: false, error: null });

    render(<RequestFileList requestId={1} docKeys={['qd_strAttach01']} />);

    expect(screen.getByText('anexo.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.queryByText('otro.pdf')).not.toBeInTheDocument();
  });

  it('filtra por fileIds cuando se pasa esa prop en vez de docKeys', () => {
    const lstFiles = [
      { id: 42, file_name: 'respuesta.pdf', mime_type: 'application/pdf', size: 100, created_at: '', updated_at: '' },
    ];
    fnUseRequestFiles.mockReturnValue({ files: lstFiles, loading: false, error: null });

    render(<RequestFileList requestId={1} fileIds={[42]} />);

    expect(screen.getByText('respuesta.pdf')).toBeInTheDocument();
    expect(screen.getByText('100 B')).toBeInTheDocument();
  });

  it('acepta label/emptyText personalizados', () => {
    fnUseRequestFiles.mockReturnValue({ files: [], loading: false, error: null });
    render(<RequestFileList requestId={1} label="Soportes SAC" emptyText="Sin soportes cargados." />);

    expect(screen.getByText('Soportes SAC')).toBeInTheDocument();
    expect(screen.getByText('Sin soportes cargados.')).toBeInTheDocument();
  });
});
