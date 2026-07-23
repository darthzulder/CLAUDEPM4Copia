import { useEffect } from 'react';
import type { FieldPath, UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import { ZdsInput, ZdsSelect, ZdsTextarea, ZdsStatusBadge } from '../../../../components/fields/ZdsFields';
import { useCollection, descOf, useSyncDesc } from '../../../../core/useCollection';
import { QD, QD_COLLECTIONS, SCR000_ADJUNTO_KEYS } from '../fields/fields';
import type { DetalleReasignacionRespuestaFormData } from '../fields/fields';
import DocumentosRadicador from './DocumentosRadicador';

// Mapea el estado SmartSupervision (FLD-079) al color del semáforo.
export function estadoVariant(in_strStatus: string): 'success' | 'danger' | 'info' | 'neutral' {
  const strStatus = in_strStatus.toLowerCase();
  if (strStatus.includes('cerrad') || strStatus.includes('200') || strStatus.includes('verde')) return 'success';
  if (strStatus.includes('radicad') || strStatus.includes('201')) return 'success';
  if (strStatus.includes('rechaz') || strStatus.includes('400') || strStatus.includes('error')) return 'danger';
  if (strStatus.includes('pendiente') || strStatus.includes('proceso')) return 'info';
  return 'neutral';
}

// ── Helpers de la matriz cat_matriz_motivos (id 45) ──────────────────────────
// Misma lógica que SCR-000/SeccionDetalleQueja: los datos vienen "sucios" (espacios
// sobrantes, comparación por texto), por eso normalizamos antes de comparar y
// derivamos las opciones de la cascada en cliente.
const normalizar = (in_gen: unknown) => String(in_gen ?? '').trim().toLowerCase();

// Lee una columna del registro crudo de la matriz (los campos viven bajo `data`).
function leerColumna(in_objRow: Record<string, unknown>, in_strCol: string): string {
  const dicData = (in_objRow.data ?? in_objRow) as Record<string, unknown>;
  return String(dicData?.[in_strCol] ?? '').trim();
}

// Opciones únicas por value, descartando vacíos (una columna se repite en la matriz).
function opcionesUnicas(in_cll: { value: string; label: string }[]): { value: string; label: string }[] {
  const setSeen = new Set<string>();
  const cllOut: { value: string; label: string }[] = [];
  for (const objOpt of in_cll) {
    if (!objOpt.value || setSeen.has(objOpt.value)) continue;
    setSeen.add(objOpt.value);
    cllOut.push(objOpt);
  }
  return cllOut;
}

interface Props {
  form: UseFormReturn<DetalleReasignacionRespuestaFormData>;
  estado: string;
  nombre: string;          // derivado de qd_strFirstName+qd_strLastName / qd_strCompanyName
  identificacion: string;  // derivado de qd_strIdType+qd_strIdNumber
  requestId: number | null; // request del caso, para listar los adjuntos del radicador
}

/** S1–S4 · Expediente del caso. La Clasificación Regulatoria (S2) es re-editable en M3. */
export default function SeccionDetalleCaso({ form, estado, nombre, identificacion, requestId }: Props) {
  const { control, watch, setValue, formState: { errors } } = form;
  // Tomamos una foto de los valores actuales del formulario.
  const objWatch = watch();

  // Canal / Admisión guardan el CÓDIGO en PM4; resolvemos su descripción vía catálogo
  // para el display de solo lectura (el valor almacenado sigue siendo el código del BPM).
  const { options: cllChannel } = useCollection(QD_COLLECTIONS.channel);
  const { options: cllAdmission } = useCollection(QD_COLLECTIONS.admission);

  // ── Clasificación editable — misma cascada cat_matriz_motivos que SCR-000 ──
  // Seguro (producto SFC), catálogo de tipo de solicitud (para resolver el LABEL que la
  // matriz usa para filtrar) y la matriz COMPLETA (la cascada momento→servicio→motivo se
  // deriva en cliente por columnas de texto).
  const { options: cllInsurance } = useCollection(QD_COLLECTIONS.sfcProduct);
  const { options: cllRequestType } = useCollection(QD_COLLECTIONS.requestType);
  const { records: cllMatrizRows } = useCollection(QD_COLLECTIONS.matrixMotivos);

  // Placa: solo aplica cuando el producto seleccionado es "Autos" (Anexo02 #25).
  const objSelectedInsurance = cllInsurance.find((o) => o.value === objWatch[QD.strSfcProduct]);
  const blnIsAutos = /autos/i.test(objSelectedInsurance?.label ?? '');
  // Servicio: solo aplica cuando el momento (interacción) es "Asistencias" (Anexo02 #31).
  const blnIsAsistencias = /asistencias/i.test(objWatch[QD.strInteraction] ?? '');

  // La matriz filtra por el LABEL de tipo de solicitud y producto (guarda texto, no código).
  const strRequestTypeLabel = cllRequestType.find((o) => o.value === objWatch[QD.strRequestType])?.label ?? '';
  const strProductLabel = objSelectedInsurance?.label ?? '';

  const cllRowsForProduct = cllMatrizRows.filter((r) =>
    normalizar(leerColumna(r, 'tipoSolicitud')) === normalizar(strRequestTypeLabel) &&
    normalizar(leerColumna(r, 'productoZurich')) === normalizar(strProductLabel));

  // Momento (interacción) — opciones únicas de la columna `interaccion`.
  const cllInteraction = opcionesUnicas(cllRowsForProduct.map((r) => {
    const strVal = leerColumna(r, 'interaccion');
    return { value: strVal, label: strVal };
  }));

  const cllRowsForInteraction = cllRowsForProduct.filter((r) =>
    normalizar(leerColumna(r, 'interaccion')) === normalizar(objWatch[QD.strInteraction]));

  // Servicio (`servicioPrestado`) — solo se muestra cuando el momento es "Asistencias".
  const cllService = opcionesUnicas(cllRowsForInteraction.map((r) => {
    const strVal = leerColumna(r, 'servicioPrestado');
    return { value: strVal, label: strVal };
  }));

  // Motivo — value = codigoMotivoSFC (código real), label = motivoSFC.
  const cllRowsForReason = blnIsAsistencias
    ? cllRowsForInteraction.filter((r) =>
        normalizar(leerColumna(r, 'servicioPrestado')) === normalizar(objWatch[QD.strServiceProvided]))
    : cllRowsForInteraction;
  const cllReason = opcionesUnicas(cllRowsForReason.map((r) => ({
    value: leerColumna(r, 'codigoMotivoSFC'),
    label: leerColumna(r, 'motivoSFC'),
  })));

  // Reselección coherente SIN pisar la precarga: si el valor actual ya no existe entre las
  // opciones derivadas (tras cambiar un eslabón aguas arriba), se limpia. A diferencia de
  // SCR-000 (form vacío), aquí el form llega precargado, así que NO limpiamos a ciegas por
  // cambio de dependencia — solo cuando el valor cae fuera de las opciones ya cargadas.
  useEffect(() => {
    const strVal = objWatch[QD.strInteraction];
    if (cllInteraction.length === 0 || !strVal) return;
    if (!cllInteraction.some((o) => o.value === strVal)) setValue(QD.strInteraction, '');
  }, [cllInteraction, objWatch, setValue]);

  useEffect(() => {
    const strVal = objWatch[QD.strServiceProvided];
    if (!strVal) return;
    // Fuera de "Asistencias" el servicio no aplica; dentro, se limpia si cae fuera de opciones.
    if (!blnIsAsistencias) { setValue(QD.strServiceProvided, ''); return; }
    if (cllService.length > 0 && !cllService.some((o) => o.value === strVal)) setValue(QD.strServiceProvided, '');
  }, [blnIsAsistencias, cllService, objWatch, setValue]);

  useEffect(() => {
    const strVal = objWatch[QD.strSfcReason];
    if (cllReason.length === 0 || !strVal) return;
    if (!cllReason.some((o) => o.value === strVal)) setValue(QD.strSfcReason, '');
  }, [cllReason, objWatch, setValue]);

  // Placa fuera de "Autos" no debe conservar valor. Gate en cllInsurance cargado: mientras
  // el catálogo no llegue, blnIsAutos es false por defecto y borraría la placa precargada.
  useEffect(() => {
    if (cllInsurance.length === 0) return;
    if (!blnIsAutos && objWatch[QD.strPlate]) setValue(QD.strPlate, '');
  }, [cllInsurance, blnIsAutos, objWatch, setValue]);

  // Sincroniza cada variable compañera <campo>_desc con la descripción del código guardado.
  useSyncDesc(form, QD.strChannel, cllChannel);
  useSyncDesc(form, QD.strSfcProduct, cllInsurance);
  useSyncDesc(form, QD.strSfcReason, cllReason);
  useSyncDesc(form, QD.strAdmission, cllAdmission);

  const strChannelDesc = descOf(cllChannel, objWatch[QD.strChannel]);
  const strAdmissionDesc = descOf(cllAdmission, objWatch[QD.strAdmission]);
  // Asunto de la Queja = descripción del motivo elegido; fallback al companion _desc que
  // viaja en task.data (evita el "flash" del código mientras la matriz aún no cargó).
  const strReasonCompanion = (objWatch as Record<string, unknown>)[`${QD.strSfcReason}_desc`] as string | undefined;
  const strReasonDesc = cllReason.find((o) => o.value === objWatch[QD.strSfcReason])?.label
    ?? strReasonCompanion ?? (objWatch[QD.strSfcReason] || '—');

  // Estos campos guardan el CÓDIGO (numérico) desde SCR-000; para el display read-only
  // usamos la variable compañera <campo>_desc que viaja en task.data.
  const strPersonTypeDesc = `${QD.strPersonType}_desc` as FieldPath<DetalleReasignacionRespuestaFormData>;
  const strReceptionInstanceDesc = `${QD.strReceptionInstance}_desc` as FieldPath<DetalleReasignacionRespuestaFormData>;
  const strControlEntityDesc = `${QD.strControlEntity}_desc` as FieldPath<DetalleReasignacionRespuestaFormData>;

  // Atajo para leer el mensaje de error de un campo.
  const err = (in_strName: keyof DetalleReasignacionRespuestaFormData) => errors[in_strName]?.message as string | undefined;

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
          <ZdsInput name={QD.strEmail} control={control} label="Correo Electrónico" readOnly
            helpText="Destino del correo de respuesta final." />
          <ZdsInput name={strPersonTypeDesc} control={control} label="Tipo de Persona" readOnly />
        </div>
      </FormSection>

      {/* ── S2 · Clasificación Regulatoria (precargada M1, re-editable en M3) (SEC-048) ──
          Producto SFC y Motivo SFC son editables con la misma cascada cat_matriz_motivos
          de SCR-000: seguro → momento → (servicio) / (placa) → motivo. Llegan precargados
          con la selección de M1 y pueden re-elegirse. Canal, Instancia, Admisión y Ente de
          Control siguen siendo de solo lectura (calculados en M1). */}
      <FormSection title="Clasificación Regulatoria (precargada M1)">
        <div className="form-row cols-2">
          <ZdsSelect
            name={QD.strSfcProduct}
            control={control}
            label="Producto SFC (seguro)"
            options={cllInsurance}
            rules={{ required: 'Campo requerido' }}
            required
            withSearch
            error={err(QD.strSfcProduct)}
          />
          <ZdsSelect
            name={QD.strInteraction}
            control={control}
            label="Momento"
            options={cllInteraction}
            rules={{ required: 'Campo requerido' }}
            required
            withSearch
            disabled={!objWatch[QD.strSfcProduct]}
            placeholder={objWatch[QD.strSfcProduct] ? 'Seleccione el momento...' : 'Seleccione primero el seguro'}
            error={err(QD.strInteraction)}
          />
        </div>

        {/* Servicio (solo si momento = Asistencias) y Placa (solo si producto = Autos). */}
        {(blnIsAsistencias || blnIsAutos) && (
          <div className="form-row cols-2">
            {blnIsAsistencias ? (
              <ZdsSelect
                name={QD.strServiceProvided}
                control={control}
                label="Servicio"
                options={cllService}
                rules={{ required: 'Campo requerido' }}
                required
                withSearch
                error={err(QD.strServiceProvided)}
              />
            ) : <div />}
            {blnIsAutos ? (
              <ZdsInput
                name={QD.strPlate}
                control={control}
                label="Placa"
                rules={{ required: 'Campo requerido' }}
                required
                error={err(QD.strPlate)}
              />
            ) : <div />}
          </div>
        )}

        <div className="form-row cols-1">
          <ZdsSelect
            name={QD.strSfcReason}
            control={control}
            label="Motivo SFC"
            options={cllReason}
            rules={{ required: 'Campo requerido' }}
            required
            withSearch
            disabled={!objWatch[QD.strInteraction] || (blnIsAsistencias && !objWatch[QD.strServiceProvided])}
            placeholder={objWatch[QD.strInteraction] ? 'Seleccione el motivo...' : 'Complete primero el momento'}
            error={err(QD.strSfcReason)}
          />
        </div>

        {/* Regulatorios calculados en M1 (solo lectura). */}
        <div className="form-row cols-3">
          <div className="zds-field-wrap">
            <span className="info-bar-label">Canal de Recepción</span>
            <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strChannelDesc}</div>
          </div>
          <ZdsInput name={strReceptionInstanceDesc} control={control} label="Instancia de Recepción" readOnly />
          <div className="zds-field-wrap">
            <span className="info-bar-label">Admisión</span>
            <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strAdmissionDesc}</div>
          </div>
        </div>
        <div className="form-row cols-3">
          <ZdsInput name={strControlEntityDesc} control={control} label="Ente de Control" readOnly />
          <div />
          <div />
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
          <ZdsTextarea name={QD.strComplaintText} control={control} label="Descripción / Texto de la Queja" readOnly />
        </div>
        <div className="form-row cols-1">
          <DocumentosRadicador requestId={requestId} docKeys={SCR000_ADJUNTO_KEYS} />
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
          <ZdsInput name={QD.strM1M2Attempts} control={control} label="Intentos M1/M2" readOnly />
          <ZdsInput name={QD.strFilingDate} control={control} label="Fecha/Hora radicación SFC" readOnly />
        </div>
      </FormSection>
    </>
  );
}
