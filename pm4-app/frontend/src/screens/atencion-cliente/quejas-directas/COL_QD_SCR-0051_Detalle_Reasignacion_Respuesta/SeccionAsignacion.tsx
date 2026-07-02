import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import FormSection from '../../../../components/FormSection';
import {
  ZdsSelect, ZdsTextarea, ZdsRadio,
  ZrButton, ZrAlert, ZrTable,
} from '../../../../components/fields/ZdsFields';
import { useCollection } from '../../../../core/useCollection';
import {
  OPTIONS, COLLECTION_DEFS, MAX_AYUDANTES,
  type DetalleReasignacionRespuestaFormData, type AsignacionHistorial,
} from './variables';

interface Props {
  form: UseFormReturn<DetalleReasignacionRespuestaFormData>;
  err: (name: keyof DetalleReasignacionRespuestaFormData) => string | undefined;
}

/** S5 Asignación · S6 Reasignación (PAN-06) · S7 Historial de Asignaciones. */
export default function SeccionAsignacion({ form, err }: Props) {
  const { control, watch, setValue } = form;
  const w = watch();

  // RUL-0051-01 — la sección de asignación solo es visible la primera vez (sin responsable).
  const mostrarAsignacion = !w.qd_tieneResponsable;

  // RUL-0051-07 — bloque de reasignación visible si "¿Necesitas de otras áreas?" = Sí.
  const mostrarReasignacion = w.qd_necesitaOtrasAreas === 'SI';

  // RUL-0051-08 — máx. 4 ayudantes.
  const historial: AsignacionHistorial[] = Array.isArray(w.qd_historialAsignaciones) ? w.qd_historialAsignaciones : [];
  const ayudantesAlcanzado = historial.length >= MAX_AYUDANTES;

  const { options: areaOpts } = useCollection(COLLECTION_DEFS.area);
  const { options: motivoReasignacionOpts } = useCollection(COLLECTION_DEFS.motivoReasignacion);

  // RUL-0051-02 — usuarios filtrados por área seleccionada (asignación inicial).
  const { options: usuariosArea } = useCollection(COLLECTION_DEFS.usuariosRole, { qd_area: w.qd_areaResponsable });

  // FLD-092 — responsables del área destino de reasignación (autocompletado).
  const { options: usuariosAreaDestino } = useCollection(COLLECTION_DEFS.usuariosRole, { qd_area: w.qd_areaDestino });
  useEffect(() => {
    setValue('qd_nuevoResponsable', usuariosAreaDestino[0]?.label ?? '');
  }, [usuariosAreaDestino, setValue]);

  // ACT-0051-03 — añade el ayudante al historial (RUL-0051-04 valida campos obligatorios).
  const reasignacionCompleta =
    !!w.qd_areaDestino && !!w.qd_motivoReasignacion && !!w.qd_observacionesReasignacion?.trim();

  const confirmarReasignacion = () => {
    if (!reasignacionCompleta || ayudantesAlcanzado) return;
    const fila: AsignacionHistorial = {
      fecha: new Date().toISOString().slice(0, 10),
      de: w.qd_responsableActual || w.qd_usuarioResponsable || '—',
      para: w.qd_nuevoResponsable || '—',
      motivo: motivoReasignacionOpts.find((m) => m.value === w.qd_motivoReasignacion)?.label ?? w.qd_motivoReasignacion,
      observaciones: w.qd_observacionesReasignacion,
    };
    setValue('qd_historialAsignaciones', [...historial, fila]);
    // limpiar el formulario de ayudante para el siguiente
    setValue('qd_areaDestino', '');
    setValue('qd_nuevoResponsable', '');
    setValue('qd_motivoReasignacion', '');
    setValue('qd_observacionesReasignacion', '');
  };

  return (
    <>
      {/* ── S5 · Asignación de Responsable (SEC-051, RUL-0051-01) ── */}
      {mostrarAsignacion && (
        <FormSection title="Asignación de Responsable">
          <div className="form-row cols-2">
            <ZdsSelect
              name="qd_areaResponsable" control={control} label="Área responsable"
              options={areaOpts} withSearch required
              rules={{ required: 'Campo requerido' }} error={err('qd_areaResponsable')}
              helpText="Áreas habilitadas para quejas (CAT-AREA)."
            />
            <ZdsSelect
              name="qd_usuarioResponsable" control={control} label="Usuario responsable"
              options={usuariosArea} withSearch required disabled={!w.qd_areaResponsable}
              rules={{ required: 'Campo requerido' }} error={err('qd_usuarioResponsable')}
              helpText="Solo usuarios autorizados del área (RUL-0051-02)."
            />
          </div>
          <div className="form-row cols-1">
            <ZdsTextarea name="qd_observacionesAsignacion" control={control}
              label="Observaciones de asignación" maxLength={2000} />
          </div>
        </FormSection>
      )}

      {/* ── S6 · Reasignación / Solicitud de ayuda (SEC-052, RUL-0051-07) ── */}
      <FormSection title="Reasignación de Caso">
        <div className="form-row cols-1">
          <ZdsRadio
            name="qd_necesitaOtrasAreas" control={control}
            label="¿Necesitas de otras áreas para dar respuesta completa?"
            options={OPTIONS.sino} inline
          />
        </div>

        {mostrarReasignacion && (
          <>
            {ayudantesAlcanzado ? (
              <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>
                Ha alcanzado el máximo de <strong>{MAX_AYUDANTES} ayudantes</strong> para este caso.
                No puede añadir más. {/* MSG-0051-06 */}
              </ZrAlert>
            ) : (
              <>
                <p className="subsection-note">
                  A quién quieres solicitar ayuda — puede añadir hasta {MAX_AYUDANTES} ayudantes
                  ({historial.length}/{MAX_AYUDANTES}).
                </p>
                <div className="form-row cols-2">
                  <ZdsSelect name="qd_areaDestino" control={control} label="Área destino"
                    options={areaOpts} withSearch error={err('qd_areaDestino')}
                    helpText="CAT-AREA." />
                  <ZdsSelect name="qd_nuevoResponsable" control={control} label="Responsable"
                    options={w.qd_nuevoResponsable ? [{ value: w.qd_nuevoResponsable, label: w.qd_nuevoResponsable }] : []}
                    disabled
                    helpText="Autocompletado según el área destino (CAT-USUARIOS-ROLE)." />
                </div>
                <div className="form-row cols-1">
                  <ZdsSelect name="qd_motivoReasignacion" control={control} label="Motivo de reasignación"
                    options={motivoReasignacionOpts} error={err('qd_motivoReasignacion')}
                    helpText="CAT-MOTIVO-REASIG." />
                </div>
                <div className="form-row cols-1">
                  <ZdsTextarea name="qd_observacionesReasignacion" control={control}
                    label="Observaciones (justificación)" maxLength={2000}
                    helpText="Obligatorio (RUL-0051-04). Queda en el historial para auditoría." />
                </div>

                {/* RUL-0051-04 — bloquea hasta completar área, motivo y observaciones. */}
                {!reasignacionCompleta && (
                  <ZrAlert config="info" {...({ 'hide-close': true } as object)}>
                    El <strong>área destino</strong>, el <strong>motivo</strong> y las{' '}
                    <strong>observaciones</strong> son obligatorios para registrar la reasignación.
                    {/* MSG-0051-03 */}
                  </ZrAlert>
                )}

                <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-75)' }}>
                  <ZrButton config="secondary" icon="plus:line"
                    disabled={!reasignacionCompleta} onClick={confirmarReasignacion}>
                    Confirmar Reasignación
                  </ZrButton>
                </div>
              </>
            )}
          </>
        )}
      </FormSection>

      {/* ── S7 · Historial de Asignaciones (SEC-053) ── */}
      {mostrarReasignacion && (
        <FormSection title="Historial de Asignaciones">
          <ZrTable zebra>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>De</th><th>Para</th><th>Motivo</th>
                  <th>Observaciones</th><th>Respondió</th><th>Comentario</th><th>Adjunto</th>
                </tr>
              </thead>
              <tbody>
                {historial.length === 0 ? (
                  <tr><td colSpan={8} className="record-empty">Sin asignaciones previas registradas</td></tr>
                ) : (
                  historial.map((row, i) => (
                    <tr key={i}>
                      <td>{row.fecha}</td>
                      <td>{row.de}</td>
                      <td>{row.para}</td>
                      <td>{row.motivo}</td>
                      <td>{row.observaciones}</td>
                      <td>{row.respondio ?? '—'}</td>
                      <td>{row.comentario ?? '—'}</td>
                      <td>{row.adjunto ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ZrTable>
        </FormSection>
      )}
    </>
  );
}
