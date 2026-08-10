import type { ReactNode } from 'react';
import { ZrModal, ZrButton, ZrTable, ZdsStatusBadge } from '../../../../components/fields/ZdsFields';
import InfoBar from '../../../../components/InfoBar';
import RequestFileList from '../../../../components/RequestFileList';
import {
  QD, SCR000_ADJUNTO_KEYS, SCR0051_ADJUNTO_KEYS, SCR0051_OPTIONS_FAVOR,
} from '../fields/fields';
import type { DetalleReasignacionRespuestaFormData } from '../fields/fields';
import type { AsignacionHistorial } from '../fields/types';
import DocumentosRadicador from './DocumentosRadicador';

interface InfoItem { label: string; value: ReactNode; }
interface DocPair { label: string; value?: string | number | null; }

// Lee la descripción legible de un campo respaldado por catálogo (companion `<campo>_desc`
// sincronizado por useSyncDesc en las secciones del formulario), con fallback al código
// crudo si el catálogo aún no resolvió una etiqueta.
function desc(in_dicWatch: Record<string, unknown>, in_strField: string): string {
  return String(in_dicWatch[`${in_strField}_desc`] ?? in_dicWatch[in_strField] ?? '');
}

// Fila label/valor — se omite por completo si el valor viene vacío.
function DocField({ label, value }: DocPair) {
  const strValue = value === undefined || value === null ? '' : String(value).trim();
  if (!strValue) return null;
  return (
    <div className="zds-field-wrap">
      <span className="info-bar-label">{label}</span>
      <div className="info-bar-value" style={{ marginTop: 'var(--zs-50)' }}>{strValue}</div>
    </div>
  );
}

// Sección del documento: título + grilla de pares label/valor. Se omite la sección
// COMPLETA (título incluido) si ninguno de sus campos trae dato — "solo si hay datos".
function DocSection({ title, items, children }: { title: string; items?: DocPair[]; children?: ReactNode }) {
  const cllVisibles = (items ?? []).filter((it) => {
    const strValue = it.value === undefined || it.value === null ? '' : String(it.value).trim();
    return !!strValue;
  });
  return (
    <OptionalSection show={cllVisibles.length > 0 || !!children} title={title}>
      {cllVisibles.length > 0 && (
        <div className="form-row cols-2">
          {cllVisibles.map((it) => <DocField key={it.label} {...it} />)}
        </div>
      )}
      {children}
    </OptionalSection>
  );
}

// Bloque con título de subsección, oculto por completo cuando `show` es falso — para
// secciones que traen componentes propios (listas de archivos, tabla) en vez de pares
// label/valor. Devolver siempre un JSX.Element (nunca `false`) es lo que permite anidar
// esto dentro de ZrModal, cuyo slot `children` no acepta booleanos sueltos.
function OptionalSection({ show, title, children }: { show: boolean; title: string; children?: ReactNode }) {
  if (!show) return null;
  return (
    <div style={{ marginTop: 'var(--zs-200)' }}>
      <div className="form-subsection-title">{title}</div>
      {children}
    </div>
  );
}

interface Props {
  data: DetalleReasignacionRespuestaFormData;
  infoItems: InfoItem[];
  nombre: string;
  identificacion: string;
  requestId: number | null;
  onClose: () => void;
}

/**
 * ACT-0051-06 · "Ver Expediente Completo" — documento de solo lectura con los datos del
 * caso que YA llegaron al formulario (task.data); no dispara peticiones nuevas. Cada
 * campo/sección se omite si no tiene dato cargado, para que se lea como un expediente
 * real y no como un formulario con huecos.
 */
