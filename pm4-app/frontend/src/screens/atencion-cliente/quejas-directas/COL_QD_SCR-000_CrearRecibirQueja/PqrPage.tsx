import type { ReactNode } from 'react';
import zurichLogo from '../../../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
import { ZrNavigation, ZrStageBanner } from '../../../../components/fields/ZdsFields';

// Chrome de la página pública de radicación (maquetado del sitio Zurich): barra de
// navegación navy, banner azul con titular + descripción, hoja de secciones y footer
// corporativo. Solo lo usa SCR-000, la única pantalla que se publica como página web
// (las pantallas de tarea PM4 siguen usando ScreenHeader/FormSection).
// Los estilos viven en shared.css (.pqr-*), tokenizados.

interface PageProps {
  title: string;
  intro: string;
  children: ReactNode;
}

export function PqrPage({ title, intro, children }: PageProps) {
  return (
    <div className="pqr-page">
      {/* ZrNavigation (habilitado 2026-08-06, ver outputs/react/navigation/zurich-navigation.md).
          Sin `routes`/`menu`: el diseño actual es una barra estática solo con el logo (el div
          `.pqr-topnav-links` que reemplaza estaba vacío, sin links reales). El header del
          componente usa el token global `--z-bg` para su fondo (no expone un custom token propio
          para eso — confirmado en el CSS real) — se sobreescribe local al navbar, sin afectar el
          resto de la página. */}
      <ZrNavigation style={{ ['--z-bg' as never]: 'var(--zc-blue-dark)' }}>
        <img slot="logo" src={zurichLogo} alt="Zurich" className="pqr-topnav-logo" />
      </ZrNavigation>

      {/* ZrStageBanner (habilitado 2026-08-10, ver outputs/react/molecules/zurich-stagebanner.md)
          SIN imagen/pictograma — por regla de negocio este banner no lleva imagen, solo
          título+texto+círculos decorativos. Confirmado leyendo el fuente vendorizado
          (web-components/dist/stage-banner.js): sin `pictogram`/`image-src` el componente
          entra en su rama "isShapedConfig" — renderiza únicamente texto + `<z-shape>`, sin
          reservar espacio de imagen (a diferencia de ZrPromo, que SIEMPRE fuerza un círculo
          de imagen vía `forceImage:true` aunque no se le pase `image-src` — por eso se
          descartó). Esa misma rama alinea el texto a la izquierda automáticamente.
          El componente solo expone dos slots de texto (`category` chico arriba, `content`
          grande abajo) — como el diseño necesita título grande arriba + párrafo normal
          debajo (no "categoría chica arriba"), se componen ambos dentro de `content` con su
          propio `font` inline (tokens `--zf-*`), que es exactamente lo que permite el tipo
          `content: string | ReactNode`. `shape="3"` fue elegido comparando visualmente las
          6 figuras disponibles en este vendor contra el diseño aprobado (no existe "7" en
          el CSS de esta versión, aunque la doc lo liste). */}
      <ZrStageBanner
        shape="3"
        content={
          <>
            <span style={{ font: 'var(--zf-h-44)', display: 'block' }}>{title}</span>
            <p style={{ font: 'var(--zf-body-20--300)', margin: 'var(--zs-75) 0 0' }}>{intro}</p>
          </>
        }
        style={{
          ['--z-stage-banner--bg' as never]: 'var(--z-blue)',
          ['--z-stage-banner--color' as never]: 'var(--zg-white-zurich)',
        }}
      />

      {children}

      <footer className="pqr-footer">
        <div className="pqr-footer-col">
          <a href="#" className="pqr-footer-link">Zurich Compañía de Seguros</a>
          <a href="#" className="pqr-footer-link pqr-footer-link--sub">Política de tratamiento de datos</a>
        </div>
        <div className="pqr-footer-divider" />
        <div className="pqr-footer-col">
          <a href="#" className="pqr-footer-link">¿Tienes problemas?</a>
          <a href="#" className="pqr-footer-link pqr-footer-link--sub">Soporte IT</a>
        </div>
        <div className="pqr-footer-legal">
          <a href="#">Privacidad y términos de uso</a>
          <span>©2026 Zurich</span>
        </div>
      </footer>
    </div>
  );
}

// Sección del formulario: título azul 24px + divisoria navy, sobre card blanco.
export function PqrSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pqr-section">
      <h2 className="pqr-section-title">{title}</h2>
      <hr className="pqr-section-divider" />
      {children}
    </section>
  );
}

// Campo de solo lectura en línea (etiqueta pequeña + valor subrayado), el patrón
// que el diseño usa para los datos calculados por el back.
export function PqrReadonly({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="pqr-readonly">
      <span className="pqr-readonly-label">{label}</span>
      <span className="pqr-readonly-value">{value || '—'}</span>
    </div>
  );
}
