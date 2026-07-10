import { ZrModal, ZrIcon } from './fields/ZdsFields';
import PdfViewer from './PdfViewer';

interface PreviewDoc {
  fileName: string;
  descripcion?: string;
  blobUrl?: string | null;
  fileId?: number | null;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewDoc: PreviewDoc | null;
}

export default function PreviewModal({ isOpen, onClose, previewDoc }: PreviewModalProps) {
  // Determinamos si el documento tiene un id de archivo en PM4.
  const blnHasFileId = previewDoc?.fileId !== undefined && previewDoc?.fileId !== null;

  // Solo montamos el modal cuando está abierto: al cerrarlo se desmonta por
  // completo y ZrModal libera su backdrop/scroll-lock (evita que la pantalla
  // de atrás quede "congelada" capturando los clics del overlay residual).
  if (!isOpen) return null;

  return (
    <ZrModal
      model={isOpen}
      onChange={(in_blnOpen: boolean) => { if (!in_blnOpen) onClose(); }}
      style={{ ['--z-modal--padding' as any]: '0', ['--z-modal--backdrop' as any]: 'color-mix(in srgb, var(--z-modal-backdrop) 55%, transparent)' }}
    >
      <div className="preview-modal">
        <div className="preview-modal-header">
          <div className="preview-modal-title">
            <ZrIcon icon="file-blank:line" config="l" />
            <div>
              <div className="preview-modal-doc-name">{previewDoc?.fileName || 'Vista previa'}</div>
              {previewDoc?.descripcion && (
                <div className="preview-modal-doc-desc">{previewDoc.descripcion}</div>
              )}
            </div>
          </div>
        </div>
        {blnHasFileId ? (
          <div style={{ padding: '0' }}>
            <PdfViewer
              fileId={previewDoc!.fileId!}
              height={Math.min(window.innerHeight * 0.82, 820)}
            />
          </div>
        ) : (
          previewDoc?.blobUrl && (
            <iframe
              src={previewDoc.blobUrl}
              title={previewDoc.fileName}
              className="preview-modal-iframe"
            />
          )
        )}
      </div>
    </ZrModal>
  );
}
