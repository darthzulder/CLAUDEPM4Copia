#!/usr/bin/env python3
"""
Cotizador Fast Flow — Calculador Excel
Lee entradas desde stdin (JSON), evalúa las fórmulas del Excel usando la
librería 'formulas' (sin necesidad de LibreOffice), y devuelve las salidas
de SALIDAS como JSON por stdout.
"""
import sys
import json
import os
import tempfile
import shutil
import warnings

warnings.filterwarnings('ignore')

# ── Auto-instalar dependencias si faltan ─────────────────────────────────────

def _ensure(pkg, import_name=None):
    try:
        __import__(import_name or pkg)
    except ImportError:
        import subprocess as _sp
        _sp.check_call([sys.executable, '-m', 'pip', 'install', pkg, '-q'])

_ensure('openpyxl')
_ensure('formulas')

import openpyxl  # noqa: E402
import formulas   # noqa: E402

# ── Helpers de formato ───────────────────────────────────────────────────────

def cop_label(n) -> str:
    """7000000000 → 'Hasta COP 7.000.000.000'"""
    try:
        n = int(float(str(n).replace(',', '').replace('.', ''))) if isinstance(n, str) else int(n)
    except Exception:
        return str(n)
    parts = []
    tmp = abs(n)
    while tmp >= 1000:
        parts.append(f'{tmp % 1000:03d}')
        tmp //= 1000
    parts.append(str(tmp))
    return 'Hasta COP ' + '.'.join(reversed(parts))

def cop_str(n) -> str:
    """1000000000 → 'COP1.000.000.000'"""
    try:
        n = int(float(str(n).replace(',', '').replace('.', ''))) if isinstance(n, str) else int(n)
    except Exception:
        return str(n)
    parts = []
    tmp = abs(n)
    while tmp >= 1000:
        parts.append(f'{tmp % 1000:03d}')
        tmp //= 1000
    parts.append(str(tmp))
    return 'COP' + '.'.join(reversed(parts))

def to_int(v, default=0) -> int:
    if v is None:
        return default
    try:
        return int(float(str(v).replace(',', '')))
    except Exception:
        return default

SECTOR_MAP = {
    'OTROS':               'Otros',
    'COPROPIEDADES':       'Copropiedades',
    'CONSTRUCCION':        'Construcción',
    'EDUCACION':           'Educación, escolarización y atención a la infancia',
    'CENTROS_COMERCIALES': 'Centros Comerciales',
}

# ── Extraer valor de un objeto Ranges de formulas ────────────────────────────

