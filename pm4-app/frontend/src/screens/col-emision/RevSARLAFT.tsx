import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { useTask } from '../../core/useTask';
import { useRequestFiles, resolveFileId } from '../../core/useRequestFiles';
import { ZrButton, ZrModal, ZrAlert, ZrLoader, ZdsStatusBadge, ZrCard } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import FormSection from '../../components/FormSection';
import ScreenHeader from '../../components/ScreenHeader';
import HelpModal from '../../components/HelpModal';
import PreviewModal from '../../components/PreviewModal';
import DocList from '../../components/DocList';
import DocItem from '../../components/DocItem';
import {
  type DocSarlaftData,
  type SarlaftPerfil,
  DOCS_POR_PERFIL,
  DIRECTRICES,
} from './variables';

// ──────────────────────────────────────────────────────────────
// Types
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
        title="VERIFICAR DOCUMENTOS SARLAFT"
        subtitle={[
          numCot && `Cotización # ${numCot}`,
          numCaso && `Caso # ${numCaso}`,
          perfil && `Perfil: ${perfil.charAt(0) + perfil.slice(1).toLowerCase()}`
        ]}
      />

      {/* Contenido */}
      <div className="screen-content">
        <div z-flex="col:150">

          <FormSection
            title="Documentos SARLAFT Cargados"
            action={<ZrButton config="secondary:xs" icon="info:line" onClick={() => setInfoOpen(true)} />}
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
            {!perfil && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                No se detectó perfil SARLAFT en la tarea. Se muestran todos los documentos posibles.
              </ZrAlert>
            )}

            <DocList mode="upload">
              {docs.map((doc, i) => {
                const { fileId, fileName } = resolveDoc(doc.key, i);
                return (
                  <DocItem
                    key={doc.key}
                    mode="upload"
                    index={i + 1}
                    descripcion={doc.descripcion}
                    vigencia={doc.vigencia}
                    fileId={fileId}
                    fileName={fileName}
                    onPreview={() => {
                      if (fileId) setPreview({ fileId, descripcion: doc.descripcion, fileName });
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
      <ZrModal model={infoOpen} onChange={(v: boolean) => setInfoOpen(v)} style={{ ['--z-modal--backdrop' as any]: 'color-mix(in srgb, var(--z-modal-backdrop) 45%, transparent)' }}>
        <HelpModal title="Directrices SARLAFT" subtitle="Documentos requeridos según el perfil del tomador">
          {DIRECTRICES.map(({ perfil: p, label, docs: dList }) => (
            <ZrCard key={p} {...({ config: 'grid' } as object)}>
              <div z-flex="75" z-align="left:center">
                <strong>{label}</strong>
                {perfil === p && <ZdsStatusBadge variant="info">Activo</ZdsStatusBadge>}
              </div>
              <ol>
                {dList.map((doc, i) => <li key={i}>{doc}</li>)}
              </ol>
            </ZrCard>
          ))}
        </HelpModal>
      </ZrModal>

      {/* Modal de vista previa — ZrModal (ZDS) + PdfViewer */}
      <PreviewModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        previewDoc={preview}
      />
    </div>
  );
}
