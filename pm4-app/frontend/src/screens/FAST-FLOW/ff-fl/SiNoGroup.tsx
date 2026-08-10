import type { ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ZrSegmentedControl, ZrButton, ZrTable, ZrAlert } from '../../../components/fields/ZdsFields';
import { FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

const SI_NO_OPTIONS = [
  { value: 'SI', text: 'SÍ' },
  { value: 'NO', text: 'NO' },
];

export function SiNoField({ form, name }: { form: Form; name: keyof FfFlSolicitudFormData }) {
  return (
    <Controller
      name={name}
      control={form.control}
      defaultValue="NO"
      render={({ field }) => (
        <ZrSegmentedControl
          name={field.name}
          model={field.value ? String(field.value) : 'NO'}
          onChange={(val: string | null) => field.onChange(val ?? 'NO')}
          onBlur={field.onBlur}
          {...({ options: SI_NO_OPTIONS } as Record<string, unknown>)}
        />
      )}
    />
  );
}

export function SiNoSelectAll({ form, prefix, count }: {
  form: Form;
  prefix: string;
  count: number;
}) {
  const { setValue } = form;
  // Armamos las claves de todas las preguntas del bloque
  const lstKeys = Array.from({ length: count }, (_, i) =>
    `${prefix}${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData
  );
  return (
    <div z-flex="50" z-align="right" style={{ marginBottom: 'var(--zs-50)' }}>
      <ZrButton config="secondary:s" icon="check:line" onClick={() => lstKeys.forEach((strKey) => setValue(strKey, 'SI'))}>
        Marcar todas SÍ
      </ZrButton>
      <ZrButton config="secondary:s" icon="close:line" onClick={() => lstKeys.forEach((strKey) => setValue(strKey, 'NO'))}>
        Marcar todas NO
      </ZrButton>
    </div>
  );
}

/**
 * Subsección con cuestionario SÍ/NO: título + intro + "marcar todas" + tabla
 * (#/pregunta/SÍ-NO) + alerta de bloqueo opcional.
 * Bloquea cuando alguna respuesta es igual a `blockOn` (p. ej. perfil bloquea con 'SI',
 * requisitos con 'NO'). Sin `blockOn`/`blockMsg` no muestra alerta.
 */
export function SiNoQuestionTable({
  form,
  title,
  intro,
  prefix,
  items,
  colHeader = 'La sociedad y sus filiales (si aplica) afirman que:',
  blockOn,
  blockMsg,
}: {
  form: Form;
  title: string;
  intro: ReactNode;
  prefix: string;
  items: readonly string[];
  colHeader?: string;
  blockOn?: 'SI' | 'NO';
  blockMsg?: string;
}) {
  const objWatch = form.watch();
  // Marcamos el bloqueo si alguna respuesta coincide con el valor que bloquea
  const blnBlocked = !!blockOn && items.some(
    (_, i) => objWatch[`${prefix}${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData] === blockOn
  );
  return (
    <div className="form-subsection form-subsection--stack">
      <div className="form-subsection-title">{title}</div>
      <p className="subsection-intro">{intro}</p>
      <SiNoSelectAll form={form} prefix={prefix} count={items.length} />
      <ZrTable>
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }} {...({ config: 'center' } as object)}>#</th>
              <th>{colHeader}</th>
              <th style={{ width: 120 }} {...({ config: 'center' } as object)}>SÍ / NO</th>
            </tr>
          </thead>
          <tbody>
            {/* Recorremos las preguntas para pintar cada fila con su control SÍ/NO */}
            {items.map((strQuestion, i) => {
              const strFieldName = `${prefix}${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData;
              return (
                <tr key={strFieldName}>
                  <td {...({ config: 'center' } as object)}>{i + 1}</td>
                  <td>{strQuestion}</td>
                  <td {...({ config: 'center' } as object)}><SiNoField form={form} name={strFieldName} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ZrTable>
      {/* Mostramos la alerta de bloqueo solo si corresponde */}
      {blnBlocked && blockMsg && (
        <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>{blockMsg}</ZrAlert>
      )}
    </div>
  );
}
