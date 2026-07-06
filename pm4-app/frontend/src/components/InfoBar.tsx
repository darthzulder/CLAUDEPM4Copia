
import type { ReactNode } from 'react';

interface InfoItem {
  label: string;
  value: ReactNode;
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
          <span className="info-bar-value">{item.value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}
