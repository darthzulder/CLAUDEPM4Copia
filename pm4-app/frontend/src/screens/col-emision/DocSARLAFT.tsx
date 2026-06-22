import { useState, useRef, useCallback } from 'react';
import { useTask } from '../../core/useTask';
import { ZrButton, ZrModal, ZrAlert } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import FormSection from '../../components/FormSection';
import pm4 from '../../api/pm4Client';
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
// Fila de documento individual
// ──────────────────────────────────────────────────────────────
function DocRow({
  index,
  descripcion,
  vigencia,
  docKey,
  state,
  onFileChange,
  onPreview,
}: {
  index: number;
  descripcion: string;
  vigencia?: string;
  docKey: string;
  state: RowState;
  onFileChange: (key: string, file: File) => void;
  onPreview: (key: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cargado  = !!state.file;

  return (
    <div className={`sarlaft-doc-row${cargado ? ' is-loaded' : ''}`}>
      {/* Índice */}
      <div className={`doc-num-badge${cargado ? ' doc-num-badge--loaded' : ''}`}>
        {cargado ? '✓' : index}
      </div>

      {/* Descripción */}
      <div className="doc-body">
        <span className="doc-desc">{descripcion}</span>
        {vigencia && (
          <span className="doc-vigencia">{vigencia}</span>
        )}
      </div>

      {/* Estado */}
      <div className="doc-estado-wrap">
        <span className={`estado-badge${cargado ? ' estado-cargado' : ' estado-pendiente'}`}>
          {cargado ? 'Cargado' : 'Pendiente'}
        </span>
      </div>

      {/* Acciones */}
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
        <ZrButton
          config="secondary:s"
          icon="document-upload:line"
          wide
          onClick={() => inputRef.current?.click()}
        >
          {cargado ? 'Cambiar' : 'Seleccionar archivo'}
        </ZrButton>
        {cargado && (
          <span className="file-name-chip">
            <span className="file-chip-icon">📄</span>
            {state.file!.name}
          </span>
        )}
      </div>

      {/* Vista previa */}
      <div className="doc-preview-trigger">
        <ZrButton
          config="secondary:s"
          icon="visibility-on:line"
          disabled={!cargado}
          onClick={() => onPreview(docKey)}
        >
          Vista previa
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
export default function DocSARLAFT() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [rowStates, setRowStates]       = useState<Record<string, RowState>>({});
  const [previewDoc, setPreviewDoc]     = useState<PreviewDoc | null>(null);
  const [infoOpen, setInfoOpen]         = useState(false);
  const [sent, setSent]                 = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const data      = (task?.data ?? {}) as DocSarlaftData;
  const requestId = task?.process_request_id ?? null;

  const rawPerfil = data.frm_sarlaft_perfil as string | undefined;
  const perfil: SarlaftPerfil | null =
    rawPerfil === 'SIMPLIFICADO' || rawPerfil === 'ESTANDAR' || rawPerfil === 'INTENSIFICADO'
      ? rawPerfil
      : null;

  const docs = DOCS_POR_PERFIL[perfil ?? 'INTENSIFICADO'];

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
      console.error('[DocSARLAFT] Error al enviar:', err);
      alert('Error al enviar los documentos. Revise la consola.');
    }
  }

  // ── Estado enviado ─────────────────────────────────────────
  if (sent) {
    return (
      <div className="screen-wrapper">
        <div className="screen-header">
          <div className="title-block">
            <h1>SOLICITUD DE DOCUMENTOS SARLAFT</h1>
          </div>
          <img src={zurichLogo} alt="Zurich" className="header-logo" />
        </div>
        <div className="screen-sent-wrapper">
          <ResultCard variant="success" title="Documentos enviados">
            <p>
              Los documentos SARLAFT fueron cargados correctamente.<br />
              El proceso continuará con la verificación correspondiente.
            </p>
          </ResultCard>
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
          <h1>SOLICITUD DE DOCUMENTOS SARLAFT</h1>
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
            title="Documentos Requeridos"
            action={<ZrButton config="secondary:xs" icon="info:line" onClick={() => setInfoOpen(true)} />}
            footer={
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
            }
          >
            {!perfil && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                No se detectó perfil SARLAFT en la tarea. Se muestran todos los documentos posibles.
              </ZrAlert>
            )}

            <div className="sarlaft-doc-list">
              {docs.map((doc, i) => (
                <DocRow
                  key={doc.key}
                  index={i + 1}
                  descripcion={doc.descripcion}
                  vigencia={doc.vigencia}
                  docKey={doc.key}
                  state={rowStates[doc.key] ?? { file: null, blobUrl: null }}
                  onFileChange={handleFileChange}
                  onPreview={handlePreview}
                />
              ))}
            </div>

            {validationError && (
              <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                {validationError}
              </ZrAlert>
            )}
          </FormSection>

        </div>
      </div>

      {/* Modal de ayuda */}
      <ZrModal model={infoOpen} onChange={(v: boolean) => setInfoOpen(v)} style={{ ['--z-modal--backdrop' as any]: 'rgba(11,27,60,.45)' }}>
        <AyudaModalContent perfilActivo={perfil} />
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
