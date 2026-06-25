import { useState } from 'react';
import { useForm } from 'react-hook-form';
import FormSection from '../../components/FormSection';
import {
  ZdsInput, ZdsSelect, ZdsRadio, ZdsDate, ZdsTextarea, ZdsCheckboxField,
  ZdsSegmented, ZdsStepper, ZdsCalendar, ZdsStatusBadge,
  ZrButton, ZrAlert, ZrProgressBar, ZrTag, ZrChip, ZrBadge, ZrLoader,
  ZrCard, ZrTile, ZrTabs, ZrTable, ZrTooltip, ZrInputGroup,
  ZrModal, ZrSidebar, ZrTextInput,
} from '../../components/fields/ZdsFields';

/**
 * Catálogo interno de Zurich DS — "mini-Storybook".
 * Renderiza cada componente de la fachada con sus variantes. Sirve como
 * referencia visual viva y para detectar regresiones de un vistazo.
 * Ruta: ?screen=ds-catalog
 */
const SELECT_OPTS = [
  { value: 'a', text: 'Opción A' },
  { value: 'b', text: 'Opción B' },
  { value: 'c', text: 'Opción C' },
] as const;

const SINO = [
  { value: 'si', text: 'Sí' },
  { value: 'no', text: 'No' },
] as const;

const flex = (v: string) => ({ ['z-flex' as never]: v } as object);

