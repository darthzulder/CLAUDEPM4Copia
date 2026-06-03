"""
Cotizador API — micro-servicio Flask
Carga el modelo Excel una vez al arrancar y sirve /calcular vía HTTP.
"""
import os, sys, json, tempfile, shutil, warnings
warnings.filterwarnings('ignore')

from flask import Flask, request, jsonify

# ── dependencias ──────────────────────────────────────────────────────────────
try:
    import openpyxl
    import formulas
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'openpyxl', 'formulas', '-q'])
    import openpyxl
    import formulas

# ── helpers ───────────────────────────────────────────────────────────────────

def cop_label(n):
    try: n = int(float(str(n).replace(',','').replace('.',''))) if isinstance(n, str) else int(n)
    except: return str(n)
    parts, t = [], abs(n)
    while t >= 1000:
        parts.append(f'{t % 1000:03d}'); t //= 1000
    parts.append(str(t))
    return 'Hasta COP ' + '.'.join(reversed(parts))

def cop_str(n):
    try: n = int(float(str(n).replace(',','').replace('.',''))) if isinstance(n, str) else int(n)
    except: return str(n)
    parts, t = [], abs(n)
    while t >= 1000:
        parts.append(f'{t % 1000:03d}'); t //= 1000
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

# ── cargar modelo ─────────────────────────────────────────────────────────────

HERE     = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.normpath(os.path.join(HERE, '..', 'frontend', 'src', 'resources', 'cotizador.xlsx'))

print(f'[cotizador] Cargando modelo desde {TEMPLATE}…', flush=True)

_tmp_dir  = tempfile.mkdtemp(prefix='cotizador_')
_tmp_path = os.path.join(_tmp_dir, 'model.xlsx')

wb = openpyxl.load_workbook(TEMPLATE)
bad = [n for n, d in list(wb.defined_names.items())
       if 'COP' in str(d.attr_text) or '[' in str(d.attr_text)]
for n in bad:
    del wb.defined_names[n]
wb.save(_tmp_path)

FNAME = os.path.basename(_tmp_path)
XL    = formulas.ExcelModel().loads(_tmp_path).finish()

print('[cotizador] Modelo listo.', flush=True)

def ck(sheet, cell):
    return f"'[{FNAME}]{sheet.upper()}'!{cell.upper()}"

# ── cálculo ───────────────────────────────────────────────────────────────────

