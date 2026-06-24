import React from 'react';

interface DocListProps {
  mode: 'upload' | 'validation';
  children: React.ReactNode;
}

export default function DocList({ mode, children }: DocListProps) {
  if (mode === 'validation') {
    return (
      <div>
        <div className="doc-table-header">
          <span>Doc</span>
          <span className="doc-table-col-desc">Descripción</span>
          <span className="doc-table-col-file">Archivo</span>
          <span className="doc-table-col-val">Validación</span>
        </div>
        <div z-flex="col:75">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div z-flex="col:75">
      {children}
    </div>
  );
}
