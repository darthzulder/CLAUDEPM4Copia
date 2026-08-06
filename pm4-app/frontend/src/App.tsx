import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { ZrLoader } from './components/fields/ZdsFields';

// Cada pantalla se carga bajo demanda: el iframe solo renderiza una a la vez
// (?screen=), así que no tiene sentido descargar las ~27 en un único bundle.
const CotizadorFastFlow = lazy(() => import('./screens/FAST-FLOW/cotizador-fast-flow/CotizadorFastFlow'));
const SolicitudCotizacionCuw = lazy(() => import('./screens/FAST-FLOW/solicitud-cotizacion-cuw/SolicitudCotizacionCuw'));
const SolicitudFfFl = lazy(() => import('./screens/FAST-FLOW/ff-fl/SolicitudFfFl'));
const CotizacionFfFl = lazy(() => import('./screens/FAST-FLOW/ff-fl/CotizacionFfFl'));
const RespuestaCotizacion = lazy(() => import('./screens/FAST-FLOW/respuesta-cotizacion/RespuestaCotizacion'));
const OpcionesCotizacion = lazy(() => import('./screens/FAST-FLOW/opciones-cotizacion/OpcionesCotizacion'));
const VisualizarDocumentos = lazy(() => import('./screens/FAST-FLOW/nota-cobertura/VisualizarDocumentos'));
const DocSARLAFT = lazy(() => import('./screens/FAST-FLOW/col-emision/DocSARLAFT'));
const RevSARLAFT = lazy(() => import('./screens/FAST-FLOW/col-emision/RevSARLAFT'));
const SolDocEmi = lazy(() => import('./screens/FAST-FLOW/col-emision/SolDocEmi'));
const VerDocEmi = lazy(() => import('./screens/FAST-FLOW/col-emision/VerDocEmi'));
const EstadoCorreo = lazy(() => import('./screens/FAST-FLOW/estado-correo/EstadoCorreo'));
const CorregirDatosFormulario = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-002_corregir-datos-formulario/CorregirDatosFormulario'));
const CrearRecibirQueja = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-000_CrearRecibirQueja/CrearRecibirQueja'));
const DsCatalog = lazy(() => import('./screens/ds-catalog/DsCatalog'));
const RevisionErrorTecnicoApi = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-004_Revision_Error_Tecnico_API/RevisionErrorTecnicoApi'));
const CorreccionErrorFuncional = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-003_Correccion_Error_Funcional/CorreccionErrorFuncional'));
const DetalleReasignacionRespuesta = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta/DetalleReasignacionRespuesta'));
const RespuestaAreaResponsable = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-0052_Respuesta_Area_Responsable/RespuestaAreaResponsable'));
const RevisionRespuestaSac = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-008_Revision_Respuesta_SAC/RevisionRespuestaSac'));
const FormularioSuperintendencia = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-009_Formulario_Superintendencia/FormularioSuperintendencia'));
const RevisionErrorTecnicoProrroga = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga/RevisionErrorTecnicoProrroga'));
const ErrorFuncionalProrroga = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-012_Revision_Error_Funcional_Prorroga/ErrorFuncionalProrroga'));
const DashboardGestionCasos = lazy(() => import('./screens/atencion-cliente/quejas-directas/COL_QD_SCR-013_Dashboard_Gestion_Casos/DashboardGestionCasos'));
const SmartsupervisionApiDocs = lazy(() => import('./screens/smartsupervision-api-docs/SmartsupervisionApiDocs'));

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.error) {
      // Mostramos el detalle del error capturado por el boundary.
      const excError = this.state.error as Error;
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', color: 'var(--zc-peach-aa)' }}>
          <h2>Error de Render</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{excError.message}{'\n\n'}{excError.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const SCREENS: Record<string, React.ComponentType> = {
  'cotizador-fast-flow': CotizadorFastFlow,
  'solicitud-cotizacion-cuw': SolicitudCotizacionCuw,
  'ff-fl': SolicitudFfFl,
  'ff-fl-cotizacion': CotizacionFfFl,
  'respuesta-cotizacion': RespuestaCotizacion,
  'opciones-cotizacion': OpcionesCotizacion,
  'nota-cobertura': VisualizarDocumentos,
  'doc-sarlaft': DocSARLAFT,
  'rev-sarlaft': RevSARLAFT,
  'sol-doc-emi': SolDocEmi,
  'ver-doc-emi': VerDocEmi,
  'estado-correo': EstadoCorreo,
  'COL_QD_SCR-002_corregir-datos-formulario': CorregirDatosFormulario,
  'COL_QD_SCR-000_CrearRecibirQueja': CrearRecibirQueja,
  'COL_QD_SCR-004_Revision_Error_Tecnico_API': RevisionErrorTecnicoApi,
  'COL_QD_SCR-003_Correccion_Error_Funcional': CorreccionErrorFuncional,
  'COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta': DetalleReasignacionRespuesta,
  'COL_QD_SCR-0052_Respuesta_Area_Responsable': RespuestaAreaResponsable,
  'COL_QD_SCR-008_Revision_Respuesta_SAC': RevisionRespuestaSac,
  'COL_QD_SCR-009_Formulario_Superintendencia': FormularioSuperintendencia,
  // La ex SCR-010 (Cierre M3) se fusionó en la SCR-009: alias para que cualquier
  // nodo del BPM que aún apunte al slug antiguo renderice el formulario unificado.
  'COL_QD_SCR-010_cierre-m3': FormularioSuperintendencia,
  'COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga': RevisionErrorTecnicoProrroga,
  'COL_QD_SCR-012_Revision_Error_Funcional_Prorroga': ErrorFuncionalProrroga,
  'COL_QD_SCR-013_Dashboard_Gestion_Casos': DashboardGestionCasos,
  'ds-catalog': DsCatalog,
  'smartsupervision-api-docs': SmartsupervisionApiDocs,
};

const DEBUG_BANNER_STYLE: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
  background: 'var(--zc-peach-aa)', color: 'var(--zg-white)', textAlign: 'center',
  padding: '6px 16px', fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
  letterSpacing: '.4px', pointerEvents: 'none',
};

declare const __COMMIT_HASH__: string;

function ScreenIndex() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--zg-white-zurich)', fontFamily: 'sans-serif', padding: '40px 32px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 24, fontSize: 12, color: 'var(--zg-7)', fontFamily: 'monospace' }}>
        {__COMMIT_HASH__}
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 6, height: 32, background: 'var(--zc-blue-zurich)', borderRadius: 3 }} />
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--zc-blue-dark)' }}>PM4 Screens</h1>
          </div>
          <p style={{ margin: '0 0 0 18px', color: 'var(--zg-5)', fontSize: 14 }}>
            {Object.keys(SCREENS).length} pantallas disponibles
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {/* Pintamos un enlace por cada pantalla registrada. */}
          {Object.keys(SCREENS).map((in_strScreen) => (
            <a
              key={in_strScreen}
              href={`?screen=${in_strScreen}`}
              style={{
                display: 'block', padding: '14px 16px', background: 'var(--zg-white)',
                border: '1.5px solid var(--zg-9)', borderRadius: 8, textDecoration: 'none',
                color: 'var(--zc-blue-dark)', fontSize: 13, fontWeight: 500, transition: 'all .15s',
                boxShadow: '0 1px 3px color-mix(in srgb, var(--zg-black) 6%, transparent)',
              }}
              onMouseEnter={in_objEvent => {
                (in_objEvent.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--zc-blue-zurich)';
                (in_objEvent.currentTarget as HTMLAnchorElement).style.color = 'var(--zc-blue-zurich)';
                (in_objEvent.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px color-mix(in srgb, var(--zc-blue-zurich) 15%, transparent)';
              }}
              onMouseLeave={in_objEvent => {
                (in_objEvent.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--zg-9)';
                (in_objEvent.currentTarget as HTMLAnchorElement).style.color = 'var(--zc-blue-dark)';
                (in_objEvent.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 3px color-mix(in srgb, var(--zg-black) 6%, transparent)';
              }}
            >
              <span style={{ display: 'block', color: 'var(--zg-7)', fontSize: 11, marginBottom: 4, fontFamily: 'monospace' }}>
                ?screen=
              </span>
              {in_strScreen}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Leemos la pantalla solicitada desde el query string del iframe.
  const objParams = new URLSearchParams(window.location.search);
  const strScreen = objParams.get('screen');
  // Detectamos si estamos usando el token de debug del .env.
  const blnUsingDebugToken = !objParams.get('token') && !!import.meta.env.VITE_PM4_TOKEN;

  if (!strScreen) return <ScreenIndex />;

  const Screen = SCREENS[strScreen];

  if (!Screen) {
    return (
      <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
        <h2>Pantalla no encontrada: <code>{strScreen}</code></h2>
        <p>Pantallas disponibles: {Object.keys(SCREENS).join(', ')}</p>
        <a href="/" style={{ color: 'var(--zc-blue-zurich)' }}>← Volver al índice</a>
      </div>
    );
  }

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<div className="loading-overlay"><ZrLoader /></div>}>
          <Screen />
        </Suspense>
      </ErrorBoundary>
      {blnUsingDebugToken && (
        <div style={DEBUG_BANNER_STYLE}>⚠ Usando token de debug — no usar en producción</div>
      )}
    </>
  );
}
