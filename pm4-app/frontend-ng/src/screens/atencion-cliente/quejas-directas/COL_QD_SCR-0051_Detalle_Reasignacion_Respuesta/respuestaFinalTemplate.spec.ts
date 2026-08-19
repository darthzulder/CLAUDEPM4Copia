import { describe, expect, it } from 'vitest';
import { buildRespuestaFinalHtml, fillRespuestaFinalHtml, type RespuestaFinalVars } from './respuestaFinalTemplate';

const BASE_VARS: RespuestaFinalVars = {
  tipo: 'queja',
  tipoDesc: 'Queja',
  numeroRadicado: '12345',
  nombre: 'Juan Pérez',
  interaccion: 'llamada telefónica',
  loQueOcurrio: 'Texto de la queja',
  nuestraRespuesta: 'Texto de la respuesta',
  textoProcede: 'Acciones tomadas',
};

describe('fillRespuestaFinalHtml', () => {
  it('sustituye los marcadores simples reconocidos', () => {
    const out = fillRespuestaFinalHtml(
      '<p>{{qd_strRequestType_desc}} N.° {{NúmeroRadicado}}</p><p>Hola {{nombre_cliente}}</p>',
      BASE_VARS,
    );
    expect(out).toBe('<p>Queja N.° 12345</p><p>Hola Juan Pérez</p>');
  });

  it('escapa HTML en el texto del usuario (evita inyección en el correo)', () => {
    const out = fillRespuestaFinalHtml('{{nombre_cliente}}', {
      ...BASE_VARS,
      nombre: '<script>alert(1)</script>',
    });
    expect(out).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('convierte saltos de línea a <br> en los campos multilínea', () => {
    const out = fillRespuestaFinalHtml('{{qd_strComplaintText}}', {
      ...BASE_VARS,
      loQueOcurrio: 'Línea 1\nLínea 2',
    });
    expect(out).toBe('Línea 1<br>Línea 2');
  });

  it('usa el texto de fallback cuando el campo multilínea viene vacío', () => {
    const out = fillRespuestaFinalHtml('{{qd_strComplaintText}}', { ...BASE_VARS, loQueOcurrio: '' });
    expect(out).toBe('Sin descripción registrada.');
  });

  it('deja intacto un marcador que no reconoce (no adivina la expansión BPM)', () => {
    const out = fillRespuestaFinalHtml('{{qd_campo_desconocido}}', BASE_VARS);
    expect(out).toBe('{{qd_campo_desconocido}}');
  });

  it('resuelve cualquier marcador texto_* al texto de acciones tomadas', () => {
    const out = fillRespuestaFinalHtml('{{texto_procede}} / {{%texto_no_procede}}', {
      ...BASE_VARS,
      textoProcede: 'Se corrigió el error',
    });
    expect(out).toContain('Se corrigió el error');
    // Ambos marcadores resuelven al mismo texto (ver comentario del código fuente).
    expect(out.match(/Se corrigió el error/g)).toHaveLength(2);
  });

  it('reemplaza las cajas %% ... % conservando el encabezado', () => {
    const out = fillRespuestaFinalHtml(
      'X %% Lo que ocurrió% Y %% Nuestra respuesta%% Z',
      { ...BASE_VARS, loQueOcurrio: 'Ocurrio1', nuestraRespuesta: 'Resp1' },
    );
    expect(out).toContain('Lo que ocurrió<br><br>');
    expect(out).toContain('Ocurrio1');
    expect(out).toContain('Nuestra respuesta<br><br>');
    expect(out).toContain('Resp1');
  });
});

describe('buildRespuestaFinalHtml', () => {
  it('genera un documento HTML completo con las variables escapadas', () => {
    const out = buildRespuestaFinalHtml({ ...BASE_VARS, nombre: '<b>Juan</b>' });
    expect(out.startsWith('<!doctype html>')).toBe(true);
    expect(out).toContain('&lt;b&gt;Juan&lt;/b&gt;');
    expect(out).not.toContain('Hola <b>Juan</b>,');
  });

  it('usa los placeholders por defecto cuando faltan datos', () => {
    const out = buildRespuestaFinalHtml({
      tipo: '', numeroRadicado: '', nombre: '', interaccion: '',
      loQueOcurrio: '', nuestraRespuesta: '', textoProcede: '',
    });
    expect(out).toContain('Sin descripción registrada.');
    expect(out).toContain('Aún no se ha redactado la respuesta al cliente.');
    expect(out).toContain('Sin acciones registradas.');
  });
});
