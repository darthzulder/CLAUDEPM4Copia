import { useForm } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsTextarea, ZrAlert, ZrTag } from '../../components/fields/ZdsFields';
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
  const { control, watch } = form;
  const campos = parseCampos(watch('ss_camposAfectados') ?? '');
  const intento = watch('ss_intentoNumero');

  return (
    <FormSection title="Error Funcional Devuelto por SmartSupervision" color="var(--z-red)">
      <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>
        SmartSupervision <strong>rechazó la radicación</strong> con un error funcional.
        Revise el detalle, corrija los campos indicados y reenvíe.
        {intento && <> — Intento <strong>#{intento}</strong>.</>}
      </ZrAlert>

      {/* Metadatos del error */}
      <div className="form-row cols-3">
        <ZdsInput name="ss_numeroCaso" control={control} label="Número de Caso (ID BPM)" readOnly />
        <ZdsInput name="ss_fechaRespuesta" control={control} label="Fecha Respuesta SS" readOnly />
        <ZdsInput name="ss_codigoError" control={control} label="Código de Error SS" readOnly />
      </div>

      {/* Mensaje completo */}
      <div className="form-row cols-1">
        <ZdsTextarea
          name="ss_mensajeError"
          control={control}
          label="Mensaje de Error (SmartSupervision)"
          readOnly
          helpText="Respuesta textual devuelta por la API de SmartSupervision — solo lectura."
        />
      </div>

      {/* Clasificación del error (editable para que el gestor la confirme / ajuste) */}
      <div className="form-row cols-2">
        <ZdsSelect
          label="Categoría del Error"
          name="ss_categoriaError"
          control={control}
          options={OPTIONS.categoriaErrorSS}
          placeholder="Seleccione categoría..."
        />
        <div className="form-group">
          <label className="form-label">Campos Afectados (según SS)</label>
          {campos.length > 0 ? (
            <div className="affected-fields-list">
              {campos.map((c, i) => <ZrTag key={i} fill="peach">{c}</ZrTag>)}
            </div>
          ) : (
            <ZdsInput name="ss_camposAfectados" control={control} label="Campos Afectados (según SS)" readOnly />
          )}
        </div>
      </div>
    </FormSection>
  );
}