def extract_val(ranges_obj):
    if ranges_obj is None:
        return None
    try:
        arr = ranges_obj.value
        v = arr[0][0]
        if v is None:
            return None
        s = str(v)
        if s in ('nan', 'N/A', '-', 'empty', '', 'None'):
            return None
        return float(v)
    except Exception:
        return None

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            print(json.dumps({'error': 'No se recibieron datos en stdin'}))
            sys.exit(1)
        inputs = json.loads(raw)
    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'JSON inválido: {e}'}))
        sys.exit(1)

    here     = os.path.dirname(os.path.abspath(__file__))
    template = os.path.normpath(os.path.join(here, '..', '..', 'frontend', 'src', 'resources', 'cotizador.xlsx'))

    if not os.path.isfile(template):
        print(json.dumps({'error': f'No se encontró el Excel: {template}'}))
        sys.exit(1)

    work_dir = tempfile.mkdtemp(prefix='cotizador_')
    try:
        # 1. Copiar template y limpiar named ranges con fórmulas inválidas
        tmp_path = os.path.join(work_dir, 'calc.xlsx')
        wb = openpyxl.load_workbook(template)
        bad_names = [
            n for n, d in list(wb.defined_names.items())
            if 'COP' in str(d.attr_text) or '[' in str(d.attr_text)
        ]
        for n in bad_names:
            del wb.defined_names[n]
        wb.save(tmp_path)
        fname = os.path.basename(tmp_path)

        # 2. Cargar modelo de fórmulas
        xl = formulas.ExcelModel().loads(tmp_path).finish()

        def ck(sheet, cell):
            """Genera la clave del modelo: '[fname]SHEET'!CELL"""
            return f"'[{fname}]{sheet.upper()}'!{cell.upper()}"

        # 3. Construir inputs para el Excel
        dyo   = inputs.get('dyo',   {})
        cc    = inputs.get('cc',    {})
        pdysi = inputs.get('pdysi', {})
        pi    = inputs.get('pi',    {})

        xl_inputs = {}

        if dyo:
            xl_inputs[ck('ENTRADAS', 'B3')] = cop_label(dyo.get('facturacion', 0))
            xl_inputs[ck('ENTRADAS', 'B4')] = to_int(dyo.get('limite1', 0))
            xl_inputs[ck('ENTRADAS', 'B5')] = to_int(dyo.get('limite2', 0))
            xl_inputs[ck('ENTRADAS', 'B6')] = to_int(dyo.get('limite3', 0))
            xl_inputs[ck('ENTRADAS', 'B8')] = 'SI' if dyo.get('anexo') else 'NO'
            xl_inputs[ck('ENTRADAS', 'B9')] = SECTOR_MAP.get(str(dyo.get('sector', '')), dyo.get('sector', 'Otros'))

        if cc:
            xl_inputs[ck('ENTRADAS', 'B15')] = to_int(cc.get('facturacion', 0))
            xl_inputs[ck('ENTRADAS', 'B16')] = cop_str(cc.get('limite1_evento', 0))
            xl_inputs[ck('ENTRADAS', 'B17')] = cop_str(cc.get('limite2_evento', 0))
            xl_inputs[ck('ENTRADAS', 'B18')] = cop_str(cc.get('limite3_evento', 0))
            xl_inputs[ck('ENTRADAS', 'B19')] = cop_str(cc.get('limite1_agregado', 0))
            xl_inputs[ck('ENTRADAS', 'B20')] = cop_str(cc.get('limite2_agregado', 0))
            xl_inputs[ck('ENTRADAS', 'B21')] = cop_str(cc.get('limite3_agregado', 0))
            xl_inputs[ck('ENTRADAS', 'B24')] = cop_str(cc.get('limite1_evento', 0))
            xl_inputs[ck('ENTRADAS', 'B25')] = cop_str(cc.get('limite2_evento', 0))
            xl_inputs[ck('ENTRADAS', 'B26')] = cop_str(cc.get('limite3_evento', 0))
            xl_inputs[ck('ENTRADAS', 'B27')] = cop_str(cc.get('limite1_agregado', 0))
            xl_inputs[ck('ENTRADAS', 'B28')] = cop_str(cc.get('limite2_agregado', 0))
            xl_inputs[ck('ENTRADAS', 'B29')] = cop_str(cc.get('limite3_agregado', 0))
            xl_inputs[ck('ENTRADAS', 'B30')] = str(cc.get('empleados', '1-100'))

        if pdysi:
            xl_inputs[ck('ENTRADAS', 'B35')] = to_int(pdysi.get('facturacion', 0))
            xl_inputs[ck('ENTRADAS', 'B36')] = to_int(pdysi.get('limite1', 0))
            xl_inputs[ck('ENTRADAS', 'B37')] = to_int(pdysi.get('limite2', 0))
            xl_inputs[ck('ENTRADAS', 'B38')] = to_int(pdysi.get('limite3', 0))

        if pi:
            xl_inputs[ck('ENTRADAS', 'B43')] = cop_label(pi.get('facturacion', 0))
            xl_inputs[ck('ENTRADAS', 'B44')] = to_int(pi.get('limite', 0))
            xl_inputs[ck('ENTRADAS', 'B45')] = str(pi.get('actividad', ''))
            xl_inputs[ck('ENTRADAS', 'B46')] = to_int(pi.get('deducible', 30000000))

        # 4. Calcular con outputs explícitos
        output_refs = []
        if dyo:
            output_refs += [ck('SALIDAS', c) for c in ['B3','B4','B5','B8','B9','B10','C8','C9','C10']]
        if cc:
            output_refs += [ck('SALIDAS', c) for c in ['B15','B16','B17','C15','C16','C17','B20','B21','B22','C20','C21','C22']]
        if pdysi:
            output_refs += [ck('SALIDAS', c) for c in ['B29','B30','B31','C29','C30','C31','B34','B35','B36','C34','C35','C36']]
        if pi:
            output_refs += [ck('SALIDAS', c) for c in ['A42','B42','C42']]

        result = xl.calculate(inputs=xl_inputs, outputs=output_refs)

        def gv(sheet, cell):
            return extract_val(result.get(ck(sheet, cell)))

        # 5. Construir respuesta
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

        print(json.dumps({'ok': True, 'result': output}))

    except Exception as e:
        import traceback
        print(json.dumps({'error': str(e), 'trace': traceback.format_exc()[-500:]}))
        sys.exit(1)
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == '__main__':
    main()
