import { ZrTable, ZrButton, ZdsStatusBadge } from '../../../../components/fields/ZdsFields';
import { diasRestantesTexto, estadoVariante } from './dashboardHelpers';
import type { CasoDashboard } from '../fields/types';

interface TablaCasosProps {
  casos: CasoDashboard[];
  tipoMap: Record<string, string>;
  areaMap: Record<string, string>;
  onVer: (caso: CasoDashboard) => void;
}

/**
 * Tabla consolidada de casos (SCR-013). Columnas: # Caso, Tipo, Creación, SLA, Vencimiento,
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
            <th>SLA</th>
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
            <tr key={c.id}>
                <td><strong>{c.numeroCaso}</strong></td>
                <td>{(tipoMap[c.tipoSolicitud] ?? c.tipoSolicitud) || '—'}</td>
                <td>{c.fechaCreacion}</td>
                <td>{c.sla ? `${c.sla} días` : '—'}</td>
                <td>{c.fechaVencimiento}</td>
                <td>{diasRestantesTexto(c)}</td>
                <td>
                  <ZdsStatusBadge variant={estadoVariante(c.estado)}>{c.estado}</ZdsStatusBadge>
                </td>
                <td>{(areaMap[c.areaResponsable] ?? c.areaResponsable) || '—'}</td>
                <td>{c.responsable || '—'}</td>
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
