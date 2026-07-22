import RequestFileList from '../../../../components/RequestFileList';

interface Props {
  /** request (caso) del cual listar los adjuntos. */
  requestId: number | null;
  /** data_name de los adjuntos que subió el radicador en SCR-000 (qd_strAttach01..05). */
  docKeys: readonly string[];
}

/**
 * Lista de solo lectura de los documentos que el radicador adjuntó en SCR-000.
 * Thin wrapper sobre RequestFileList con los textos propios de la radicación.
 */
export default function DocumentosRadicador({ requestId, docKeys }: Props) {
  return (
    <RequestFileList
      requestId={requestId}
      docKeys={docKeys}
      label="Documentos adjuntos del radicador"
      emptyText="El radicador no adjuntó documentos a esta queja."
      loadingText="Buscando documentos del caso…"
    />
  );
}
