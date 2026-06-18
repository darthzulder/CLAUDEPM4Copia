import { useForm } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import SelectField from '../../components/fields/SelectField';
import { OPTIONS, RevisarErrorTecnicoFormData } from './variables';

type FormInstance = ReturnType<typeof useForm<RevisarErrorTecnicoFormData>>;

interface Props {
  form: FormInstance;
}

export default function SeccionDetalleError({ form }: Props) {
  const { register, control } = form;

  return (
    <>
      {/* ── Sección 1: Detalle del Error ── */}
      <FormSection title="⚠ Detalle del Error de Integración" color="#B44444">
        <div className="form-row cols-3">
          <div className="form-group">
            <label className="form-label">Número de Caso (ID BPM)</label>
            <input
              {...register('et_numeroCaso')}
              readOnly
              className="form-control"
              placeholder="Asignado por el BPM"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha y Hora del Error</label>
            <input
              {...register('et_fechaHoraError')}
              readOnly
              className="form-control"
              placeholder="—"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Código de Error</label>
            <input
              {...register('et_codigoError')}
              readOnly
              className="form-control code-input"
              placeholder="—"
            />
          </div>
        </div>

        <div className="form-row cols-2">
          <SelectField
            label="Tipo de Error"
            name="et_tipoError"
            control={control}
            options={OPTIONS.tipoError}
            placeholder="Seleccione tipo..."
          />
          <SelectField
            label="Sistema Afectado"
            name="et_sistemaAfectado"
            control={control}
            options={OPTIONS.sistemaAfectado}
            placeholder="Seleccione sistema..."
          />
        </div>

        <div className="form-row cols-1">
          <div className="form-group">
            <label className="form-label">Mensaje del Error (log del sistema)</label>
            <textarea
              {...register('et_mensajeError')}
              readOnly
              className="form-control textarea code-input"
              rows={4}
              placeholder="Sin mensaje de error registrado"
            />
            <span className="form-helper">Campo de solo lectura — generado automáticamente por el sistema</span>
          </div>
        </div>
      </FormSection>

      {/* ── Sección 2: Queja Afectada ── */}
      <FormSection title="📋 Queja Afectada (Solo Lectura)">
        <div className="info-banner">
          ℹ Los datos del consumidor y la queja son de solo lectura. Fueron registrados en el paso anterior del proceso (P01-T01).
        </div>

        <div className="form-row cols-3">
          <div className="form-group">
            <label className="form-label">Nombre del Consumidor</label>
            <input
              {...register('et_nombreConsumidor')}
              readOnly
              className="form-control"
              placeholder="—"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Número de Identificación</label>
            <input
              {...register('et_numeroIdentificacion')}
              readOnly
              className="form-control"
              placeholder="—"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo de Solicitud</label>
            <input
              {...register('et_tipoSolicitud')}
              readOnly
              className="form-control"
              placeholder="—"
            />
          </div>
        </div>

        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Producto SFC</label>
            <input
              {...register('et_productoSFC')}
              readOnly
              className="form-control"
              placeholder="—"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Motivo SFC</label>
            <input
              {...register('et_motivoSFC')}
              readOnly
              className="form-control"
              placeholder="—"
            />
          </div>
        </div>
      </FormSection>
    </>
  );
}
