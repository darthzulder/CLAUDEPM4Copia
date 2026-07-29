import { useState, useCallback } from 'react';
import { ActionBar } from '../../../components/ActionBar';
import { useTask } from '../../../core/useTask';
import { ZrButton, ZrModal, ZrAlert, ZrIcon, ZrLoader, ZdsStatusBadge, ZrCard } from '../../../components/fields/ZdsFields';
import ResultCard from '../../../components/ResultCard';
import FormSection from '../../../components/FormSection';
import ScreenHeader from '../../../components/ScreenHeader';
import HelpModal from '../../../components/HelpModal';
import PreviewModal from '../../../components/PreviewModal';
import DocList from '../../../components/DocList';
import DocItem from '../../../components/DocItem';
import { uploadAttachments, attachIdsToPayload } from '../../../core/attachments';
import {
  type SolDocEmiData,
  PRODUCTO_DOC_DEFS,
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
export default function SolDocEmi() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [dicRowStates, setDicRowStates]           = useState<Record<string, RowState>>({});
  const [objPreviewDoc, setObjPreviewDoc]         = useState<PreviewDoc | null>(null);
  const [blnInfoOpen, setBlnInfoOpen]             = useState(false);
  const [blnSent, setBlnSent]                     = useState(false);
  const [strValidationError, setStrValidationError] = useState<string | null>(null);

  const objData      = (task?.data ?? {}) as SolDocEmiData;
  const intRequestId = task?.process_request_id ?? null;

  // Filtramos los documentos según los productos activos
  const lstActiveDocs = PRODUCTO_DOC_DEFS.filter((objDoc) => !!objData[objDoc.productoKey]);
  const lstDocs = lstActiveDocs.length > 0 ? lstActiveDocs : PRODUCTO_DOC_DEFS;

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
      // Subimos cada archivo al request antes de completar la tarea, y guardamos
      // el fileUploadId de cada uno como <key>_id para poder referenciarlo con precisión.
      const mapFiles = new Map<string, File>();
      lstDocs.forEach((objDoc) => {
        const objFile = dicRowStates[objDoc.key]?.file;
        if (objFile) mapFiles.set(objDoc.key, objFile);
      });
      const dicUploadedIds = intRequestId && mapFiles.size > 0 ? await uploadAttachments(intRequestId, mapFiles) : {};
      const { _user: _u, _request: _r, ...objTaskData } = (task?.data ?? {}) as Record<string, unknown>;
      await completeTask({ ...objTaskData, ...attachIdsToPayload(dicUploadedIds) });
      setBlnSent(true);
    } catch (excError) {
      console.error('[SolDocEmi] Error al enviar:', excError);
      alert('Error al enviar los documentos. Revise la consola.');
    }
  }

  // ── Estado enviado ─────────────────────────────────────────
  if (blnSent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title="SOLICITUD DE DOCUMENTOS EMISIÓN" />
        <div className="screen-content">
          <ResultCard variant="success" title="Documentos enviados">
            <p>
              Las notas de cobertura fueron cargadas correctamente.<br />
              El proceso continuará con la verificación de documentos de emisión.
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
        title="SOLICITUD DE DOCUMENTOS EMISIÓN"
        subtitle={[
          strQuoteNum && `Cotización # ${strQuoteNum}`,
          strCaseNum && `Caso # ${strCaseNum}`,
          lstActiveDocs.length > 0 && `${lstActiveDocs.length} producto${lstActiveDocs.length > 1 ? 's' : ''} seleccionado${lstActiveDocs.length > 1 ? 's' : ''}`
        ]}
      />

      {/* Contenido */}
      <div className="screen-content">
        <div z-flex="col:150">

          <FormSection
            title="Notas de Cobertura Requeridas"
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
            {lstActiveDocs.length === 0 && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                No se detectaron productos activos en la tarea. Se muestran todos los documentos posibles.
              </ZrAlert>
            )}

            <DocList mode="upload">
              {lstDocs.map((objDoc, intI) => (
                <DocItem
                  key={objDoc.key}
                  mode="upload"
                  index={intI + 1}
                  descripcion={objDoc.descripcion}
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
        <HelpModal title="Documentos de Emisión" subtitle="Una nota de cobertura por producto seleccionado en la cotización">
          <strong>Productos y documentos requeridos</strong>
          <div z-flex="col:50">
            {PRODUCTO_DOC_DEFS.map((objDef) => {
              // Marcamos como requerido el producto que este activo
              const blnActive = lstActiveDocs.some((objDoc) => objDoc.key === objDef.key);
              return (
                <ZrCard key={objDef.key} {...({ config: 'grid' } as object)}>
                  <div z-flex="75" z-align="left:center">
                    <strong>{objDef.producto}</strong>
                    {blnActive && <ZdsStatusBadge variant="info">Requerido</ZdsStatusBadge>}
                  </div>
                  <div z-flex="50" z-align="left:center"><ZrIcon icon="file-blank:line" config="xs" /> {objDef.descripcion}</div>
                </ZrCard>
              );
            })}
          </div>
          {lstActiveDocs.length === 0 && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              No se detectaron productos activos. Se muestran todos los posibles.
            </ZrAlert>
          )}
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
