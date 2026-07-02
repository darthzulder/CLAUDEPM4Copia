import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import { useCollection } from '../../../../core/useCollection';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea, ZdsSelect, ZdsDate,
  ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import {
  DEFAULTS, COLLECTION_DEFS,
  type ErrorFuncionalProrrogaFormData, type AccionErrorFuncionalProrroga,
} from './variables';

// Fecha de hoy (ISO YYYY-MM-DD) para el mínimo del calendario y la validación RUL-012-01.
const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function ErrorFuncionalProrroga() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const hoy = hoyISO();

  const form = useForm<ErrorFuncionalProrrogaFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  const { options: motivoProrrogaOpts } = useCollection(COLLECTION_DEFS.motivoProrroga);

  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<ErrorFuncionalProrrogaFormData>) });
  }, [task, reset]);

  const err = (name: keyof ErrorFuncionalProrrogaFormData): string | undefined => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
  };

  // RUL-012-01 — nueva fecha límite debe ser posterior a hoy.
  const fechaValida = !!w.qd_nuevaFechaLimite && w.qd_nuevaFechaLimite > hoy;

  const puedeReenviar =
    !!w.qd_motivoProrroga && fechaValida
    && !!w.qd_contadorProrroga?.trim() && !!w.qd_justificacionProrroga?.trim();

  const enviarCon = (accion: AccionErrorFuncionalProrroga) => (data: ErrorFuncionalProrrogaFormData) =>
    completeTask({ ...data, qd_accion: accion } as unknown as Record<string, unknown>)
      .catch((e) => console.error('[ErrorFuncionalProrroga] Error al enviar:', e));

  const onReenviar = handleSubmit(enviarCon('REENVIAR'));       // ACT-012-01
  const onCancelar = () => enviarCon('CANCELAR')(w);            // ACT-012-02

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

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Corrección Error Funcional Prórroga"
        subtitle={["SP4-T06 · PAN-12", "Gestión de Quejas Directas", "Rol: Analista SAC / Área Responsable"]}
      />

      <div className="screen-content">
        <form onSubmit={onReenviar} noValidate>

          {/* ── S1 · Panel de Error — Prórroga (SEC-039, solo lectura) ── */}
          <FormSection title="Panel de Error — Prórroga" color="var(--z-red)">
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              SmartSupervision <strong>rechazó la solicitud de prórroga (HTTP 400 funcional)</strong>.
              Corrija los campos señalados y reenvíe.
              {w.qd_intentoActualProrroga && <> — Intento actual <strong>#{w.qd_intentoActualProrroga}</strong>.</>}
            </ZrAlert>

            <div className="form-row cols-3">
              <ZdsInput name="qd_codigoErrorProrroga" control={control} label="Código de Error SFC Prórroga" readOnly />
              <ZdsInput name="qd_campoAfectadoProrroga" control={control} label="Campo Afectado" readOnly />
              <ZdsInput name="qd_intentoActualProrroga" control={control} label="Intento N.° actual" readOnly />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name="qd_mensajeErrorProrroga" control={control} label="Mensaje de Error SFC" readOnly
                helpText="Mensaje literal devuelto por SmartSupervision — solo lectura." />
            </div>
          </FormSection>

          {/* ── S2 · Campos de Prórroga a Corregir (SEC-040, editable) ── */}
          <FormSection title="Campos de Prórroga a Corregir">
            <div className="form-row cols-2">
              <ZdsSelect name="qd_motivoProrroga" control={control} label="Motivo de Prórroga"
                options={motivoProrrogaOpts} required rules={{ required: 'Campo requerido' }}
                error={err('qd_motivoProrroga')}
                helpText="Motivo aceptado por SmartSupervision (CAT-MOTIVO-PRORR)." />
              <ZdsDate name="qd_nuevaFechaLimite" control={control} label="Nueva Fecha Límite"
                min={hoy} required
                rules={{
                  required: 'Campo requerido',
                  validate: (v: string) => (v && v > hoy) || 'La fecha debe ser posterior a hoy',
                }}
                error={err('qd_nuevaFechaLimite')}
                helpText="Nueva fecha de respuesta solicitada (posterior a hoy)." />
            </div>
            <div className="form-row cols-2">
              <ZdsInput name="qd_contadorProrroga" control={control} label="Contador de Prórroga"
                required
                rules={{ required: 'Campo requerido', pattern: { value: /^\d+$/, message: 'Solo dígitos' } }}
                error={err('qd_contadorProrroga')}
                helpText="N.° de prórroga (1, 2, ...)." />
              <div />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea name="qd_justificacionProrroga" control={control} label="Justificación"
                required maxLength={2000}
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                error={err('qd_justificacionProrroga')}
                helpText="Justificación de la necesidad de prórroga." />
            </div>

            {/* RUL-012-01 / MSG-012-01 — fecha posterior a hoy. */}
            {!!w.qd_nuevaFechaLimite && !fechaValida && (
              <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
                La nueva fecha límite debe ser <strong>posterior a la fecha actual</strong>. {/* MSG-012-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── Acciones (ACT-012-01/02) ── */}
          <ActionBar>
            <ZrButton config="negative" disabled={submitting} loading={submitting} onClick={onCancelar}>
              Cancelar Prórroga
            </ZrButton>
            <ZrButton config="positive" disabled={!puedeReenviar || submitting} loading={submitting}
              onClick={() => { onReenviar(); }}>
              Reenviar Prórroga ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
