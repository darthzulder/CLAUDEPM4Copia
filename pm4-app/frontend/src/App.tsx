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
};

const DEBUG_BANNER_STYLE: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
  background: '#EC5962', color: '#fff', textAlign: 'center',
  padding: '6px 16px', fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
  letterSpacing: '.4px', pointerEvents: 'none',
};

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get('screen') ?? 'cotizador-fast-flow';
  const usingDebugToken = !params.get('token') && !!import.meta.env.VITE_PM4_TOKEN;
  const Screen = SCREENS[screen];

  if (!Screen) {
    return (
      <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
        <h2>Pantalla no encontrada: <code>{screen}</code></h2>
        <p>Pantallas disponibles: {Object.keys(SCREENS).join(', ')}</p>
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
