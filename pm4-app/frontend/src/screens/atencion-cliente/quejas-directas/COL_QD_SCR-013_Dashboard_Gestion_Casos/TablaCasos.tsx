import { ZrTable, ZrButton, ZdsStatusBadge } from '../../../../components/fields/ZdsFields';
import { diasRestantesTexto, estadoVariante, type CasoDashboard } from './variables';

interface TablaCasosProps {
  casos: CasoDashboard[];
  tipoMap: Record<string, string>;
  areaMap: Record<string, string>;
  onVer: (caso: CasoDashboard) => void;
}

/**
 * Tabla consolidada de casos (SCR-013). Columnas: # Caso, Tipo, Creación, Vencimiento,
 * Días (semáforo), Estado (píldora DS), Área, Responsable, Acción (Ver).
 * Tipo y Área se muestran resolviendo el código de la colección a su descripción.
 */
export default function TablaCasos({ casos, tipoMap, areaMap, onVer }: TablaCasosProps) {
  if (casos.length === 0) {
    return <p className="subsection-note">No hay casos que coincidan con los filtros seleccionados.</p>;
  }

  return (
    <ZrTable>
      <table>
        <thead>
          <tr>
            <th># Caso</th>
            <th>Tipo</th>
            <th>Creación</th>
            <th>Vencimiento</th>
            <th>Días restantes</th>
            <th>Estado</th>
            <th>Área</th>
            <th>Responsable</th>
            <th {...({ config: 'center' } as object)}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((c) => (
            <tr key={c.qd_id}>
                <td><strong>{c.qd_numeroCaso}</strong></td>
                <td>{(tipoMap[c.qd_tipoSolicitud] ?? c.qd_tipoSolicitud) || '—'}</td>
                <td>{c.qd_fechaCreacion}</td>
                <td>{c.qd_fechaVencimiento}</td>
                <td>{diasRestantesTexto(c)}</td>
                <td>
                  <ZdsStatusBadge variant={estadoVariante(c.qd_estado)}>{c.qd_estado}</ZdsStatusBadge>
                </td>
                <td>{(areaMap[c.qd_areaResponsable] ?? c.qd_areaResponsable) || '—'}</td>
                <td>{c.qd_responsable || '—'}</td>
                <td {...({ config: 'center' } as object)}>
                  <ZrButton config="secondary:s" onClick={() => onVer(c)}>Ver</ZrButton>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
    </ZrTable>
  );
}
