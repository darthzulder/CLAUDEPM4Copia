interface Props {
  title: string;
  children: React.ReactNode;
  color?: string;
  /** Acción a la derecha del header (p.ej. botón de ayuda). */
  action?: React.ReactNode;
  /** Pie dentro del card, debajo del body (p.ej. <ActionBar>). */
  footer?: React.ReactNode;
}

export default function FormSection({ title, children, color = 'var(--z-blue)', action, footer }: Props) {
  return (
    <div className="form-section-card">
      <div className="form-section-header" style={{ backgroundColor: color }}>
        <span>{title}</span>
        {action && <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>{action}</span>}
      </div>
      <div className="form-section-body">{children}</div>
      {footer}
    </div>
  );
}
