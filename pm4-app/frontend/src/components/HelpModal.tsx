import React from 'react';

interface HelpModalProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function HelpModal({ title, subtitle, children }: HelpModalProps) {
  return (
    <div className="ayuda-modal">
      <div className="ayuda-modal-header">
        <div className="ayuda-modal-icon-circle">i</div>
        <div>
          <div className="ayuda-modal-title">{title}</div>
          {subtitle && <div className="ayuda-modal-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="ayuda-modal-body">
        {children}
      </div>
    </div>
  );
}
