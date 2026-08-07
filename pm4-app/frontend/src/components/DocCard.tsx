import type { ReactNode } from 'react';
import { ZrIcon } from './fields/ZdsFields';

interface DocCardProps {
  /** Nombre del archivo, mostrado en negrita. */
  fileName: string;
  /** Metadatos bajo el nombre (tamaño, fecha, etc. — ya formateados). */
  meta: ReactNode;
  /** Botones de acción a la derecha de la fila (preview, descargar, ver PDF…). */
  actions: ReactNode;
  /** Si está expandido — agrega el modificador visual `is-open`. Omitir en cards sin cuerpo expandible. */
  isOpen?: boolean;
  /** Cuerpo expandible (p.ej. `PdfViewer`), mostrado solo cuando `isOpen`. */
  children?: ReactNode;
}

/**
 * Fila/card de un archivo ya existente: ícono + nombre + metadatos + acciones, con
 * cuerpo expandible opcional. Extraído 2026-08-06 para eliminar la duplicación entre
 * `RequestFileList.tsx` y `VisualizarDocumentos.tsx` (mismo markup `.doc-card`/
 * `.doc-card-header` reimplementado en ambos). No confundir con `DocItem` — ese es
 * el checklist de documentos REQUERIDOS (badge numerado + carga/validación), un
 * patrón visual distinto.
 */
export default function DocCard({ fileName, meta, actions, isOpen, children }: DocCardProps) {
  return (
    <div className={`doc-card${isOpen ? ' is-open' : ''}`}>
      <div className="doc-card-header">
        <ZrIcon icon="file-blank:line" config="l" />
        <div className="doc-info">
          <div className="doc-name">{fileName}</div>
          <div className="doc-meta">{meta}</div>
        </div>
        <div className="doc-actions">{actions}</div>
      </div>

      {isOpen && children && (
        <div className="doc-viewer">{children}</div>
      )}
    </div>
  );
}
