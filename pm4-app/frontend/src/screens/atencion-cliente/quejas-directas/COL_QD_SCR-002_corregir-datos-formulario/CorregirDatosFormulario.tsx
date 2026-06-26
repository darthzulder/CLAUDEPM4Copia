import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActionBar } from '../../../../components/ActionBar';
import FormSection from '../../../../components/FormSection';
import InfoBar from '../../../../components/InfoBar';
import ScreenHeader from '../../../../components/ScreenHeader';
import { ZdsInput, ZrAlert, ZrButton, ZrLoader } from '../../../../components/fields/ZdsFields';
import { useTask } from '../../../../core/useTask';
import { ERRORES_EJEMPLO, type CampoConError, type CorregirDatosFormData } from './variables';
import SeccionErroresValidacion from './SeccionErroresValidacion';

function parsearErrores(erroresJson: unknown): CampoConError[] {
  if (typeof erroresJson === 'string' && erroresJson) {
    try { return JSON.parse(erroresJson) as CampoConError[]; } catch { /**/ }
  }
  return [];
}

export default function CorregirDatosFormulario() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [triggered, setTriggered] = useState(false);

  const form = useForm<CorregirDatosFormData>({ mode: 'onChange' });
  const { control, handleSubmit, reset, trigger, watch, formState: { errors } } = form;
  const w = watch();

  // Error list: proveniente de qd_errores_json (BPM) o del fallback de desarrollo
  const camposConError = useMemo<CampoConError[]>(() => {
    const parsed = parsearErrores(w.qd_errores_json);
    return parsed.length > 0 ? parsed : ERRORES_EJEMPLO;
  }, [w.qd_errores_json]);

  // Nombres de campos que deben quedar sin error antes de habilitar el envío
  const allErrorFieldNames = useMemo((): Array<keyof CorregirDatosFormData> => {
    const names = new Set(camposConError.map(c => c.campo as keyof CorregirDatosFormData));
    if (names.has('qd_municipio')) names.add('qd_departamento');
    return Array.from(names);
  }, [camposConError]);

  // Antes del trigger asumimos todos pendientes; luego leemos formState.errors
  const pendingErrors = triggered
    ? allErrorFieldNames.filter(name => !!errors[name]).length
    : camposConError.length;

  const canSubmit = triggered && pendingErrors === 0 && !submitting;

  useEffect(() => {
    const data = task?.data as (Partial<CorregirDatosFormData> & Record<string, unknown>) | undefined;
    if (data) reset(data);

    // Obtener nombres de error directamente de task.data para no depender de watch()
    const errJson = data?.qd_errores_json;
    const parsedFields = parsearErrores(errJson);
    const fieldsToTrigger: Array<keyof CorregirDatosFormData> =
      parsedFields.length > 0
        ? parsedFields.map(e => e.campo as keyof CorregirDatosFormData)
        : ERRORES_EJEMPLO.map(e => e.campo as keyof CorregirDatosFormData);
    if (parsedFields.some(e => e.campo === 'qd_municipio') ||
        ERRORES_EJEMPLO.some(e => e.campo === 'qd_municipio')) {
      fieldsToTrigger.push('qd_departamento');
    }

    const t = setTimeout(async () => {
      await trigger(fieldsToTrigger);
      setTriggered(true);
    }, 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  const onSubmit = async (data: CorregirDatosFormData) => {
    try {
      await completeTask(data as unknown as Record<string, unknown>);
    } catch (e) {
      console.error('[CorregirDatosFormulario] Error al enviar:', e);
    }
  };

  if (loading) return <div className="screen-wrapper"><div className="screen-loading"><ZrLoader /></div></div>;
  if (error) return <div className="screen-wrapper"><ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error al cargar el formulario: {error}</ZrAlert></div>;

  const submitLabel = canSubmit
    ? 'Guardar Correcciones'
    : `Guardar Correcciones (${pendingErrors} error${pendingErrors !== 1 ? 'es' : ''} pendiente${pendingErrors !== 1 ? 's' : ''})`;

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Corrección de Datos"
        subtitle={['SCR-002 · PAN-02 · P01-T07', 'Gestión de Quejas Directas', 'Rol: Gestor de Experiencia']}
      />

      <div className="screen-content">
        <InfoBar items={[
          { label: 'Caso',              value: w.qd_numeroCaso || '—' },
          { label: 'SLA Restante',      value: w.qd_slaRestante || '—' },
          { label: 'Estado',            value: 'En corrección preventiva' },
          { label: 'Errores pendientes', value: `${pendingErrors} de ${camposConError.length}` },
        ]} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Alerta principal */}
          {!canSubmit ? (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              <strong>{pendingErrors} error{pendingErrors !== 1 ? 'es' : ''} de validación {pendingErrors !== 1 ? 'detectados' : 'detectado'}.</strong>{' '}
              Corrija cada campo resaltado. El botón "Guardar Correcciones" se habilitará únicamente cuando el contador de errores llegue a 0 (RUL-002-01).
            </ZrAlert>
          ) : (
            <ZrAlert config="positive" {...({ 'hide-close': true } as object)}>
              Todos los errores han sido corregidos. Presione "Guardar Correcciones" para que el sistema re-ejecute la validación preventiva.
            </ZrAlert>
          )}

          {/* Datos del Caso — solo lectura */}
          <FormSection title="Datos del Caso">
            <div className="form-row cols-3">
              <ZdsInput name="qd_numeroCaso"     control={control} label="Número de Caso"      readOnly />
              <ZdsInput name="qd_canalRecepcion" control={control} label="Canal de Recepción"  readOnly />
              <ZdsInput name="qd_slaRestante"    control={control} label="SLA Restante"         readOnly />
            </div>
          </FormSection>

          {/* Campos con Error */}
          <SeccionErroresValidacion camposConError={camposConError} form={form} triggered={triggered} />

          {/* Aviso sobre re-ejecución automática */}
          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
            Al guardar, el sistema re-ejecutará automáticamente <strong>P01-T06</strong> (Validación Preventiva). Si persisten errores, volverá a esta pantalla. El envío a SmartSupervision solo se activa cuando el contador = 0.
          </ZrAlert>

          <ActionBar>
            <ZrButton config="secondary:s" onClick={() => window.history.back()}>
              Cancelar Corrección
            </ZrButton>
            <ZrButton
              config="positive:s"
              disabled={!canSubmit}
              loading={submitting}
              onClick={() => { handleSubmit(onSubmit)(); }}
            >
              {submitLabel}
            </ZrButton>
          </ActionBar>

        </form>
      </div>
    </div>
  );
}
