import { useState } from 'react';
import type { MutableRefObject } from 'react';
import type { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { ZrButton, ZdsFileInput } from './fields/ZdsFields';

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
 * ZdsFileInput y botón "Agregar documento" hasta `max`.
 */
export default function DocSupportUploader<T extends FieldValues>({
  form,
  fileRegistry,
  docKeys,
  title = 'Documento de soporte de las confirmaciones',
  intro = 'Por favor cargue aquí el documento de respaldo proporcionado por el intermediario. Se pueden agregar hasta 3 documentos.',
  max = 3,
}: DocSupportUploaderProps<T>) {
  const { watch, setValue, setError, clearErrors, control, formState: { errors } } = form;
  const w = watch();
  const [numDocs, setNumDocs] = useState(1);
  const limit = Math.min(max, docKeys.length);

  const handleRemoveSlot = (indexToDelete: number) => {
    // Shift subsequent fields up
    for (let i = indexToDelete; i < numDocs - 1; i++) {
      const currentKey = docKeys[i];
      const nextKey = docKeys[i + 1];
      const nextVal = (w as Record<string, unknown>)[nextKey as string];

      // Shift form state values
      if (nextVal) {
        setValue(currentKey, nextVal as never);
      } else {
        setValue(currentKey, '' as never);
      }

      // Shift file registry
      const nextFile = fileRegistry.current.get(nextKey as string);
      if (nextFile) {
        fileRegistry.current.set(currentKey as string, nextFile);
      } else {
        fileRegistry.current.delete(currentKey as string);
      }

      // Shift errors
      const nextError = (errors as Record<string, any>)[nextKey]?.message;
      if (nextError) {
        setError(currentKey, { type: 'manual', message: nextError } as never);
      } else {
        clearErrors(currentKey);
      }
    }

    // Clear the last slot
    const lastKey = docKeys[numDocs - 1];
    setValue(lastKey, '' as never);
    fileRegistry.current.delete(lastKey as string);
    clearErrors(lastKey);

    // Decrement count
    setNumDocs((n) => Math.max(1, n - 1));
  };

  return (
    <div className="form-subsection form-subsection--stack">
      <div className="form-subsection-title">{title}</div>
      <p className="subsection-intro">{intro}</p>
      <div z-flex="col:75">
        {docKeys.slice(0, numDocs).map((docKey, i) => {
          const errorMsg = (errors as Record<string, any>)[docKey]?.message;
          return (
            <div key={docKey} className="doc-row">
              <span className="doc-row-label">Documento {i + 1}</span>
              <ZdsFileInput
                control={control}
                name={docKey}
                fileRegistry={fileRegistry}
                setValue={setValue}
                setError={setError}
                clearErrors={clearErrors}
                error={errorMsg}
                allowedExtensions={['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']}
                maxSizeMb={5}
                errorMessage="Solo se permiten archivos pdf, jpg, png o docx, máx 5 MB (MSG-000-06)"
              />
              {numDocs > 1 && (
                <ZrButton
                  config="secondary:s"
                  icon="trash:line"
                  onClick={() => handleRemoveSlot(i)}
                  {...({ title: 'Eliminar documento' } as Record<string, unknown>)}
                />
              )}
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
