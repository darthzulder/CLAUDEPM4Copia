import { useState, useCallback } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { useTask } from '../../core/useTask';
import { ZrButton, ZrModal, ZrAlert, ZrIcon } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import FormSection from '../../components/FormSection';
import ScreenHeader from '../../components/ScreenHeader';
import HelpModal from '../../components/HelpModal';
import PreviewModal from '../../components/PreviewModal';
import DocList from '../../components/DocList';
import DocItem from '../../components/DocItem';
import pm4 from '../../api/pm4Client';
import {
  type SolDocEmiData,
  PRODUCTO_DOC_DEFS,
} from './variables';

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
      <ScreenHeader
        title="SOLICITUD DE DOCUMENTOS EMISIÓN"
        subtitle={[
          numCot && `Cotización # ${numCot}`,
          numCaso && `Caso # ${numCaso}`,
          docsActivos.length > 0 && `${docsActivos.length} producto${docsActivos.length > 1 ? 's' : ''} seleccionado${docsActivos.length > 1 ? 's' : ''}`
        ]}
      />

      {/* Contenido */}
      <div className="screen-content">
        <div z-flex="col:150">

          <FormSection
            title="Notas de Cobertura Requeridas"
            action={<ZrButton config="secondary:xs" icon="info:line" onClick={() => setInfoOpen(true)} />}
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
            {docsActivos.length === 0 && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                No se detectaron productos activos en la tarea. Se muestran todos los documentos posibles.
              </ZrAlert>
            )}

            <DocList mode="upload">
              {docs.map((doc, i) => (
                <DocItem
                  key={doc.key}
                  mode="upload"
                  index={i + 1}
                  descripcion={doc.descripcion}
                  state={rowStates[doc.key] ?? { file: null, blobUrl: null }}
                  onFileChange={(f) => handleFileChange(doc.key, f)}
                  onPreview={() => handlePreview(doc.key)}
                />
              ))}
            </DocList>

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
        <HelpModal title="Documentos de Emisión" subtitle="Una nota de cobertura por producto seleccionado en la cotización">
          <p className="help-section-label">Productos y documentos requeridos</p>
          <div z-flex="col:50">
            {PRODUCTO_DOC_DEFS.map((def) => {
              const activo = docsActivos.some((d) => d.key === def.key);
              return (
                <div key={def.key} className={`help-product-row${activo ? ' help-product-active' : ''}`}>
                  <div className="help-product-name">
                    {def.producto}
                    {activo && <span className="badge-active">Requerido</span>}
                  </div>
                  <div className="help-product-doc"><ZrIcon icon="file-blank:line" config="xs" /> {def.descripcion}</div>
                </div>
              );
            })}
          </div>
          {docsActivos.length === 0 && (
            <div className="help-note">
              ℹ No se detectaron productos activos. Se muestran todos los posibles.
            </div>
          )}
        </HelpModal>
      </ZrModal>

      {/* Modal de vista previa — ZrModal (ZDS) */}
      <PreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        previewDoc={previewDoc}
      />
    </div>
  );
}
