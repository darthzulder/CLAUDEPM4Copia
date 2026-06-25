import { useState, useMemo } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { useTask } from '../../core/useTask';
import { useRequestFiles, resolveFileId } from '../../core/useRequestFiles';
import { ZrButton, ZrModal, ZrForm, ZrTextarea, ZrAlert, ZdsStatusBadge, ZrLoader } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import FormSection from '../../components/FormSection';
import ScreenHeader from '../../components/ScreenHeader';
import HelpModal from '../../components/HelpModal';
import PreviewModal from '../../components/PreviewModal';
import DocList from '../../components/DocList';
import DocItem from '../../components/DocItem';
import {
  type SolDocEmiData,
  type ValidacionDoc,
  type DecisionEmi,
  PRODUCTO_DOC_DEFS,
} from './variables';

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
// Banner de decisión derivada
// ──────────────────────────────────────────────────────────────
function DecisionBanner({ decision }: { decision: DecisionEmi | null }) {
  if (decision === null) {
    return (
      <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
        Valide todos los documentos para determinar la decisión.
      </ZrAlert>
    );
  }
  if (decision === 'COMPLETO') {
    return (
      <ZrAlert config="positive" {...({ 'hide-close': true } as object)}>
        <strong>Documentos completos — se procederá a emitir la póliza.</strong>
      </ZrAlert>
    );
  }
  return (
    <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
      <strong>Documentos incompletos — se solicitarán nuevos documentos.</strong>
    </ZrAlert>
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
    const fallback = files[idx];
    if (fallback) return { fileId: fallback.id, fileName: fallback.file_name };
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
        <ScreenHeader title="VERIFICACIÓN DOCUMENTOS EMISIÓN" />
        <div className="screen-content">
          <ResultCard variant="success" title="Verificación completada">
            <p>
              La decisión fue registrada correctamente.<br />
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
        title="VERIFICACIÓN DOCUMENTOS EMISIÓN"
        subtitle={[
          numCot && `Cotización # ${numCot}`,
          numCaso && `Caso # ${numCaso}`,
          docsActivos.length > 0 && `${docsActivos.length} producto${docsActivos.length > 1 ? 's' : ''}`
        ]}
      />

      {/* Contenido */}
      <div className="screen-content">
        <div z-flex="col:150">

          <FormSection
            title="Documentos de Emisión"
            action={<ZrButton config="secondary:xs" icon="info:line" onClick={() => setInfoOpen(true)} />}
            footer={
              <>
                {/* Sección de Decisión */}
                <div className="decision-section">
                  <div className="decision-title">
                    <span className="decision-accent" />
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
                    <ZrAlert config="negative" style={{ marginTop: '0.75rem' }} {...({ 'hide-close': true } as object)}>
                      {submitError}
                    </ZrAlert>
                  )}
                </div>

                <ActionBar>
                  <ZrButton
                    config="primary:l"
                    disabled={submitting || derivedDecision === null}
                    loading={submitting}
                    onClick={handleContinuar}
                  >
                    {submitting ? 'Guardando…' : 'CONTINUAR'}
                  </ZrButton>
                </ActionBar>
              </>
            }
          >
            <DocList mode="validation">
              {docs.map((doc, i) => {
                const { fileId, fileName } = resolveDoc(doc.key, i);
                return (
                  <DocItem
                    key={doc.key}
                    mode="validation"
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
                    valOpciones={VAL_OPCIONES}
                  />
                );
              })}
            </DocList>
          </FormSection>

        </div>
      </div>

      {/* Modal de ayuda — criterios de verificación */}
      <ZrModal
        model={infoOpen}
        onChange={(v: boolean) => setInfoOpen(v)}
        style={{ ['--z-modal--backdrop' as any]: 'color-mix(in srgb, var(--z-modal-backdrop) 45%, transparent)' }}
      >
        <HelpModal title="Criterios de Verificación" subtitle="Guía para validar documentos de emisión">
          <div z-flex="col:100">
            <div z-flex="col:50">
              <strong>Estados de validación</strong>
              <div z-flex="col:50">
                <div z-flex="100" z-align="left:center">
                  <ZdsStatusBadge variant="success">Aprobada</ZdsStatusBadge>
                  <span>El documento es correcto y cumple todos los requisitos de emisión.</span>
                </div>
                <div z-flex="100" z-align="left:center">
                  <ZdsStatusBadge variant="info">En revisión</ZdsStatusBadge>
                  <span>Estado inicial — debe cambiarse a Aprobada o Rechazada antes de continuar.</span>
                </div>
                <div z-flex="100" z-align="left:center">
                  <ZdsStatusBadge variant="danger">Rechazada</ZdsStatusBadge>
                  <span>El documento no cumple los requisitos, está incorrecto o incompleto.</span>
                </div>
              </div>
            </div>

            <div z-flex="col:50">
              <strong>Decisión automática</strong>
              <div z-flex="col:50">
                <ZrAlert config="positive" {...({ 'hide-close': true } as object)}>
                  <strong>Todos aprobados:</strong> Se procederá a emitir la póliza.
                </ZrAlert>
                <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                  <strong>Alguno rechazado:</strong> Se solicitarán nuevos documentos al Sales Support.
                </ZrAlert>
              </div>
            </div>

            <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
              No es posible continuar si algún documento permanece en estado <strong>En revisión</strong>.
            </ZrAlert>
          </div>
        </HelpModal>
      </ZrModal>

      {/* Modal de vista previa */}
      <PreviewModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        previewDoc={preview}
      />
    </div>
  );
}
