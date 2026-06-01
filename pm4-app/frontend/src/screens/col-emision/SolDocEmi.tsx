import { useState, useRef, useCallback } from 'react';
import { useTask } from '../../core/useTask';
import { ZrButton } from '@zurich/web-components/react/button';
import { ZrModal }  from '@zurich/web-components/react/modal';
import pm4 from '../../api/pm4Client';
import {
  type SolDocEmiData,
  type ProductoDocDef,
  PRODUCTO_DOC_DEFS,
} from './variables';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
import './styles.css';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface RowState {
  file: File | null;
  blobUrl: string | null;
}

interface PreviewDoc {
  descripcion: string;
  fileName: string;
  blobUrl: string;
}

// ──────────────────────────────────────────────────────────────
// Fila de documento con upload
// ──────────────────────────────────────────────────────────────
function DocRow({
  index,
  descripcion,
  docKey,
  state,
  onFileChange,
  onPreview,
}: {
  index: number;
  descripcion: string;
  docKey: string;
  state: RowState;
  onFileChange: (key: string, file: File) => void;
  onPreview: (key: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cargado  = !!state.file;

  return (
    <div className={`sarlaft-doc-row${cargado ? ' is-loaded' : ''}`}>
      <div className={`doc-num-badge${cargado ? ' doc-num-badge--loaded' : ''}`}>
        {cargado ? '✓' : index}
      </div>

      <div className="doc-body">
        <span className="doc-desc">{descripcion}</span>
      </div>

      <div className="doc-estado-wrap">
        <span className={`estado-badge${cargado ? ' estado-cargado' : ' estado-pendiente'}`}>
          {cargado ? 'Cargado' : 'Pendiente'}
        </span>
      </div>

      <div className="doc-file-area">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileChange(docKey, f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="btn-upload"
          onClick={() => inputRef.current?.click()}
        >
          <span className="btn-upload-icon">⬆</span>
          {cargado ? 'Cambiar' : 'Seleccionar archivo'}
        </button>
        {cargado && (
          <span className="file-name-chip">
            <span className="file-chip-icon">📄</span>
            {state.file!.name}
          </span>
        )}
      </div>

      <div className="doc-preview-trigger">
        <button
          type="button"
          className={`btn-preview${!cargado ? ' btn-preview--disabled' : ''}`}
          disabled={!cargado}
          title={cargado ? 'Ver vista previa' : 'Cargue un archivo primero'}
          onClick={() => onPreview(docKey)}
        >
          <span>👁</span>
          <span className="btn-preview-label">Vista previa</span>
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Modal de ayuda — documentos por producto
// ──────────────────────────────────────────────────────────────
function AyudaModalContent({ docsActivos }: { docsActivos: ProductoDocDef[] }) {
  return (
    <div className="ayuda-modal">
      <div className="ayuda-modal-header">
        <div className="ayuda-modal-icon-circle">i</div>
        <div>
          <div className="ayuda-modal-title">Documentos de Emisión</div>
          <div className="ayuda-modal-subtitle">Una nota de cobertura por producto seleccionado en la cotización</div>
        </div>
      </div>
      <div className="ayuda-modal-body">
        <p className="ayuda-section-label">Productos y documentos requeridos</p>
        <div className="ayuda-productos-list">
          {PRODUCTO_DOC_DEFS.map((def) => {
            const activo = docsActivos.some((d) => d.key === def.key);
            return (
              <div key={def.key} className={`ayuda-producto-row${activo ? ' ayuda-producto-activo' : ''}`}>
                <div className="ayuda-producto-nombre">
                  {def.producto}
                  {activo && <span className="ayuda-badge-activo">Requerido</span>}
                </div>
                <div className="ayuda-producto-doc">📄 {def.descripcion}</div>
              </div>
            );
          })}
        </div>
        {docsActivos.length === 0 && (
          <div className="ayuda-nota">
            ℹ No se detectaron productos activos. Se muestran todos los posibles.
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Pantalla principal
// ──────────────────────────────────────────────────────────────
export default function SolDocEmi() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [rowStates, setRowStates]           = useState<Record<string, RowState>>({});
  const [previewDoc, setPreviewDoc]         = useState<PreviewDoc | null>(null);
  const [infoOpen, setInfoOpen]             = useState(false);
  const [sent, setSent]                     = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const data      = (task?.data ?? {}) as SolDocEmiData;
  const requestId = task?.process_request_id ?? null;

  // Filtra los documentos según los productos activos
  const docsActivos = PRODUCTO_DOC_DEFS.filter((d) => !!data[d.productoKey]);
  const docs = docsActivos.length > 0 ? docsActivos : PRODUCTO_DOC_DEFS;

  // ── Cambio de archivo ──────────────────────────────────────
  const handleFileChange = useCallback((key: string, file: File) => {
    const blobUrl = URL.createObjectURL(file);
    setRowStates((prev) => {
      if (prev[key]?.blobUrl) URL.revokeObjectURL(prev[key].blobUrl!);
      return { ...prev, [key]: { file, blobUrl } };
    });
    setValidationError(null);
  }, []);

  // ── Abrir modal de preview ─────────────────────────────────
  const handlePreview = useCallback((key: string) => {
    const row = rowStates[key];
    if (!row?.blobUrl || !row.file) return;
    const doc = docs.find((d) => d.key === key);
    setPreviewDoc({
      descripcion: doc?.descripcion ?? key,
      fileName: row.file.name,
      blobUrl: row.blobUrl,
    });
  }, [rowStates, docs]);

  // ── Enviar ─────────────────────────────────────────────────
  async function handleEnviar() {
    const pendientes = docs.filter((d) => !rowStates[d.key]?.file);
    if (pendientes.length > 0) {
      setValidationError(
        `Debe cargar todos los documentos requeridos. Pendiente${pendientes.length > 1 ? 's' : ''}: ${pendientes
          .map((d) => d.descripcion)
          .join(', ')}.`
      );
      return;
    }
    setValidationError(null);

    try {
      if (requestId) {
        for (const doc of docs) {
          const file = rowStates[doc.key]?.file;
          if (!file) continue;
          const fd = new FormData();
          fd.append('file', file);
          await pm4.post(`/requests/${requestId}/files?data_name=${doc.key}`, fd);
        }
      }
      const { _user: _u, _request: _r, ...taskData } = (task?.data ?? {}) as Record<string, unknown>;
      await completeTask({ ...taskData });
      setSent(true);
    } catch (err) {
      console.error('[SolDocEmi] Error al enviar:', err);
      alert('Error al enviar los documentos. Revise la consola.');
    }
  }

  // ── Estado enviado ─────────────────────────────────────────
  if (sent) {
    return (
      <div className="screen-wrapper">
        <div className="screen-header">
          <div className="title-block">
            <h1>SOLICITUD DE DOCUMENTOS EMISIÓN</h1>
          </div>
          <img src={zurichLogo} alt="Zurich" className="header-logo" />
        </div>
        <div className="screen-sent-wrapper">
          <div className="screen-sent">
            <div className="screen-sent-icon">✓</div>
            <div className="screen-sent-title">Documentos enviados</div>
            <div className="screen-sent-sub">
              Las notas de cobertura fueron cargadas correctamente.<br />
              El proceso continuará con la verificación de documentos de emisión.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Carga / error ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading">
          <div className="spinner" />
          <span>Cargando…</span>
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
          <h1>SOLICITUD DE DOCUMENTOS EMISIÓN</h1>
          <div className="subtitle">
            {numCot  && <span>Cotización # {numCot}</span>}
            {numCaso && <span>Caso # {numCaso}</span>}
            {docsActivos.length > 0 && (
              <span>{docsActivos.length} producto{docsActivos.length > 1 ? 's' : ''} seleccionado{docsActivos.length > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      {/* Contenido */}
      <div className="screen-content">
        <div className="verdoc-layout">

          <div className="nc-section">
            <div className="nc-section-header">
              <span>Notas de Cobertura Requeridas</span>
              <button type="button" className="btn-info-help" onClick={() => setInfoOpen(true)} title="Ver documentos por producto">i</button>
            </div>
            <div className="nc-section-body">

              {docsActivos.length === 0 && (
                <div className="perfil-aviso">
                  ℹ No se detectaron productos activos en la tarea. Se muestran todos los documentos posibles.
                </div>
              )}

              <div className="sarlaft-doc-list">
                {docs.map((doc, i) => (
                  <DocRow
                    key={doc.key}
                    index={i + 1}
                    descripcion={doc.descripcion}
                    docKey={doc.key}
                    state={rowStates[doc.key] ?? { file: null, blobUrl: null }}
                    onFileChange={handleFileChange}
                    onPreview={handlePreview}
                  />
                ))}
              </div>

              {validationError && (
                <div className="validation-error">
                  ⚠ {validationError}
                </div>
              )}
            </div>

            <div className="submit-bar">
              <ZrButton
                config="primary:l"
                disabled={submitting}
                loading={submitting}
                onClick={handleEnviar}
              >
                {submitting ? 'Enviando…' : 'ENVIAR'}
              </ZrButton>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de ayuda */}
      <ZrModal model={infoOpen} onChange={(v: boolean) => setInfoOpen(v)} style={{ ['--z-modal--backdrop' as any]: 'rgba(11,27,60,.45)' }}>
        <AyudaModalContent docsActivos={docsActivos} />
      </ZrModal>

      {/* Modal de vista previa — ZrModal (ZDS) */}
      <ZrModal
        model={!!previewDoc}
        onChange={(v: boolean) => { if (!v) setPreviewDoc(null); }}
        style={{ ['--z-modal--padding' as any]: '0', ['--z-modal--backdrop' as any]: 'rgba(11,27,60,.55)' }}
      >
        <div className="preview-modal">
          <div className="preview-modal-header">
            <div className="preview-modal-title">
              <span className="preview-modal-icon">📄</span>
              <div>
                <div className="preview-modal-doc-name">{previewDoc?.fileName}</div>
                <div className="preview-modal-doc-desc">{previewDoc?.descripcion}</div>
              </div>
            </div>
          </div>
          {previewDoc?.blobUrl && (
            <iframe
              src={previewDoc.blobUrl}
              title={previewDoc.fileName}
              className="preview-modal-iframe"
            />
          )}
        </div>
      </ZrModal>
    </div>
  );
}
