import { useState } from 'react';
import { useTask } from '../../../core/useTask';
import { ZrButton, ZrModal, ZrAlert, ZrLoader } from '../../../components/fields/ZdsFields';
import ResultCard from '../../../components/ResultCard';
import ScreenHeader from '../../../components/ScreenHeader';
import { type EstadoCorreoData } from './variables';

type TaskData = EstadoCorreoData & Record<string, unknown>;

export default function EstadoCorreo() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [blnSent, setBlnSent] = useState(false);
  const [blnShowConfirm, setBlnShowConfirm] = useState(false);

  const objData = (task?.data ?? {}) as TaskData;
  // El envío fue exitoso cuando el código de respuesta es 200
  const blnIsSuccess = String(objData.email_respuesta_envio ?? '') === '200';

  async function handleConfirm() {
    setBlnShowConfirm(false);
    try {
      // Copiamos los datos del caso omitiendo los campos internos (_)
      const objRaw = task?.data as Record<string, unknown> ?? {};
      const dicPayload: Record<string, unknown> = {};
      for (const [strKey, objVal] of Object.entries(objRaw)) {
        if (!strKey.startsWith('_')) dicPayload[strKey] = objVal;
      }
      await completeTask(dicPayload);
      setBlnSent(true);
    } catch (excError) {
      console.error('[EstadoCorreo] Error al continuar:', excError);
      alert('Error al avanzar la tarea. Revise la consola.');
    }
  }

  // ── Carga / error ────────────────────────────────────────────────────────
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

  // ── Estado enviado ───────────────────────────────────────────────────────
  if (blnSent) {
    return (
      <div className="screen-wrapper">
        <ScreenHeader
          title="Estado de correo electrónico"
          subtitle={[
            objData.frm_gen_num_cotizacion && `Cotización # ${objData.frm_gen_num_cotizacion}`,
            objData.frm_caso && `Caso # ${objData.frm_caso}`
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
          objData.frm_gen_num_cotizacion && `Cotización # ${objData.frm_gen_num_cotizacion}`,
          objData.frm_caso && `Caso # ${objData.frm_caso}`
        ]}
      />

      <div className="email-status-content">
        {blnIsSuccess ? (
          <ResultCard variant="success" title="Envío de correo completado">
            <p>
              La <strong>notificación por correo electrónico</strong> de{' '}
              <strong>{objData.email_titulo_envio || '—'}</strong> se ha enviado correctamente.
            </p>
            {objData.email_correos_exitosos && (
              <>
                <p><strong>Correos enviados a:</strong></p>
                <div className="email-status-badge">{objData.email_correos_exitosos}</div>
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
              <strong>{objData.email_titulo_envio || '—'}</strong>.
            </p>
            {objData.email_correos_fallidos && (
              <>
                <p><strong>Correos con error:</strong></p>
                <div className="email-status-badge email-status-badge--error">{objData.email_correos_fallidos}</div>
              </>
            )}
            {objData.email_correos_exitosos && (
              <>
                <p><strong>Enviados correctamente:</strong></p>
                <div className="email-status-badge">{objData.email_correos_exitosos}</div>
              </>
            )}
            <p className="email-status-note">
              Puede continuar de todas formas o contactar al soporte técnico.
            </p>
          </ResultCard>
        )}

        <div z-flex z-align="center">
          <ZrButton
            config="primary:l"
            icon="arrow-long-right:line"
            disabled={submitting}
            loading={submitting}
            onClick={() => setBlnShowConfirm(true)}
          >
            CONTINUAR
          </ZrButton>
        </div>
      </div>

      {/* Modal de confirmación */}
      {blnShowConfirm && (
        <ZrModal model={blnShowConfirm} onChange={(open: boolean) => setBlnShowConfirm(open)}>
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
            <ZrButton config="secondary" onClick={() => setBlnShowConfirm(false)}>Cancelar</ZrButton>
            <ZrButton config="primary:l" onClick={handleConfirm}>Sí, continuar</ZrButton>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
