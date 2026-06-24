import type { ReactNode } from 'react';

export type ResultVariant = 'success' | 'error' | 'info' | 'warning';

// Glifo de estado dentro del círculo (mismo criterio que .screen-sent / .ec-card)
const ICON: Record<ResultVariant, string> = {
  success: '✓',
  error:   '✕',
  info:    'i',
  warning: '!',
};

/**
 * Tarjeta de resultado/confirmación unificada (centrada, icono circular).
 * Reemplaza los antiguos .ec-card, .result-card y .screen-sent.
 */
export default function ResultCard({
  variant = 'success',
  title,
  children,
}: {
  variant?: ResultVariant;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={`result-card result-card--${variant}`}>
      <div className="result-card-icon" style={{ fontStyle: variant === 'info' ? 'italic' : 'normal' }}>
        {ICON[variant]}
      </div>
      <div className="result-card-title">{title}</div>
      {children && <div className="result-card-body">{children}</div>}
    </div>
  );
}
