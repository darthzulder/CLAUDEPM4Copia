interface Props {
  title: string;
  children: React.ReactNode;
  color?: string;
}

export default function FormSection({ title, children, color = '#1a3c6e' }: Props) {
  return (
    <div style={{
      marginBottom: 'var(--zs-150)',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,.07), 0 6px 18px rgba(0,0,0,.06)',
      border: '1px solid rgba(221,227,236,.7)',
    }}>
      <div className="form-section-header" style={{ backgroundColor: color }}>
        <span>{title}</span>
      </div>
      <div className="form-section-body">{children}</div>
    </div>
  );
}
