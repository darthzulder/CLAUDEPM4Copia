import { Component, type ErrorInfo, type ReactNode } from 'react';
import CotizadorFastFlow from './screens/FAST-FLOW/cotizador-fast-flow/CotizadorFastFlow';
import SolicitudCotizacionCuw from './screens/FAST-FLOW/solicitud-cotizacion-cuw/SolicitudCotizacionCuw';
import SolicitudFfFl from './screens/FAST-FLOW/ff-fl/SolicitudFfFl';
import CotizacionFfFl from './screens/FAST-FLOW/ff-fl/CotizacionFfFl';
import RespuestaCotizacion from './screens/FAST-FLOW/respuesta-cotizacion/RespuestaCotizacion';
import OpcionesCotizacion from './screens/FAST-FLOW/opciones-cotizacion/OpcionesCotizacion';
import VisualizarDocumentos from './screens/FAST-FLOW/nota-cobertura/VisualizarDocumentos';
import DocSARLAFT from './screens/FAST-FLOW/col-emision/DocSARLAFT';
import RevSARLAFT from './screens/FAST-FLOW/col-emision/RevSARLAFT';
import SolDocEmi from './screens/FAST-FLOW/col-emision/SolDocEmi';
import VerDocEmi from './screens/FAST-FLOW/col-emision/VerDocEmi';
import EstadoCorreo from './screens/FAST-FLOW/estado-correo/EstadoCorreo';
import CorregirDatosFormulario from './screens/atencion-cliente/quejas-directas/COL_QD_SCR-002_corregir-datos-formulario/CorregirDatosFormulario';
import CrearRecibirQueja from './screens/atencion-cliente/quejas-directas/COL_QD_SCR-001_CrearRecibirQueja/CrearRecibirQueja';
import DsCatalog from './screens/ds-catalog/DsCatalog';
import CierreM3 from './screens/atencion-cliente/quejas-directas/COL_QD_SCR-010_cierre-m3/CierreM3';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.error) {
      const e = this.state.error as Error;
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', color: 'var(--zc-peach-aa)' }}>
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
  'COL_QD_SCR-002_corregir-datos-formulario': CorregirDatosFormulario,
  'COL_QD_SCR-001_CrearRecibirQueja': CrearRecibirQueja,
  'COL_QD_SCR-010_cierre-m3': CierreM3,
  'ds-catalog': DsCatalog,
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
          {Object.keys(SCREENS).map((key) => (
            <a
              key={key}
              href={`?screen=${key}`}
              style={{
                display: 'block', padding: '14px 16px', background: 'var(--zg-white)',
                border: '1.5px solid var(--zg-9)', borderRadius: 8, textDecoration: 'none',
                color: 'var(--zc-blue-dark)', fontSize: 13, fontWeight: 500, transition: 'all .15s',
                boxShadow: '0 1px 3px color-mix(in srgb, var(--zg-black) 6%, transparent)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--zc-blue-zurich)';
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--zc-blue-zurich)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px color-mix(in srgb, var(--zc-blue-zurich) 15%, transparent)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--zg-9)';
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--zc-blue-dark)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 3px color-mix(in srgb, var(--zg-black) 6%, transparent)';
              }}
            >
              <span style={{ display: 'block', color: 'var(--zg-7)', fontSize: 11, marginBottom: 4, fontFamily: 'monospace' }}>
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
        <a href="/" style={{ color: 'var(--zc-blue-zurich)' }}>← Volver al índice</a>
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
