import { useMemo, useState } from 'react';
import pm4 from '../api/pm4Client';
import { useRequestFiles, type Pm4File } from '../core/useRequestFiles';
import PreviewModal from './PreviewModal';
import { ZrButton, ZrIcon, ZrAlert, ZrLoader } from './fields/ZdsFields';

interface Props {
  /** request (caso) del cual listar los adjuntos. */
  requestId: number | null;
  /** data_name de los adjuntos a mostrar (filtra los archivos del request). */
  docKeys: readonly string[];
  /** Título de la sección. */
  label?: string;
  /** Texto cuando no hay archivos que coincidan. */
  emptyText?: string;
  /** Texto mientras se cargan los archivos. */
  loadingText?: string;
}

// Formatea el tamaño del archivo a una unidad legible.
function formatBytes(in_intBytes: number): string {
  if (in_intBytes < 1024) return `${in_intBytes} B`;
  if (in_intBytes < 1024 * 1024) return `${(in_intBytes / 1024).toFixed(1)} KB`;
  return `${(in_intBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Lista de solo lectura de los archivos que un caso (request) tiene adjuntos,
 * filtrados por su `custom_properties.data_name` para no mezclar adjuntos de
 * otras tareas. Cada fila permite previsualizar el documento en un popup (icono
 * de ojo) y descargarlo. Reusado por SCR-0051 (documentos del radicador) y
 * SCR-008 (soportes internos del área).
 */
export default function RequestFileList({
  requestId, docKeys,
  label = 'Documentos adjuntos',
  emptyText = 'No hay documentos adjuntos.',
  loadingText = 'Buscando documentos del caso…',
}: Props) {
  const { files, loading, error } = useRequestFiles(requestId);
  const [objPreview, setObjPreview] = useState<Pm4File | null>(null);

  // Solo los archivos cuyo data_name coincide con las claves indicadas.
  const lstDocs = useMemo(() => {
    const setKeys = new Set<string>(docKeys);
    return files.filter((objFile) => {
      const genDataName = objFile.custom_properties?.data_name;
      return typeof genDataName === 'string' && setKeys.has(genDataName);
    });
  }, [files, docKeys]);

  // Descarga el binario del archivo vía el proxy y lo guarda localmente.
  const descargar = async (in_objFile: Pm4File) => {
    try {
      const objResponse = await pm4.get(`/files/${in_objFile.id}/contents`, { responseType: 'blob' });
      const strUrl = URL.createObjectURL(objResponse.data as Blob);
      const objAnchor = document.createElement('a');
      objAnchor.href = strUrl;
      objAnchor.download = in_objFile.file_name;
      objAnchor.click();
      URL.revokeObjectURL(strUrl);
    } catch (exc) {
      console.error('[RequestFileList] Error al descargar:', exc);
    }
  };

  return (
    <div className="zds-field-wrap">
      <span className="info-bar-label">{label}</span>

      {loading && (
        <div className="no-docs-card">
          <ZrLoader style={{ ['--z-loader--size' as never]: '20px' }} />
          <p>{loadingText}</p>
        </div>
      )}

      {error && !loading && (
        <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
          No se pudieron cargar los documentos: {error}
        </ZrAlert>
      )}

      {!loading && !error && lstDocs.length === 0 && (
        <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
          {emptyText}
        </ZrAlert>
      )}

      {!loading && lstDocs.length > 0 && (
        <div z-flex="col:75" style={{ marginTop: 'var(--zs-50)' }}>
          {lstDocs.map((objFile) => (
            <div key={objFile.id} className="doc-card">
              <div className="doc-card-header">
                <ZrIcon icon="file-blank:line" config="l" />
                <div className="doc-info">
                  <div className="doc-name">{objFile.file_name}</div>
                  <div className="doc-meta">{formatBytes(objFile.size)}</div>
                </div>
                <div className="doc-actions">
                  <ZrButton
                    config="secondary:s"
                    icon="visibility-on:line"
                    onClick={() => setObjPreview(objFile)}
                    {...({ title: 'Vista previa' } as Record<string, unknown>)}
                  />
                  <ZrButton
                    config="secondary:s"
                    icon="download:line"
                    onClick={() => descargar(objFile)}
                  >
                    Descargar
                  </ZrButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PreviewModal
        isOpen={!!objPreview}
        onClose={() => setObjPreview(null)}
        previewDoc={objPreview ? { fileName: objPreview.file_name, fileId: objPreview.id } : null}
      />
    </div>
  );
}
