import { useState } from 'react';
import { useTask } from '../../core/useTask';
import { useRequestFiles, type Pm4File } from '../../core/useRequestFiles';
import PdfViewer from '../../components/PdfViewer';
import { ZrButton } from '@zurich/web-components/react/button';
import { type NotaCoberturaData } from './variables';
import './styles.css';

const LOGO = 'https://bpm.beesmart.ec/fonts/zurich/zurich-logo-white.svg';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ──────────────────────────────────────────────────────────────
// Tarjeta de un documento individual
// ──────────────────────────────────────────────────────────────
function DocumentCard({ file }: { file: Pm4File }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`doc-card${open ? ' is-open' : ''}`}>
      <div className="doc-card-header">
        <span className="doc-icon">📄</span>
        <div className="doc-info">
          <div className="doc-name">{file.file_name}</div>
          <div className="doc-meta">
            {formatBytes(file.size)} · {formatDate(file.created_at)}
          </div>
        </div>
        <div className="doc-actions">
          <button
            type="button"
            className={`btn-ver${open ? ' active' : ''}`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Ocultar' : 'Ver PDF'}
          </button>
        </div>
      </div>

      {open && (
        <div className="doc-viewer">
          <PdfViewer fileId={file.id} label={file.file_name} height={640} />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Pantalla principal
// ──────────────────────────────────────────────────────────────
export default function VisualizarDocumentos() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const data = (task?.data ?? {}) as NotaCoberturaData;
  const requestId = task?.process_request_id ?? null;
  const { files, loading: filesLoading, error: filesError } = useRequestFiles(requestId);

  async function handleContinuar() {
    try {
      const { _user: _u, _request: _r, ...taskData } = (task?.data ?? {}) as Record<string, unknown>;
      await completeTask({ ...taskData });
    } catch (err) {
      console.error('[VisualizarDocumentos] Error al derivar:', err);
      alert('Error al continuar. Revise la consola.');
    }
  }

  // ── Estados de carga/error ───────────────────────────────────
  if (loading) {
    return (
      <div className="nc-wrapper">
        <div className="nc-loading">
          <div className="spinner" />
          <span>Cargando documentos…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nc-wrapper">
        <div className="nc-error">⚠ Error cargando la tarea: {error}</div>
      </div>
    );
  }

  const titulo  = data.frm_titulo || 'VISUALIZAR DOCUMENTOS DE SALIDA';
  const numCot  = data.frm_num_cotizacion ?? data.frm_gen_num_cotizacion;
  const numCaso = data.frm_caso;

  return (
    <div className="nc-wrapper">
      {submitting && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* Header */}
      <div className="nc-header">
        <div className="title-block">
          <h1>{titulo}</h1>
          <div className="subtitle">
            {numCot  && <span>Cotización # {numCot}</span>}
            {numCaso && <span>Caso # {numCaso}</span>}
          </div>
        </div>
        <img
          src={LOGO}
          alt="Zurich"
          className="nc-header-logo"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* Contenido */}
      <div className="nc-content">
        <div className="nc-section">
          <div className="nc-section-header">
            <span>Notas de Cobertura Generadas</span>
          </div>
          <div className="nc-section-body">

            {filesLoading && (
              <div className="no-docs-card">
                <div className="pdf-spinner" />
                <p>Buscando documentos del caso…</p>
              </div>
            )}

            {filesError && !filesLoading && (
              <div className="no-docs-card">
                <div className="no-docs-icon">⚠️</div>
                <p>No se pudieron cargar los documentos: {filesError}</p>
              </div>
            )}

            {!filesLoading && !filesError && files.length === 0 && (
              <div className="no-docs-card">
                <div className="no-docs-icon">📂</div>
                <p>No hay documentos disponibles para este caso.</p>
              </div>
            )}

            {!filesLoading && files.length > 0 && (
              <div className="doc-list">
                {files.map((file) => (
                  <DocumentCard key={file.id} file={file} />
                ))}
              </div>
            )}

          </div>

          {/* Barra de acción */}
          <div className="nc-submit-bar">
            <ZrButton
              config="primary:l"
              disabled={submitting}
              loading={submitting}
              onClick={handleContinuar}
            >
              {submitting ? 'Enviando…' : 'CONTINUAR'}
            </ZrButton>
          </div>
        </div>
      </div>
    </div>
  );
}
