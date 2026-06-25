import { useState } from 'react';
import { useTask } from '../../core/useTask';
import { ZrButton, ZrModal, ZrAlert, ZrLoader } from '../../components/fields/ZdsFields';
import ResultCard from '../../components/ResultCard';
import ScreenHeader from '../../components/ScreenHeader';
import { type EstadoCorreoData } from './variables';

type TaskData = EstadoCorreoData & Record<string, unknown>;

export default function EstadoCorreo() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [sent, setSent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const data = (task?.data ?? {}) as TaskData;
  const esExito = String(data.email_respuesta_envio ?? '') === '200';

  async function handleConfirm() {
    setShowConfirm(false);
    try {
      const raw = task?.data as Record<string, unknown> ?? {};
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (!k.startsWith('_')) payload[k] = v;
      }
      await completeTask(payload);
      setSent(true);
    } catch (e) {
      console.error('[EstadoCorreo] Error al continuar:', e);
      alert('Error al avanzar la tarea. Revise la consola.');
    }
  }

  // ── Loading / Error ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading"><ZrLoader /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-wrapper">
        <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error al cargar la tarea: {error}</ZrAlert>
      </div>
    );
  }

  // ── Sent ─────────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader
          title="Estado de correo electrónico"
          subtitle={[
            data.frm_gen_num_cotizacion && `Cotización # ${data.frm_gen_num_cotizacion}`,
            data.frm_caso && `Caso # ${data.frm_caso}`
          ]}
        />
        <div className="email-status-content">
          <ResultCard variant="success" title="Proceso avanzado">
            <p>El proceso continuará automáticamente al siguiente nodo.</p>
          </ResultCard>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-wrapper">
      {submitting && (
        <div className="email-status-overlay">
          <ZrLoader />
          <span>Procesando…</span>
        </div>
      )}

      <ScreenHeader
        title="Estado de correo electrónico"
        subtitle={[
          data.frm_gen_num_cotizacion && `Cotización # ${data.frm_gen_num_cotizacion}`,
          data.frm_caso && `Caso # ${data.frm_caso}`
        ]}
      />

      <div className="email-status-content">
        {esExito ? (
          <ResultCard variant="success" title="Envío de correo completado">
            <p>
              La <strong>notificación por correo electrónico</strong> de{' '}
              <strong>{data.email_titulo_envio || '—'}</strong> se ha enviado correctamente.
            </p>
            {data.email_correos_exitosos && (
              <>
                <p><strong>Correos enviados a:</strong></p>
                <div className="email-status-badge">{data.email_correos_exitosos}</div>
              </>
            )}
            <p className="email-status-note">
              El proceso se ejecutó sin inconvenientes. Puede avanzar haciendo clic en{' '}
              <strong>«Continuar»</strong>.
            </p>
          </ResultCard>
        ) : (
          <ResultCard variant="error" title="No fue posible completar el envío">
            <p>
              Se produjo un <strong>error</strong> al intentar enviar las notificaciones
              por correo electrónico de{' '}
              <strong>{data.email_titulo_envio || '—'}</strong>.
            </p>
            {data.email_correos_fallidos && (
              <>
                <p><strong>Correos con error:</strong></p>
                <div className="email-status-badge email-status-badge--error">{data.email_correos_fallidos}</div>
              </>
            )}
            {data.email_correos_exitosos && (
              <>
                <p><strong>Enviados correctamente:</strong></p>
                <div className="email-status-badge">{data.email_correos_exitosos}</div>
              </>
            )}
            <p className="email-status-note">
              Puede continuar de todas formas o contactar al soporte técnico.
            </p>
          </ResultCard>
        )}

        <div className="email-status-actions">
          <ZrButton
            config="primary:l"
            icon="arrow-long-right:line"
            disabled={submitting}
            loading={submitting}
            onClick={() => setShowConfirm(true)}
          >
            CONTINUAR
          </ZrButton>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirm && (
        <ZrModal model={showConfirm} onChange={(open: boolean) => setShowConfirm(open)}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            ¿Estás seguro de continuar?
          </h3>
          <p style={{ margin: '0 0 var(--zs-50)', font: 'var(--zf-body-16--400)', color: 'var(--z-text)' }}>
            Esta acción enviará el formulario para su procesamiento.
          </p>
          <p style={{ margin: '0 0 var(--zs-200)', font: 'var(--zf-capt-14)', color: 'var(--z-muted)' }}>
            Una vez confirmado, no podrá realizar cambios adicionales.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--zs-75)' }}>
            <ZrButton config="secondary" onClick={() => setShowConfirm(false)}>Cancelar</ZrButton>
            <ZrButton config="primary:l" onClick={handleConfirm}>Sí, continuar</ZrButton>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
