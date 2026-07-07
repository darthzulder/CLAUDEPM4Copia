import { useRef } from 'react';
import { ZrButton, ZrSelect, ZrIcon, ZdsStatusBadge } from './fields/ZdsFields';

export interface DocItemState {
  file: File | null;
  blobUrl: string | null;
}

interface DocItemProps {
  index: number;
  descripcion: string;
  onPreview: () => void;
  mode: 'upload' | 'validation';
  
  // upload mode specific
  vigencia?: string;
  state?: DocItemState;
  onFileChange?: (file: File) => void;

  // validation mode specific
  fileId?: number | null;
  fileName?: string;
  validacion?: string;
  onValidacion?: (val: any) => void;
  valOpciones?: { value: string; label: string }[];
}

export default function DocItem({
  index,
  descripcion,
  onPreview,
  mode,
  vigencia,
  state,
  onFileChange,
  fileId,
  fileName,
  validacion,
  onValidacion,
  valOpciones = [],
}: DocItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (mode === 'validation') {
    // Marcamos el documento como cargado si tiene id de archivo.
    const blnLoaded = fileId !== null;
    // Derivamos la clase CSS segun el estado de validacion.
    const strValidationCls = validacion ? validacion.toLowerCase().replace('_', '-') : 'en-revision';
    return (
      <div className={`doc-item doc-item--validation${blnLoaded ? ' is-loaded' : ''}`}>
        {/* Badge coloreado por estado de validación */}
        <div className={`doc-num-badge doc-num-badge--${strValidationCls}`}>
          {index}
        </div>

        {/* Descripción */}
        <div className="doc-body doc-table-col-desc">
          <span className="doc-desc">{descripcion}</span>
        </div>

        {/* Archivo + botón ver */}
        <div className="doc-file-area--validation doc-table-col-file">
          {blnLoaded ? (
            <span className="file-name-chip">
              <ZrIcon icon="file-blank:line" config="xs" />
              {fileName}
            </span>
          ) : (
            <span className="file-name-empty">Sin documento</span>
          )}
          <ZrButton
            config="secondary:s"
            icon="visibility-on:line"
            disabled={!blnLoaded}
            onClick={onPreview}
          >
            Ver
          </ZrButton>
        </div>

        {/* Select de validación — ZrSelect ZDS */}
        <div className="validation-select-wrap doc-table-col-val">
          {onValidacion && (
            <ZrSelect
              config="line"
              label=""
              model={validacion || ''}
              options={valOpciones.map((in_objOpt) => ({ value: in_objOpt.value, text: in_objOpt.label }))}
              onChange={(in_strValue: string | null) => onValidacion(in_strValue || '')}
            />
          )}
        </div>
      </div>
    );
  }

  // mode === 'upload'
  // Marcamos como cargado si hay archivo en estado o id de archivo.
  const blnLoaded = !!state?.file || (fileId !== null && fileId !== undefined);
  // Texto por defecto cuando el documento aun no se carga.
  const strPendingLabel = onFileChange ? 'Pendiente' : 'Sin documento';

  return (
    <div className={`doc-item${blnLoaded ? ' is-loaded' : ''}`}>
      {/* Índice */}
      <div className={`doc-num-badge${blnLoaded ? ' doc-num-badge--loaded' : ''}`}>
        {blnLoaded ? '✓' : index}
      </div>

      {/* Descripción */}
      <div className="doc-body">
        <span className="doc-desc">{descripcion}</span>
        {vigencia && <span className="doc-meta">{vigencia}</span>}
      </div>

      {/* Estado */}
      <div className="doc-status-wrap">
        <ZdsStatusBadge variant={blnLoaded ? 'success' : onFileChange ? 'danger' : 'neutral'}>
          {blnLoaded ? 'Cargado' : strPendingLabel}
        </ZdsStatusBadge>
      </div>

      {/* Acciones / Nombre del archivo */}
      <div className="doc-file-area">
        {onFileChange && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={(in_objEvent) => {
                // Tomamos el primer archivo seleccionado y lo notificamos.
                const objFile = in_objEvent.target.files?.[0];
                if (objFile && onFileChange) onFileChange(objFile);
                in_objEvent.target.value = '';
              }}
            />
            <ZrButton
              config="secondary:s"
              icon="document-upload:line"
              wide
              onClick={() => inputRef.current?.click()}
            >
              {blnLoaded ? 'Cambiar' : 'Seleccionar archivo'}
            </ZrButton>
          </>
        )}
        {blnLoaded && (state?.file || fileName) && (
          <span className="file-name-chip">
            <ZrIcon icon="file-blank:line" config="xs" />
            {state?.file?.name || fileName}
          </span>
        )}
        {!blnLoaded && !onFileChange && (
          <span className="file-name-empty">—</span>
        )}
      </div>

      {/* Vista previa */}
      <div className="doc-preview-trigger">
        <ZrButton
          config="secondary:s"
          icon="visibility-on:line"
          disabled={!blnLoaded}
          onClick={onPreview}
        >
          {onFileChange ? 'Vista previa' : 'Ver'}
        </ZrButton>
      </div>
    </div>
  );
}
