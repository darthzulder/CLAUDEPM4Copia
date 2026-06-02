import { useState, useMemo } from 'react';
import { useTask } from '../../core/useTask';
import { useRequestFiles, resolveFileId } from '../../core/useRequestFiles';
import PdfViewer from '../../components/PdfViewer';
import { ZrButton }   from '@zurich/web-components/react/button';
import { ZrModal }    from '@zurich/web-components/react/modal';
import { ZrForm }     from '@zurich/web-components/react/form';
import { ZrSelect }   from '@zurich/web-components/react/select';
import { ZrTextarea } from '@zurich/web-components/react/textarea';
import {
  type SolDocEmiData,
  type ValidacionDoc,
  type DecisionEmi,
  PRODUCTO_DOC_DEFS,
} from './variables';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
import './styles.css';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface PreviewState {
  fileId: number;
  descripcion: string;
  fileName: string;
}

const VAL_OPCIONES: Array<{ value: ValidacionDoc; label: string }> = [
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'APROBADA',    label: 'Aprobada'    },
  { value: 'RECHAZADA',   label: 'Rechazada'   },
];

// ──────────────────────────────────────────────────────────────
// Fila de documento — solo lectura + select de validación
// ──────────────────────────────────────────────────────────────
function DocRow({
  index,
  descripcion,
  fileId,
  fileName,
  validacion,
  onValidacion,
  onPreview,
}: {
  index: number;
  descripcion: string;
  fileId: number | null;
  fileName: string;
  validacion: ValidacionDoc;
  onValidacion: (v: ValidacionDoc) => void;
  onPreview: () => void;
}) {
  const cargado = fileId !== null;

  return (
    <div className={`sarlaft-doc-row verdoc-row${cargado ? ' is-loaded' : ''}`}>
      {/* Badge coloreado por estado de validación */}
      <div className={`doc-num-badge doc-num-badge--${validacion.toLowerCase().replace('_', '-')}`}>
        {index}
      </div>

      {/* Descripción */}
      <div className="doc-body">
        <span className="doc-desc">{descripcion}</span>
      </div>

      {/* Archivo + botón ver */}
      <div className="verdoc-file-area">
        {cargado ? (
          <span className="file-name-chip">
            <span className="file-chip-icon">📄</span>
            {fileName}
          </span>
        ) : (
          <span className="file-name-empty">Sin documento</span>
        )}
        <button
          type="button"
          className={`btn-preview${!cargado ? ' btn-preview--disabled' : ''}`}
          disabled={!cargado}
          title={cargado ? 'Ver documento' : 'No hay documento cargado'}
          onClick={onPreview}
        >
          <span>👁</span>
          <span className="btn-preview-label">Ver</span>
        </button>
      </div>

      {/* Select de validación — ZrSelect ZDS */}
      <div className="val-zrselect-wrap">
        <ZrSelect
          config="line"
          label=""
          model={validacion}
          options={VAL_OPCIONES.map((o) => ({ value: o.value, text: o.label }))}
          onChange={(v: string | null) => onValidacion((v ?? '') as ValidacionDoc)}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Banner de decisión derivada
// ──────────────────────────────────────────────────────────────
function DecisionBanner({ decision }: { decision: DecisionEmi | null }) {
  if (decision === null) {
    return (
      <div className="decision-banner decision-banner--pending">
        <span className="decision-banner-icon">⏳</span>
        <span>Valide todos los documentos para determinar la decisión.</span>
      </div>
    );
  }
  if (decision === 'COMPLETO') {
    return (
      <div className="decision-banner decision-banner--completo">
        <span className="decision-banner-icon">✓</span>
        <div>
          <strong>Documentos completos — se procederá a emitir la póliza.</strong>
        </div>
      </div>
    );
  }
  return (
    <div className="decision-banner decision-banner--incompleto">
      <span className="decision-banner-icon">✗</span>
      <div>
        <strong>Documentos incompletos — se solicitarán nuevos documentos.</strong>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Panel informativo derecho
// ──────────────────────────────────────────────────────────────
function AyudaModalContent() {
  return (
    <div className="ayuda-modal">
      <div className="ayuda-modal-header">
        <div className="ayuda-modal-icon-circle">i</div>
        <div>
          <div className="ayuda-modal-title">Criterios de Verificación</div>
          <div className="ayuda-modal-subtitle">Guía para validar documentos de emisión</div>
        </div>
      </div>
      <div className="ayuda-modal-body">

        <div>
          <p className="ayuda-section-label">Estados de validación</p>
          <div className="ayuda-estados-grid">
            <span className="val-chip val-chip--aprobada">Aprobada</span>
            <span className="ayuda-desc">El documento es correcto y cumple todos los requisitos de emisión.</span>
            <span className="val-chip val-chip--en-revision">En revisión</span>
            <span className="ayuda-desc">Estado inicial — debe cambiarse a Aprobada o Rechazada antes de continuar.</span>
            <span className="val-chip val-chip--rechazada">Rechazada</span>
            <span className="ayuda-desc">El documento no cumple los requisitos, está incorrecto o incompleto.</span>
          </div>
        </div>

        <div className="ayuda-divider" />

        <div>
          <p className="ayuda-section-label">Decisión automática</p>
          <div className="ayuda-decision-rows">
            <div className="ayuda-decision-row ayuda-decision-row--completo">
              <span className="ayuda-decision-tag ayuda-decision-tag--completo">Todos aprobados</span>
              <span className="ayuda-desc">Se procederá a emitir la póliza.</span>
            </div>
            <div className="ayuda-decision-row ayuda-decision-row--incompleto">
              <span className="ayuda-decision-tag ayuda-decision-tag--incompleto">Alguno rechazado</span>
              <span className="ayuda-desc">Se solicitarán nuevos documentos al Sales Support.</span>
            </div>
          </div>
        </div>

        <div className="ayuda-nota">
          ⚠ No es posible continuar si algún documento permanece en estado <strong>En revisión</strong>.
        </div>

      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Pantalla principal
// ──────────────────────────────────────────────────────────────
export default function VerDocEmi() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [validaciones, setValidaciones] = useState<Record<string, ValidacionDoc>>({});
  const [comentarios, setComentarios]   = useState('');
  const [preview, setPreview]           = useState<PreviewState | null>(null);
  const [infoOpen, setInfoOpen]         = useState(false);
  const [sent, setSent]                 = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);

  const data      = (task?.data ?? {}) as SolDocEmiData;
  const requestId = task?.process_request_id ?? null;
  const { files, loading: filesLoading } = useRequestFiles(requestId);

  const docsActivos = PRODUCTO_DOC_DEFS.filter((d) => !!data[d.productoKey]);
  const docs        = docsActivos.length > 0 ? docsActivos : PRODUCTO_DOC_DEFS;

  function getValidacion(key: string): ValidacionDoc {
    return validaciones[key] ?? 'EN_REVISION';
  }

  function resolveDoc(key: string, idx: number): { fileId: number | null; fileName: string } {
    const fromTask = resolveFileId((data as Record<string, unknown>)[key]);
    if (fromTask) {
      const match = files.find((f) => f.id === fromTask);
      return { fileId: fromTask, fileName: match?.file_name ?? `Documento ${idx + 1}` };
    }
    const byName = files.find((f) => f.file_name === key);
    if (byName) return { fileId: byName.id, fileName: byName.file_name };
    return { fileId: null, fileName: '' };
  }

  // Decisión derivada automáticamente
  const derivedDecision = useMemo((): DecisionEmi | null => {
    const vals = docs.map((d) => getValidacion(d.key));
    if (vals.some((v) => v === 'EN_REVISION')) return null;          // aún pendiente
    return vals.every((v) => v === 'APROBADA') ? 'COMPLETO' : 'INCOMPLETO';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validaciones, docs]);

  // ── Continuar ──────────────────────────────────────────────
  async function handleContinuar() {
    if (derivedDecision === null) {
      setSubmitError('Todos los documentos deben estar validados (Aprobada o Rechazada) antes de continuar.');
      return;
    }
    if (derivedDecision === 'INCOMPLETO' && !comentarios.trim()) {
      setSubmitError('Debe ingresar comentarios cuando hay documentos rechazados.');
      return;
    }
    setSubmitError(null);

    try {
      const { _user: _u, _request: _r, ...taskData } = (task?.data ?? {}) as Record<string, unknown>;

      const validacionesOut: Record<string, string> = {};
      for (const doc of docs) {
        validacionesOut[`${doc.key}_validacion`] = getValidacion(doc.key);
      }

      await completeTask({
        ...taskData,
        ...validacionesOut,
        frm_decision_emision: derivedDecision,
        ...(derivedDecision === 'INCOMPLETO' ? { frm_comentarios_emision: comentarios.trim() } : {}),
      });
      setSent(true);
    } catch (err) {
      console.error('[VerDocEmi] Error al continuar:', err);
      setSubmitError('Error al guardar la verificación. Revise la consola.');
    }
  }

  // ── Estado enviado ─────────────────────────────────────────
  if (sent) {
    return (
      <div className="screen-wrapper">
        <div className="screen-header">
          <div className="title-block">
            <h1>VERIFICACIÓN DOCUMENTOS EMISIÓN</h1>
          </div>
          <img src={zurichLogo} alt="Zurich" className="header-logo" />
        </div>
        <div className="screen-sent-wrapper">
          <div className="screen-sent">
            <div className="screen-sent-icon">✓</div>
            <div className="screen-sent-title">Verificación completada</div>
            <div className="screen-sent-sub">
              La decisión fue registrada correctamente.<br />
              El proceso continuará al siguiente nodo automáticamente.
            </div>
          </div>
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
          <h1>VERIFICACIÓN DOCUMENTOS EMISIÓN</h1>
          <div className="subtitle">
            {numCot  && <span>Cotización # {numCot}</span>}
            {numCaso && <span>Caso # {numCaso}</span>}
            {docsActivos.length > 0 && (
              <span>{docsActivos.length} producto{docsActivos.length > 1 ? 's' : ''}</span>
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
              <span>Documentos de Emisión</span>
              <button
                type="button"
                className="btn-info-help"
                onClick={() => setInfoOpen(true)}
                title="Ver criterios de verificación"
              >
                i
              </button>
            </div>

            <div className="nc-section-body">
              {/* Cabecera de columnas */}
              <div className="verdoc-table-header">
                <span style={{ flex: 1 }}>Documento</span>
                <span style={{ width: 200 }}>Archivo</span>
                <span style={{ width: 180 }}>Validación</span>
              </div>

              <div className="sarlaft-doc-list">
                {docs.map((doc, i) => {
                  const { fileId, fileName } = resolveDoc(doc.key, i);
                  return (
                    <DocRow
                      key={doc.key}
                      index={i + 1}
                      descripcion={doc.descripcion}
                      fileId={fileId}
                      fileName={fileName}
                      validacion={getValidacion(doc.key)}
                      onValidacion={(v) => {
                        setValidaciones((prev) => ({ ...prev, [doc.key]: v }));
                        setSubmitError(null);
                      }}
                      onPreview={() => {
                        if (fileId) setPreview({ fileId, descripcion: doc.descripcion, fileName });
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Sección de Decisión */}
            <div className="verdoc-decision-section">
              <div className="verdoc-decision-title">
                <span className="verdoc-decision-acento" />
                Decisión
              </div>

              <DecisionBanner decision={derivedDecision} />

              {derivedDecision === 'INCOMPLETO' && (
                <div style={{ marginTop: '1rem' }}>
                  <ZrForm config="line">
                    <ZrTextarea
                      name="frm_comentarios_emision"
                      label="Comentarios *"
                      model={comentarios}
                      onChange={(v: string | null) => {
                        setComentarios(v ?? '');
                        setSubmitError(null);
                      }}
                      elastic
                      help-text="Describa las razones por las cuales los documentos están incompletos."
                      required
                    />
                  </ZrForm>
                </div>
              )}

              {submitError && (
                <div className="validation-error" style={{ marginTop: '0.75rem' }}>
                  ⚠ {submitError}
                </div>
              )}
            </div>

            <div className="submit-bar">
              <ZrButton
                config="primary:l"
                disabled={submitting || derivedDecision === null}
                loading={submitting}
                onClick={handleContinuar}
              >
                {submitting ? 'Guardando…' : 'CONTINUAR'}
              </ZrButton>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de ayuda — criterios de verificación */}
      <ZrModal
        model={infoOpen}
        onChange={(v: boolean) => setInfoOpen(v)}
        style={{ ['--z-modal--backdrop' as any]: 'rgba(11,27,60,.45)' }}
      >
        <AyudaModalContent />
      </ZrModal>

      {/* Modal de vista previa */}
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
          <div>
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