export default function DsCatalog() {
  const { control } = useForm({
    defaultValues: {
      txt: 'Texto de ejemplo', sel: 'b', rad: 'a', fec: '', area: 'Comentario…',
      chk: true, seg: 'si', step: 2, cal: '',
    },
  });
  const [tab, setTab] = useState(1);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="screen-wrapper">
      <div className="screen-content" {...flex('col:200')}>
        <div>
          <h1 style={{ font: 'var(--zf-body-20--700)', color: 'var(--z-text)', marginBottom: 'var(--zs-25)' }}>Catálogo Zurich DS</h1>
          <p className="subsection-intro">Componentes consumidos desde la fachada <code>ZdsFields</code>. Fuente de verdad visual del proyecto.</p>
        </div>

        {/* ── Botones ─────────────────────────────────────────── */}
        <FormSection title="Botones">
          <div {...flex('100')} style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <ZrButton config="primary">Primario</ZrButton>
            <ZrButton config="secondary">Secundario</ZrButton>
            <ZrButton config="negative">Destructivo</ZrButton>
            <ZrButton config="primary" icon="check:line">Con ícono</ZrButton>
            <ZrButton config="secondary:s">Pequeño</ZrButton>
            <ZrTooltip text="Tooltip sobre un botón" config="top">
              <ZrButton config="secondary" icon="info:line">Con tooltip</ZrButton>
            </ZrTooltip>
          </div>
        </FormSection>

        {/* ── Campos de formulario ────────────────────────────── */}
        <FormSection title="Campos de formulario">
          <div className="form-row cols-2">
            <ZdsInput control={control} name="txt" label="Texto" />
            <ZdsSelect control={control} name="sel" label="Select" options={SELECT_OPTS} />
            <ZdsDate control={control} name="fec" label="Fecha" />
            <ZdsRadio control={control} name="rad" label="Radio" options={SELECT_OPTS} inline />
          </div>
          <ZdsTextarea control={control} name="area" label="Área de texto" />
          <div {...flex('200')} style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <ZdsCheckboxField control={control} name="chk" label="Acepto los términos" />
            <ZdsSegmented control={control} name="seg" options={SINO} />
          </div>
          <ZdsStepper control={control} name="step" label="Paso" steps={5} center />
        </FormSection>

        {/* ── InputGroup ──────────────────────────────────────── */}
        <FormSection title="Grupo de inputs (InputGroup)">
          <ZrInputGroup legend="Importe">
            <output>€</output>
            <ZrTextInput label="Cantidad" />
          </ZrInputGroup>
        </FormSection>

        {/* ── Calendario inline ───────────────────────────────── */}
        <FormSection title="Calendario (inline)">
          <ZdsCalendar control={control} name="cal" wide />
        </FormSection>

        {/* ── Estados y etiquetas ─────────────────────────────── */}
        <FormSection title="Estados y etiquetas">
          <div {...flex('75')} style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <ZdsStatusBadge variant="success">Aprobado</ZdsStatusBadge>
            <ZdsStatusBadge variant="danger">Rechazado</ZdsStatusBadge>
            <ZdsStatusBadge variant="info">En revisión</ZdsStatusBadge>
            <ZdsStatusBadge variant="neutral">Pendiente</ZdsStatusBadge>
            <ZrTag fill="peach">Tag</ZrTag>
            <ZrChip>Chip</ZrChip>
            {/* ZrBadge es un contador de notificación: va ANCLADO a un host (botón/ícono),
                no standalone — flota a la esquina superior derecha. */}
            <ZrButton config="secondary" icon="mail-closed:line">
              Mensajes
              <ZrBadge config="text" text="3" fill="peach" />
            </ZrButton>
          </div>
        </FormSection>

        {/* ── Feedback ────────────────────────────────────────── */}
        <FormSection title="Feedback">
          <ZrAlert config="info" {...({ 'hide-close': true } as object)}>Alerta informativa.</ZrAlert>
          <ZrAlert config="positive" {...({ 'hide-close': true } as object)}>Operación exitosa.</ZrAlert>
          <ZrAlert config="negative" {...({ 'hide-close': true } as object)}>Ha ocurrido un error.</ZrAlert>
          <ZrAlert config="alert" {...({ 'hide-close': true } as object)}>Advertencia importante.</ZrAlert>
          <ZrProgressBar {...({ config: 'linear', progress: 3, max: 5, 'no-percentage': true, 'progress-bar-title': 'Paso 3 de 5' } as object)} />
          <div {...flex('100')} style={{ alignItems: 'center' }}><ZrLoader /> <span className="subsection-intro" style={{ margin: 0 }}>Indicador de carga (ZrLoader)</span></div>
        </FormSection>

        {/* ── Pestañas ────────────────────────────────────────── */}
        <FormSection title="Pestañas (Tabs)">
          <ZrTabs
            model={tab}
            onChange={(idx: number) => setTab(idx)}
            {...({ tabs: [{ name: 'Resumen' }, { name: 'Detalle' }, { name: 'Historial' }] } as Record<string, unknown>)}
          >
            <div slot="tab-1">Contenido de Resumen.</div>
            <div slot="tab-2">Contenido de Detalle.</div>
            <div slot="tab-3">Contenido de Historial.</div>
          </ZrTabs>
        </FormSection>

        {/* ── Tabla ───────────────────────────────────────────── */}
        <FormSection title="Tabla">
          <ZrTable>
            <table>
              <thead>
                <tr><th>Producto</th><th>Estado</th><th {...({ config: 'right' } as object)}>Prima</th></tr>
              </thead>
              <tbody>
                <tr><td>D&amp;O</td><td><ZdsStatusBadge variant="success">Activa</ZdsStatusBadge></td><td {...({ config: 'right' } as object)}>$1.200</td></tr>
                <tr><td>Cyber</td><td><ZdsStatusBadge variant="info">En revisión</ZdsStatusBadge></td><td {...({ config: 'right' } as object)}>$3.400</td></tr>
              </tbody>
            </table>
          </ZrTable>
        </FormSection>

        {/* ── Tarjetas ────────────────────────────────────────── */}
        <FormSection title="Tarjetas">
          <div className="form-row cols-2">
            <ZrCard {...({ config: 'grid' } as object)}>
              <strong>ZrCard</strong>
              <p className="subsection-intro" style={{ margin: 0 }}>Contenedor genérico del DS.</p>
            </ZrCard>
            <ZrTile header="ZrTile" content="Superficie de contenido estructurada (header + body + media)." />
          </div>
        </FormSection>

        {/* ── Overlays ────────────────────────────────────────── */}
        <FormSection title="Overlays">
          <div {...flex('100')} style={{ flexWrap: 'wrap' }}>
            <ZrButton config="primary" onClick={() => setModal(true)}>Abrir modal</ZrButton>
            <ZrButton config="secondary" icon="menu:line" onClick={() => setDrawer(true)}>Abrir sidebar</ZrButton>
          </div>
        </FormSection>

        {modal && (
          <ZrModal model={modal} onChange={(v: boolean) => setModal(v)}>
            <div style={{ padding: 'var(--zs-200)' }}>
              <h3 style={{ marginTop: 0 }}>Modal de ejemplo</h3>
              <p className="subsection-intro">Diálogo centrado con backdrop.</p>
              <div {...flex('75')} style={{ justifyContent: 'flex-end' }}>
                <ZrButton config="secondary" onClick={() => setModal(false)}>Cerrar</ZrButton>
              </div>
            </div>
          </ZrModal>
        )}

        <ZrSidebar config="right" model={drawer} onChange={(v: boolean) => setDrawer(v)}>
          <h3 style={{ marginTop: 0 }}>Sidebar de ejemplo</h3>
          <p className="subsection-intro">Panel lateral deslizable.</p>
          <ZrButton config="link" onClick={() => setDrawer(false)}>Cerrar</ZrButton>
        </ZrSidebar>
      </div>
    </div>
  );
}
