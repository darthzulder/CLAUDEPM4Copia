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
        title="SOLICITUD DE DOCUMENTOS SARLAFT"
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
            title="Documentos Requeridos"
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
            {!perfil && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                No se detectó perfil SARLAFT en la tarea. Se muestran todos los documentos posibles.
              </ZrAlert>
            )}

            <DocList mode="upload">
              {docs.map((doc, i) => (
                <DocItem
                  key={doc.key}
                  mode="upload"
                  index={i + 1}
                  descripcion={doc.descripcion}
                  vigencia={doc.vigencia}
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

      {/* Modal de vista previa — ZrModal (ZDS) */}
      <PreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        previewDoc={previewDoc}
      />
    </div>
  );
}
