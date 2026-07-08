import { useState } from 'react';
import { useTask } from '../../../core/useTask';
import { ZrButton, ZrModal, ZrAlert, ZrLoader } from '../../../components/fields/ZdsFields';
import ResultCard from '../../../components/ResultCard';
import ScreenHeader from '../../../components/ScreenHeader';
import { RESPUESTA_VALUES, type RespuestaCotizacionData } from './variables';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function getBlock(in_objData: RespuestaCotizacionData): {
  variant: 'info' | 'on-hold' | 'error';
  icon: string;
  title: string;
  message: string;
} | null {
  const strResponse = in_objData.frm_respuesta_cotizacion;
  const strLrFlag    = in_objData.frm_control_desde_optalitix_loss_ratio_calculado_flag;
  const strKnowsRC  = in_objData.frm_conoceValorSumaRC;
  const dblLrValue   = Number(in_objData.frm_valorRC_lossRatio_calculado ?? 0);

  // La oportunidad se deriva a Case Underwriting
  if (
    strResponse === RESPUESTA_VALUES.REQUIERE_CASEUW &&
    String(strLrFlag).toUpperCase() === 'NO'
  ) {
    return {
      variant: 'info',
      icon: '📋',
      title: 'Cotización finalizada',
      message:
        'Esta oportunidad no puede cotizarse con Fast Flow y se creará un Case Underwriting.',
    };
  }

  // La cotización queda en espera por revisión de Compliance
  if (strResponse === RESPUESTA_VALUES.INTERMEDIARIO) {
    return {
      variant: 'on-hold',
      icon: '⏸',
      title: 'Cotización en estado On hold',
      message: 'La cotización requiere revisión del área de Compliance.',
    };
  }

  // El intermediario no está autorizado para gestionar la cotización
  if (strResponse === RESPUESTA_VALUES.ON_HOLD) {
    return {
      variant: 'info',
      icon: '🔒',
      title: 'Cotización finalizada',
      message:
        'El intermediario no tiene autorización para gestionar esta cotización, favor comunicarse con el responsable de la cuenta.',
    };
  }

  // Se superó el límite de loss ratio permitido
  if (String(strKnowsRC).toUpperCase() === 'NO' && dblLrValue > 20) {
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
// Modal de confirmación
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
// Pantalla
// ---------------------------------------------------------------------------
export default function RespuestaCotizacion() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [blnConfirmOpen, setBlnConfirmOpen] = useState(false);
  const [blnSent, setBlnSent] = useState(false);

  const objData = (task?.data ?? {}) as unknown as RespuestaCotizacionData;
  // Determinamos el bloque de resultado a mostrar
  const objBlock = task ? getBlock(objData) : null;

  async function handleConfirm() {
    setBlnConfirmOpen(false);
    try {
      await completeTask({});
      setBlnSent(true);
    } catch (excError) {
      console.error('[RespuestaCotizacion] Error al completar tarea:', excError);
      alert('Error al finalizar la cotización. Revise la consola.');
    }
  }

  if (loading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading">
          <ZrLoader />
          <span>Cargando resultado…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-wrapper">
        <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error al cargar el resultado: {error}</ZrAlert>
      </div>
    );
  }

  if (blnSent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader title={objData.frm_titulo || 'RESULTADO DE LA COTIZACIÓN'} />
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

  // Datos de cabecera para el encabezado
  const strTitle = objData.frm_titulo || 'RESULTADO DE LA COTIZACIÓN';
  const strQuoteNum = objData.frm_gen_num_cotizacion;
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
        title={strTitle}
        subtitle={[
          strQuoteNum ? `Cotización # ${strQuoteNum}` : null,
          strCaseNum ? `Caso # ${strCaseNum}` : null,
        ]}
      />

      {/* Contenido */}
      <div className="result-content">
        {objBlock ? (
          <ResultCard
            variant={objBlock.variant === 'on-hold' ? 'warning' : objBlock.variant === 'error' ? 'error' : 'info'}
            title={objBlock.title}
          >
            <p>{objBlock.message}</p>
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
            onClick={() => setBlnConfirmOpen(true)}
          >
            FINALIZAR
          </ZrButton>
        </div>
      </div>

      {blnConfirmOpen && (
        <ConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => setBlnConfirmOpen(false)}
        />
      )}
    </div>
  );
}
