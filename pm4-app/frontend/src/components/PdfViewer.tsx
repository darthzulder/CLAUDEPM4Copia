import { useState, useEffect, useRef } from 'react';
import pm4 from '../api/pm4Client';
import { ZrButton } from './fields/ZdsFields';

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

    let active = true;
    setLoading(true);
    setError(null);

    pm4.get(`/files/${fileId}/contents`, { responseType: 'blob' })
      .then((r) => {
        if (!active) return;
        // Revocar URL anterior para liberar memoria
        if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
        const url = URL.createObjectURL(r.data as Blob);
        prevUrl.current = url;
        setBlobUrl(url);
      })
      .catch((e) => {
        if (!active) return;
        const msg = e.response?.data?.message ?? e.message;
        console.error('[PdfViewer] Error al cargar archivo:', msg);
        setError(msg);
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [fileId]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); };
  }, []);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = label ?? 'documento.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!fileId) return null;

  return (
    <div className={`pdf-viewer ${className}`}>
      {label && <div className="pdf-viewer-label">{label}</div>}

      {loading && (
        <div className="pdf-viewer-state">
          <div className="pdf-spinner" />
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
