interface Props {
  title: string;
  children: React.ReactNode;
  color?: string;
}

export default function FormSection({ title, children, color = '#1a3c6e' }: Props) {
  return (
    <div className="form-section">
      <div className="form-section-header" style={{ backgroundColor: color }}>
        <span>{title}</span>
      </div>
      <div className="form-section-body">{children}</div>
    </div>
  );
}
