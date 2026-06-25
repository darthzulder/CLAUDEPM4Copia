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
  const hasFileId = previewDoc?.fileId !== undefined && previewDoc?.fileId !== null;

  return (
    <ZrModal
      model={isOpen}
      onChange={(v: boolean) => { if (!v) onClose(); }}
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
        {hasFileId ? (
          <div style={{ padding: '0' }}>
            <PdfViewer
              fileId={previewDoc!.fileId!}
              height={Math.min(window.innerHeight * 0.70, 680)}
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
