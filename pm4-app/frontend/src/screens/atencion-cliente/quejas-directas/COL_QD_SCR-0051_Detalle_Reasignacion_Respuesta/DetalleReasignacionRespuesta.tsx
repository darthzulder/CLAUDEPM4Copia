import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import ScreenHeader from '../../../../components/ScreenHeader';
import { ActionBar } from '../../../../components/ActionBar';
import { ZrButton, ZrAlert, ZrModal, ZrLoader } from '../../../../components/fields/ZdsFields';
import pm4 from '../../../../api/pm4Client';
import {
  DEFAULTS, SLA_UMBRAL_PRORROGA,
  type DetalleReasignacionRespuestaFormData, type AccionFlujoCombinado,
} from './variables';
import SeccionDetalleCaso from './SeccionDetalleCaso';
import SeccionAsignacion from './SeccionAsignacion';
import SeccionRespuesta from './SeccionRespuesta';

export default function DetalleReasignacionRespuesta() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const fileRegistry = useRef(new Map<string, File>());
  const [showExpediente, setShowExpediente] = useState(false);
  const [showVistaPrevia, setShowVistaPrevia] = useState(false);

  const form = useForm<DetalleReasignacionRespuestaFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<DetalleReasignacionRespuestaFormData>) });
  }, [task, reset]);

  const err = (name: keyof DetalleReasignacionRespuestaFormData): string | undefined => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
  };

  // RUL-0051-03 — SLA crítico: habilita prórroga y banner rojo si slaRestante <= 2.
  const sla = Number.parseInt(w.qd_slaRestante ?? '', 10);
  const slaCritico = Number.isFinite(sla) && sla <= SLA_UMBRAL_PRORROGA;

  const uploadFiles = async (requestId: number) => {
    for (const [docKey, file] of fileRegistry.current.entries()) {
      const fd = new FormData();
      fd.append('file', file);
      await pm4.post(`/requests/${requestId}/files?data_name=${docKey}`, fd);
    }
  };

  const enviarCon = (accion: AccionFlujoCombinado) => async (data: DetalleReasignacionRespuestaFormData) => {
    try {
      const requestId = task?.process_request_id;
      if (requestId && fileRegistry.current.size > 0) await uploadFiles(requestId);
      await completeTask({ ...data, qd_accion: accion } as unknown as Record<string, unknown>);
    } catch (e) {
      console.error('[DetalleReasignacionRespuesta] Error al enviar:', e);
    }
  };

  // ACT-0051-08 Enviar (valida RUL-0051-05: respuestaCliente no vacío).
  const onEnviar = handleSubmit(enviarCon('ENVIAR'));
  // ACT-0051-01 Confirmar Asignación.
  const onConfirmarAsignacion = handleSubmit(enviarCon('CONFIRMAR_ASIGNACION'));

  // ACT-0051-07 Guardar Borrador · ACT-0051-04 Solicitar Prórroga (sin validación bloqueante).
  const onGuardarBorrador = () => enviarCon('GUARDAR_BORRADOR')(w);
  const onSolicitarProrroga = () => enviarCon('SOLICITAR_PRORROGA')(w);

  if (loading) {
    return <div className="screen-wrapper"><div className="screen-loading"><ZrLoader /></div></div>;
  }
  if (error) {
    return (
      <div className="screen-wrapper">
        <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
          Error al cargar el formulario: {error}
        </ZrAlert>
      </div>
    );
  }

  const puedeEnviar = !!w.qd_respuestaCliente?.trim() && !!w.qd_respuestaFavorDe;

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Detalle / Reasignación / Respuesta"
        subtitle={["SP2 · PAN-05.1", "Gestión de Quejas Directas", "Rol: Analista SAC / Área Responsable"]}
      />

      <div className="screen-content">
        {/* RUL-0051-03 / MSG-0051-01 — banner SLA crítico. */}
        {slaCritico && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            ⚠ El caso tiene <strong>{w.qd_slaRestante}</strong> día(s) hábil(es) restante(s). Priorice
            la gestión; puede <strong>solicitar prórroga regulatoria</strong>. {/* MSG-0051-01 */}
          </ZrAlert>
        )}

        <form onSubmit={onEnviar} noValidate>
          <SeccionDetalleCaso control={control} estado={w.qd_estadoSS || ''} />
          <SeccionAsignacion form={form} err={err} />
          <SeccionRespuesta form={form} fileRegistry={fileRegistry} err={err} />

          {/* RUL-0051-05 / MSG-0051-02 — bloqueo de envío si falta la respuesta. */}
          {!puedeEnviar && (
            <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
              El campo <strong>Respuesta al Cliente</strong> es obligatorio para enviar. {/* MSG-0051-02 */}
            </ZrAlert>
          )}

          {/* Acciones (ACT-0051-01..08) */}
          <ActionBar>
            <ZrButton config="link" icon="file-text:line" onClick={() => setShowExpediente(true)}>
              Ver Expediente Completo
            </ZrButton>
            <ZrButton config="secondary" onClick={() => setShowVistaPrevia(true)}>
              Vista Previa Respuesta Final
            </ZrButton>
            <ZrButton config="secondary"
              disabled={!slaCritico || submitting} loading={submitting}
              onClick={onSolicitarProrroga}>
              Solicitar Prórroga Regulatoria
            </ZrButton>
            <ZrButton config="secondary" disabled={submitting} loading={submitting}
              onClick={onGuardarBorrador}>
              Guardar Borrador
            </ZrButton>
            {!w.qd_tieneResponsable && (
              <ZrButton config="positive" disabled={!w.qd_usuarioResponsable || submitting} loading={submitting}
                onClick={() => { onConfirmarAsignacion(); }}>
                Confirmar Asignación
              </ZrButton>
            )}
            <ZrButton config="positive" disabled={!puedeEnviar || submitting} loading={submitting}
              onClick={() => { onEnviar(); }}>
              Enviar ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>

      {/* ACT-0051-06 · Ver Expediente Completo */}
      {showExpediente && (
        <ZrModal model={showExpediente} onChange={(open: boolean) => setShowExpediente(open)}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            Expediente del caso
          </h3>
          <p className="subsection-note">
            {w.qd_nombreConsumidor} · {w.qd_identificacion} · {w.qd_productoSFC} · {w.qd_motivoSFC}
          </p>
          <p style={{ font: 'var(--zf-cap-14)' }}>{w.qd_textoQueja || 'Sin descripción.'}</p>
          <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
            <ZrButton config="secondary:s" onClick={() => setShowExpediente(false)}>Cerrar</ZrButton>
          </div>
        </ZrModal>
      )}

      {/* ACT-0051-05 · Vista Previa Respuesta Final */}
      {showVistaPrevia && (
        <ZrModal model={showVistaPrevia} onChange={(open: boolean) => setShowVistaPrevia(open)}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            Vista previa — carta de respuesta final
          </h3>
          <p className="subsection-note">Destinatario: {w.qd_nombreConsumidor} ({w.qd_correoElectronico})</p>
          <p style={{ font: 'var(--zf-cap-14)', whiteSpace: 'pre-wrap' }}>
            {w.qd_respuestaCliente || 'Aún no se ha redactado la respuesta al cliente.'}
          </p>
          <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
            <ZrButton config="secondary:s" onClick={() => setShowVistaPrevia(false)}>Cerrar</ZrButton>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
