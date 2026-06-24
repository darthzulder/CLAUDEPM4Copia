import { useEffect, useRef } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { useForm } from 'react-hook-form';
import { useTask } from '../../core/useTask';
import FormSection from '../../components/FormSection';
import ScreenHeader from '../../components/ScreenHeader';
import { ZdsInput, ZdsSelect, ZdsRadio, ZrButton, ZrAlert, ZrFileInput } from '../../components/fields/ZdsFields';
import pm4 from '../../api/pm4Client';
import { OPTIONS, RecibirQuejaFormData } from './variables';
import SeccionConsumidor from './SeccionConsumidor';
import SeccionClasificacion from './SeccionClasificacion';

export default function RecibirQueja() {
  const { task, loading, error, submitting, completeTask } = useTask();
  const fileRegistry = useRef(new Map<string, File>());

  const form = useForm<RecibirQuejaFormData>({
    defaultValues: {
      qd_codigoPais: '170',
      qd_incluyeAnexos: 'NO',
    },
  });

  const { control, watch, handleSubmit, reset, setValue, formState: { errors, isSubmitted } } = form;
  const w = watch();

  // Pre-poblar formulario con datos del task
  useEffect(() => {
    if (task?.data) {
      reset({
        qd_codigoPais: '170',
        qd_incluyeAnexos: 'NO',
        ...(task.data as Partial<RecibirQuejaFormData>),
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: RecibirQuejaFormData) => {
    try {
      const requestId = task?.process_request_id;
      // Subir archivos adjuntos antes de completar la tarea
      if (requestId && fileRegistry.current.size > 0) {
        for (const [docKey, file] of fileRegistry.current.entries()) {
          const fd = new FormData();
          fd.append('file', file);
          await pm4.post(`/requests/${requestId}/files?data_name=${docKey}`, fd);
        }
      }
      await completeTask(data as unknown as Record<string, unknown>);
    } catch (err) {
      console.error('[RecibirQueja] Error al enviar:', err);
    }
  };


  if (loading) {
    return (
      <div className="screen-wrapper">
        <div className="screen-loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-wrapper">
        <div className="screen-error">Error al cargar el formulario: {error}</div>
      </div>
    );
  }

  return (
    <div className="screen-wrapper">
      {/* ── Encabezado ── */}
      <ScreenHeader
        title="Recibir / Crear Queja"
        subtitle={[
          'SCR-001 · P01-T01',
          'Gestión de Quejas Directas',
          'Rol: Gestor de Experiencia',
        ]}
      />

      <div className="screen-content">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── Sección 1: Encabezado del Caso ── */}
        <FormSection title="Encabezado del Caso">
          <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
            Complete todos los campos del consumidor y la queja. Al presionar <strong>Crear Queja</strong> el sistema ejecutará validación preventiva automática antes de activar la radicación ante SmartSupervision.
          </ZrAlert>
          <div className="form-row cols-3">
            <ZdsInput
              name="qd_numeroCaso"
              control={control}
              label="Número de Caso (ID BPM)"
              readOnly
            />
            <ZdsSelect
              name="qd_canalRecepcion"
              control={control}
              label="Canal de Recepción"
              options={OPTIONS.canal}
              rules={{ required: 'Campo requerido' }}
              required
              error={isSubmitted && errors.qd_canalRecepcion ? String(errors.qd_canalRecepcion.message) : undefined}
            />
            <ZdsInput
              name="qd_fechaHoraCreacion"
              control={control}
              label="Fecha y Hora de Creación"
              readOnly
            />
          </div>
        </FormSection>

        {/* ── Sección 2: Datos del Consumidor ── */}
        <SeccionConsumidor form={form} />

        {/* ── Sección 3: Clasificación ── */}
        <SeccionClasificacion form={form} />

        {/* ── Sección 4: Adjuntos ── */}
        <FormSection title="Adjuntos">
          <div className="form-row cols-2">
            <ZdsRadio
              name="qd_incluyeAnexos"
              control={control}
              label="¿Incluye Anexos a la Queja?"
              options={OPTIONS.incluyeAnexos}
              rules={{ required: 'Campo requerido' }}
              required
              error={isSubmitted && errors.qd_incluyeAnexos ? String(errors.qd_incluyeAnexos.message) : undefined}
            />
            <ZdsInput
              name="qd_adjuntoNombre"
              control={control}
              label="Nombre del Archivo Adjunto"
              readOnly
            />
          </div>

          {w.qd_incluyeAnexos === 'SI' && (
            <ZrFileInput
              label="Archivo Adjunto"
              model={w.qd_adjuntoNombre || null}
              droppable
              onChange={(file: File | string | null) => {
                if (file && typeof file !== 'string') {
                  setValue('qd_adjuntoNombre', file.name);
                  fileRegistry.current.set('qd_adjunto', file);
                } else if (!file) {
                  setValue('qd_adjuntoNombre', '');
                  fileRegistry.current.delete('qd_adjunto');
                }
              }}
              {...({
                accept: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
                'help-text': 'Formatos aceptados: PDF, DOC, DOCX, JPG, PNG',
              } as Record<string, unknown>)}
            />
          )}
        </FormSection>

        {/* ── Barra de acciones ── */}
        <ActionBar>
          <ZrButton config="secondary:s" onClick={() => window.history.back()}>Cancelar</ZrButton>
          <ZrButton
            config="secondary:s"
            disabled={submitting}
            onClick={() => completeTask({ ...w, _draft: true } as Record<string, unknown>)}
          >
            Guardar Borrador
          </ZrButton>
          <ZrButton config="positive:s" onClick={() => { handleSubmit(onSubmit)(); }} loading={submitting} disabled={submitting}>Crear Queja</ZrButton>
        </ActionBar>
        </form>
      </div>
    </div>
  );
}
