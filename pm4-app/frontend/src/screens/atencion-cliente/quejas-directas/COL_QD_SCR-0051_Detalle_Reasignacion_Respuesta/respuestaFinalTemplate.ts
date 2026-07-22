// Plantilla HTML de la carta de respuesta final al cliente (correo "Procede").
// Es el mismo HTML del correo que envía el proceso; aquí se usa para la VISTA
// PREVIA (ACT-0051-05) renderizándolo dentro de un <iframe srcDoc> para no
// contaminar los estilos de la app con las reglas table-based del email.
//
// Los marcadores del correo original ({{Tipo}}, %% Lo que ocurrió%, etc.) se
// sustituyen por los EQUIVALENTES del proceso (registro QD). El mapeo vive en
// buildRespuestaFinalHtml() más abajo.

export interface RespuestaFinalVars {
  tipo: string;            // qd_strRequestType   (tipo de solicitud PQRS)
  numeroRadicado: string;  // qd_strBpmCaseId     (número de radicado del caso)
  nombre: string;          // qd_strCompanyName | qd_strFirstName + qd_strLastName
  interaccion: string;     // qd_strInteraction   (momento/interacción)
  loQueOcurrio: string;    // qd_strComplaintText (texto de la queja)
  nuestraRespuesta: string;// qd_strClientResponse
  textoProcede: string;    // qd_strActionsTaken  (acciones tomadas / "procede")
}

