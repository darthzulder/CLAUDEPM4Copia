
interface InfoItem {
  label: string;
  value: string | number | undefined | null;
}

interface InfoBarProps {
  items: InfoItem[];
}

export default function InfoBar({ items }: InfoBarProps) {
  return (
    <div className="co-info-bar">
      {items.map((item, idx) => (
        <div className="co-info-item" key={idx}>
          <span className="co-info-label">{item.label}</span>
          <span className="co-info-value">{String(item.value ?? '—')}</span>
        </div>
      ))}
    </div>
  );
}
