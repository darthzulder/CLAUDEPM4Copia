import { useMemo, useState } from 'react';
import pm4 from '../../../../api/pm4Client';
import { useRequestFiles, type Pm4File } from '../../../../core/useRequestFiles';
import PreviewModal from '../../../../components/PreviewModal';
import { ZrButton, ZrIcon, ZrAlert, ZrLoader } from '../../../../components/fields/ZdsFields';

interface Props {
  /** request (caso) del cual listar los adjuntos. */
  requestId: number | null;
  /** data_name de los adjuntos que subió el radicador en SCR-000 (qd_strAttach01..05). */
  docKeys: readonly string[];
}

// Formatea el tamaño del archivo a una unidad legible.
function formatBytes(in_intBytes: number): string {
  if (in_intBytes < 1024) return `${in_intBytes} B`;
  if (in_intBytes < 1024 * 1024) return `${(in_intBytes / 1024).toFixed(1)} KB`;
  return `${(in_intBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Lista de solo lectura de los documentos que el radicador adjuntó en SCR-000.
 * Filtra los archivos del request por su `custom_properties.data_name` para no
 * mezclar adjuntos de otras tareas (área responsable, SAC, etc.). Cada fila
 * permite ver el documento en un popup (icono de ojo) y descargarlo.
 */
export default function DocumentosRadicador({ requestId, docKeys }: Props) {
  const { files, loading, error } = useRequestFiles(requestId);
  const [objPreview, setObjPreview] = useState<Pm4File | null>(null);

  // Solo los archivos cuyo data_name coincide con los adjuntos de la radicación.
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
      console.error('[DocumentosRadicador] Error al descargar:', exc);
    }
  };

  return (
    <div className="zds-field-wrap">
      <span className="info-bar-label">Documentos adjuntos del radicador</span>

      {loading && (
        <div className="no-docs-card">
          <ZrLoader style={{ ['--z-loader--size' as never]: '20px' }} />
          <p>Buscando documentos del caso…</p>
        </div>
      )}

      {error && !loading && (
        <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
          No se pudieron cargar los documentos: {error}
        </ZrAlert>
      )}

      {!loading && !error && lstDocs.length === 0 && (
        <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
          El radicador no adjuntó documentos a esta queja.
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
