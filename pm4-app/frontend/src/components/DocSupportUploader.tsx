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
  // Valores actuales del formulario para poder desplazar los slots.
  const objWatch = watch();
  const [numDocs, setNumDocs] = useState(1);
  // Tope real de documentos, acotado por la cantidad de claves disponibles.
  const intLimit = Math.min(max, docKeys.length);

  const handleRemoveSlot = (in_intIdxDelete: number) => {
    // Desplazamos hacia arriba los campos posteriores al eliminado.
    for (let intI = in_intIdxDelete; intI < numDocs - 1; intI++) {
      const strCurrentKey = docKeys[intI];
      const strNextKey = docKeys[intI + 1];
      const objNextVal = (objWatch as Record<string, unknown>)[strNextKey as string];

      // Desplazamos el valor del formulario.
      if (objNextVal) {
        setValue(strCurrentKey, objNextVal as never);
      } else {
        setValue(strCurrentKey, '' as never);
      }

      // Desplazamos el archivo en el registro.
      const objNextFile = fileRegistry.current.get(strNextKey as string);
      if (objNextFile) {
        fileRegistry.current.set(strCurrentKey as string, objNextFile);
      } else {
        fileRegistry.current.delete(strCurrentKey as string);
      }

      // Desplazamos el mensaje de error.
      const strNextError = (errors as Record<string, any>)[strNextKey]?.message;
      if (strNextError) {
        setError(strCurrentKey, { type: 'manual', message: strNextError } as never);
      } else {
        clearErrors(strCurrentKey);
      }
    }

    // Limpiamos el ultimo slot.
    const strLastKey = docKeys[numDocs - 1];
    setValue(strLastKey, '' as never);
    fileRegistry.current.delete(strLastKey as string);
    clearErrors(strLastKey);

    // Reducimos el contador de documentos.
    setNumDocs((n) => Math.max(1, n - 1));
  };

  return (
    <div className="form-subsection form-subsection--stack">
      <div className="form-subsection-title">{title}</div>
      <p className="subsection-intro">{intro}</p>
      <div z-flex="col:75">
        {docKeys.slice(0, numDocs).map((docKey, in_intIdx) => {
          const strErrorMsg = (errors as Record<string, any>)[docKey]?.message;
          return (
            <div key={docKey} className="doc-row">
              <span className="doc-row-label">Documento {in_intIdx + 1}</span>
              <ZdsFileInput
                control={control}
                name={docKey}
                fileRegistry={fileRegistry}
                setValue={setValue}
                setError={setError}
                clearErrors={clearErrors}
                error={strErrorMsg}
                allowedExtensions={['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']}
                maxSizeMb={5}
                errorMessage="Solo se permiten archivos pdf, jpg, png o docx, máx 5 MB (MSG-000-06)"
              />
              {numDocs > 1 && (
                <ZrButton
                  config="secondary:s"
                  icon="trash:line"
                  onClick={() => handleRemoveSlot(in_intIdx)}
                  {...({ title: 'Eliminar documento' } as Record<string, unknown>)}
                />
              )}
            </div>
          );
        })}
      </div>
      {numDocs < intLimit && (
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
