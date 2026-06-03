"""
Cotizador API — sin scipy, sin formulas library.
Carga tables.json al arrancar (~1MB) y sirve /calcular con lookups puros.
"""
import os, json
from flask import Flask, request, jsonify

HERE   = os.path.dirname(os.path.abspath(__file__))
TABLES = json.load(open(os.path.join(HERE, 'tables.json'), encoding='utf-8'))

print('[cotizador] tables.json cargado.', flush=True)

# ── Helpers ───────────────────────────────────────────────────────────────────

def cop_label(n) -> str:
    try: n = int(float(str(n).replace(',','').replace('.',''))) if isinstance(n, str) else int(n)
    except: return str(n)
    parts, t = [], abs(n)
    while t >= 1000:
        parts.append(f'{t % 1000:03d}'); t //= 1000
    parts.append(str(t))
    return 'Hasta COP ' + '.'.join(reversed(parts))

def cop_str(n) -> str:
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
    'OTROS':'Otros','COPROPIEDADES':'Copropiedades','CONSTRUCCION':'Construcción',
    'EDUCACION':'Educación, escolarización y atención a la infancia',
    'CENTROS_COMERCIALES':'Centros Comerciales',
}

def xlookup(val, search_list, result_list, default=None):
    """Equivalente a XLOOKUP: busca val en search_list, retorna el item correspondiente de result_list."""
    try:
        idx = [str(x) for x in search_list].index(str(val))
        return result_list[idx]
    except (ValueError, IndexError):
        return default

# ── Cálculos por producto ────────────────────────────────────────────────────

def calc_dyo(inp):
    t = TABLES['dyo']
    fac   = cop_label(inp.get('facturacion', 0))
    anexo = bool(inp.get('anexo'))
    sector = SECTOR_MAP.get(str(inp.get('sector','')), inp.get('sector','Otros'))

    # Encontrar fila por facturación
    row_data = next((r for r in t['matrix'] if r['fac'] == fac), None)
    if not row_data:
        return None

    limites = t['limites']
    opts = {}
    for i, key in enumerate(['opt1','opt2','opt3']):
        lim = to_int(inp.get(f'limite{i+1}', 0))
        prima_a = xlookup(lim, limites, row_data['primas'])
        # NC prima_b: solo si sector=Otros y anexo=SI
        prima_b = None
        ent_limite = None
        if sector == 'Otros' and anexo:
            nc_entry = t['nc'].get(str(lim))
            if nc_entry:
                ent_limite = nc_entry.get('limite_nc')
                # Prima NC ≈ deducible del NC (el Excel lo calcula igual que la prima A para esa tabla)
                prima_b = xlookup(lim, limites, row_data['primas'])
        opts[key] = {'prima_a': prima_a, 'prima_b': prima_b, 'deducible': 0, 'ent_limite': ent_limite}
    return opts

def calc_cc(inp):
    t = TABLES['cc']
    fac      = str(to_int(inp.get('facturacion', 0)))
    empleados = str(inp.get('empleados', '1-100'))

    opts = {}
    for i, key in enumerate(['opt1','opt2','opt3']):
        ev  = cop_str(inp.get(f'limite{i+1}_evento',   0))
        agr = cop_str(inp.get(f'limite{i+1}_agregado', 0))
        lookup_key = f'{empleados}-{fac}-{ev}-{agr}'
        prima      = t['primas'].get(lookup_key)
        deducible_str = t['deducibles'].get(ev)
        # Deducible puede venir como "COP30.000.000" — convertir a número
        ded = None
        if deducible_str:
            try: ded = float(deducible_str.replace('COP','').replace('.',''))
            except: pass
        opts[key] = {'deducible': ded, 'prima': prima}
    return opts

def calc_pdysi(inp):
    t = TABLES['pdysi']
    fac = str(to_int(inp.get('facturacion', 0)))

    opts = {}
    for i, key in enumerate(['opt1','opt2','opt3']):
        lim = str(to_int(inp.get(f'limite{i+1}', 0)))
        lookup_key = f'{fac}-{lim}'
        opts[key] = {
            'deducible': t['deducibles'].get(lookup_key),
            'prima':     t['primas'].get(lookup_key),
        }
    return opts

def calc_pi(inp):
    t        = TABLES['pi']
    fac      = cop_label(inp.get('facturacion', 0))
    lim      = to_int(inp.get('limite', 0))
    ded      = to_int(inp.get('deducible', 30000000))
    actividad = str(inp.get('actividad', ''))

    # Sector mapping: el Excel usa ABOGADOS/ADMINISTRADORES/CONTADORES
    sector_key = None
    actividad_upper = actividad.upper()
    if 'ABOGAD' in actividad_upper:
        sector_key = 'ABOGADOS'
    elif 'CONTAD' in actividad_upper:
        sector_key = 'CONTADORES'
    else:
        sector_key = 'ADMINISTRADORES'  # default

    lookup_key = f'{fac}{ded}{lim}'
    sector_table = t.get(sector_key, t.get('ADMINISTRADORES', {}))
    prima = sector_table.get(lookup_key)

    return {'opt1': {'limite': lim, 'deducible': ded, 'prima': prima}}

# ── Flask ─────────────────────────────────────────────────────────────────────

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'ok': True})

@app.route('/calcular', methods=['POST'])
def calcular():
    try:
        inp = request.get_json(force=True) or {}
        result = {}
        if inp.get('dyo'):   result['dyo']   = calc_dyo(inp['dyo'])
        if inp.get('cc'):    result['cc']     = calc_cc(inp['cc'])
        if inp.get('pdysi'): result['pdysi']  = calc_pdysi(inp['pdysi'])
        if inp.get('pi'):    result['pi']     = calc_pi(inp['pi'])
        return jsonify({'ok': True, 'result': result})
    except Exception as e:
        import traceback
        return jsonify({'ok': False, 'error': str(e), 'trace': traceback.format_exc()[-400:]}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
