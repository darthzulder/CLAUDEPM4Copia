import type { ReactNode } from 'react';
import zurichLogo from '../../../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';
import pqrBannerDummy from '../../../../resources/placeholders/pqr-banner-dummy.svg';
import { ZrNavigation, ZrPromo } from '../../../../components/fields/ZdsFields';

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

      {/* ZrPromo (habilitado 2026-08-06, ver outputs/react/molecules/zurich-promo.md) con
          imagen DUMMY (resources/placeholders/pqr-banner-dummy.svg) — el diseño actual de
          este banner no tiene imagen/pictograma (solo título+texto+círculos decorativos), y
          tanto ZrPromo como ZrStageBanner requieren uno. Reemplazar `pqrBannerDummy` por el
          asset final de diseño en cuanto esté disponible; no hace falta tocar nada más de
          este componente para el swap (Fase 3b del plan de reducción de shared.css). `shape`
          es un valor de muestra (1-7) — ajustar cuando haya diseño real que comparar. */}
      <ZrPromo
        header={title}
        content={intro}
        shape="3"
        {...({ 'image-src': pqrBannerDummy } as Record<string, unknown>)}
        style={{
          ['--z-promo--bg' as never]: 'var(--z-blue)',
          ['--z-promo--color' as never]: 'var(--zg-white-zurich)',
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
