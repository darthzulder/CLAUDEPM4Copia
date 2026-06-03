#!/usr/bin/env python3
"""
Cotizador Worker — proceso persistente.
Carga el modelo Excel UNA vez al inicio y procesa requests en loop
vía stdin (JSON request) → stdout (JSON response).
"""
import sys, os, json, tempfile, shutil, warnings
warnings.filterwarnings('ignore')

def _ensure(pkg):
    try:
        __import__(pkg)
    except ImportError:
        import subprocess as _sp
        _sp.check_call([sys.executable, '-m', 'pip', 'install', pkg, '-q'])

_ensure('openpyxl')
_ensure('formulas')

import openpyxl   # noqa
import formulas   # noqa

# ── Helpers ──────────────────────────────────────────────────────────────────

def cop_label(n):
    try: n = int(float(str(n).replace(',','').replace('.',''))) if isinstance(n, str) else int(n)
    except: return str(n)
    parts = []
    t = abs(n)
    while t >= 1000:
        parts.append(f'{t % 1000:03d}')
        t //= 1000
    parts.append(str(t))
    return 'Hasta COP ' + '.'.join(reversed(parts))

def cop_str(n):
    try: n = int(float(str(n).replace(',','').replace('.',''))) if isinstance(n, str) else int(n)
    except: return str(n)
    parts = []
    t = abs(n)
    while t >= 1000:
        parts.append(f'{t % 1000:03d}')
        t //= 1000
    parts.append(str(t))
    return 'COP' + '.'.join(reversed(parts))

def to_int(v, d=0):
    try: return int(float(str(v).replace(',','')))
    except: return d

SECTOR_MAP = {
    'OTROS': 'Otros', 'COPROPIEDADES': 'Copropiedades',
    'CONSTRUCCION': 'Construcción',
    'EDUCACION': 'Educación, escolarización y atención a la infancia',
    'CENTROS_COMERCIALES': 'Centros Comerciales',
}

def extract_val(r):
    if r is None: return None
    try:
        v = r.value[0][0]
        if v is None or str(v) in ('nan','N/A','-','empty',''): return None
        return float(v)
    except: return None

# ── Cargar modelo ─────────────────────────────────────────────────────────────

def load_model(template_path):
    wb = openpyxl.load_workbook(template_path)
    bad = [n for n,d in list(wb.defined_names.items())
           if 'COP' in str(d.attr_text) or '[' in str(d.attr_text)]
    for n in bad:
        del wb.defined_names[n]
    tmp_dir = tempfile.mkdtemp(prefix='cotizador_')
    tmp_path = os.path.join(tmp_dir, 'model.xlsx')
    wb.save(tmp_path)
    fname = os.path.basename(tmp_path)
    xl = formulas.ExcelModel().loads(tmp_path).finish()
    return xl, fname, tmp_dir

def ck(fname, sheet, cell):
    return f"'[{fname}]{sheet.upper()}'!{cell.upper()}"

# ── Calcular ──────────────────────────────────────────────────────────────────

