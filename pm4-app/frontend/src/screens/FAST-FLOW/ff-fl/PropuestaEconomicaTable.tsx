import type { ReactNode } from 'react';
import type { UseFormReturn, FieldPath } from 'react-hook-form';
import { ZdsSelect, ZrTable } from '../../../components/fields/ZdsFields';
import { FfFlSolicitudFormData } from './variables';

type ZdsOption = { value: string; label?: string; text?: string; disabled?: boolean };

/**
 * Tabla "Propuesta económica" estándar: 3 filas #/límite(ZdsSelect)/modalidad fija,
 * con intro y nota opcionales. Reutilizable por los productos cuyo límite es un único
 * select por fila (D&O, PI, PDySI). CC usa una variante propia con agregado.
 */
export function PropuestaEconomicaTable({
  form,
  fields,
  options,
  intro,
  note,
}: {
  form: UseFormReturn<FfFlSolicitudFormData>;
  fields: readonly FieldPath<FfFlSolicitudFormData>[];
  options: readonly ZdsOption[];
  intro?: ReactNode;
  note?: ReactNode;
}) {
  const { control } = form;
  return (
    <div className="form-subsection form-subsection--stack">
      <div className="form-subsection-title">Propuesta económica</div>
      {intro && <p className="subsection-intro">{intro}</p>}
      <ZrTable>
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }} {...({ config: 'center' } as object)}>#</th>
              <th>Límite asegurado</th>
              <th>Modalidad de cobertura</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, i) => (
              <tr key={field}>
                <td {...({ config: 'center' } as object)}>{i + 1}</td>
                <td>
                  <ZdsSelect
                    label=""
                    name={field}
                    control={control}
                    options={options}
                    placeholder="Seleccione un límite"
                  />
                </td>
                <td>Todo y cada reclamo en el agregado anual</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ZrTable>
      {note && <p className="subsection-note">{note}</p>}
    </div>
  );
}
