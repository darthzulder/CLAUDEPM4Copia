
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
      {/* Recorremos los items para pintar cada par etiqueta/valor. */}
      {items.map((in_objItem, in_intIdx) => (
        <div className="info-bar-item" key={in_intIdx}>
          <span className="info-bar-label">{in_objItem.label}</span>
          <span className="info-bar-value">{in_objItem.value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}