def calculate(xl, fname, inputs_json):
    dyo   = inputs_json.get('dyo',   {})
    cc    = inputs_json.get('cc',    {})
    pdysi = inputs_json.get('pdysi', {})
    pi    = inputs_json.get('pi',    {})

    xl_inputs  = {}
    xl_outputs = []

    if dyo:
        xl_inputs[ck(fname,'ENTRADAS','B3')] = cop_label(dyo.get('facturacion',0))
        xl_inputs[ck(fname,'ENTRADAS','B4')] = to_int(dyo.get('limite1',0))
        xl_inputs[ck(fname,'ENTRADAS','B5')] = to_int(dyo.get('limite2',0))
        xl_inputs[ck(fname,'ENTRADAS','B6')] = to_int(dyo.get('limite3',0))
        xl_inputs[ck(fname,'ENTRADAS','B8')] = 'SI' if dyo.get('anexo') else 'NO'
        xl_inputs[ck(fname,'ENTRADAS','B9')] = SECTOR_MAP.get(str(dyo.get('sector','')), dyo.get('sector','Otros'))
        xl_outputs += [ck(fname,'SALIDAS',c) for c in ['B3','B4','B5','B8','B9','B10','C8','C9','C10']]

    if cc:
        xl_inputs[ck(fname,'ENTRADAS','B15')] = to_int(cc.get('facturacion',0))
        xl_inputs[ck(fname,'ENTRADAS','B16')] = cop_str(cc.get('limite1_evento',0))
        xl_inputs[ck(fname,'ENTRADAS','B17')] = cop_str(cc.get('limite2_evento',0))
        xl_inputs[ck(fname,'ENTRADAS','B18')] = cop_str(cc.get('limite3_evento',0))
        xl_inputs[ck(fname,'ENTRADAS','B19')] = cop_str(cc.get('limite1_agregado',0))
        xl_inputs[ck(fname,'ENTRADAS','B20')] = cop_str(cc.get('limite2_agregado',0))
        xl_inputs[ck(fname,'ENTRADAS','B21')] = cop_str(cc.get('limite3_agregado',0))
        xl_inputs[ck(fname,'ENTRADAS','B24')] = cop_str(cc.get('limite1_evento',0))
        xl_inputs[ck(fname,'ENTRADAS','B25')] = cop_str(cc.get('limite2_evento',0))
        xl_inputs[ck(fname,'ENTRADAS','B26')] = cop_str(cc.get('limite3_evento',0))
        xl_inputs[ck(fname,'ENTRADAS','B27')] = cop_str(cc.get('limite1_agregado',0))
        xl_inputs[ck(fname,'ENTRADAS','B28')] = cop_str(cc.get('limite2_agregado',0))
        xl_inputs[ck(fname,'ENTRADAS','B29')] = cop_str(cc.get('limite3_agregado',0))
        xl_inputs[ck(fname,'ENTRADAS','B30')] = str(cc.get('empleados','1-100'))
        xl_outputs += [ck(fname,'SALIDAS',c) for c in ['B15','B16','B17','C15','C16','C17','B20','B21','B22','C20','C21','C22']]

    if pdysi:
        xl_inputs[ck(fname,'ENTRADAS','B35')] = to_int(pdysi.get('facturacion',0))
        xl_inputs[ck(fname,'ENTRADAS','B36')] = to_int(pdysi.get('limite1',0))
        xl_inputs[ck(fname,'ENTRADAS','B37')] = to_int(pdysi.get('limite2',0))
        xl_inputs[ck(fname,'ENTRADAS','B38')] = to_int(pdysi.get('limite3',0))
        xl_outputs += [ck(fname,'SALIDAS',c) for c in ['B29','B30','B31','C29','C30','C31','B34','B35','B36','C34','C35','C36']]

    if pi:
        xl_inputs[ck(fname,'ENTRADAS','B43')] = cop_label(pi.get('facturacion',0))
        xl_inputs[ck(fname,'ENTRADAS','B44')] = to_int(pi.get('limite',0))
        xl_inputs[ck(fname,'ENTRADAS','B45')] = str(pi.get('actividad',''))
        xl_inputs[ck(fname,'ENTRADAS','B46')] = to_int(pi.get('deducible',30000000))
        xl_outputs += [ck(fname,'SALIDAS',c) for c in ['A42','B42','C42']]

    if not xl_outputs:
        return {}

    result = xl.calculate(inputs=xl_inputs, outputs=xl_outputs)

    def gv(sheet, cell):
        return extract_val(result.get(ck(fname, sheet, cell)))

    output = {}
    if dyo:
        output['dyo'] = {
            'opt1': {'prima_a': gv('SALIDAS','B3'), 'prima_b': gv('SALIDAS','C8'),  'deducible': 0, 'ent_limite': gv('SALIDAS','B8')},
            'opt2': {'prima_a': gv('SALIDAS','B4'), 'prima_b': gv('SALIDAS','C9'),  'deducible': 0, 'ent_limite': gv('SALIDAS','B9')},
            'opt3': {'prima_a': gv('SALIDAS','B5'), 'prima_b': gv('SALIDAS','C10'), 'deducible': 0, 'ent_limite': gv('SALIDAS','B10')},
        }
    if cc:
        output['cc'] = {
            'opt1': {'deducible': gv('SALIDAS','B15'), 'prima': gv('SALIDAS','C15')},
            'opt2': {'deducible': gv('SALIDAS','B16'), 'prima': gv('SALIDAS','C16')},
            'opt3': {'deducible': gv('SALIDAS','B17'), 'prima': gv('SALIDAS','C17')},
        }
    if pdysi:
        output['pdysi'] = {
            'opt1': {'deducible': gv('SALIDAS','B29'), 'prima': gv('SALIDAS','C29')},
            'opt2': {'deducible': gv('SALIDAS','B30'), 'prima': gv('SALIDAS','C30')},
            'opt3': {'deducible': gv('SALIDAS','B31'), 'prima': gv('SALIDAS','C31')},
        }
    if pi:
        output['pi'] = {
            'opt1': {'limite': gv('SALIDAS','A42'), 'deducible': gv('SALIDAS','B42'), 'prima': gv('SALIDAS','C42')},
        }
    return output

# ── Worker loop ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    here     = os.path.dirname(os.path.abspath(__file__))
    template = os.path.normpath(os.path.join(here,'..','..','frontend','src','resources','cotizador.xlsx'))

    try:
        xl, fname, tmp_dir = load_model(template)
        # Señal de que el worker está listo
        sys.stdout.write(json.dumps({'ready': True}) + '\n')
        sys.stdout.flush()
    except Exception as e:
        sys.stdout.write(json.dumps({'ready': False, 'error': str(e)}) + '\n')
        sys.stdout.flush()
        sys.exit(1)

    try:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                req = json.loads(line)
                result = calculate(xl, fname, req)
                sys.stdout.write(json.dumps({'ok': True, 'result': result}) + '\n')
            except Exception as e:
                import traceback
                sys.stdout.write(json.dumps({'ok': False, 'error': str(e), 'trace': traceback.format_exc()[-300:]}) + '\n')
            sys.stdout.flush()
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
