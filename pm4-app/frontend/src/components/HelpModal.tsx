import React from 'react';

interface HelpModalProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Contenedor de contenido de ayuda dentro de un ZrModal.
 * CSS-free: solo primitivos de layout DS (z-flex) + un divisor tokenizado
 * (ZDS no tiene componente divider). La tipografía es la base del DS.
 */
export default function HelpModal({ title, subtitle, children }: HelpModalProps) {
  return (
    <div z-flex="col:150">
      <div z-flex="col:50">
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
