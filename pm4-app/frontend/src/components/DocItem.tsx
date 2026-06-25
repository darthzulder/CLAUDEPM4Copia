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
    const cargado = fileId !== null;
    const validationClass = validacion ? validacion.toLowerCase().replace('_', '-') : 'en-revision';
    return (
      <div className={`doc-item doc-item--validation${cargado ? ' is-loaded' : ''}`}>
        {/* Badge coloreado por estado de validación */}
        <div className={`doc-num-badge doc-num-badge--${validationClass}`}>
          {index}
        </div>

        {/* Descripción */}
        <div className="doc-body doc-table-col-desc">
          <span className="doc-desc">{descripcion}</span>
        </div>

        {/* Archivo + botón ver */}
        <div className="doc-file-area--validation doc-table-col-file">
          {cargado ? (
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
            disabled={!cargado}
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
              options={valOpciones.map((o) => ({ value: o.value, text: o.label }))}
              onChange={(v: string | null) => onValidacion(v || '')}
            />
          )}
        </div>
      </div>
    );
  }

  // mode === 'upload'
  const cargado = !!state?.file || (fileId !== null && fileId !== undefined);
  const pendingLabel = onFileChange ? 'Pendiente' : 'Sin documento';

  return (
    <div className={`doc-item${cargado ? ' is-loaded' : ''}`}>
      {/* Índice */}
      <div className={`doc-num-badge${cargado ? ' doc-num-badge--loaded' : ''}`}>
        {cargado ? '✓' : index}
      </div>

      {/* Descripción */}
      <div className="doc-body">
        <span className="doc-desc">{descripcion}</span>
        {vigencia && <span className="doc-meta">{vigencia}</span>}
      </div>

      {/* Estado */}
      <div className="doc-status-wrap">
        <ZdsStatusBadge variant={cargado ? 'success' : onFileChange ? 'danger' : 'neutral'}>
          {cargado ? 'Cargado' : pendingLabel}
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
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && onFileChange) onFileChange(f);
                e.target.value = '';
              }}
            />
            <ZrButton
              config="secondary:s"
              icon="document-upload:line"
              wide
              onClick={() => inputRef.current?.click()}
            >
              {cargado ? 'Cambiar' : 'Seleccionar archivo'}
            </ZrButton>
          </>
        )}
        {cargado && (state?.file || fileName) && (
          <span className="file-name-chip">
            <ZrIcon icon="file-blank:line" config="xs" />
            {state?.file?.name || fileName}
          </span>
        )}
        {!cargado && !onFileChange && (
          <span className="file-name-empty">—</span>
        )}
      </div>

      {/* Vista previa */}
      <div className="doc-preview-trigger">
        <ZrButton
          config="secondary:s"
          icon="visibility-on:line"
          disabled={!cargado}
          onClick={onPreview}
        >
          {onFileChange ? 'Vista previa' : 'Ver'}
        </ZrButton>
      </div>
    </div>
  );
}
