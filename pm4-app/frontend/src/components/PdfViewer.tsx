import { useState, useEffect, useRef } from 'react';
import pm4 from '../api/pm4Client';
import { ZrButton, ZrLoader } from './fields/ZdsFields';

interface Props {
  /** ID del archivo en PM4 */
  fileId: number | null;
  /** Nombre visible sobre el visor */
  label?: string;
  /** Alto del iframe en px (default 640) */
  height?: number;
  /** Clase CSS extra para el contenedor */
  className?: string;
}

/**
 * Descarga el contenido binario de un archivo PM4 a través del proxy backend
 * y lo muestra en un <iframe> usando un blob URL (evita problemas de CORS/auth).
 *
 * Ruta backend usada: GET /api/files/{fileId}/contents
 */
export default function PdfViewer({ fileId, label, height = 640, className = '' }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setBlobUrl(null);
      return;
    }

    let blnActive = true;
    setLoading(true);
    setError(null);

    // Descargamos el binario del archivo y lo exponemos como blob URL.
    pm4.get(`/files/${fileId}/contents`, { responseType: 'blob' })
      .then((in_objResponse) => {
        if (!blnActive) return;
        // Revocar URL anterior para liberar memoria
        if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
        const strUrl = URL.createObjectURL(in_objResponse.data as Blob);
        prevUrl.current = strUrl;
        setBlobUrl(strUrl);
      })
      .catch((in_excError) => {
        if (!blnActive) return;
        const strMsg = in_excError.response?.data?.message ?? in_excError.message;
        console.error('[PdfViewer] Error al cargar archivo:', strMsg);
        setError(strMsg);
      })
      .finally(() => { if (blnActive) setLoading(false); });

    return () => { blnActive = false; };
  }, [fileId]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); };
  }, []);

  // Descarga el blob actual como archivo local mediante un enlace temporal.
  const handleDownload = () => {
    if (!blobUrl) return;
    const objLink = document.createElement('a');
    objLink.href = blobUrl;
    objLink.download = label ?? 'documento.pdf';
    document.body.appendChild(objLink);
    objLink.click();
    objLink.remove();
  };

  if (!fileId) return null;

  return (
    <div className={`pdf-viewer ${className}`}>
      {label && <div className="pdf-viewer-label">{label}</div>}

      {loading && (
        <div className="pdf-viewer-state">
          <ZrLoader style={{ ['--z-loader--size' as never]: '20px' }} />
          <span>Cargando documento…</span>
        </div>
      )}

      {error && !loading && (
        <div className="pdf-viewer-state pdf-viewer-error">
          No se pudo cargar el documento: {error}
        </div>
      )}

      {blobUrl && !loading && (
        <>
          <iframe
            src={blobUrl}
            title={label ?? 'Documento'}
            style={{ width: '100%', height, border: 'none', borderRadius: 4 }}
          />
          <div className="pdf-viewer-actions">
            <ZrButton config="secondary:s" icon="download:line" onClick={handleDownload}>
              Descargar
            </ZrButton>
          </div>
        </>
      )}
    </div>
  );
}
