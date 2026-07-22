import type { ReactNode } from 'react';
import { ZrCard, ZrIcon } from './fields/ZdsFields';

export type ResultVariant = 'success' | 'error' | 'info' | 'warning';

// Ícono DS por variante (set de íconos `:line` del DS).
const ICON: Record<ResultVariant, string> = {
  success: 'check:line',
  error:   'close:line',
  info:    'info:line',
  warning: 'alert-triangle:line',
};

// Color de estado por variante (alias semánticos → tokens DS).
const COLOR: Record<ResultVariant, string> = {
  success: 'var(--z-green)',
  error:   'var(--z-red)',
  info:    'var(--z-blue)',
  warning: 'var(--z-orange)',
};

/**
 * Tarjeta de resultado/confirmación sobre ZrCard + ZrIcon (defaults del DS).
 * Reemplaza el antiguo .result-card custom: la superficie la aporta ZrCard.
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
    <ZrCard {...({ config: 'grid' } as object)} style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <div>
        <ZrIcon {...({ icon: ICON[variant] } as object)} style={{ color: COLOR[variant], fontSize: 48 }} />
        <div style={{ font: 'var(--zf-body-20--700)', color: 'var(--z-text)', marginTop: 'var(--zs-50)' }}>{title}</div>
        {children && (
          <div style={{ font: 'var(--zf-body-16)', color: 'var(--z-text)', lineHeight: 1.6, marginTop: 'var(--zs-50)' }}>{children}</div>
        )}
      </div>
    </ZrCard>
  );
}
