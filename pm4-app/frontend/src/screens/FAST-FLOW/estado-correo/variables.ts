export interface EstadoCorreoData {
  // Control de estado del envío: "200" = éxito, cualquier otro = error
  email_respuesta_envio?: string;

  // Contenido del correo enviado
  email_titulo_envio?: string;
  email_correos_exitosos?: string;
  email_correos_fallidos?: string;

  // Metadatos del caso
  frm_gen_num_cotizacion?: string;
  frm_caso?: string;
}
