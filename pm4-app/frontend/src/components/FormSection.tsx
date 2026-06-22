interface Props {
  title: string;
  children: React.ReactNode;
  color?: string;
  /** Acción a la derecha del header (p.ej. botón de ayuda). */
  action?: React.ReactNode;
  /** Pie dentro del card, debajo del body (p.ej. submit-bar). */
  footer?: React.ReactNode;
}

export default function FormSection({ title, children, color = 'var(--z-blue)', action, footer }: Props) {
  return (
    <div style={{
      marginBottom: 'var(--zs-250)',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,.07), 0 6px 18px rgba(0,0,0,.06)',
      border: '1px solid rgba(221,227,236,.7)',
    }}>
      <div className="form-section-header" style={{ backgroundColor: color }}>
        <span>{title}</span>
        {action && <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>{action}</span>}
      </div>
      <div className="form-section-body">{children}</div>
      {footer}
    </div>
  );
}