def do_calculate(inp):
    dyo   = inp.get('dyo',   {})
    cc    = inp.get('cc',    {})
    pdysi = inp.get('pdysi', {})
    pi    = inp.get('pi',    {})

    xl_in, xl_out = {}, []

    if dyo:
        xl_in[ck('ENTRADAS','B3')] = cop_label(dyo.get('facturacion',0))
        xl_in[ck('ENTRADAS','B4')] = to_int(dyo.get('limite1',0))
        xl_in[ck('ENTRADAS','B5')] = to_int(dyo.get('limite2',0))
        xl_in[ck('ENTRADAS','B6')] = to_int(dyo.get('limite3',0))
        xl_in[ck('ENTRADAS','B8')] = 'SI' if dyo.get('anexo') else 'NO'
        xl_in[ck('ENTRADAS','B9')] = SECTOR_MAP.get(str(dyo.get('sector','')), dyo.get('sector','Otros'))
        xl_out += [ck('SALIDAS',c) for c in ['B3','B4','B5','B8','B9','B10','C8','C9','C10']]

    if cc:
        xl_in[ck('ENTRADAS','B15')] = to_int(cc.get('facturacion',0))
        for i, k in enumerate(['B16','B17','B18'], 1):
            xl_in[ck('ENTRADAS',k)] = cop_str(cc.get(f'limite{i}_evento',0))
        for i, k in enumerate(['B19','B20','B21'], 1):
            xl_in[ck('ENTRADAS',k)] = cop_str(cc.get(f'limite{i}_agregado',0))
        for i, k in enumerate(['B24','B25','B26'], 1):
            xl_in[ck('ENTRADAS',k)] = cop_str(cc.get(f'limite{i}_evento',0))
        for i, k in enumerate(['B27','B28','B29'], 1):
            xl_in[ck('ENTRADAS',k)] = cop_str(cc.get(f'limite{i}_agregado',0))
        xl_in[ck('ENTRADAS','B30')] = str(cc.get('empleados','1-100'))
        xl_out += [ck('SALIDAS',c) for c in ['B15','B16','B17','C15','C16','C17','B20','B21','B22','C20','C21','C22']]

    if pdysi:
        xl_in[ck('ENTRADAS','B35')] = to_int(pdysi.get('facturacion',0))
        xl_in[ck('ENTRADAS','B36')] = to_int(pdysi.get('limite1',0))
        xl_in[ck('ENTRADAS','B37')] = to_int(pdysi.get('limite2',0))
        xl_in[ck('ENTRADAS','B38')] = to_int(pdysi.get('limite3',0))
        xl_out += [ck('SALIDAS',c) for c in ['B29','B30','B31','C29','C30','C31','B34','B35','B36','C34','C35','C36']]

    if pi:
        xl_in[ck('ENTRADAS','B43')] = cop_label(pi.get('facturacion',0))
        xl_in[ck('ENTRADAS','B44')] = to_int(pi.get('limite',0))
        xl_in[ck('ENTRADAS','B45')] = str(pi.get('actividad',''))
        xl_in[ck('ENTRADAS','B46')] = to_int(pi.get('deducible',30000000))
        xl_out += [ck('SALIDAS',c) for c in ['A42','B42','C42']]

    if not xl_out:
        return {}

    res = XL.calculate(inputs=xl_in, outputs=xl_out)

    def gv(s, c):
        return extract_val(res.get(ck(s, c)))

    out = {}
    if dyo:
        out['dyo'] = {
            'opt1': {'prima_a': gv('SALIDAS','B3'), 'prima_b': gv('SALIDAS','C8'),  'deducible': 0, 'ent_limite': gv('SALIDAS','B8')},
            'opt2': {'prima_a': gv('SALIDAS','B4'), 'prima_b': gv('SALIDAS','C9'),  'deducible': 0, 'ent_limite': gv('SALIDAS','B9')},
            'opt3': {'prima_a': gv('SALIDAS','B5'), 'prima_b': gv('SALIDAS','C10'), 'deducible': 0, 'ent_limite': gv('SALIDAS','B10')},
        }
    if cc:
        out['cc'] = {
            'opt1': {'deducible': gv('SALIDAS','B15'), 'prima': gv('SALIDAS','C15')},
            'opt2': {'deducible': gv('SALIDAS','B16'), 'prima': gv('SALIDAS','C16')},
            'opt3': {'deducible': gv('SALIDAS','B17'), 'prima': gv('SALIDAS','C17')},
        }
    if pdysi:
        out['pdysi'] = {
            'opt1': {'deducible': gv('SALIDAS','B29'), 'prima': gv('SALIDAS','C29')},
            'opt2': {'deducible': gv('SALIDAS','B30'), 'prima': gv('SALIDAS','C30')},
            'opt3': {'deducible': gv('SALIDAS','B31'), 'prima': gv('SALIDAS','C31')},
        }
    if pi:
        out['pi'] = {
            'opt1': {'limite': gv('SALIDAS','A42'), 'deducible': gv('SALIDAS','B42'), 'prima': gv('SALIDAS','C42')},
        }
    return out

# ── Flask app ─────────────────────────────────────────────────────────────────

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'ok': True})

@app.route('/calcular', methods=['POST'])
def calcular():
    try:
        result = do_calculate(request.get_json(force=True) or {})
        return jsonify({'ok': True, 'result': result})
    except Exception as e:
        import traceback
        return jsonify({'ok': False, 'error': str(e), 'trace': traceback.format_exc()[-400:]}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
