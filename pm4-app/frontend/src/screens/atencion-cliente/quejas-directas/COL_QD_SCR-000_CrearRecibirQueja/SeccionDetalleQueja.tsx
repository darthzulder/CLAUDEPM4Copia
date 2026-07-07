import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import DocSupportUploader from '../../../../components/DocSupportUploader';
import { ZdsInput, ZdsSelect, ZdsRadio, ZdsTextarea } from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import { COLLECTION_DEFS, OPTIONS, ADJUNTO_KEYS, CrearRecibirQuejaFormData } from './variables';

interface Props {
  form: UseFormReturn<CrearRecibirQuejaFormData>;
  fileRegistry: MutableRefObject<Map<string, File>>;
}

export default function SeccionDetalleQueja({ form, fileRegistry }: Props) {
  const { control, watch, setValue, formState: { errors } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Cargamos los catalogos de la seccion de detalle de la queja.
  const { options: cllInsurance } = useCollection(COLLECTION_DEFS.seguro);
  const { options: cllProductDetail } = useCollection(COLLECTION_DEFS.detalleProducto, { qd_productoSFC: objWatch.qd_productoSFC });
  const { options: cllReason } = useCollection(COLLECTION_DEFS.motivo);
  const { options: cllAdmission } = useCollection(COLLECTION_DEFS.admision);
  const { options: cllControlEntity } = useCollection(COLLECTION_DEFS.ente);
  const { options: cllGuardianship } = useCollection(COLLECTION_DEFS.tutela);
  const { options: cllExpressComplaint } = useCollection(COLLECTION_DEFS.quejaExpres);

  // Determinamos si el rol radicador es el Defensor.
  const blnIsDefender = objWatch.qd_rolRadicador === 'DEFENSOR';

  // FLD-327 — escalamiento al Defensor computado (back): Defensor → "Sí".
  useEffect(() => {
    setValue('qd_escalamientoDefensor', blnIsDefender ? 'Sí' : 'No');
  }, [blnIsDefender, setValue]);

  // FLD-324 — detalle del producto: primer código de CAT-DETALLE-PRODUCTO para el seguro elegido.
  useEffect(() => {
    setValue('qd_detalleProducto', cllProductDetail[0]?.label ?? '');
  }, [cllProductDetail, setValue]);

  // FLD-331 — admisión por defecto "No aplica" (rol ≠ Defensor), resuelta desde CAT-ADMISION.
  useEffect(() => {
    if (blnIsDefender || objWatch.qd_admision || cllAdmission.length === 0) return;
    const objNotApplicable = cllAdmission.find((o) => /no aplica/i.test(o.label));
    if (objNotApplicable) setValue('qd_admision', objNotApplicable.label);
  }, [blnIsDefender, objWatch.qd_admision, cllAdmission, setValue]);

  // FLD-332 — ente de control por defecto "Otros", resuelto desde CAT-ENTE.
  useEffect(() => {
    if (objWatch.qd_enteControl || cllControlEntity.length === 0) return;
    const objOthers = cllControlEntity.find((o) => /otros/i.test(o.label));
    if (objOthers) setValue('qd_enteControl', objOthers.label);
  }, [objWatch.qd_enteControl, cllControlEntity, setValue]);

  // FLD-333 — tutela por defecto "No", resuelta desde CAT-TUTELA.
  useEffect(() => {
    if (objWatch.qd_tutela || cllGuardianship.length === 0) return;
    const objNo = cllGuardianship.find((o) => /^\d?\.?\s*no$/i.test(o.label.trim()));
    if (objNo) setValue('qd_tutela', objNo.label);
  }, [objWatch.qd_tutela, cllGuardianship, setValue]);

  // FLD-334 — queja exprés por defecto "No", resuelta desde CAT-EXPRES.
  useEffect(() => {
    if (objWatch.qd_quejaExpres || cllExpressComplaint.length === 0) return;
    const objNo = cllExpressComplaint.find((o) => /^\d?\.?\s*no$/i.test(o.label.trim()));
    if (objNo) setValue('qd_quejaExpres', objNo.label);
  }, [objWatch.qd_quejaExpres, cllExpressComplaint, setValue]);

  // Atajo para leer el mensaje de error de un campo.
  const err = (in_strName: keyof CrearRecibirQuejaFormData) => errors[in_strName]?.message;

  return (
    <FormSection title="Detalle de la Queja">
      <div className="form-row cols-2">
        <ZdsSelect
          name="qd_productoSFC"
          control={control}
          label="Selecciona el seguro"
          options={cllInsurance}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err('qd_productoSFC')}
        />
        <ZdsInput
          name="qd_detalleProducto"
          control={control}
          label="Detalle del producto"
          readOnly
          helpText="Asignado por el sistema (CAT-DETALLE-PRODUCTO)."
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
      {objWatch.qd_replica === 'SI' && (
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
          name="qd_motivoSFC"
          control={control}
          label="Cuéntanos el motivo"
          options={cllReason}
          rules={{ required: 'Campo requerido' }}
          required
          withSearch
          error={err('qd_motivoSFC')}
        />
      </div>

      <div className="form-row cols-1">
        <ZdsTextarea
          name="qd_textoQueja"
          control={control}
          label="Ingresa el detalle"
          rules={{
            required: 'Campo requerido',
            minLength: { value: 50, message: 'Mínimo 50 caracteres (MSG-000-03)' },
            maxLength: { value: 2000, message: 'Máximo 2000 caracteres (MSG-000-03)' },
          }}
          required
          maxLength={2000}
          error={err('qd_textoQueja')}
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
        {blnIsDefender ? (
          <ZdsSelect
            name="qd_admision"
            control={control}
            label="Admisión"
            options={cllAdmission}
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
          helpText="Asignado por el sistema (CAT-ENTE, por defecto: Otros)."
        />
      </div>

      <div className="form-row cols-2">
        <ZdsInput
          name="qd_tutela"
          control={control}
          label="Tutela"
          readOnly
          helpText="Asignada por el sistema (CAT-TUTELA, por defecto: No)."
        />
        <ZdsInput
          name="qd_quejaExpres"
          control={control}
          label="Queja Exprés"
          readOnly
          helpText="Asignada por el sistema (CAT-EXPRES, por defecto: No)."
        />
      </div>
    </FormSection>
  );
}
