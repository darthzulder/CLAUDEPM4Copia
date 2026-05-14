import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTask } from '../../core/useTask';
import { ZrButton } from '@zurich/web-components/react/button';
import { RESPUESTA_VALUES, type RespuestaCotizacionData } from './variables';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
import './styles.css';

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
  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal-dialog">
        <div className="modal-header">Confirmar finalización</div>
        <div className="modal-body">¿Estás seguro de finalizar esta cotización?</div>
        <div className="modal-footer">
          <ZrButton config="secondary" onClick={onCancel}>CANCELAR</ZrButton>
          <ZrButton config="primary:l" onClick={onConfirm}>ACEPTAR</ZrButton>
        </div>
      </div>
    </div>,
    document.body
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
        <div className="screen-header">
          <div className="title-block"><h1>{data.frm_titulo || 'RESULTADO DE LA COTIZACIÓN'}</h1></div>
          <img src={zurichLogo} alt="Zurich" className="header-logo" />
        </div>
        <div className="screen-sent-wrapper">
          <div className="screen-sent">
            <div className="screen-sent-icon">✓</div>
            <div className="screen-sent-title">Tarea finalizada</div>
            <div className="screen-sent-sub">
              La cotización fue finalizada correctamente.<br />
              El proceso continuará al siguiente nodo automáticamente.
            </div>
          </div>
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
      <div className="screen-header">
        <div className="title-block">
          <h1>{titulo}</h1>
          <div className="subtitle">
            {numCot && <span>Cotización # {numCot}</span>}
            {numCaso && <span>Caso # {numCaso}</span>}
          </div>
        </div>
        <img src={zurichLogo} alt="Zurich" className="header-logo" />
      </div>

      {/* Content */}
      <div className="result-content">
        {block ? (
          <div className="result-card">
            <div className={`result-card-header ${block.variant === 'on-hold' ? 'on-hold' : block.variant === 'error' ? 'error' : ''}`}>
              <div className="result-icon">{block.icon}</div>
              <h2>{block.title}</h2>
            </div>
            <div className="result-card-body">
              <p>{block.message}</p>
            </div>
          </div>
        ) : (
          <div className="result-card">
            <div className="result-card-header">
              <div className="result-icon">ℹ️</div>
              <h2>Resultado de cotización</h2>
            </div>
            <div className="result-card-body">
              <p>La cotización ha sido procesada.</p>
            </div>
          </div>
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
