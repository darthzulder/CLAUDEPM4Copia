import { useState } from 'react';
import { useTask } from '../../core/useTask';
import { ZrButton } from '@zurich/web-components/react/button';
import zurichLogo from '../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
import { type EstadoCorreoData } from './variables';
import './styles.css';

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
      <div className="ec-wrapper">
        <div className="screen-loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ec-wrapper">
        <div className="screen-error">⚠ Error al cargar la tarea: {error}</div>
      </div>
    );
  }

  // ── Sent ─────────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="ec-wrapper">
        <Header data={data} />
        <div className="ec-content">
          <div className="ec-card ec-card--success">
            <div className="ec-icon ec-icon--check" />
            <h2 className="ec-title">Proceso avanzado</h2>
            <p className="ec-desc">El proceso continuará automáticamente al siguiente nodo.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ec-wrapper">
      {submitting && (
        <div className="ec-overlay">
          <div className="spinner" />
          <span>Procesando…</span>
        </div>
      )}

      <Header data={data} />

      <div className="ec-content">
        {esExito ? (
          <div className="ec-card ec-card--success">
            <div className="ec-icon ec-icon--check" />
            <h2 className="ec-title">Envío de correo completado</h2>
            <p className="ec-desc">
              La <strong>notificación por correo electrónico</strong> de{' '}
              <strong>{data.email_titulo_envio || '—'}</strong> se ha enviado correctamente.
            </p>
            {data.email_correos_exitosos && (
              <>
                <p className="ec-desc"><strong>Correos enviados a:</strong></p>
                <div className="ec-badge">{data.email_correos_exitosos}</div>
              </>
            )}
            <p className="ec-desc ec-desc--note">
              El proceso se ejecutó sin inconvenientes. Puede avanzar haciendo clic en{' '}
              <strong>«Continuar»</strong>.
            </p>
          </div>
        ) : (
          <div className="ec-card ec-card--error">
            <div className="ec-icon ec-icon--error" />
            <h2 className="ec-title">No fue posible completar el envío</h2>
            <p className="ec-desc">
              Se produjo un <strong>error</strong> al intentar enviar las notificaciones
              por correo electrónico de{' '}
              <strong>{data.email_titulo_envio || '—'}</strong>.
            </p>
            {data.email_correos_fallidos && (
              <>
                <p className="ec-desc"><strong>Correos con error:</strong></p>
                <div className="ec-badge ec-badge--error">{data.email_correos_fallidos}</div>
              </>
            )}
            {data.email_correos_exitosos && (
              <>
                <p className="ec-desc"><strong>Enviados correctamente:</strong></p>
                <div className="ec-badge">{data.email_correos_exitosos}</div>
              </>
            )}
            <p className="ec-desc ec-desc--note">
              Puede continuar de todas formas o contactar al soporte técnico.
            </p>
          </div>
        )}

        <div className="ec-actions">
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
        <div className="ec-modal-backdrop" onClick={() => setShowConfirm(false)}>
          <div className="ec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ec-modal-icon">⚠</div>
            <h3 className="ec-modal-title">¿Estás seguro de continuar?</h3>
            <p className="ec-modal-text">
              Esta acción enviará el formulario para su procesamiento.
            </p>
            <p className="ec-modal-sub">Una vez confirmado, no podrá realizar cambios adicionales.</p>
            <div className="ec-modal-actions">
              <ZrButton config="primary" onClick={handleConfirm}>
                Sí, continuar
              </ZrButton>
              <ZrButton config="secondary" onClick={() => setShowConfirm(false)}>
                Cancelar
              </ZrButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ data }: { data: TaskData }) {
  return (
    <div className="ec-header">
      <div className="ec-header-titles">
        <h1>Estado de correo electrónico</h1>
        <div className="ec-header-sub">
          {data.frm_gen_num_cotizacion && <span>Cotización # {data.frm_gen_num_cotizacion}</span>}
          {data.frm_caso && <span>Caso # {data.frm_caso}</span>}
        </div>
      </div>
      <img src={zurichLogo} alt="Zurich" className="ec-logo" />
    </div>
  );
}
