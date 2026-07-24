import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import { ZdsInput, ZdsStatusBadge, ZrAlert } from '../../../../components/fields/ZdsFields';
import type { StatusVariant } from '../../../../components/fields/ZdsFields';
import { QD } from '../fields/fields';
import type { FormularioSuperintendenciaFormData } from '../fields/fields';
import { Ro } from './FormularioSuperintendencia';

interface Props {
  form: UseFormReturn<FormularioSuperintendenciaFormData>;
}

// Estado del envío a SFC → variante de píldora (ZdsStatusBadge, no hex crudo).
const STATUS_VARIANT: Record<string, StatusVariant> = {
  'Pendiente':       'neutral',
  'Enviando':        'info',
  'Rechazado (400)': 'danger',
  'Aceptado (200)':  'success',
};

// Secciones de Cierre Regulatorio M3 fusionadas desde la ex SCR-010: los datos
// de cierre los calcula el back (Excel PQRS, hoja "MomentoIII") → solo lectura.
// El gestor solo revisa lo calculado; el envío a SmartSupervision lo dispara la
// acción ENVIAR_SFC del formulario principal.
export default function SeccionCierreEnvio({ form }: Props) {
  const { control, watch } = form;
  const objWatch = watch();

  const strStatus = objWatch[QD.strM3ClosureStatus] || 'Pendiente';
  const strVariant = STATUS_VARIANT[strStatus] ?? 'neutral';
  const strLastError = objWatch[QD.strLastError];
  const blnRejected = objWatch[QD.strM3ClosureStatus] === 'Rechazado (400)';

  return (
    <>
      {/* ── Datos de Cierre Regulatorio (Back, solo lectura) ── */}
      <FormSection title="Datos de Cierre Regulatorio">
        <div className="form-row cols-2">
          <ZdsInput name={QD.strUpdateDate} control={control} label="Fecha de Actualización" readOnly />
          <ZdsInput name={QD.strClosureDate} control={control} label="Fecha de Cierre" readOnly />
        </div>
      </FormSection>

      {/* ── Estado del Envío a SmartSupervision (SFC) ── */}
      <FormSection title="Estado del Envío a SmartSupervision (SFC)">
        <div className="form-row cols-2">
          <div className="zds-field-wrap">
            <span className="info-bar-label">Estado del envío a SFC</span>
            <div style={{ marginTop: 'var(--zs-50)' }}>
              <ZdsStatusBadge variant={strVariant}>{strStatus}</ZdsStatusBadge>
            </div>
          </div>
          <Ro label="Intentos de envío" value={objWatch[QD.strM3ClosureAttempts] || '0'} />
        </div>

        <div className="form-row cols-1">
          <ZdsInput name={QD.strSfcCode} control={control} label="Código SFC / Número de Radicado" readOnly />
        </div>

        {strLastError && (
          <div className="form-row cols-1">
            <Ro label="Último error registrado" value={strLastError} />
          </div>
        )}

        {blnRejected && (
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
            <strong>Envío rechazado por SFC.</strong> Revise el error indicado y reenvíe una vez corregido en el back.
          </ZrAlert>
        )}
      </FormSection>
    </>
  );
}
