import type { ReactNode } from 'react';
import zurichLogo from '../../../../resources/zurich/ZurichLogo_Horz_White_CMYK_no_R.png';

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
      <nav className="pqr-topnav">
        <div className="pqr-topnav-links" />
        <img src={zurichLogo} alt="Zurich" className="pqr-topnav-logo" />
      </nav>

      <header className="pqr-banner">
        <div className="pqr-banner-content">
          <h1 className="pqr-banner-title">{title}</h1>
          <p className="pqr-banner-text">{intro}</p>
        </div>
        <div className="pqr-banner-shapes" />
      </header>

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
