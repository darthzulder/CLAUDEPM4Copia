
interface InfoItem {
  label: string;
  value: string | number | undefined | null;
}

interface InfoBarProps {
  items: InfoItem[];
}

export default function InfoBar({ items }: InfoBarProps) {
  return (
    <div className="info-bar">
      {items.map((item, idx) => (
        <div className="info-bar-item" key={idx}>
          <span className="info-bar-label">{item.label}</span>
          <span className="info-bar-value">{String(item.value ?? 'â€”')}</span>
        </div>
      ))}
    </div>
  );
}
