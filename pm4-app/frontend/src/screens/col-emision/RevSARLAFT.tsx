import { useState } from 'react';
import { useTask } from '../../core/useTask';
import { useRequestFiles, resolveFileId } from '../../core/useRequestFiles';
import PdfViewer from '../../components/PdfViewer';
import { ZrButton, ZrModal, ZrAlert } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import FormSection from '../../components/FormSection';
import {
  type DocSarlaftData,
  type SarlaftPerfil,
  DOCS_POR_PERFIL,
  DIRECTRICES,
} from './variables';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface PreviewState {
  fileId: number;
  descripcion: string;
  fileName: string;
}

// ──────────────────────────────────────────────────────────────
// Fila de documento (solo lectura)
// ──────────────────────────────────────────────────────────────
function DocRow({
  index,
  descripcion,
  vigencia,
  fileId,
  fileName,
  onPreview,
}: {
  index: number;
  descripcion: string;
  vigencia?: string;
  fileId: number | null;
  fileName: string;
  onPreview: (state: PreviewState) => void;
}) {
  const cargado = fileId !== null;

  return (
    <div className={`sarlaft-doc-row${cargado ? ' is-loaded' : ''}`}>
      {/* Índice */}
      <div className={`doc-num-badge${cargado ? ' doc-num-badge--loaded' : ''}`}>
        {cargado ? '✓' : index}
      </div>

      {/* Descripción */}
      <div className="doc-body">
        <span className="doc-desc">{descripcion}</span>
        {vigencia && <span className="doc-vigencia">{vigencia}</span>}
      </div>

      {/* Estado */}
      <div className="doc-estado-wrap">
        <span className={`estado-badge${cargado ? ' estado-cargado' : ' estado-sin-doc'}`}>
          {cargado ? 'Cargado' : 'Sin documento'}
        </span>
      </div>

      {/* Nombre del archivo */}
      <div className="doc-file-area">
        {cargado ? (
          <span className="file-name-chip">
            <span className="file-chip-icon">📄</span>
            {fileName}
          </span>
        ) : (
          <span className="file-name-empty">—</span>
        )}
      </div>

      {/* Ver documento */}
      <div className="doc-preview-trigger">
        <ZrButton
          config="secondary:s"
          icon="visibility-on:line"
          disabled={!cargado}
          onClick={() => {
            if (fileId) onPreview({ fileId, descripcion, fileName });
          }}
        >
          Ver
        </ZrButton>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Modal de ayuda — directrices SARLAFT
// ──────────────────────────────────────────────────────────────
function AyudaModalContent({ perfilActivo }: { perfilActivo: SarlaftPerfil | null }) {
  return (
    <div className="ayuda-modal">
      <div className="ayuda-modal-header">
        <div className="ayuda-modal-icon-circle">i</div>
        <div>
          <div className="ayuda-modal-title">Directrices SARLAFT</div>
          <div className="ayuda-modal-subtitle">Documentos requeridos según el perfil del tomador</div>
        </div>
      </div>
      <div className="ayuda-modal-body">
        {DIRECTRICES.map(({ perfil, label, docs }) => (
          <div
            key={perfil}
            className={`ayuda-perfil-block${perfilActivo === perfil ? ' ayuda-perfil-activo' : ''}`}
          >
            <div className="ayuda-perfil-header">
              <span className="ayuda-perfil-label">{label}</span>
              {perfilActivo === perfil && <span className="ayuda-badge-activo">Activo</span>}
            </div>
            <ol className="ayuda-doc-list">
              {docs.map((doc, i) => <li key={i}>{doc}</li>)}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Pantalla principal
// ──────────────────────────────────────────────────────────────
export default function RevSARLAFT() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [preview, setPreview]   = useState<PreviewState | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [sent, setSent]         = useState(false);

  const data      = (task?.data ?? {}) as DocSarlaftData;
  const requestId = task?.process_request_id ?? null;
  const { files, loading: filesLoading } = useRequestFiles(requestId);

  const rawPerfil = data.frm_sarlaft_perfil as string | undefined;
  const perfil: SarlaftPerfil | null =
    rawPerfil === 'SIMPLIFICADO' || rawPerfil === 'ESTANDAR' || rawPerfil === 'INTENSIFICADO'
      ? rawPerfil
      : null;

  const docs = DOCS_POR_PERFIL[perfil ?? 'INTENSIFICADO'];

  // Resuelve el file_id para cada documento:
  // 1.° intenta la variable de proceso (task.data[doc.key])
  // 2.° cae a la posición en la lista de archivos del request
  function resolveDoc(key: string, idx: number): { fileId: number | null; fileName: string } {
    const fromTask = resolveFileId((data as Record<string, unknown>)[key]);
    if (fromTask) {
      const match = files.find((f) => f.id === fromTask);
      return { fileId: fromTask, fileName: match?.file_name ?? `Documento ${idx + 1}` };
    }
    const fallback = files[idx];
    if (fallback) return { fileId: fallback.id, fileName: fallback.file_name };
    return { fileId: null, fileName: '' };
  }

  // ── Confirmar verificación ─────────────────────────────────
  async function handleVerificado() {
    try {
      const { _user: _u, _request: _r, ...taskData } = (task?.data ?? {}) as Record<string, unknown>;
      await completeTask({ ...taskData });
      setSent(true);
    } catch (err) {
      console.error('[RevSARLAFT] Error al confirmar:', err);
      alert('Error al confirmar la verificación. Revise la consola.');
    }
  }

  // ── Estado enviado ─────────────────────────────────────────
  if (sent) {
    return (
      <div className="screen-wrapper">
        <div className="screen-header">
          <div className="title-block">
            <h1>VERIFICAR DOCUMENTOS SARLAFT</h1>
          </div>
          <img src={zurichLogo} alt="Zurich" className="header-logo" />
        </div>
        <div className="screen-sent-wrapper">
          <ResultCard variant="success" title="Verificación confirmada">
            <p>
              La información SARLAFT fue verificada correctamente.<br />
              El proceso continuará al siguiente nodo automáticamente.
            </p>
          </ResultCard>
        </div>
      </div>
    );
  }

  // ── Carga / error ──────────────────────────────────────────
  if (loading || filesLoading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading">
          <div className="spinner" />
          <span>Cargando documentos…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-wrapper">
        <div className="screen-error">⚠ Error cargando la tarea: {error}</div>
      </div>
    );
  }

  const numCot  = data.frm_num_cotizacion ?? data.frm_gen_num_cotizacion;
  const numCaso = data.frm_caso;

  return (
    <div className="screen-wrapper">
      {submitting && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* Header */}
      <div className="screen-header">
        <div className="title-block">
          <h1>VERIFICAR DOCUMENTOS SARLAFT</h1>
          <div className="subtitle">
            {numCot  && <span>Cotización # {numCot}</span>}
            {numCaso && <span>Caso # {numCaso}</span>}
            {perfil  && <span>Perfil: {perfil.charAt(0) + perfil.slice(1).toLowerCase()}</span>}
          </div>
        </div>
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      {/* Contenido */}
      <div className="screen-content">
        <div className="verdoc-layout">

          <FormSection
            title="Documentos SARLAFT Cargados"
            action={<ZrButton config="secondary:xs" icon="info:line" onClick={() => setInfoOpen(true)} />}
            footer={
              <div className="submit-bar">
                <ZrButton
                  config="primary:l"
                  disabled={submitting || files.length === 0}
                  loading={submitting}
                  onClick={handleVerificado}
                >
                  {submitting ? 'Confirmando…' : 'INFORMACIÓN SARLAFT VERIFICADA'}
                </ZrButton>
              </div>
            }
          >
            {!perfil && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                No se detectó perfil SARLAFT en la tarea. Se muestran todos los documentos posibles.
              </ZrAlert>
            )}

            <div className="sarlaft-doc-list">
              {docs.map((doc, i) => {
                const { fileId, fileName } = resolveDoc(doc.key, i);
                return (
                  <DocRow
                    key={doc.key}
                    index={i + 1}
                    descripcion={doc.descripcion}
                    vigencia={doc.vigencia}
                    fileId={fileId}
                    fileName={fileName}
                    onPreview={setPreview}
                  />
                );
              })}
            </div>

            {files.length === 0 && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                No se encontraron documentos cargados para este caso.
              </ZrAlert>
            )}
          </FormSection>

        </div>
      </div>

      {/* Modal de ayuda */}
      <ZrModal model={infoOpen} onChange={(v: boolean) => setInfoOpen(v)} style={{ ['--z-modal--backdrop' as any]: 'rgba(11,27,60,.45)' }}>
        <AyudaModalContent perfilActivo={perfil} />
      </ZrModal>

      {/* Modal de vista previa — ZrModal (ZDS) + PdfViewer */}
      <ZrModal
        model={!!preview}
        onChange={(v: boolean) => { if (!v) setPreview(null); }}
        style={{ ['--z-modal--padding' as any]: '0', ['--z-modal--backdrop' as any]: 'rgba(11,27,60,.55)' }}
      >
        <div className="preview-modal">
          <div className="preview-modal-header">
            <div className="preview-modal-title">
              <span className="preview-modal-icon">📄</span>
              <div>
                <div className="preview-modal-doc-name">{preview?.fileName}</div>
                <div className="preview-modal-doc-desc">{preview?.descripcion}</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '0' }}>
            <PdfViewer
              fileId={preview?.fileId ?? null}
              height={Math.min(window.innerHeight * 0.70, 680)}
            />
          </div>
        </div>
      </ZrModal>
    </div>
  );
}