export default function ExpedienteCompletoModal({ data, infoItems, nombre, identificacion, requestId, onClose }: Props) {
  const objWatch = data as unknown as Record<string, unknown>;
  const lstHistory: AsignacionHistorial[] = Array.isArray(data[QD.lstAssignHistory]) ? data[QD.lstAssignHistory] : [];
  const strFavorLabel = SCR0051_OPTIONS_FAVOR.find((o) => o.value === data[QD.strFavorability])?.label;
  const blnHasRadicadorDocs = SCR000_ADJUNTO_KEYS.some((strKey) => !!objWatch[strKey]);
  const blnHasSoportes = SCR0051_ADJUNTO_KEYS.some((strKey) => !!objWatch[strKey]);

  return (
    <ZrModal model onChange={(open: boolean) => { if (!open) onClose(); }}>
      <div className="modal-wide">
        <h3 style={{ margin: '0 0 var(--zs-25)', font: 'var(--zf-h-20--700)', color: 'var(--z-text)' }}>
          Expediente del Caso
        </h3>
        <p className="subsection-note" style={{ margin: '0 0 var(--zs-150)' }}>
          {nombre}{identificacion ? ` · ${identificacion}` : ''}
        </p>

        <div className="modal-scroll-body">
          <InfoBar items={infoItems} />

          <DocSection title="Datos del Consumidor" items={[
            { label: 'Nombre del Consumidor', value: nombre },
            { label: 'Tipo y N.° de Identificación', value: identificacion },
            { label: 'Correo Electrónico', value: data[QD.strEmail] },
            { label: 'Tipo de Persona', value: desc(objWatch, QD.strPersonType) },
          ]} />

          <DocSection title="Clasificación Regulatoria" items={[
            { label: 'Producto SFC', value: desc(objWatch, QD.strSfcProduct) },
            { label: 'Momento', value: data[QD.strInteraction] },
            { label: 'Servicio', value: data[QD.strServiceProvided] },
            { label: 'Placa', value: data[QD.strPlate] },
            { label: 'Motivo SFC', value: desc(objWatch, QD.strSfcReason) },
            { label: 'Canal de Recepción', value: desc(objWatch, QD.strChannel) },
            { label: 'Instancia de Recepción', value: desc(objWatch, QD.strReceptionInstance) },
            { label: 'Admisión', value: desc(objWatch, QD.strAdmission) },
            { label: 'Ente de Control', value: desc(objWatch, QD.strControlEntity) },
            { label: 'Escalamiento Defensor', value: data[QD.strOmbudsmanEscalation] },
            { label: 'Compensación', value: data[QD.strCompensation] },
            { label: 'Relación con Fraude', value: data[QD.strFraudRelated] },
          ]} />

          <DocSection title="Descripción de la Queja" items={[
            { label: 'Descripción / Texto de la Queja', value: data[QD.strComplaintText] },
          ]} />

          <OptionalSection show={blnHasRadicadorDocs} title="Documentos del Radicador">
            <DocumentosRadicador requestId={requestId} docKeys={SCR000_ADJUNTO_KEYS} />
          </OptionalSection>

          <DocSection title="Asignación / Reasignación" items={[
            { label: 'Área a Cargo', value: data[QD.strAssigneeArea] },
            { label: 'Usuario Responsable', value: desc(objWatch, QD.strAssigneeUser) },
            { label: 'Comentario de Reasignación', value: data[QD.strAssignmentRemarks] },
          ]} />

          <OptionalSection show={lstHistory.length > 0} title="Historial de Asignaciones">
            <ZrTable zebra>
              <table>
                <thead>
                  <tr><th>Fecha</th><th>De</th><th>Para</th><th>Observaciones</th><th>Respondió</th></tr>
                </thead>
                <tbody>
                  {lstHistory.map((objRow, intIndex) => (
                    <tr key={intIndex}>
                      <td>{objRow.fecha}</td>
                      <td>{objRow.de}</td>
                      <td>{objRow.para}</td>
                      <td>{objRow.observaciones}</td>
                      <td>{objRow.respondio === 'si' ? <ZdsStatusBadge variant="success">✓</ZdsStatusBadge> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ZrTable>
          </OptionalSection>

          <DocSection title="Respuesta" items={[
            { label: 'Respuesta a favor de', value: strFavorLabel },
            { label: 'Observaciones SAC', value: data[QD.strSacRemarks] },
            { label: 'Respuesta al Cliente', value: data[QD.strClientResponse] },
            { label: 'Acciones Tomadas', value: data[QD.strActionsTaken] },
          ]} />

          <OptionalSection show={blnHasSoportes} title="Soportes Internos">
            <RequestFileList
              requestId={requestId}
              docKeys={SCR0051_ADJUNTO_KEYS}
              label="Adjuntos de soporte"
              emptyText="Sin soportes internos cargados."
              loadingText="Buscando soportes internos del caso…"
            />
          </OptionalSection>
        </div>

        <div z-flex="75" z-align="right:center" style={{ marginTop: 'var(--zs-200)' }}>
          <ZrButton config="secondary:s" onClick={onClose}>Cerrar</ZrButton>
        </div>
      </div>
    </ZrModal>
  );
}