// Escapa caracteres HTML para inyectar texto del usuario sin romper el markup.
// Coacciona a string: algunas variables de PM4 pueden llegar como número/otro tipo.
const esc = (in_val: unknown): string =>
  String(in_val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Escapa y convierte saltos de línea en <br> (campos multilínea del formulario).
const nl2br = (in_str: string): string => esc(in_str).replace(/\r?\n/g, '<br>');

const PLACEHOLDER = '—';

export function buildRespuestaFinalHtml(in_objVars: RespuestaFinalVars): string {
  const tipo = esc(in_objVars.tipo) || 'queja';
  const numeroRadicado = esc(in_objVars.numeroRadicado) || PLACEHOLDER;
  const nombre = esc(in_objVars.nombre) || PLACEHOLDER;
  const interaccion = esc(in_objVars.interaccion) || PLACEHOLDER;
  const loQueOcurrio = nl2br(in_objVars.loQueOcurrio) || 'Sin descripción registrada.';
  const nuestraRespuesta = nl2br(in_objVars.nuestraRespuesta) || 'Aún no se ha redactado la respuesta al cliente.';
  const textoProcede = nl2br(in_objVars.textoProcede) || 'Sin acciones registradas.';

  return `<!doctype html>
<html>

<head>
  <meta charset="utf-8">
  <title>Respuesta a su queja - Procede</title>
  <style type="text/css">
    /* Reset & Email client search optimization */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f4f4; }

    /* Custom Typography */
    body, table, td, p, a {
      font-family: "Zurich Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
  </style>
</head>

<body style="margin: 0 !important; padding: 0 !important; background-color: #f4f4f4;">

  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="background-color: #f4f4f4; padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px; width: 100%;">

          <!-- HEADER BANNER -->
          <tr>
            <td align="center" valign="top" background="https://cozurich.dev.cloud.processmaker.net/public-files/Imagenes%20correos/Recurso%202@2x.png" bgcolor="#2167AE" style="background-image: url('https://cozurich.dev.cloud.processmaker.net/public-files/Imagenes%20correos/Recurso%202@2x.png'); background-position: left top; background-size: 600px 270px; width: 600px; height: 270px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; height: 250px;">
                <tr>
                  <!-- Columna espaciadora izquierda -->
                  <td width="260" style="width: 260px; font-size: 1px; line-height: 1px;">&nbsp;</td>

                  <!-- Columna del contenido derecho -->
                  <td width="340" valign="top" style="width: 340px; padding: 25px 30px 25px 0; text-align: right;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="right" style="padding-bottom: 25px; line-height: normal;">
                          <img src="https://cozurich.dev.cloud.processmaker.net/public-files/Imagenes%20correos/Logo-zurich-white.png" alt="Zurich" height="28" style="display: block; border: 0; height: 28px; outline: none; float: right;" title="Zurich">
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="color: #ffffff; font-size: 24px; line-height: 30px; font-family: 'Zurich Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                          <span style="font-weight: bold;">Respuesta a su</span><br>
                          <span style="font-weight: normal;">${tipo} N.°</span><br>
                          <span style="font-weight: normal;">${numeroRadicado}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CUERPO DEL CORREO -->
          <tr>
            <td align="left" style="padding: 40px 45px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">

                <!-- Saludo -->
                <tr>
                  <td style="color: #1FB1E6; font-size: 19px; font-weight: bold; padding-bottom: 25px;">
                    Hola ${nombre},
                  </td>
                </tr>

                <!-- Párrafos Iniciales -->
                <tr>
                  <td style="color: #23366F; font-size: 15px; line-height: 22px; font-weight: normal; padding-bottom: 20px;">
                    Gracias por su paciencia mientras revisábamos su <strong>${tipo}</strong> relacionada con <strong>${interaccion}.</strong>
                  </td>
                </tr>
                <tr>
                  <td style="color: #23366F; font-size: 15px; line-height: 22px; font-weight: normal; padding-bottom: 25px;">
                    Después de analizar detalladamente su caso, encontramos lo siguiente:
                  </td>
                </tr>

                <!-- CAJA GRIS 1: Lo que ocurrió (qd_strComplaintText) -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #EEF0F1; border-radius: 16px; width: 100%;">
                      <tr>
                        <td valign="top" style="padding: 25px 30px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="color: #1FB1E6; font-size: 15px; font-weight: bold; padding-bottom: 15px; line-height: 22px;">
                                Lo que ocurrió
                              </td>
                            </tr>
                            <tr>
                              <td style="color: #23366F; font-size: 15px; font-weight: normal; line-height: 22px;">
                                ${loQueOcurrio}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CAJA GRIS 2: Nuestra respuesta (qd_strClientResponse) -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #EEF0F1; border-radius: 16px; width: 100%;">
                      <tr>
                        <td style="padding: 25px 30px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="color: #1FB1E6; font-size: 15px; font-weight: bold; padding-bottom: 15px; line-height: 22px;">
                                Nuestra respuesta
                              </td>
                            </tr>
                            <tr>
                              <td style="color: #23366F; font-size: 15px; font-weight: normal; line-height: 22px;">
                                ${nuestraRespuesta}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CAJA GRIS 3: texto_procede (qd_strActionsTaken) -->
                <tr>
                  <td style="padding-bottom: 35px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #EEF0F1; border-radius: 16px; width: 100%;">
                      <tr>
                        <td valign="top" style="padding: 25px 30px; color: #23366F; font-size: 15px; font-weight: normal; line-height: 22px;">
                          ${textoProcede}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Textos finales e informativos -->
                <tr>
                  <td style="color: #23366F; font-size: 15px; line-height: 22px; font-weight: normal; padding-bottom: 20px;">
                    Lamentamos los inconvenientes que esta situación le haya podido causar y agradecemos que nos hayas dado la oportunidad de revisarla. Sus comentarios nos ayudan a mejorar nuestro servicio y los procesos con nuestros aliados.
                  </td>
                </tr>
                <tr>
                  <td style="color: #23366F; font-size: 15px; line-height: 22px; font-weight: normal; padding-bottom: 35px;">
                    Si tiene alguna duda sobre esta respuesta o necesita más información, por favor responda a este correo o contáctenos a través de nuestros canales de atención.
                  </td>
                </tr>

                <!-- Cierre -->
                <tr>
                  <td align="center" style="color: #23366F; font-size: 16px; line-height: 22px; padding-bottom: 25px;">
                    En Zurich Seguros, más que asegurarte, nos importas tú.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="color: #23366F; font-size: 15px; line-height: 20px; padding-bottom: 15px;">
                    Saludos cordiales,
                  </td>
                </tr>
                <tr>
                  <td align="center" style="color: #23366F; font-size: 16px; line-height: 22px; font-weight: bold;">
                    Servicio al cliente<br>
                    Zurich Seguros
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- REDES SOCIALES -->
          <tr>
            <td align="center" style="background-color: #2167AE; padding: 18px 0 14px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
                <tr>
                  <td style="color: #ffffff; font-size: 15px; font-weight: normal; padding-bottom: 10px;">
                    Síguenos
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="https://www.instagram.com/zurichsegurosco" target="_blank" style="text-decoration: none; margin: 0 8px;">
                      <img src="https://cozurich.dev.cloud.processmaker.net/public-files/Imagenes%20correos/icono_instragram.png" width="16" height="16" alt="Instagram" style="display: inline-block; border: 0; vertical-align: middle; outline: none; text-decoration: none;">
                    </a>
                    <a href="https://www.facebook.com/ZurichenColombia/" target="_blank" style="text-decoration: none; margin: 0 8px;">
                      <img src="https://cozurich.dev.cloud.processmaker.net/public-files/Imagenes%20correos/icono_facebook.png" width="16" height="16" alt="Facebook" style="display: inline-block; border: 0; vertical-align: middle; outline: none; text-decoration: none;">
                    </a>
                    <a href="https://www.youtube.com/channel/UCLCeIvom-s0d_5iOHc6oCQQ" target="_blank" style="text-decoration: none; margin: 0 8px;">
                      <img src="https://cozurich.dev.cloud.processmaker.net/public-files/Imagenes%20correos/icono_youtube.png" width="16" height="16" alt="YouTube" style="display: inline-block; border: 0; vertical-align: middle; outline: none; text-decoration: none;">
                    </a>
                    <a href="https://www.linkedin.com/company/zurichcolombia" target="_blank" style="text-decoration: none; margin: 0 8px;">
                      <img src="https://cozurich.dev.cloud.processmaker.net/public-files/Imagenes%20correos/icono_linkedin.png" width="16" height="16" alt="LinkedIn" style="display: inline-block; border: 0; vertical-align: middle; outline: none; text-decoration: none;">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PIE DE PÁGINA -->
          <tr>
            <td style="background-color: #eef0f1; padding: 25px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Vigilado (Izquierda) -->
                  <td width="70" valign="middle" align="left" style="padding-right: 10px;">
                    <img src="https://cozurich.dev.cloud.processmaker.net/public-files/Imagenes%20correos/superintendecia-vertical.png" alt="Vigilado" height="130" style="display: block; border: 0; height: 130px; outline: none; text-decoration: none;">
                  </td>

                  <!-- Canales de atención -->
                  <td valign="middle" align="center" style="color: #2167AE; font-family: 'Zurich Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <p style="margin: 0; font-size: 15px; font-weight: bold; padding-bottom: 10px;">Canales de atención Zurich</p>

                    <p style="margin: 0; font-size: 10.5px; line-height: 16px; color: #2167AE; padding-bottom: 10px;">
                      En Bogotá: (601) 319 0730 | Línea nacional: 01 8000 112 723<br>
                      Celular: #723 | WhatsApp: +57 315 768 6083<br>
                      Correo: <a href="mailto:atencioncliente@zurich.com" style="color: #2167AE; text-decoration: none; font-weight: bold;">atencioncliente@zurich.com</a>
                    </p>

                    <p style="margin: 0; font-size: 11px; color: #2167AE; font-weight: bold; padding-bottom: 12px;">
                      Zurich Colombia Seguros S.A.
                    </p>

                    <img src="https://cozurich.dev.cloud.processmaker.net/public-files/Imagenes%20correos/Logo-zurich-blue.png" alt="Zurich Seguros" height="30" style="display: inline-block; border: 0; height: 30px; outline: none; text-decoration: none;" title="Zurich Seguros">
                  </td>

                  <!-- Compañía de Seguros (Derecha) -->
                  <td width="70" valign="middle" align="right" style="padding-left: 10px;">
                    <img src="https://cozurich.dev.cloud.processmaker.net/public-files/Imagenes%20correos/zurich_compania_de_seguros.png" alt="Zurich Compañía de Seguros" height="100" style="display: block; border: 0; height: 100px; outline: none; text-decoration: none;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>

</html>`;
}
