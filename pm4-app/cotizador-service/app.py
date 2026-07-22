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

def cop_label(in_intAmount) -> str:
    # Normalizamos el monto a entero
    try: in_intAmount = int(float(str(in_intAmount).replace(',','').replace('.',''))) if isinstance(in_intAmount, str) else int(in_intAmount)
    except: return str(in_intAmount)
    # Partimos el numero en grupos de miles
    lstParts, intTemp = [], abs(in_intAmount)
    while intTemp >= 1000:
        lstParts.append(f'{intTemp % 1000:03d}'); intTemp //= 1000
    lstParts.append(str(intTemp))
    return 'Hasta COP ' + '.'.join(reversed(lstParts))

def cop_str(in_intAmount) -> str:
    # Normalizamos el monto a entero
    try: in_intAmount = int(float(str(in_intAmount).replace(',','').replace('.',''))) if isinstance(in_intAmount, str) else int(in_intAmount)
    except: return str(in_intAmount)
    # Partimos el numero en grupos de miles
    lstParts, intTemp = [], abs(in_intAmount)
    while intTemp >= 1000:
        lstParts.append(f'{intTemp % 1000:03d}'); intTemp //= 1000
    lstParts.append(str(intTemp))
    return 'COP' + '.'.join(reversed(lstParts))

def to_int(in_genValue, in_intDefault=0):
    # Intentamos convertir el valor a entero y si falla devolvemos el default
    try: return int(float(str(in_genValue).replace(',','')))
    except: return in_intDefault

SECTOR_MAP = {
    'OTROS':'Otros','COPROPIEDADES':'Copropiedades','CONSTRUCCION':'Construcción',
    'EDUCACION':'Educación, escolarización y atención a la infancia',
    'CENTROS_COMERCIALES':'Centros Comerciales',
}

def xlookup(in_genValue, in_lstSearch, in_lstResult, in_genDefault=None):
    """Equivalente a XLOOKUP: busca val en search_list, retorna el item correspondiente de result_list."""
    # Buscamos el valor y devolvemos el item en la misma posicion
    try:
        intIdx = [str(genItem) for genItem in in_lstSearch].index(str(in_genValue))
        return in_lstResult[intIdx]
    except (ValueError, IndexError):
        return in_genDefault

# ── Cálculos por producto ────────────────────────────────────────────────────

def calc_dyo(in_dicInput):
    dicTable = TABLES['dyo']
    strBilling = cop_label(in_dicInput.get('facturacion', 0))
    blnAnexo = bool(in_dicInput.get('anexo'))
    strSector = SECTOR_MAP.get(str(in_dicInput.get('sector','')), in_dicInput.get('sector','Otros'))

    # Encontrar fila por facturación
    dicRowData = next((r for r in dicTable['matrix'] if r['fac'] == strBilling), None)
    if not dicRowData:
        return None

    lstLimits = dicTable['limites']
    dicOptions = {}
    # Recorremos las tres opciones de cotizacion
    for intIdx, strKey in enumerate(['opt1','opt2','opt3']):
        intLimit = to_int(in_dicInput.get(f'limite{intIdx+1}', 0))
        dblPrimaA = xlookup(intLimit, lstLimits, dicRowData['primas'])
        # NC (Anexo): solo si sector=Otros y anexo=SI
        # v2: SALIDAS col C = DEDUCIBLE (no prima_b)
        genEntLimit   = None
        genEntDeduc = None
        if strSector == 'Otros' and blnAnexo:
            dicNcEntry = dicTable['nc'].get(str(intLimit))
            if dicNcEntry:
                genEntLimit    = dicNcEntry.get('limite_nc')
                genEntDeduc = dicNcEntry.get('deducible')
        dicOptions[strKey] = {'prima_a': dblPrimaA, 'deducible': 0, 'ent_limite': genEntLimit, 'ent_deducible': genEntDeduc}
    return dicOptions

