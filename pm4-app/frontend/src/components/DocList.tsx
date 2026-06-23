import React from 'react';

interface DocListProps {
  mode: 'upload' | 'validation';
  children: React.ReactNode;
}

export default function DocList({ mode, children }: DocListProps) {
  if (mode === 'validation') {
    return (
      <div className="verdoc-table-layout">
        <div className="verdoc-table-header">
          <span>Doc</span>
          <span className="verdoc-table-col-desc">Descripción</span>
          <span className="verdoc-table-col-file">Archivo</span>
          <span className="verdoc-table-col-val">Validación</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--zs-75)' }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="sarlaft-doc-list">
      {children}
    </div>
  );
}
