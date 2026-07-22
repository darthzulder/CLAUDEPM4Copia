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
import { QD, SCR011_DEFAULTS as DEFAULTS } from '../fields/fields';
import type { RevisionErrorTecnicoProrrogaFormData, AccionErrorTecnicoProrroga } from '../fields/fields';

export default function RevisionErrorTecnicoProrroga() {
  // Cargamos la tarea y su estado desde PM4
  const { task, loading, error, submitting, completeTask } = useTask();

  // Inicializamos el formulario con los valores por defecto
  const form = useForm<RevisionErrorTecnicoProrrogaFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const objWatch = watch();

  // Pre-poblamos el formulario con los datos del caso
  useEffect(() => {
    if (task?.data) reset({ ...DEFAULTS, ...(task.data as Partial<RevisionErrorTecnicoProrrogaFormData>) });
  }, [task, reset]);

  const err = (in_strField: keyof RevisionErrorTecnicoProrrogaFormData): string | undefined => {
    // Ocultamos el error de requerido hasta que se intente enviar
    const objFieldError = errors[in_strField];
    if (!objFieldError || (objFieldError.type === 'required' && !isSubmitted)) return undefined;
    return String(objFieldError.message);
  };

  // RUL-011-01 (🔴 BLOQUEA): causa raíz y corrección obligatorias para autorizar.
  const blnCanAuthorize = !!objWatch[QD.strExtRootCause]?.trim() && !!objWatch[QD.strExtCorrection]?.trim();

  // Enviamos la tarea con la accion seleccionada
  const enviarCon = (in_strAction: AccionErrorTecnicoProrroga) => (in_objData: RevisionErrorTecnicoProrrogaFormData) =>
    completeTask({ ...in_objData, [QD.strAction]: in_strAction } as unknown as Record<string, unknown>)
      .catch((excError) => console.error('[RevisionErrorTecnicoProrroga] Error al enviar:', excError));

  // ACT-011-01 Autorizar Reenvío (valida RUL-011-01).
  const onAutorizar = handleSubmit(enviarCon('AUTORIZAR_REENVIO'));
  // ACT-011-02 Escalar a Proveedor (siempre disponible).
  const onEscalar = () => enviarCon('ESCALAR_PROVEEDOR')(objWatch);

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
              {objWatch[QD.strExtAttempt] && <> — Intento de prórroga <strong>#{objWatch[QD.strExtAttempt]}</strong>.</>}
            </ZrAlert>

            <div className="form-row cols-3">
              <ZdsInput name={QD.strExtHttpCode} control={control} label="Código HTTP prórroga" readOnly />
              <ZdsInput name={QD.strExtErrorType} control={control} label="Tipo de Error" readOnly />
              <ZdsInput name={QD.strExtAttempt} control={control} label="Número de intento prórroga" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea name={QD.strExtTechMessage} control={control} label="Mensaje técnico de la API" readOnly
                helpText="Stack trace o mensaje técnico completo devuelto por la API — solo lectura." />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea name={QD.strExtPayload} control={control} label="Payload de prórroga enviado" readOnly
                helpText="JSON del payload de prórroga del intento fallido — solo lectura." />
            </div>
          </FormSection>

          {/* ── S2 · Registro de Corrección — Prórroga (SEC-038, editable) ── */}
          <FormSection title="Registro de Corrección — Prórroga">
            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strExtRootCause} control={control} label="Causa Raíz"
                required maxLength={2000}
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                error={err(QD.strExtRootCause)}
              />
            </div>
            <div className="form-row cols-1">
              <ZdsTextarea
                name={QD.strExtCorrection} control={control} label="Corrección Aplicada"
                required maxLength={2000}
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                error={err(QD.strExtCorrection)}
              />
            </div>

            {/* RUL-011-01 / MSG-011-01 — causa y corrección obligatorias. */}
            {!blnCanAuthorize && (
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
            <ZrButton config="positive" disabled={!blnCanAuthorize || submitting} loading={submitting}
              onClick={() => { onAutorizar(); }}>
              Autorizar Reenvío Prórroga ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>
    </div>
  );
}
