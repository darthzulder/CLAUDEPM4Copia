interface Props {
  estadoCierreM3:   string;
  intentosCierreM3: string;
  ultimoError:      string;
}

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  'Pendiente':        { bg: '#e9f0f8', color: '#2167AE' },
  'Enviando':         { bg: '#fff8e1', color: '#d97706' },
  'Rechazado (400)':  { bg: '#fef2f2', color: '#EC5962' },
  'Aceptado (200)':   { bg: '#f0fdf4', color: '#0CA442' },
};

export default function SeccionEstadoCierre({ estadoCierreM3, intentosCierreM3, ultimoError }: Props) {
  const cfg = STATUS_CONFIG[estadoCierreM3] ?? { bg: '#f3f4f6', color: '#6b7280' };

  return (
    <div className="estado-cierre-grid">
      <div className="form-group">
        <span className="form-label">Estado del envío a SFC</span>
        <div>
          <span
            className="estado-badge"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {estadoCierreM3 || 'Pendiente'}
          </span>
        </div>
      </div>

      <div className="form-group">
        <span className="form-label">Intentos de envío</span>
        <div className="intentos-valor">{intentosCierreM3 || '0'}</div>
      </div>

      {ultimoError && (
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <span className="form-label">Último error registrado</span>
          <div className="ultimo-error-panel">
            <span className="ultimo-error-texto">{ultimoError}</span>
          </div>
        </div>
      )}
    </div>
  );
}
