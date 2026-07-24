/**
 * Documentación estilo Swagger del Web Service Smartsupervisión (SFC).
 *
 * La documentación es una página HTML autónoma (tema oscuro, estilos y JS propios)
 * servida como asset estático desde `public/docs/`. Se embebe en un iframe para
 * AISLAR sus estilos del design system de la app (tokens ZDS / shared.css): es un
 * visor de documentación, no una pantalla de formulario PM4, por eso no consume ZdsFields.
 */
const DOC_URL = 'docs/smartsupervision-webservice.html';

export default function SmartsupervisionApiDocs() {
  return (
    <iframe
      src={DOC_URL}
      title="Documentación Web Service Smartsupervisión (SFC)"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 'none',
      }}
    />
  );
}
