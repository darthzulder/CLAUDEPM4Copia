import type { Control } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import { ZdsInput, ZdsTextarea, ZdsStatusBadge } from '../../../../components/fields/ZdsFields';
import type { DetalleReasignacionRespuestaFormData } from './variables';

// Mapea el estado SmartSupervision (FLD-079) al color del semáforo.
function estadoVariant(estado: string): 'success' | 'danger' | 'info' | 'neutral' {
  const e = estado.toLowerCase();
  if (e.includes('cerrad') || e.includes('200') || e.includes('verde')) return 'success';
  if (e.includes('radicad') || e.includes('201')) return 'success';
  if (e.includes('rechaz') || e.includes('400') || e.includes('error')) return 'danger';
  if (e.includes('pendiente') || e.includes('proceso')) return 'info';
  return 'neutral';
}

interface Props {
  control: Control<DetalleReasignacionRespuestaFormData>;
  estado: string;
}

/** S1–S4 · Expediente del caso (solo lectura). */
export default function SeccionDetalleCaso({ control, estado }: Props) {
  return (
    <>
      {/* ── S1 · Datos del Consumidor (SEC-047) ── */}
      <FormSection title="Datos del Consumidor">
        <div className="form-row cols-2">
          <ZdsInput name="qd_nombreConsumidor" control={control} label="Nombre del Consumidor" readOnly />
          <ZdsInput name="qd_identificacion" control={control} label="Tipo y N.° de Identificación" readOnly />
        </div>
        <div className="form-row cols-2">
          <ZdsInput name="qd_correoElectronico" control={control} label="Correo Electrónico" readOnly
            helpText="Destino del correo de respuesta final." />
          <ZdsInput name="qd_tipoPersona" control={control} label="Tipo de Persona" readOnly />
        </div>
      </FormSection>

      {/* ── S2 · Clasificación Regulatoria (precargada M1) (SEC-048) ── */}
      <FormSection title="Clasificación Regulatoria (precargada M1)">
        <div className="form-row cols-3">
          <ZdsInput name="qd_canal" control={control} label="Canal de Recepción" readOnly />
          <ZdsInput name="qd_productoSFC" control={control} label="Producto SFC" readOnly />
          <ZdsInput name="qd_motivoSFC" control={control} label="Motivo SFC" readOnly />
        </div>
        <div className="form-row cols-3">
          <ZdsInput name="qd_instanciaPunto" control={control} label="Instancia / Punto de Recepción" readOnly />
          <ZdsInput name="qd_admision" control={control} label="Admisión" readOnly />
          <ZdsInput name="qd_enteControl" control={control} label="Ente de Control" readOnly />
        </div>
      </FormSection>

      {/* ── S3 · Descripción de la Queja (SEC-049) ── */}
      <FormSection title="Descripción de la Queja">
        <div className="form-row cols-1">
          <ZdsInput name="qd_resumen" control={control} label="Asunto de la Queja" readOnly />
        </div>
        <div className="form-row cols-1">
          <ZdsTextarea name="qd_textoQueja" control={control} label="Descripción / Texto de la Queja" readOnly />
        </div>
      </FormSection>

      {/* ── S4 · Estado SmartSupervision (SEC-050) ── */}
      <FormSection title="Estado SmartSupervision">
        <div className="form-row cols-3">
          <div className="zds-field-wrap">
            <span className="info-bar-label">Estado SmartSupervision</span>
            <div style={{ marginTop: 'var(--zs-50)' }}>
              <ZdsStatusBadge variant={estadoVariant(estado || '')}>
                {estado || 'Sin estado'}
              </ZdsStatusBadge>
            </div>
          </div>
          <ZdsInput name="qd_intentosM1M2" control={control} label="Intentos M1/M2" readOnly />
          <ZdsInput name="qd_fechaRadicacion" control={control} label="Fecha/Hora radicación SFC" readOnly />
        </div>
      </FormSection>
    </>
  );
}
