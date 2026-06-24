import { useState } from 'react';
import { useTask } from '../../core/useTask';
import { ZrButton, ZrModal } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import ScreenHeader from '../../components/ScreenHeader';
import { RESPUESTA_VALUES, type RespuestaCotizacionData } from './variables';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getBlock(d: RespuestaCotizacionData): {
  variant: 'info' | 'on-hold' | 'error';
  icon: string;
  title: string;
  message: string;
} | null {
  const respuesta = d.frm_respuesta_cotizacion;
  const lrFlag    = d.frm_control_desde_optalitix_loss_ratio_calculado_flag;
  const conoceRC  = d.frm_conoceValorSumaRC;
  const lrValue   = Number(d.frm_valorRC_lossRatio_calculado ?? 0);

  if (
    respuesta === RESPUESTA_VALUES.REQUIERE_CASEUW &&
    String(lrFlag).toUpperCase() === 'NO'
  ) {
    return {
      variant: 'info',
      icon: '📋',
      title: 'Cotización finalizada',
      message:
        'Esta oportunidad no puede cotizarse con Fast Flow y se creará un Case Underwriting.',
    };
  }

  if (respuesta === RESPUESTA_VALUES.INTERMEDIARIO) {
    return {
      variant: 'on-hold',
      icon: '⏸',
      title: 'Cotización en estado On hold',
      message: 'La cotización requiere revisión del área de Compliance.',
    };
  }

  if (respuesta === RESPUESTA_VALUES.ON_HOLD) {
    return {
      variant: 'info',
      icon: '🔒',
      title: 'Cotización finalizada',
      message:
        'El intermediario no tiene autorización para gestionar esta cotización, favor comunicarse con el responsable de la cuenta.',
    };
  }

  if (String(conoceRC).toUpperCase() === 'NO' && lrValue > 20) {
    return {
      variant: 'error',
      icon: '⚠️',
      title: 'Cotización finalizada',
      message:
        'Esta oportunidad no puede cotizarse con Fast Flow porque ha superado el límite establecido para el loss ratio (20%).',
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Confirm modal
// ---------------------------------------------------------------------------
interface ConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ onConfirm, onCancel }: ConfirmProps) {
  return (
    <ZrModal model={true} onChange={(open: boolean) => { if (!open) onCancel(); }} {...({ 'no-close': true } as object)}>
      <p>¿Estás seguro de finalizar esta cotización?</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--zs-75)', marginTop: 'var(--zs-100)' }}>
        <ZrButton config="secondary" onClick={onCancel}>CANCELAR</ZrButton>
        <ZrButton config="primary:l" onClick={onConfirm}>ACEPTAR</ZrButton>
      </div>
    </ZrModal>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function RespuestaCotizacion() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const data = (task?.data ?? {}) as unknown as RespuestaCotizacionData;
  const block = task ? getBlock(data) : null;

  async function handleConfirm() {
    setConfirmOpen(false);
    try {
      await completeTask({});
      setSent(true);
    } catch (err) {
      console.error('[RespuestaCotizacion] Error al completar tarea:', err);
      alert('Error al finalizar la cotización. Revise la consola.');
    }
  }

  if (loading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading">
          <div className="spinner" />
          <span>Cargando resultado…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-wrapper">
        <div className="screen-error">⚠ Error al cargar el resultado: {error}</div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title={data.frm_titulo || 'RESULTADO DE LA COTIZACIÓN'} />
        <div className="screen-content">
          <ResultCard variant="success" title="Tarea finalizada">
            <p>
              La cotización fue finalizada correctamente.<br />
              El proceso continuará al siguiente nodo automáticamente.
            </p>
          </ResultCard>
        </div>
      </div>
    );
  }

  const titulo = data.frm_titulo || 'RESULTADO DE LA COTIZACIÓN';
  const numCot = data.frm_gen_num_cotizacion;
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
        title={titulo}
        subtitle={[
          numCot ? `Cotización # ${numCot}` : null,
          numCaso ? `Caso # ${numCaso}` : null,
        ]}
      />

      {/* Content */}
      <div className="result-content">
        {block ? (
          <ResultCard
            variant={block.variant === 'on-hold' ? 'warning' : block.variant === 'error' ? 'error' : 'info'}
            title={block.title}
          >
            <p>{block.message}</p>
          </ResultCard>
        ) : (
          <ResultCard variant="info" title="Resultado de cotización">
            <p>La cotización ha sido procesada.</p>
          </ResultCard>
        )}

        <div className="result-actions">
          <ZrButton
            config="primary:l"
            disabled={submitting}
            loading={submitting}
            onClick={() => setConfirmOpen(true)}
          >
            FINALIZAR
          </ZrButton>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
