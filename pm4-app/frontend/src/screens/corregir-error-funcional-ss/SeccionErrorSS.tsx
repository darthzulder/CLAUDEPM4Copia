import { useForm } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import SelectField from '../../components/fields/SelectField';
import { OPTIONS, CorregirErrorFuncionalSSFormData } from './variables';

type FormInstance = ReturnType<typeof useForm<CorregirErrorFuncionalSSFormData>>;

function parseCampos(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
  } catch { /* no es JSON */ }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

interface Props { form: FormInstance }

export default function SeccionErrorSS({ form }: Props) {
  const { register, control, watch } = form;
  const campos = parseCampos(watch('ss_camposAfectados') ?? '');
  const intento = watch('ss_intentoNumero');

  return (
    <FormSection title="🚫 Error Funcional Devuelto por SmartSupervision" color="#B44444">
      <div className="error-banner">
        SmartSupervision <strong>rechazó la radicación</strong> con un error funcional.
        Revise el detalle, corrija los campos indicados y reenvíe.
        {intento && <> — Intento <strong>#{intento}</strong>.</>}
      </div>

      {/* Metadatos del error */}
      <div className="form-row cols-3">
        <div className="form-group">
          <label className="form-label">Número de Caso (ID BPM)</label>
          <input {...register('ss_numeroCaso')} readOnly className="form-control" placeholder="—" />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha Respuesta SS</label>
          <input {...register('ss_fechaRespuesta')} readOnly className="form-control" placeholder="—" />
        </div>
        <div className="form-group">
          <label className="form-label">Código de Error SS</label>
          <input {...register('ss_codigoError')} readOnly className="form-control code-input" placeholder="—" />
        </div>
      </div>

      {/* Mensaje completo */}
      <div className="form-row cols-1">
        <div className="form-group">
          <label className="form-label">Mensaje de Error (SmartSupervision)</label>
          <textarea
            {...register('ss_mensajeError')}
            readOnly
            className="form-control textarea code-input"
            rows={3}
            placeholder="Sin mensaje registrado"
          />
          <span className="form-helper">Respuesta textual devuelta por la API de SmartSupervision — solo lectura.</span>
        </div>
      </div>

      {/* Clasificación del error (editable para que el gestor la confirme / ajuste) */}
      <div className="form-row cols-2">
        <SelectField
          label="Categoría del Error"
          name="ss_categoriaError"
          control={control}
          options={OPTIONS.categoriaErrorSS}
          placeholder="Seleccione categoría..."
        />
        <div className="form-group">
          <label className="form-label">Campos Afectados (según SS)</label>
          {campos.length > 0 ? (
            <div className="campos-afectados-list">
              {campos.map((c, i) => <span key={i} className="campo-tag">{c}</span>)}
            </div>
          ) : (
            <input readOnly className="form-control" placeholder="Sin campos específicos indicados" />
          )}
        </div>
      </div>
    </FormSection>
  );
}
