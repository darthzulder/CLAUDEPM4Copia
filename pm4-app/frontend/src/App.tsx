import { Component, type ErrorInfo, type ReactNode } from 'react';
import CotizadorFastFlow from './screens/cotizador-fast-flow/CotizadorFastFlow';
import SolicitudCotizacionCuw from './screens/solicitud-cotizacion-cuw/SolicitudCotizacionCuw';
import SolicitudFfFl from './screens/ff-fl/SolicitudFfFl';
import CotizacionFfFl from './screens/ff-fl/CotizacionFfFl';
import RespuestaCotizacion from './screens/respuesta-cotizacion/RespuestaCotizacion';
import OpcionesCotizacion from './screens/opciones-cotizacion/OpcionesCotizacion';
import VisualizarDocumentos from './screens/nota-cobertura/VisualizarDocumentos';
import DocSARLAFT  from './screens/col-emision/DocSARLAFT';
import RevSARLAFT  from './screens/col-emision/RevSARLAFT';
import SolDocEmi   from './screens/col-emision/SolDocEmi';
import VerDocEmi   from './screens/col-emision/VerDocEmi';
import EstadoCorreo from './screens/estado-correo/EstadoCorreo';
import RecibirQueja from './screens/recibir-queja/RecibirQueja';
import RevisarErrorTecnico from './screens/revisar-error-tecnico/RevisarErrorTecnico';
import CorregirDatosFormulario from './screens/corregir-datos-formulario/CorregirDatosFormulario';
import CorregirErrorFuncionalSS from './screens/corregir-error-funcional-ss/CorregirErrorFuncionalSS';
import RevisarQuejaAsignar from './screens/revisar-queja-asignar/RevisarQuejaAsignar';
import CierreM3 from './screens/COL_QD_cierre-m3/CierreM3';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.error) {
      const e = this.state.error as Error;
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', color: '#b00' }}>
          <h2>Error de Render</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{e.message}{'\n\n'}{e.stack}</pre>
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
  'recibir-queja': RecibirQueja,
  'revisar-error-tecnico': RevisarErrorTecnico,
  'corregir-datos-formulario': CorregirDatosFormulario,
  'corregir-error-funcional-ss': CorregirErrorFuncionalSS,
  'revisar-queja-asignar': RevisarQuejaAsignar,
  'COL_QD_cierre-m3': CierreM3,
};

const DEBUG_BANNER_STYLE: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
  background: '#EC5962', color: '#fff', textAlign: 'center',
  padding: '6px 16px', fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
  letterSpacing: '.4px', pointerEvents: 'none',
};

function ScreenIndex() {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fc', fontFamily: 'sans-serif', padding: '40px 32px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 6, height: 32, background: '#2167AE', borderRadius: 3 }} />
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>PM4 Screens</h1>
          </div>
          <p style={{ margin: '0 0 0 18px', color: '#6b7280', fontSize: 14 }}>
            {Object.keys(SCREENS).length} pantallas disponibles
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {Object.keys(SCREENS).map((key) => (
            <a
              key={key}
              href={`?screen=${key}`}
              style={{
                display: 'block', padding: '14px 16px', background: '#fff',
                border: '1.5px solid #e5e7eb', borderRadius: 8, textDecoration: 'none',
                color: '#1a1a2e', fontSize: 13, fontWeight: 500, transition: 'all .15s',
                boxShadow: '0 1px 3px rgba(0,0,0,.06)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#2167AE';
                (e.currentTarget as HTMLAnchorElement).style.color = '#2167AE';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px rgba(33,103,174,.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e5e7eb';
                (e.currentTarget as HTMLAnchorElement).style.color = '#1a1a2e';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 3px rgba(0,0,0,.06)';
              }}
            >
              <span style={{ display: 'block', color: '#9ca3af', fontSize: 11, marginBottom: 4, fontFamily: 'monospace' }}>
                ?screen=
              </span>
              {key}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get('screen');
  const usingDebugToken = !params.get('token') && !!import.meta.env.VITE_PM4_TOKEN;

  if (!screen) return <ScreenIndex />;

  const Screen = SCREENS[screen];

  if (!Screen) {
    return (
      <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
        <h2>Pantalla no encontrada: <code>{screen}</code></h2>
        <p>Pantallas disponibles: {Object.keys(SCREENS).join(', ')}</p>
        <a href="/" style={{ color: '#2167AE' }}>← Volver al índice</a>
      </div>
    );
  }

  return (
    <>
      <ErrorBoundary>
        <Screen />
      </ErrorBoundary>
      {usingDebugToken && (
        <div style={DEBUG_BANNER_STYLE}>⚠ Usando token de debug — no usar en producción</div>
      )}
    </>
  );
}
