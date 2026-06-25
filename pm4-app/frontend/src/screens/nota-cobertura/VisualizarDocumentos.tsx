import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { useTask } from '../../core/useTask';
import { useRequestFiles, type Pm4File } from '../../core/useRequestFiles';
import PdfViewer from '../../components/PdfViewer';
import { ZrButton, ZrAlert, ZrIcon, ZrLoader } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import FormSection from '../../components/FormSection';
import ScreenHeader from '../../components/ScreenHeader';
import { type NotaCoberturaData } from './variables';

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
        <ZrIcon icon="file-blank:line" config="l" />
        <div className="doc-info">
          <div className="doc-name">{file.file_name}</div>
          <div className="doc-meta">
            {formatBytes(file.size)} · {formatDate(file.created_at)}
          </div>
        </div>
        <div className="doc-actions">
          <ZrButton
            config="secondary:s"
            icon={open ? 'visibility-off:line' : 'visibility-on:line'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Ocultar' : 'Ver PDF'}
          </ZrButton>
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
  const [sent, setSent] = useState(false);

  const data = (task?.data ?? {}) as NotaCoberturaData;
  const requestId = task?.process_request_id ?? null;
  const { files, loading: filesLoading, error: filesError } = useRequestFiles(requestId);

  async function handleContinuar() {
    try {
      const { _user: _u, _request: _r, ...taskData } = (task?.data ?? {}) as Record<string, unknown>;
      await completeTask({ ...taskData });
      setSent(true);
    } catch (err) {
      console.error('[VisualizarDocumentos] Error al derivar:', err);
      alert('Error al continuar. Revise la consola.');
    }
  }

  // ── Estados de carga/error ───────────────────────────────────
  if (sent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title={data.frm_titulo || 'VISUALIZAR DOCUMENTOS DE SALIDA'} />
        <div className="screen-content">
          <ResultCard variant="success" title="Tarea derivada">
            <p>
              Los documentos fueron confirmados correctamente.<br />
              El proceso continuará al siguiente nodo automáticamente.
            </p>
          </ResultCard>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading">
          <ZrLoader />
          <span>Cargando documentos…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-wrapper">
        <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error cargando la tarea: {error}</ZrAlert>
      </div>
    );
  }

  const titulo  = data.frm_titulo || 'VISUALIZAR DOCUMENTOS DE SALIDA';
  const numCot  = data.frm_num_cotizacion ?? data.frm_gen_num_cotizacion;
  const numCaso = data.frm_caso;

  return (
    <div className="screen-wrapper">
      {submitting && (
        <div className="loading-overlay">
          <ZrLoader />
        </div>
      )}

      {/* Header */}
      <ScreenHeader
        title={titulo}
        subtitle={[
          numCot ? `Cotización # ${numCot}` : null,
          numCaso ? `Caso # ${numCaso}` : null,
        ]}
      />

      {/* Contenido */}
      <div className="screen-content">
        <FormSection
          title="Notas de Cobertura Generadas"
          footer={
            <ActionBar>
              <ZrButton
                config="primary:l"
                disabled={submitting}
                loading={submitting}
                onClick={handleContinuar}
              >
                {submitting ? 'Enviando…' : 'CONTINUAR'}
              </ZrButton>
            </ActionBar>
          }
        >
          {filesLoading && (
            <div className="no-docs-card">
              <ZrLoader style={{ ['--z-loader--size' as never]: '20px' }} />
              <p>Buscando documentos del caso…</p>
            </div>
          )}

          {filesError && !filesLoading && (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              No se pudieron cargar los documentos: {filesError}
            </ZrAlert>
          )}

          {!filesLoading && !filesError && files.length === 0 && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              No hay documentos disponibles para este caso.
            </ZrAlert>
          )}

          {!filesLoading && files.length > 0 && (
            <div z-flex="col:75">
              {files.map((file) => (
                <DocumentCard key={file.id} file={file} />
              ))}
            </div>
          )}
        </FormSection>
      </div>
    </div>
  );
}
