import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTask } from '../../../../core/useTask';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSection from '../../../../components/FormSection';
import { ActionBar } from '../../../../components/ActionBar';
import {
  ZdsInput, ZdsTextarea, ZdsRadio,
  ZrButton, ZrAlert, ZrModal, ZrLoader,
} from '../../../../components/fields/ZdsFields';
import { OPTIONS, DEFAULTS, RevisionErrorTecnicoApiFormData, AccionErrorTecnico } from './variables';

export default function RevisionErrorTecnicoApi() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [showLog, setShowLog] = useState(false);

  const form = useForm<RevisionErrorTecnicoApiFormData>({ defaultValues: DEFAULTS });
  const { control, watch, handleSubmit, reset, formState: { errors, isSubmitted } } = form;
  const w = watch();

  useEffect(() => {
    if (task?.data) {
      reset({ ...DEFAULTS, ...(task.data as Partial<RevisionErrorTecnicoApiFormData>) });
    }
  }, [task, reset]);

  const err = (name: keyof RevisionErrorTecnicoApiFormData): string | undefined => {
    const e = errors[name];
    if (!e || (e.type === 'required' && !isSubmitted)) return undefined;
    return String(e.message);
  };

  // RUL-004-01 (🔴 BLOQUEA): causaRaiz o correccionAplicada vacíos ⇒ no se puede autorizar.
  const puedeAutorizar =
    !!w.et_causaRaiz?.trim() && !!w.et_correccionAplicada?.trim();

  // ACT-004-01 / ACT-004-02 — ambos completan la tarea; difieren en la acción registrada.
  const enviar = (accion: AccionErrorTecnico) =>
    completeTask({ ...w, et_accion: accion } as unknown as Record<string, unknown>)
      .catch((e) => console.error('[RevisionErrorTecnicoApi] Error al enviar:', e));

  const onAutorizar = handleSubmit((data) =>
    completeTask({ ...data, et_accion: 'AUTORIZAR_REENVIO' } as unknown as Record<string, unknown>)
      .catch((e) => console.error('[RevisionErrorTecnicoApi] Error al autorizar:', e)),
  );

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

  const ajustaPayload = w.et_requiereAjustePayload === 'SI';

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Revisión Error Técnico API"
        subtitle={["SP1-T06", "Gestión de Quejas Directas", "Rol: Analista Técnico"]}
      />

      <div className="screen-content">
        <form onSubmit={onAutorizar} noValidate>

          {/* ── S1 · Detalle del Error Técnico (solo lectura) ── */}
          <FormSection
            title="Detalle del Error Técnico"
            color="var(--z-red)"
            action={
              <ZrButton config="link" icon="file-text:line" onClick={() => setShowLog(true)}>
                Ver Log Completo
              </ZrButton>
            }
          >
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              La integración con SmartSupervision <strong>falló por un error técnico</strong> tras
              varios intentos. Revise el detalle, registre la corrección y autorice el reenvío.
              {w.et_numeroIntento && <> — Intento acumulado <strong>#{w.et_numeroIntento}</strong>.</>}
            </ZrAlert>

            <div className="form-row cols-3">
              <ZdsInput name="et_codigoHttp" control={control} label="Código HTTP" readOnly />
              <ZdsInput name="et_tipoError" control={control} label="Tipo de Error" readOnly />
              <ZdsInput name="et_numeroIntento" control={control} label="Número de Intento Acumulado" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsInput name="et_endpoint" control={control} label="Endpoint Invocado" readOnly />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name="et_mensajeTecnico"
                control={control}
                label="Mensaje Técnico de la API"
                readOnly
                helpText="Stack trace o mensaje técnico completo devuelto por la API — solo lectura."
              />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name="et_payloadEnviado"
                control={control}
                label="Payload Enviado (JSON)"
                readOnly={!ajustaPayload}
                helpText={
                  ajustaPayload
                    ? 'Ajuste el JSON del payload que se reenviará a SmartSupervision.'
                    : 'JSON del payload del intento fallido — solo lectura.'
                }
              />
            </div>
          </FormSection>

          {/* ── S2 · Registro de Corrección Técnica (editable) ── */}
          <FormSection title="Registro de Corrección Técnica">
            <div className="form-row cols-1">
              <ZdsTextarea
                name="et_causaRaiz"
                control={control}
                label="Causa Raíz Identificada"
                required
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                maxLength={2000}
                error={isSubmitted ? err('et_causaRaiz') : undefined}
              />
            </div>

            <div className="form-row cols-1">
              <ZdsTextarea
                name="et_correccionAplicada"
                control={control}
                label="Corrección Aplicada"
                required
                rules={{ required: 'Campo requerido', maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } }}
                maxLength={2000}
                error={isSubmitted ? err('et_correccionAplicada') : undefined}
              />
            </div>

            <div className="form-row cols-1">
              <ZdsRadio
                label="¿Requiere ajuste en payload?"
                name="et_requiereAjustePayload"
                control={control}
                options={OPTIONS.sino}
                inline
                rules={{ required: 'Campo requerido' }}
                required
                error={err('et_requiereAjustePayload')}
              />
            </div>

            {ajustaPayload && (
              <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
                Edite el <strong>Payload Enviado (JSON)</strong> en la sección superior antes de
                autorizar: el reenvío usará el payload corregido.
              </ZrAlert>
            )}

            {!puedeAutorizar && (
              <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                Debe registrar la <strong>causa raíz</strong> y la <strong>corrección aplicada</strong>{' '}
                antes de autorizar el reenvío. {/* MSG-004-01 / RUL-004-01 */}
              </ZrAlert>
            )}
          </FormSection>

          {/* ── Acciones (ACT-004-01 / ACT-004-02) ── */}
          <ActionBar>
            <ZrButton
              config="secondary"
              loading={submitting}
              disabled={submitting}
              onClick={() => enviar('ESCALAR_PROVEEDOR')}
            >
              Escalar a Proveedor
            </ZrButton>
            <ZrButton
              config="positive"
              loading={submitting}
              disabled={submitting || !puedeAutorizar}
              onClick={() => { onAutorizar(); }}
            >
              Autorizar Reenvío ▶
            </ZrButton>
          </ActionBar>
        </form>
      </div>

      {/* ACT-004-03 · Ver Log Completo */}
      {showLog && (
        <ZrModal model={showLog} onChange={(open: boolean) => setShowLog(open)}>
          <h3 style={{ margin: '0 0 var(--zs-75)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
            Log completo del error técnico
          </h3>
          <ZdsInput name="et_endpoint" control={control} label="Endpoint Invocado" readOnly />
          <ZdsTextarea name="et_mensajeTecnico" control={control} label="Mensaje Técnico de la API" readOnly />
          <ZdsTextarea name="et_payloadEnviado" control={control} label="Payload Enviado (JSON)" readOnly />
          <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-100)' }}>
            <ZrButton config="secondary:s" onClick={() => setShowLog(false)}>Cerrar</ZrButton>
          </div>
        </ZrModal>
      )}
    </div>
  );
}
