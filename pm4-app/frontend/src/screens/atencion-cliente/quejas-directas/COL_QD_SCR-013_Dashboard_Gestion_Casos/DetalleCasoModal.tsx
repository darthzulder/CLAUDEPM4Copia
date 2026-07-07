import { ZrModal, ZrButton, ZdsStatusBadge } from '../../../../components/fields/ZdsFields';
import InfoBar from '../../../../components/InfoBar';
import { diasBadge, estadoVariante, type CasoDashboard } from './variables';

interface DetalleCasoModalProps {
  caso: CasoDashboard;
  tipoMap: Record<string, string>;
  areaMap: Record<string, string>;
  onClose: () => void;
}

/**
 * Modal de detalle de caso (SCR-013 · modal PAN-13). Vista de solo lectura del expediente
 * resumido. Tipo y Área se resuelven de código a descripción vía las colecciones.
 */
export default function DetalleCasoModal({ caso, tipoMap, areaMap, onClose }: DetalleCasoModalProps) {
  const dias = diasBadge(caso);
  const tipo = (tipoMap[caso.qd_tipoSolicitud] ?? caso.qd_tipoSolicitud) || '—';
  const area = (areaMap[caso.qd_areaResponsable] ?? caso.qd_areaResponsable) || '—';

  return (
    <ZrModal model onChange={(open: boolean) => { if (!open) onClose(); }}>
      <div className="section-spacer">
        <h3 style={{ margin: '0 0 var(--zs-25)', font: 'var(--zf-h-20)', fontWeight: 700, color: 'var(--z-text)' }}>
          Caso #{caso.qd_numeroCaso} — {tipo}
        </h3>
        <p className="subsection-note" style={{ margin: 0 }}>
          {area} · Responsable: {caso.qd_responsable || '—'}
        </p>
      </div>

      <InfoBar
        items={[
          { label: 'Estado', value: <ZdsStatusBadge variant={estadoVariante(caso.qd_estado)}>{caso.qd_estado}</ZdsStatusBadge> },
          { label: 'Tipo de solicitud', value: tipo },
          { label: 'Fecha de creación', value: caso.qd_fechaCreacion },
          { label: 'Fecha de vencimiento', value: caso.qd_fechaVencimiento },
          {
            label: 'Días restantes / SLA',
            value: (
              <span className="days-badge">
                <span className={`days-dot days-dot--${dias.variante}`}>{dias.dot}</span>
                {dias.texto}
              </span>
            ),
          },
          { label: 'Área responsable', value: area },
        ]}
      />

      <div className="field-wrap" style={{ marginTop: 'var(--zs-100)' }}>
        <span className="form-label">Descripción / Motivo</span>
        <p style={{ margin: '4px 0 0', font: 'var(--zf-capt-14)', color: 'var(--z-text)', whiteSpace: 'pre-wrap' }}>
          {caso.qd_descripcion || 'Sin descripción registrada.'}
        </p>
      </div>

      <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-150)' }}>
        <ZrButton config="secondary:s" onClick={onClose}>Cerrar</ZrButton>
      </div>
    </ZrModal>
  );
}
