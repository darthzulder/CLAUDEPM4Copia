import { useState, useCallback } from 'react';
import { ActionBar } from '../../../components/ActionBar';
import { useTask } from '../../../core/useTask';
import { ZrButton, ZrModal, ZrAlert, ZrLoader, ZdsStatusBadge, ZrCard } from '../../../components/fields/ZdsFields';
import ResultCard from '../../../components/ResultCard';
import FormSection from '../../../components/FormSection';
import ScreenHeader from '../../../components/ScreenHeader';
import HelpModal from '../../../components/HelpModal';
import PreviewModal from '../../../components/PreviewModal';
import DocList from '../../../components/DocList';
import DocItem from '../../../components/DocItem';
import pm4 from '../../../api/pm4Client';
import {
  type DocSarlaftData,
  type SarlaftPerfil,
  DOCS_POR_PERFIL,
  DIRECTRICES,
} from './variables';

// ──────────────────────────────────────────────────────────────
// Tipos
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
// Pantalla principal
// ──────────────────────────────────────────────────────────────
export default function DocSARLAFT() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [dicRowStates, setDicRowStates]       = useState<Record<string, RowState>>({});
  const [objPreviewDoc, setObjPreviewDoc]     = useState<PreviewDoc | null>(null);
  const [blnInfoOpen, setBlnInfoOpen]         = useState(false);
  const [blnSent, setBlnSent]                 = useState(false);
  const [strValidationError, setStrValidationError] = useState<string | null>(null);

  const objData      = (task?.data ?? {}) as DocSarlaftData;
  const intRequestId = task?.process_request_id ?? null;

  // Normalizamos el perfil SARLAFT recibido en la tarea
  const strRawProfile = objData.frm_sarlaft_perfil as string | undefined;
  const strProfile: SarlaftPerfil | null =
    strRawProfile === 'SIMPLIFICADO' || strRawProfile === 'ESTANDAR' || strRawProfile === 'INTENSIFICADO'
      ? strRawProfile
      : null;

  // Documentos requeridos segun el perfil
  const lstDocs = DOCS_POR_PERFIL[strProfile ?? 'INTENSIFICADO'];

  // ── Cambio de archivo ──────────────────────────────────────
  const handleFileChange = useCallback((in_strKey: string, in_objFile: File) => {
    const strBlobUrl = URL.createObjectURL(in_objFile);
    setDicRowStates((objPrev) => {
      if (objPrev[in_strKey]?.blobUrl) URL.revokeObjectURL(objPrev[in_strKey].blobUrl!);
      return { ...objPrev, [in_strKey]: { file: in_objFile, blobUrl: strBlobUrl } };
    });
    setStrValidationError(null);
  }, []);

  // ── Abrir modal de preview ─────────────────────────────────
  const handlePreview = useCallback((in_strKey: string) => {
    const objRow = dicRowStates[in_strKey];
    if (!objRow?.blobUrl || !objRow.file) return;
    const objDoc = lstDocs.find((objItem) => objItem.key === in_strKey);
    setObjPreviewDoc({
      descripcion: objDoc?.descripcion ?? in_strKey,
      fileName: objRow.file.name,
      blobUrl: objRow.blobUrl,
    });
  }, [dicRowStates, lstDocs]);

  // ── Enviar ─────────────────────────────────────────────────
  async function handleEnviar() {
    // Validamos que no queden documentos pendientes de cargar
    const lstPending = lstDocs.filter((objDoc) => !dicRowStates[objDoc.key]?.file);
    if (lstPending.length > 0) {
      setStrValidationError(
        `Debe cargar todos los documentos requeridos. Pendiente${lstPending.length > 1 ? 's' : ''}: ${lstPending
          .map((objDoc) => objDoc.descripcion)
          .join(', ')}.`
      );
      return;
    }
    setStrValidationError(null);

    try {
      // Subimos cada archivo al request antes de completar la tarea
      if (intRequestId) {
        for (const objDoc of lstDocs) {
          const objFile = dicRowStates[objDoc.key]?.file;
          if (!objFile) continue;
          const objFormData = new FormData();
          objFormData.append('file', objFile);
          await pm4.post(`/requests/${intRequestId}/files?data_name=${objDoc.key}`, objFormData);
        }
      }
      const { _user: _u, _request: _r, ...objTaskData } = (task?.data ?? {}) as Record<string, unknown>;
      await completeTask({ ...objTaskData });
      setBlnSent(true);
    } catch (excError) {
      console.error('[DocSARLAFT] Error al enviar:', excError);
      alert('Error al enviar los documentos. Revise la consola.');
    }
  }

  // ── Estado enviado ─────────────────────────────────────────
  if (blnSent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title="SOLICITUD DE DOCUMENTOS SARLAFT" />
        <div className="screen-content">
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
          <ZrLoader />
          <span>Cargando…</span>
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
        title="SOLICITUD DE DOCUMENTOS SARLAFT"
        subtitle={[
          strQuoteNum && `Cotización # ${strQuoteNum}`,
          strCaseNum && `Caso # ${strCaseNum}`,
          strProfile && `Perfil: ${strProfile.charAt(0) + strProfile.slice(1).toLowerCase()}`
        ]}
      />

      {/* Contenido */}
      <div className="screen-content">
        <div z-flex="col:150">

          <FormSection
            title="Documentos Requeridos"
            action={<ZrButton config="secondary:xs" icon="info:line" onClick={() => setBlnInfoOpen(true)} />}
            footer={
              <ActionBar>
                <ZrButton
                  config="primary:l"
                  disabled={submitting}
                  loading={submitting}
                  onClick={handleEnviar}
                >
                  {submitting ? 'Enviando…' : 'ENVIAR'}
                </ZrButton>
              </ActionBar>
            }
          >
            {!strProfile && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                No se detectó perfil SARLAFT en la tarea. Se muestran todos los documentos posibles.
              </ZrAlert>
            )}

            <DocList mode="upload">
              {lstDocs.map((objDoc, intI) => (
                <DocItem
                  key={objDoc.key}
                  mode="upload"
                  index={intI + 1}
                  descripcion={objDoc.descripcion}
                  vigencia={objDoc.vigencia}
                  state={dicRowStates[objDoc.key] ?? { file: null, blobUrl: null }}
                  onFileChange={(f) => handleFileChange(objDoc.key, f)}
                  onPreview={() => handlePreview(objDoc.key)}
                />
              ))}
            </DocList>

            {strValidationError && (
              <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                {strValidationError}
              </ZrAlert>
            )}
          </FormSection>

        </div>
      </div>

      {/* Modal de ayuda */}
      <ZrModal model={blnInfoOpen} onChange={(v: boolean) => setBlnInfoOpen(v)} style={{ ['--z-modal--backdrop' as any]: 'color-mix(in srgb, var(--z-modal-backdrop) 45%, transparent)' }}>
        <HelpModal title="Directrices SARLAFT" subtitle="Documentos requeridos según el perfil del tomador">
          {DIRECTRICES.map(({ perfil: strProfileItem, label: strLabel, docs: lstDocItems }) => (
            <ZrCard key={strProfileItem} {...({ config: 'grid' } as object)}>
              <div z-flex="75" z-align="left:center">
                <strong>{strLabel}</strong>
                {strProfile === strProfileItem && <ZdsStatusBadge variant="info">Activo</ZdsStatusBadge>}
              </div>
              <ol>
                {lstDocItems.map((strDoc, intI) => <li key={intI}>{strDoc}</li>)}
              </ol>
            </ZrCard>
          ))}
        </HelpModal>
      </ZrModal>

      {/* Modal de vista previa — ZrModal (ZDS) */}
      <PreviewModal
        isOpen={!!objPreviewDoc}
        onClose={() => setObjPreviewDoc(null)}
        previewDoc={objPreviewDoc}
      />
    </div>
  );
}
