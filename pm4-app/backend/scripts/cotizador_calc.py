#!/usr/bin/env python3
"""
Cotizador Fast Flow — Calculador Excel
Recibe entradas como JSON en argv[1], escribe las celdas en ENTRADAS,
LibreOffice recalcula todas las fórmulas y se leen las salidas de SALIDAS.
"""
import sys
import json
import os
import shutil
import subprocess
import tempfile

try:
    import openpyxl
except ImportError:
    print(json.dumps({"error": "openpyxl no instalado. Ejecutar: pip install openpyxl"}))
    sys.exit(1)

# ─── Helpers de formato ──────────────────────────────────────────────────────

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
    formatted = '.'.join(reversed(parts))
    return f'Hasta COP {formatted}'

def cop_str(n) -> str:
    """1000000000 → 'COP1.000.000.000'  (formato CC/Infidelidad)"""
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

def safe_num(v):
    if v is None or v == 'N/A' or v == '-' or v == '':
        return None
    try:
        return float(v)
    except Exception:
        return None

# ─── Sector mapping (form value → Excel label) ───────────────────────────────

SECTOR_MAP = {
    'OTROS':             'Otros',
    'COPROPIEDADES':     'Copropiedades',
    'CONSTRUCCION':      'Construcción',
    'EDUCACION':         'Educación, escolarización y atención a la infancia',
    'CENTROS_COMERCIALES': 'Centros Comerciales',
}

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            print(json.dumps({"error": "No se recibieron datos en stdin"}))
            sys.exit(1)
        inputs = json.loads(raw)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"JSON inválido: {e}"}))
        sys.exit(1)

    # Ruta al Excel template
    here = os.path.dirname(os.path.abspath(__file__))
    template = os.path.join(here, '..', '..', 'frontend', 'src', 'resources', 'cotizador.xlsx')
    template = os.path.normpath(template)

    if not os.path.isfile(template):
        print(json.dumps({"error": f"No se encontró el Excel: {template}"}))
        sys.exit(1)

    work_dir = tempfile.mkdtemp(prefix='cotizador_')
    try:
        input_file  = os.path.join(work_dir, 'input.xlsx')
        output_dir  = os.path.join(work_dir, 'output')
        lo_profile  = os.path.join(work_dir, 'lo_profile')
        os.makedirs(output_dir)
        os.makedirs(lo_profile)

        shutil.copy(template, input_file)

        # ── Escribir entradas ──────────────────────────────────────────────
        wb = openpyxl.load_workbook(input_file)
        ws = wb['ENTRADAS']

        dyo   = inputs.get('dyo',   {})
        cc    = inputs.get('cc',    {})
        pdysi = inputs.get('pdysi', {})
        pi    = inputs.get('pi',    {})

        # D&O
        if dyo:
            ws['B3'] = cop_label(dyo.get('facturacion', 0))
            ws['B4'] = to_int(dyo.get('limite1', 0))
            ws['B5'] = to_int(dyo.get('limite2', 0))
            ws['B6'] = to_int(dyo.get('limite3', 0))
            ws['B8'] = 'SI' if dyo.get('anexo') else 'NO'
            ws['B9'] = SECTOR_MAP.get(str(dyo.get('sector', '')), dyo.get('sector', 'Otros'))

        # CC / Infidelidad de Empleados
        if cc:
            ws['B15'] = to_int(cc.get('facturacion', 0))
            ws['B16'] = cop_str(cc.get('limite1_evento', 0))
            ws['B17'] = cop_str(cc.get('limite2_evento', 0))
            ws['B18'] = cop_str(cc.get('limite3_evento', 0))
            ws['B19'] = cop_str(cc.get('limite1_agregado', 0))
            ws['B20'] = cop_str(cc.get('limite2_agregado', 0))
            ws['B21'] = cop_str(cc.get('limite3_agregado', 0))
            # NC: mismos límites que principales
            ws['B24'] = cop_str(cc.get('limite1_evento', 0))
            ws['B25'] = cop_str(cc.get('limite2_evento', 0))
            ws['B26'] = cop_str(cc.get('limite3_evento', 0))
            ws['B27'] = cop_str(cc.get('limite1_agregado', 0))
            ws['B28'] = cop_str(cc.get('limite2_agregado', 0))
            ws['B29'] = cop_str(cc.get('limite3_agregado', 0))
            ws['B30'] = str(cc.get('empleados', '1-100'))

        # PDySI / Cyber
        if pdysi:
            ws['B35'] = to_int(pdysi.get('facturacion', 0))
            ws['B36'] = to_int(pdysi.get('limite1', 0))
            ws['B37'] = to_int(pdysi.get('limite2', 0))
            ws['B38'] = to_int(pdysi.get('limite3', 0))

        # PI
        if pi:
            ws['B43'] = cop_label(pi.get('facturacion', 0))
            ws['B44'] = to_int(pi.get('limite', 0))
            ws['B45'] = str(pi.get('actividad', ''))
            ws['B46'] = to_int(pi.get('deducible', 30000000))

        # Forzar recálculo al abrir
        wb.calculation.forceFullCalc = True
        wb.calculation.fullCalcOnLoad = True
        wb.save(input_file)

        # ── Encontrar y ejecutar LibreOffice ─────────────────────────────
        def find_libreoffice():
            if sys.platform == 'win32':
                for p in [
                    r'C:\Program Files\LibreOffice\program\soffice.exe',
                    r'C:\Program Files (x86)\LibreOffice\program\soffice.exe',
                ]:
                    if os.path.isfile(p):
                        return p
                try:
                    r = subprocess.run(['where', 'soffice'], capture_output=True, text=True, timeout=5)
                    if r.returncode == 0:
                        return r.stdout.strip().splitlines()[0]
                except Exception:
                    pass
                return None  # LibreOffice no encontrado en Windows
            else:
                for c in ['/usr/bin/libreoffice', '/usr/bin/soffice', 'libreoffice']:
                    if os.path.isabs(c):
                        if os.path.isfile(c):
                            return c
                    else:
                        return c
                return 'libreoffice'

        lo_bin = find_libreoffice()

        if not lo_bin:
            # Sin LibreOffice: usar el template original con valores cacheados
            # (modo dev sin recalculo real — en producción/Render siempre hay LO)
            output_file = template
        else:
            subprocess.run(
                [
                    lo_bin,
                    '--headless', '--nologo', '--nofirststartwizard',
                    f'-env:UserInstallation=file://{lo_profile}',
                    '--convert-to', 'xlsx',
                    '--outdir', output_dir,
                    input_file,
                ],
                capture_output=True, text=True, timeout=60, check=False
            )
            converted = os.path.join(output_dir, 'input.xlsx')
            output_file = converted if os.path.isfile(converted) else input_file

        # ── Leer salidas ──────────────────────────────────────────────────
        wb2 = openpyxl.load_workbook(output_file, data_only=True)
        ws2 = wb2['SALIDAS']

        def v(ref):
            return safe_num(ws2[ref].value)

        result = {}

        if dyo:
            result['dyo'] = {
                'opt1': {'prima_a': v('B3'), 'prima_b': v('C8'), 'deducible': 0, 'ent_limite': v('B8')},
                'opt2': {'prima_a': v('B4'), 'prima_b': v('C9'), 'deducible': 0, 'ent_limite': v('B9')},
                'opt3': {'prima_a': v('B5'), 'prima_b': v('C10'), 'deducible': 0, 'ent_limite': v('B10')},
            }

        if cc:
            result['cc'] = {
                'opt1': {'deducible': v('B15'), 'prima': v('C15')},
                'opt2': {'deducible': v('B16'), 'prima': v('C16')},
                'opt3': {'deducible': v('B17'), 'prima': v('C17')},
            }

        if pdysi:
            result['pdysi'] = {
                'opt1': {'deducible': v('B29'), 'prima': v('C29')},
                'opt2': {'deducible': v('B30'), 'prima': v('C30')},
                'opt3': {'deducible': v('B31'), 'prima': v('C31')},
            }

        if pi:
            result['pi'] = {
                'opt1': {'limite': v('A42'), 'deducible': v('B42'), 'prima': v('C42')},
            }

        print(json.dumps({'ok': True, 'result': result}))

    except subprocess.TimeoutExpired:
        print(json.dumps({'error': 'LibreOffice tardó demasiado (timeout 60s)'}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == '__main__':
    main()
