import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea,
  ZrButton, ZrAlert, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import {
  DEFAULTS,
  type RevisionErrorTecnicoProrrogaFormData, type AccionErrorTecnicoProrroga,
} from './variables';

export default function RevisionErrorTecnicoProrroga() {
  const { task, loading, error, submitting, completeTask } = useTask();

  const form = useForm<RevisionErrorTecnicoProrrogaFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<RevisionErrorTecnicoProrrogaFormData>) });
  }, [task, reset]);

  const err = (name: keyof RevisionErrorTecnicoProrrogaFormData): string | undefined => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
  };

  // RUL-011-01 (🔴 BLOQUEA): causa raíz y corrección obligatorias para autorizar.
  const puedeAutorizar = !!w.qd_causaRaizProrroga?.trim() && !!w.qd_correccionProrroga?.trim();

  const enviarCon = (accion: AccionErrorTecnicoProrroga) => (data: RevisionErrorTecnicoProrrogaFormData) =>
    completeTask({ ...data, qd_accion: accion } as unknown as Record<string, unknown>)
      .catch((e) => console.error('[RevisionErrorTecnicoProrroga] Error al enviar:', e));

  // ACT-011-01 Autorizar Reenvío (valida RUL-011-01).
  const onAutorizar = handleSubmit(enviarCon('AUTORIZAR_REENVIO'));
  // ACT-011-02 Escalar a Proveedor (siempre disponible).
  const onEscalar = () => enviarCon('ESCALAR_PROVEEDOR')(w);

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
        title="Revisión Error Técnico Prórroga"
        subtitle={["SP4-T05 · PAN-11", "Gestión de Quejas Directas", "Rol: Analista Técnico"]}
      />

      <div className="screen-content">
        <form onSubmit={onAutorizar} noValidate>

          {/* ── S1 · Detalle del Error Técnico — Prórroga (SEC-037, solo lectura) ── */}
          <FormSection title="Detalle del Error Técnico — Prórroga" color="var(--z-red)">
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              El envío de la <strong>solicitud de prórroga</strong> a SmartSupervision falló por un
              error técnico. Revise el detalle, registre la corrección y autorice el reenvío.
              {w.qd_intentoProrroga && <> — Intento de prórroga <strong>#{w.qd_intentoProrroga}</strong>.</>}
            </ZrAlert>

            <div className="form-row cols-3">
              <ZdsInput name="qd_codigoHTTPProrroga" control={control} label="Código HTTP prórroga" readOnly />
              <ZdsInput name="qd_tipoErrorProrroga" control={control} label="Tipo de Error" readOnly />
              <ZdsInput name="qd_intentoProrroga" control={control} label="Número de intento prórroga" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea name="qd_mensajeTecnicoProrroga" control={control} label="Mensaje técnico de la API" readOnly
                helpText="Stack trace o mensaje técnico completo devuelto por la API — solo lectura." />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea name="qd_payloadProrroga" control={control} label="Payload de prórroga enviado" readOnly
                helpText="JSON del payload de prórroga del intento fallido — solo lectura." />
            </div>
          </FormSection>

          {/* ── S2 · Registro de Corrección — Prórroga (SEC-038, editable) ── */}
          <FormSection title="Registro de Corrección — Prórroga">
            <div className="form-row cols-1">
              <ZdsTextarea
                name="qd_causaRaizProrroga" control={control} label="Causa Raíz"
                required maxLength={2000}
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                error={err('qd_causaRaizProrroga')}
              />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea
                name="qd_correccionProrroga" control={control} label="Corrección Aplicada"
                required maxLength={2000}
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                error={err('qd_correccionProrroga')}
              />
            </div>

            {/* RUL-011-01 / MSG-011-01 — causa y corrección obligatorias. */}
            {!puedeAutorizar && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                Debe registrar la <strong>causa raíz</strong> y la <strong>corrección aplicada</strong>{' '}
                antes de autorizar el reenvío de la prórroga. {/* MSG-011-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── Acciones (ACT-011-01/02) ── */}
          <ActionBar>
            <ZrButton config="secondary" disabled={submitting} loading={submitting} onClick={onEscalar}>
              Escalar a Proveedor
            </ZrButton>
            <ZrButton config="positive" disabled={!puedeAutorizar || submitting} loading={submitting}
              onClick={() => { onAutorizar(); }}>
              Autorizar Reenvío Prórroga ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
