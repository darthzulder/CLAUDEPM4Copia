import { useState, useMemo } from 'react';
import { ActionBar } from '../../../components/ActionBar';
import { useTask } from '../../../core/useTask';
import { useRequestFiles, resolveFileId } from '../../../core/useRequestFiles';
import { ZrButton, ZrModal, ZrForm, ZrTextarea, ZrAlert, ZdsStatusBadge, ZrLoader } from '../../../components/fields/ZdsFields';
import ResultCard from '../../../components/ResultCard';
import FormSection from '../../../components/FormSection';
import ScreenHeader from '../../../components/ScreenHeader';
import HelpModal from '../../../components/HelpModal';
import PreviewModal from '../../../components/PreviewModal';
import DocList from '../../../components/DocList';
import DocItem from '../../../components/DocItem';
import {
  type SolDocEmiData,
  type ValidacionDoc,
  type DecisionEmi,
  PRODUCTO_DOC_DEFS,
} from './variables';

// ──────────────────────────────────────────────────────────────
// Tipos
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
  const [dicValidations, setDicValidations] = useState<Record<string, ValidacionDoc>>({});
  const [strComments, setStrComments]   = useState('');
  const [objPreview, setObjPreview]           = useState<PreviewState | null>(null);
  const [blnInfoOpen, setBlnInfoOpen]         = useState(false);
  const [blnSent, setBlnSent]                 = useState(false);
  const [strSubmitError, setStrSubmitError]   = useState<string | null>(null);

  const objData      = (task?.data ?? {}) as SolDocEmiData;
  const intRequestId = task?.process_request_id ?? null;
  const { files, loading: filesLoading } = useRequestFiles(intRequestId);

  // Filtramos los documentos según los productos activos
  const lstActiveDocs = PRODUCTO_DOC_DEFS.filter((objDoc) => !!objData[objDoc.productoKey]);
  const lstDocs        = lstActiveDocs.length > 0 ? lstActiveDocs : PRODUCTO_DOC_DEFS;

  // Estado de validación de un documento (por defecto En revisión)
  function getValidacion(in_strKey: string): ValidacionDoc {
    return dicValidations[in_strKey] ?? 'EN_REVISION';
  }

  // Resuelve el archivo asociado a un documento
  function resolveDoc(in_strKey: string, in_intIdx: number): { fileId: number | null; fileName: string } {
    const intFromTask = resolveFileId((objData as Record<string, unknown>)[in_strKey]);
    if (intFromTask) {
      const objMatch = files.find((f) => f.id === intFromTask);
      return { fileId: intFromTask, fileName: objMatch?.file_name ?? `Documento ${in_intIdx + 1}` };
    }
    const objFallback = files[in_intIdx];
    if (objFallback) return { fileId: objFallback.id, fileName: objFallback.file_name };
    return { fileId: null, fileName: '' };
  }

  // Decisión derivada automáticamente del estado de cada documento
  const strDerivedDecision = useMemo((): DecisionEmi | null => {
    const lstVals = lstDocs.map((objDoc) => getValidacion(objDoc.key));
    if (lstVals.some((strVal) => strVal === 'EN_REVISION')) return null;          // aún pendiente
    return lstVals.every((strVal) => strVal === 'APROBADA') ? 'COMPLETO' : 'INCOMPLETO';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dicValidations, lstDocs]);

  // ── Continuar ──────────────────────────────────────────────
  async function handleContinuar() {
    // Todos los documentos deben estar validados antes de avanzar
    if (strDerivedDecision === null) {
      setStrSubmitError('Todos los documentos deben estar validados (Aprobada o Rechazada) antes de continuar.');
      return;
    }
    if (strDerivedDecision === 'INCOMPLETO' && !strComments.trim()) {
      setStrSubmitError('Debe ingresar comentarios cuando hay documentos rechazados.');
      return;
    }
    setStrSubmitError(null);

    try {
      const { _user: _u, _request: _r, ...objTaskData } = (task?.data ?? {}) as Record<string, unknown>;

      // Empaquetamos la validación de cada documento
      const dicValidationsOut: Record<string, string> = {};
      for (const objDoc of lstDocs) {
        dicValidationsOut[`${objDoc.key}_validacion`] = getValidacion(objDoc.key);
      }

      await completeTask({
        ...objTaskData,
        ...dicValidationsOut,
        frm_decision_emision: strDerivedDecision,
        ...(strDerivedDecision === 'INCOMPLETO' ? { frm_comentarios_emision: strComments.trim() } : {}),
      });
      setBlnSent(true);
    } catch (excError) {
      console.error('[VerDocEmi] Error al continuar:', excError);
      setStrSubmitError('Error al guardar la verificación. Revise la consola.');
    }
  }

  // ── Estado enviado ─────────────────────────────────────────
  if (blnSent) {
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

  // Datos de cabecera para el encabezado
  const strQuoteNum  = objData.frm_num_cotizacion ?? objData.frm_gen_num_cotizacion;
  const strCaseNum = objData.frm_caso;

  return (
    <div className="screen-wrapper">
      {submitting && (
        <div className="loading-overlay">
          <ZrLoader />
        </div>
      )}

      {/* Cabecera */}
      <ScreenHeader
        title="VERIFICACIÓN DOCUMENTOS EMISIÓN"
        subtitle={[
          strQuoteNum && `Cotización # ${strQuoteNum}`,
          strCaseNum && `Caso # ${strCaseNum}`,
          lstActiveDocs.length > 0 && `${lstActiveDocs.length} producto${lstActiveDocs.length > 1 ? 's' : ''}`
        ]}
      />

      {/* Contenido */}
      <div className="screen-content">
        <div z-flex="col:150">

          <FormSection
            title="Documentos de Emisión"
            action={<ZrButton config="secondary:xs" icon="info:line" onClick={() => setBlnInfoOpen(true)} />}
            footer={
              <>
                {/* Sección de Decisión */}
                <div className="decision-section">
                  <div className="decision-title">
                    <span className="decision-accent" />
                    Decisión
                  </div>

                  <DecisionBanner decision={strDerivedDecision} />

                  {strDerivedDecision === 'INCOMPLETO' && (
                    <div style={{ marginTop: '1rem' }}>
                      <ZrForm config="line">
                        <ZrTextarea
                          name="frm_comentarios_emision"
                          label="Comentarios *"
                          model={strComments}
                          onChange={(strVal: string | null) => {
                            setStrComments(strVal ?? '');
                            setStrSubmitError(null);
                          }}
                          elastic
                          help-text="Describa las razones por las cuales los documentos están incompletos."
                          required
                        />
                      </ZrForm>
                    </div>
                  )}

                  {strSubmitError && (
                    <ZrAlert config="negative" style={{ marginTop: '0.75rem' }} {...({ 'hide-close': true } as object)}>
                      {strSubmitError}
                    </ZrAlert>
                  )}
                </div>

                <ActionBar>
                  <ZrButton
                    config="primary:l"
                    disabled={submitting || strDerivedDecision === null}
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
              {lstDocs.map((objDoc, intI) => {
                // Resolvemos el archivo asociado a este documento
                const { fileId: intFileId, fileName: strFileName } = resolveDoc(objDoc.key, intI);
                return (
                  <DocItem
                    key={objDoc.key}
                    mode="validation"
                    index={intI + 1}
                    descripcion={objDoc.descripcion}
                    fileId={intFileId}
                    fileName={strFileName}
                    validacion={getValidacion(objDoc.key)}
                    onValidacion={(strVal) => {
                      setDicValidations((objPrev) => ({ ...objPrev, [objDoc.key]: strVal }));
                      setStrSubmitError(null);
                    }}
                    onPreview={() => {
                      if (intFileId) setObjPreview({ fileId: intFileId, descripcion: objDoc.descripcion, fileName: strFileName });
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
        model={blnInfoOpen}
        onChange={(v: boolean) => setBlnInfoOpen(v)}
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
        isOpen={!!objPreview}
        onClose={() => setObjPreview(null)}
        previewDoc={objPreview}
      />
    </div>
  );
}
