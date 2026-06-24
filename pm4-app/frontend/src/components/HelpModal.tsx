import React from 'react';

interface HelpModalProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function HelpModal({ title, subtitle, children }: HelpModalProps) {
  return (
    <div className="help-modal">
      <div className="help-modal-header">
        <div className="help-modal-icon">i</div>
        <div>
          <div className="help-modal-title">{title}</div>
          {subtitle && <div className="help-modal-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="help-modal-body">
        {children}
      </div>
    </div>
  );
}
