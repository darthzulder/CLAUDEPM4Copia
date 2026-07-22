import { useState } from 'react';
import { ActionBar } from '../../../components/ActionBar';
import { useTask } from '../../../core/useTask';
import { useRequestFiles, resolveFileId } from '../../../core/useRequestFiles';
import { ZrButton, ZrModal, ZrAlert, ZrLoader, ZdsStatusBadge, ZrCard } from '../../../components/fields/ZdsFields';
import ResultCard from '../../../components/ResultCard';
import FormSection from '../../../components/FormSection';
import ScreenHeader from '../../../components/ScreenHeader';
import HelpModal from '../../../components/HelpModal';
import PreviewModal from '../../../components/PreviewModal';
import DocList from '../../../components/DocList';
import DocItem from '../../../components/DocItem';
import {
  type DocSarlaftData,
  type SarlaftPerfil,
  DOCS_POR_PERFIL,
  DIRECTRICES,
} from './variables';

// ──────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────
interface PreviewState {
  fileId: number;
  descripcion: string;
  fileName: string;
}


// ──────────────────────────────────────────────────────────────
// Pantalla principal
// ──────────────────────────────────────────────────────────────
export default function RevSARLAFT() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [objPreview, setObjPreview]   = useState<PreviewState | null>(null);
  const [blnInfoOpen, setBlnInfoOpen] = useState(false);
  const [blnSent, setBlnSent]         = useState(false);

  const objData      = (task?.data ?? {}) as DocSarlaftData;
  const intRequestId = task?.process_request_id ?? null;
  const { files, loading: filesLoading } = useRequestFiles(intRequestId);

  // Normalizamos el perfil SARLAFT recibido en la tarea
  const strRawProfile = objData.frm_sarlaft_perfil as string | undefined;
  const strProfile: SarlaftPerfil | null =
    strRawProfile === 'SIMPLIFICADO' || strRawProfile === 'ESTANDAR' || strRawProfile === 'INTENSIFICADO'
      ? strRawProfile
      : null;

  // Documentos requeridos segun el perfil
  const lstDocs = DOCS_POR_PERFIL[strProfile ?? 'INTENSIFICADO'];

  // Resuelve el file_id para cada documento:
  // 1.° intenta la variable de proceso (task.data[doc.key])
  // 2.° cae a la posición en la lista de archivos del request
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

  // ── Confirmar verificación ─────────────────────────────────
  async function handleVerificado() {
    try {
      const { _user: _u, _request: _r, ...objTaskData } = (task?.data ?? {}) as Record<string, unknown>;
      await completeTask({ ...objTaskData });
      setBlnSent(true);
    } catch (excError) {
      console.error('[RevSARLAFT] Error al confirmar:', excError);
      alert('Error al confirmar la verificación. Revise la consola.');
    }
  }

  // ── Estado enviado ─────────────────────────────────────────
  if (blnSent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title="VERIFICAR DOCUMENTOS SARLAFT" />
        <div className="screen-content">
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
        title="VERIFICAR DOCUMENTOS SARLAFT"
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
            title="Documentos SARLAFT Cargados"
            action={<ZrButton config="secondary:xs" icon="info:line" onClick={() => setBlnInfoOpen(true)} />}
            footer={
              <ActionBar>
                <ZrButton
                  config="primary:l"
                  disabled={submitting || files.length === 0}
                  loading={submitting}
                  onClick={handleVerificado}
                >
                  {submitting ? 'Confirmando…' : 'INFORMACIÓN SARLAFT VERIFICADA'}
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
              {lstDocs.map((objDoc, intI) => {
                // Resolvemos el archivo asociado a este documento
                const { fileId: intFileId, fileName: strFileName } = resolveDoc(objDoc.key, intI);
                return (
                  <DocItem
                    key={objDoc.key}
                    mode="upload"
                    index={intI + 1}
                    descripcion={objDoc.descripcion}
                    vigencia={objDoc.vigencia}
                    fileId={intFileId}
                    fileName={strFileName}
                    onPreview={() => {
                      if (intFileId) setObjPreview({ fileId: intFileId, descripcion: objDoc.descripcion, fileName: strFileName });
                    }}
                  />
                );
              })}
            </DocList>

            {files.length === 0 && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                No se encontraron documentos cargados para este caso.
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

      {/* Modal de vista previa — ZrModal (ZDS) + PdfViewer */}
      <PreviewModal
        isOpen={!!objPreview}
        onClose={() => setObjPreview(null)}
        previewDoc={objPreview}
      />
    </div>
  );
}