def calc_cc(in_dicInput):
    dicTable = TABLES['cc']
    strBilling = str(to_int(in_dicInput.get('facturacion', 0)))
    strEmployees = str(in_dicInput.get('empleados', '1-100'))

    dicOptions = {}
    # Recorremos las tres opciones de cotizacion
    for intIdx, strKey in enumerate(['opt1','opt2','opt3']):
        strEvent  = cop_str(in_dicInput.get(f'limite{intIdx+1}_evento',   0))
        strAggregate = cop_str(in_dicInput.get(f'limite{intIdx+1}_agregado', 0))
        strLookupKey = f'{strEmployees}-{strBilling}-{strEvent}-{strAggregate}'
        dblPrima      = dicTable['primas'].get(strLookupKey)
        strDeducible = dicTable['deducibles'].get(strEvent)
        # Deducible puede venir como "COP30.000.000" — convertir a número
        dblDeducible = None
        if strDeducible:
            try: dblDeducible = float(strDeducible.replace('COP','').replace('.',''))
            except: pass
        dicOptions[strKey] = {'deducible': dblDeducible, 'prima': dblPrima}
    return dicOptions

def calc_pdysi(in_dicInput):
    # v2: ENTRADAS B27(fac) B28-B30(limites), SALIDAS B23-C25
    dicTable = TABLES['pdysi']
    strBilling = str(to_int(in_dicInput.get('facturacion', 0)))

    dicOptions = {}
    # Recorremos las tres opciones de cotizacion
    for intIdx, strKey in enumerate(['opt1','opt2','opt3']):
        strLimit = str(to_int(in_dicInput.get(f'limite{intIdx+1}', 0)))
        strLookupKey = f'{strBilling}-{strLimit}'
        dicOptions[strKey] = {
            'deducible': dicTable['deducibles'].get(strLookupKey),
            'prima':     dicTable['primas'].get(strLookupKey),
        }
    return dicOptions

def _pi_sector(in_strActivity: str) -> str:
    # Deducimos el sector a partir del texto de la actividad
    strUpper = in_strActivity.upper()
    if 'ABOGAD' in strUpper:   return 'ABOGADOS'
    if 'CONTAD' in strUpper:   return 'CONTADORES'
    return 'ADMINISTRADORES'

def calc_pi(in_dicInput):
    # v2: 3 alternativas, cada una con limite+deducible propios
    # ENTRADAS: B35(fac) B36-B38(limites) B39(actividad) B40-B42(deducibles)
    dicTable        = TABLES['pi']
    strBilling      = cop_label(in_dicInput.get('facturacion', 0))
    strActivity = str(in_dicInput.get('actividad', ''))
    dicSectorTable = dicTable.get(_pi_sector(strActivity), dicTable.get('ADMINISTRADORES', {}))

    dicDedMap = TABLES.get('pi_ded_map', {}).get(_pi_sector(strActivity), {})

    dicOptions = {}
    # Recorremos las tres opciones de cotizacion
    for intIdx, strKey in enumerate(['opt1','opt2','opt3']):
        intLimit = to_int(in_dicInput.get(f'limite{intIdx+1}', 0))
        if intLimit == 0:
            dicOptions[strKey] = {'limite': None, 'deducible': None, 'prima': None}
            continue
        # Deducible: usar el pasado o auto-derivar del mapeo
        intDeducible = to_int(in_dicInput.get(f'deducible{intIdx+1}', 0))
        if intDeducible == 0:
            intDeducible = dicDedMap.get(str(intLimit), 0)
        strLookupKey = f'{strBilling}{intDeducible}{intLimit}'
        dblPrima = dicSectorTable.get(strLookupKey)
        dicOptions[strKey] = {'limite': intLimit, 'deducible': intDeducible, 'prima': dblPrima}
    return dicOptions

# ── Flask ─────────────────────────────────────────────────────────────────────

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'ok': True})

@app.route('/calcular', methods=['POST'])
def calcular():
    # Leemos el payload y calculamos cada producto solicitado
    try:
        dicInput = request.get_json(force=True) or {}
        dicResult = {}
        if dicInput.get('dyo'):   dicResult['dyo']   = calc_dyo(dicInput['dyo'])
        if dicInput.get('cc'):    dicResult['cc']     = calc_cc(dicInput['cc'])
        if dicInput.get('pdysi'): dicResult['pdysi']  = calc_pdysi(dicInput['pdysi'])
        if dicInput.get('pi'):    dicResult['pi']     = calc_pi(dicInput['pi'])
        return jsonify({'ok': True, 'result': dicResult})
    except Exception as excError:
        import traceback
        return jsonify({'ok': False, 'error': str(excError), 'trace': traceback.format_exc()[-400:]}), 500

if __name__ == '__main__':
    # Levantamos el servidor en el puerto configurado
    intPort = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=intPort)
