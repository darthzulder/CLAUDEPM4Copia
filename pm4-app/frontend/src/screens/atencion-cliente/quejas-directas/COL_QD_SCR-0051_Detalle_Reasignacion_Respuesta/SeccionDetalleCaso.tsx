import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import { ZdsInput, ZdsTextarea, ZdsStatusBadge } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { COLLECTION_DEFS, type DetalleReasignacionRespuestaFormData } from './variables';

// Mapea el estado SmartSupervision (FLD-079) al color del semáforo.
export function estadoVariant(in_strStatus: string): 'success' | 'danger' | 'info' | 'neutral' {
  const strStatus = in_strStatus.toLowerCase();
  if (strStatus.includes('cerrad') || strStatus.includes('200') || strStatus.includes('verde')) return 'success';
  if (strStatus.includes('radicad') || strStatus.includes('201')) return 'success';
  if (strStatus.includes('rechaz') || strStatus.includes('400') || strStatus.includes('error')) return 'danger';
  if (strStatus.includes('pendiente') || strStatus.includes('proceso')) return 'info';
  return 'neutral';
}

interface Props {
  form: UseFormReturn<DetalleReasignacionRespuestaFormData>;
  estado: string;
  nombre: string;          // derivado de qd_nombres+qd_apellidos / qd_razonSocial
  identificacion: string;  // derivado de qd_tipoIdentificacion+qd_numeroIdentificacion
}

/** S1–S4 · Expediente del caso (solo lectura). */
export default function SeccionDetalleCaso({ form, estado, nombre, identificacion }: Props) {
  const { control, watch } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Estos campos guardan el CÓDIGO en PM4; resolvemos su descripción vía catálogo para mostrar.
  // El valor almacenado no cambia (sigue siendo el código que espera el BPM).
  const { options: cllChannel } = useCollection(COLLECTION_DEFS.canal);
  const { options: cllProduct } = useCollection(COLLECTION_DEFS.producto);
  const { options: cllReason } = useCollection(COLLECTION_DEFS.motivo);
  const { options: cllAdmission } = useCollection(COLLECTION_DEFS.admision);

  // Resuelve la descripción de un código contra su catálogo.
  const desc = (in_lstOptions: { value: string; label: string }[], in_strCode: string | undefined): string => {
    if (!in_strCode) return '—';
    return in_lstOptions.find((o) => o.value === in_strCode)?.label ?? in_strCode;
  };

  const strChannelDesc = desc(cllChannel, objWatch.qd_canal);
  const strProductDesc = desc(cllProduct, objWatch.qd_productoSFC);
  const strReasonDesc = desc(cllReason, objWatch.qd_motivoSFC);
  const strAdmissionDesc = desc(cllAdmission, objWatch.qd_admision);

  return (
    <>
      {/* ── S1 · Datos del Consumidor (SEC-047) ── */}
      <FormSection title="Datos del Consumidor">
        <div className="form-row cols-2">
          <div className="zds-field-wrap">
            <span className="info-bar-label">Nombre del Consumidor</span>
            <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{nombre || '—'}</div>
          </div>
          <div className="zds-field-wrap">
            <span className="info-bar-label">Tipo y N.° de Identificación</span>
            <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{identificacion || '—'}</div>
          </div>
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
          <div className="zds-field-wrap">
            <span className="info-bar-label">Canal de Recepción</span>
            <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strChannelDesc}</div>
          </div>
          <div className="zds-field-wrap">
            <span className="info-bar-label">Producto SFC</span>
            <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strProductDesc}</div>
          </div>
          <div className="zds-field-wrap">
            <span className="info-bar-label">Motivo SFC</span>
            <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strReasonDesc}</div>
          </div>
        </div>
        <div className="form-row cols-3">
          <ZdsInput name="qd_instanciaRecepcion" control={control} label="Instancia de Recepción" readOnly />
          <div className="zds-field-wrap">
            <span className="info-bar-label">Admisión</span>
            <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strAdmissionDesc}</div>
          </div>
          <ZdsInput name="qd_enteControl" control={control} label="Ente de Control" readOnly />
        </div>
      </FormSection>

      {/* ── S3 · Descripción de la Queja (SEC-049) ── */}
      <FormSection title="Descripción de la Queja">
        <div className="form-row cols-1">
          <div className="zds-field-wrap">
            <span className="info-bar-label">Asunto de la Queja</span>
            <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strReasonDesc}</div>
          </div>
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
