import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActionBar } from '../../../../components/ActionBar';
import FormSection from '../../../../components/FormSection';
import InfoBar from '../../../../components/InfoBar';
import ScreenHeader from '../../../../components/ScreenHeader';
import { ZdsInput, ZrAlert, ZrButton, ZrLoader } from '../../../../components/fields/ZdsFields';
import { useTask } from '../../../../core/useTask';
import { QD, SCR002_ERRORES_EJEMPLO as ERRORES_EJEMPLO } from '../fields/fields';
import type { CorregirDatosFormData } from '../fields/fields';
import type { CampoConError } from '../fields/types';
import SeccionErroresValidacion from './SeccionErroresValidacion';

function parsearErrores(in_objErrorsJson: unknown): CampoConError[] {
  if (typeof in_objErrorsJson === 'string' && in_objErrorsJson) {
    try { return JSON.parse(in_objErrorsJson) as CampoConError[]; } catch { /**/ }
  }
  return [];
}

export default function CorregirDatosFormulario() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const [blnTriggered, setBlnTriggered] = useState(false);

  const form = useForm<CorregirDatosFormData>({ mode: 'onChange' });
  const { control, handleSubmit, reset, trigger, watch, formState: { errors } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Error list: proveniente de qd_strErrorsJson (BPM) o del fallback de desarrollo
  const lstFieldsWithError = useMemo<CampoConError[]>(() => {
    const lstParsed = parsearErrores(objWatch[QD.strErrorsJson]);
    return lstParsed.length > 0 ? lstParsed : ERRORES_EJEMPLO;
  }, [objWatch[QD.strErrorsJson]]);

  // Nombres de campos que deben quedar sin error antes de habilitar el envío
  const lstErrorFieldNames = useMemo((): Array<keyof CorregirDatosFormData> => {
    const objNames = new Set(lstFieldsWithError.map(objErr => objErr.campo as keyof CorregirDatosFormData));
    if (objNames.has(QD.strCity)) objNames.add(QD.strDepartment);
    return Array.from(objNames);
  }, [lstFieldsWithError]);

  // Antes del trigger asumimos todos pendientes; luego leemos formState.errors
  const intPendingErrors = blnTriggered
    ? lstErrorFieldNames.filter(objName => !!errors[objName]).length
    : lstFieldsWithError.length;

  // Habilita el envío solo cuando no quedan errores pendientes.
  const blnCanSubmit = blnTriggered && intPendingErrors === 0 && !submitting;

  // Precargamos el formulario y disparamos la validación de los campos con error.
  useEffect(() => {
    const objData = task?.data as (Partial<CorregirDatosFormData> & Record<string, unknown>) | undefined;
    if (objData) reset(objData);

    // Obtener nombres de error directamente de task.data para no depender de watch()
    const objErrJson = objData?.[QD.strErrorsJson];
    const lstParsedFields = parsearErrores(objErrJson);
    const lstFieldsToTrigger: Array<keyof CorregirDatosFormData> =
      lstParsedFields.length > 0
        ? lstParsedFields.map(objErr => objErr.campo as keyof CorregirDatosFormData)
        : ERRORES_EJEMPLO.map(objErr => objErr.campo as keyof CorregirDatosFormData);
    if (lstParsedFields.some(objErr => objErr.campo === QD.strCity) ||
        ERRORES_EJEMPLO.some(objErr => objErr.campo === QD.strCity)) {
      lstFieldsToTrigger.push(QD.strDepartment);
    }

    const tspTimer = setTimeout(async () => {
      await trigger(lstFieldsToTrigger);
      setBlnTriggered(true);
    }, 80);
    return () => clearTimeout(tspTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  // Completa la tarea con las correcciones aplicadas.
  const onSubmit = async (in_objData: CorregirDatosFormData) => {
    try {
      await completeTask(in_objData as unknown as Record<string, unknown>);
    } catch (exc) {
      console.error('[CorregirDatosFormulario] Error al enviar:', exc);
    }
  };

  if (loading) return <div className="screen-wrapper"><div className="screen-loading"><ZrLoader /></div></div>;
  if (error) return <div className="screen-wrapper"><ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Error al cargar el formulario: {error}</ZrAlert></div>;

  // Texto del botón de envío según los errores pendientes.
  const strSubmitLabel = blnCanSubmit
    ? 'Guardar Correcciones'
    : `Guardar Correcciones (${intPendingErrors} error${intPendingErrors !== 1 ? 'es' : ''} pendiente${intPendingErrors !== 1 ? 's' : ''})`;

  return (
    <div className="screen-wrapper">
      <ScreenHeader
        title="Corrección de Datos"
        subtitle={['SCR-002 · PAN-02 · P01-T07', 'Gestión de Quejas Directas', 'Rol: Gestor de Experiencia']}
      />

      <div className="screen-content">
        <InfoBar items={[
          { label: 'Caso',              value: objWatch[QD.strBpmCaseId] || '—' },
          { label: 'SLA Restante',      value: objWatch[QD.strSlaAssigned] || '—' },
          { label: 'Estado',            value: 'En corrección preventiva' },
          { label: 'Errores pendientes', value: `${intPendingErrors} de ${lstFieldsWithError.length}` },
        ]} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Alerta principal */}
          {!blnCanSubmit ? (
            <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
              <strong>{intPendingErrors} error{intPendingErrors !== 1 ? 'es' : ''} de validación {intPendingErrors !== 1 ? 'detectados' : 'detectado'}.</strong>{' '}
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
              <ZdsInput name={QD.strBpmCaseId}   control={control} label="Número de Caso"      readOnly />
              <ZdsInput name={QD.strChannel}     control={control} label="Canal de Recepción"  readOnly />
              <ZdsInput name={QD.strSlaAssigned} control={control} label="SLA Restante"        readOnly />
            </div>
          </FormSection>

          {/* Campos con Error */}
          <SeccionErroresValidacion camposConError={lstFieldsWithError} form={form} triggered={blnTriggered} />

          {/* Aviso sobre re-ejecución automática */}
          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
            Al guardar, el sistema re-ejecutará automáticamente <strong>P01-T06</strong> (Validación Preventiva). Si persisten errores, volverá a esta pantalla. El envío a SmartSupervision solo se activa cuando el contador = 0.
          </ZrAlert>

          <ActionBar>
            <ZrButton config="secondary" onClick={() => window.history.back()}>
              Cancelar Corrección
            </ZrButton>
            <ZrButton
              config="positive"
              disabled={!blnCanSubmit}
              loading={submitting}
              onClick={() => { handleSubmit(onSubmit)(); }}
            >
              {strSubmitLabel}
            </ZrButton>
          </ActionBar>

        </form>
      </div>
    </div>
  );
}
