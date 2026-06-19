import { useForm } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import { ZdsInput } from '../../components/fields/ZdsFields';
import { CorregirDatosFormData } from './variables';

type FormInstance = ReturnType<typeof useForm<CorregirDatosFormData>>;

interface ErrorItem {
  campo:   string;
  label:   string;
  mensaje: string;
}

function parseErrores(raw: string): ErrorItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ErrorItem[];
  } catch {
    // no es JSON — mostrar como mensaje genérico
  }
  return [{ campo: 'general', label: 'Error de validación', mensaje: raw }];
}

interface Props {
  form: FormInstance;
}

export default function SeccionErroresValidacion({ form }: Props) {
  const { control, watch } = form;
  const raw = watch('cf_erroresValidacion') ?? '';
  const errores = parseErrores(raw);
  const total = watch('cf_totalErrores') ?? String(errores.length);

  return (
    <FormSection title="Errores Detectados por Validación Preventiva" color="#B44444">
      <div className="error-banner" style={{ marginBottom: 'var(--zs-100)' }}>
        Se detectaron <strong>{total} error(es)</strong> al intentar radicar la queja ante SmartSupervision.
        Corrija los campos indicados y vuelva a enviar, o escale para revisión manual.
      </div>

      {errores.length > 0 && (
        <div className="error-list">
          {errores.map((e, i) => (
            <div key={i} className="error-list-item">
              <span className="error-list-label">{e.label || e.campo}</span>
              <span className="error-list-msg">{e.mensaje}</span>
            </div>
          ))}
        </div>
      )}

      <div className="form-row cols-2" style={{ marginTop: 'var(--zs-100)' }}>
        <ZdsInput
          name="cf_numeroCaso"
          control={control}
          label="Número de Caso (ID BPM)"
          readOnly
        />
        <ZdsInput
          name="cf_fechaValidacion"
          control={control}
          label="Fecha y Hora de Validación"
          readOnly
        />
      </div>
    </FormSection>
  );
}
