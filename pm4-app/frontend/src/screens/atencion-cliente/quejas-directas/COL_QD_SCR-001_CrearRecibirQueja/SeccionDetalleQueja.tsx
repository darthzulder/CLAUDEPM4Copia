import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import DocSupportUploader from '../../../../components/DocSupportUploader';
import { ZdsInput, ZdsSelect, ZdsRadio, ZdsTextarea } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { COLLECTION_DEFS, OPTIONS, ADJUNTO_KEYS, CrearRecibirQuejaFormData } from './variables';
import { fieldError } from './errorHelper';

interface Props {
  form: UseFormReturn<CrearRecibirQuejaFormData>;
  fileRegistry: MutableRefObject<Map<string, File>>;
}

export default function SeccionDetalleQueja({ form, fileRegistry }: Props) {
  const { control, watch, setValue, formState: { errors, isSubmitted } } = form;
  const w = watch();

  const { options: seguroOpts } = useCollection(COLLECTION_DEFS.seguro);
  const { options: motivoOpts } = useCollection(COLLECTION_DEFS.motivo);
  const { options: admisionOpts } = useCollection(COLLECTION_DEFS.admision);

  const esDefensor = w.qd_rol === 'DEFENSOR';

  // FLD-327 — escalamiento al Defensor computado (back): Defensor → "Sí".
  useEffect(() => {
    setValue('qd_escalamientoDefensor', esDefensor ? 'Sí' : 'No');
  }, [esDefensor, setValue]);

  const err = (name: keyof CrearRecibirQuejaFormData) => fieldError(errors, name, w[name], isSubmitted);

  return (
    <FormSection title="Detalle de la Queja">
      <div className="form-row cols-2">
        <ZdsSelect
          name="qd_seguro"
          control={control}
          label="Selecciona el seguro"
          options={seguroOpts}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err('qd_seguro')}
        />
        <ZdsInput
          name="qd_detalleProducto"
          control={control}
          label="Detalle del producto"
          readOnly
          helpText="Asignado por el sistema (pendiente confirmar lista)."
        />
      </div>

      <div className="form-row cols-2">
        <ZdsRadio
          name="qd_replica"
          control={control}
          label="¿Ya habías radicado previamente la misma queja o es una reconsideración?"
          options={OPTIONS.replica}
          rules={{ required: 'Campo requerido' }}
          required
          inline
          error={err('qd_replica')}
        />
        <ZdsInput
          name="qd_escalamientoDefensor"
          control={control}
          label="Escalamiento al Defensor del Consumidor"
          readOnly
          helpText="Asignado por el sistema según la instancia."
        />
      </div>

      {/* RUL-000-12 — argumento visible solo si réplica = Sí */}
      {w.qd_replica === 'SI' && (
        <div className="form-row cols-1">
          <ZdsTextarea
            name="qd_argumentoReplica"
            control={control}
            label="Argumento de la réplica"
            maxLength={2000}
          />
        </div>
      )}

      <div className="form-row cols-1">
        <ZdsSelect
          name="qd_motivo"
          control={control}
          label="Cuéntanos el motivo"
          options={motivoOpts}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err('qd_motivo')}
        />
      </div>

      <div className="form-row cols-1">
        <ZdsTextarea
          name="qd_detalle"
          control={control}
          label="Ingresa el detalle"
          rules={{
            required: 'Campo requerido',
            minLength: { value: 50, message: 'Mínimo 50 caracteres (MSG-000-03)' },
            maxLength: { value: 2000, message: 'Máximo 2000 caracteres (MSG-000-03)' },
          }}
          required
          maxLength={2000}
          error={err('qd_detalle')}
        />
      </div>

      {/* FLD-330 — adjuntos múltiples (pdf, jpg, png, docx · máx 5 MB c/u) */}
      <DocSupportUploader
        form={form}
        fileRegistry={fileRegistry}
        docKeys={ADJUNTO_KEYS}
        max={5}
        title="Ingresa archivos adjuntos"
        intro="Formatos permitidos: PDF, JPG, PNG, DOCX. Máximo 5 MB por archivo. Puede agregar hasta 5 documentos."
      />

      <div className="form-row cols-2">
        {esDefensor ? (
          <ZdsSelect
            name="qd_admision"
            control={control}
            label="Admisión"
            options={admisionOpts}
            rules={{ required: 'Campo requerido' }}
            required
            error={err('qd_admision')}
          />
        ) : (
          <ZdsInput
            name="qd_admision"
            control={control}
            label="Admisión"
            readOnly
            helpText="Editable solo cuando el rol es Defensor del Consumidor."
          />
        )}
        <ZdsInput
          name="qd_enteControl"
          control={control}
          label="Ente de control"
          readOnly
          helpText="Asignado por el sistema (por defecto: Otros)."
        />
      </div>

      <div className="form-row cols-2">
        <ZdsInput
          name="qd_tutela"
          control={control}
          label="Tutela"
          readOnly
          helpText="Asignada por el sistema (por defecto: No)."
        />
        <ZdsInput
          name="qd_quejaExpres"
          control={control}
          label="Queja Exprés"
          readOnly
          helpText="Asignada por el sistema (pendiente confirmar con SFC)."
        />
      </div>
    </FormSection>
  );
}
