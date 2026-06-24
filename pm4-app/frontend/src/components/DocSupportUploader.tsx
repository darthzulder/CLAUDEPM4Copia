import { useState } from 'react';
import type { MutableRefObject } from 'react';
import type { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { ZrButton, ZrFileInput } from './fields/ZdsFields';

interface DocSupportUploaderProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  fileRegistry: MutableRefObject<Map<string, File>>;
  docKeys: readonly Path<T>[];
  title?: string;
  intro?: string;
  max?: number;
}

/**
 * Bloque reutilizable "Documento de soporte": lista de filas con label +
 * ZrFileInput (drag&drop) y botón "Agregar documento" hasta `max`.
 * Cablea cada archivo al formulario (setValue) y al fileRegistry para el upload.
 */
export default function DocSupportUploader<T extends FieldValues>({
  form,
  fileRegistry,
  docKeys,
  title = 'Documento de soporte de las confirmaciones',
  intro = 'Por favor cargue aquí el documento de respaldo proporcionado por el intermediario. Se pueden agregar hasta 3 documentos.',
  max = 3,
}: DocSupportUploaderProps<T>) {
  const { watch, setValue, register } = form;
  const w = watch();
  const [numDocs, setNumDocs] = useState(1);
  const limit = Math.min(max, docKeys.length);

  return (
    <div className="form-subsection form-subsection--stack">
      <div className="form-subsection-title">{title}</div>
      <p className="subsection-intro">{intro}</p>
      <div z-flex="col:75">
        {docKeys.slice(0, numDocs).map((docKey, i) => {
          const fileName = (w as Record<string, unknown>)[docKey] as string | undefined;
          return (
            <div key={docKey} className="doc-row">
              <span className="doc-row-label">Documento {i + 1}</span>
              <ZrFileInput
                label=""
                model={fileName || null}
                droppable
                onChange={(file: File | string | null) => {
                  if (file && typeof file !== 'string') {
                    setValue(docKey, file.name as never);
                    fileRegistry.current.set(docKey, file);
                  } else if (!file) {
                    setValue(docKey, '' as never);
                    fileRegistry.current.delete(docKey);
                  }
                }}
                {...({ accept: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'] } as Record<string, unknown>)}
              />
              <input type="hidden" {...register(docKey)} />
            </div>
          );
        })}
      </div>
      {numDocs < limit && (
        <ZrButton
          config="secondary"
          onClick={() => setNumDocs((n) => n + 1)}
          style={{ marginTop: 'var(--zs-75)' }}
          icon="plus:line"
        >
          Agregar documento
        </ZrButton>
      )}
    </div>
  );
}
