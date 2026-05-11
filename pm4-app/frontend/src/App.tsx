import CotizadorFastFlow from './screens/cotizador-fast-flow/CotizadorFastFlow';
import SolicitudCotizacionCuw from './screens/solicitud-cotizacion-cuw/SolicitudCotizacionCuw';
import SolicitudFfFl from './screens/ff-fl/SolicitudFfFl';
import RespuestaCotizacion from './screens/respuesta-cotizacion/RespuestaCotizacion';
import OpcionesCotizacion from './screens/opciones-cotizacion/OpcionesCotizacion';
import VisualizarDocumentos from './screens/nota-cobertura/VisualizarDocumentos';

const SCREENS: Record<string, React.ComponentType> = {
  'cotizador-fast-flow': CotizadorFastFlow,
  'solicitud-cotizacion-cuw': SolicitudCotizacionCuw,
  'ff-fl': SolicitudFfFl,
  'respuesta-cotizacion': RespuestaCotizacion,
  'opciones-cotizacion': OpcionesCotizacion,
  'nota-cobertura': VisualizarDocumentos,
};

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get('screen') ?? 'cotizador-fast-flow';
  const Screen = SCREENS[screen];

  if (!Screen) {
    return (
      <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
        <h2>Pantalla no encontrada: <code>{screen}</code></h2>
        <p>Pantallas disponibles: {Object.keys(SCREENS).join(', ')}</p>
      </div>
    );
  }

  return <Screen />;
}
