"""
Tests de la lógica pura de app.py (calc_dyo/cc/pdysi/pi + helpers).

Los valores esperados se leen directamente de tables.json (no se inventan) para que
un cambio real en las tablas rompa el test y obligue a revisar, en vez de fijar
números arbitrarios. Corre con: `pytest -q` desde cotizador-service/.
"""
import os
import sys

# app.py no es un paquete instalado — lo resolvemos por ruta relativa al repo.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import (  # noqa: E402
    calc_cc,
    calc_dyo,
    calc_pdysi,
    calc_pi,
    cop_label,
    cop_str,
    to_int,
    xlookup,
    _pi_sector,
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def test_cop_label_formatea_miles():
    assert cop_label(500000000) == 'Hasta COP 500.000.000'
    assert cop_label(7000000000) == 'Hasta COP 7.000.000.000'


def test_cop_str_formatea_miles():
    assert cop_str(500000000) == 'COP500.000.000'
    assert cop_str(1000000000) == 'COP1.000.000.000'


def test_cop_label_no_numerico_devuelve_str_original():
    # Ni int ni string numérico → cae al except y devuelve str(valor) tal cual.
    assert cop_label(None) == 'None'


def test_to_int_convierte_string_con_comas():
    assert to_int('1,000,000') == 1000000


def test_to_int_usa_default_si_no_puede_convertir():
    assert to_int('no-es-un-numero', in_intDefault=-1) == -1


def test_xlookup_encuentra_por_indice():
    assert xlookup(2, [1, 2, 3], ['a', 'b', 'c']) == 'b'


def test_xlookup_devuelve_default_si_no_encuentra():
    assert xlookup(99, [1, 2, 3], ['a', 'b', 'c'], in_genDefault='none') == 'none'


def test_pi_sector_detecta_abogados_y_contadores():
    assert _pi_sector('Abogado litigante') == 'ABOGADOS'
    assert _pi_sector('Contador público') == 'CONTADORES'
    assert _pi_sector('Administrador de propiedad horizontal') == 'ADMINISTRADORES'


# ── calc_dyo ─────────────────────────────────────────────────────────────────

def test_calc_dyo_sin_anexo():
    result = calc_dyo({
        'facturacion': 7000000000,
        'sector': 'OTROS',
        'anexo': False,
        'limite1': 500000000,
        'limite2': 1000000000,
        'limite3': 1500000000,
    })
    assert result['opt1'] == {
        'prima_a': 1542800.9440609897, 'deducible': 0, 'ent_limite': None, 'ent_deducible': None,
    }
    assert result['opt2']['prima_a'] == 2505891.1518567386
    assert result['opt3']['prima_a'] == 3200773.9699074067


def test_calc_dyo_con_anexo_agrega_entidades_nc():
    result = calc_dyo({
        'facturacion': 7000000000,
        'sector': 'OTROS',
        'anexo': True,
        'limite1': 500000000,
    })
    assert result['opt1']['ent_limite'] == 100000000
    assert result['opt1']['ent_deducible'] == 10000000


def test_calc_dyo_fila_no_existente_devuelve_none():
    # Facturación fuera de cualquier bucket conocido del cuadro "fac".
    assert calc_dyo({'facturacion': 999999999999}) is None


# ── calc_cc ──────────────────────────────────────────────────────────────────

def test_calc_cc_encuentra_prima_y_deducible():
    result = calc_cc({
        'facturacion': 15000000000,
        'empleados': '1-100',
        'limite1_evento': 500000000, 'limite1_agregado': 500000000,
        'limite2_evento': 1000000000, 'limite2_agregado': 1000000000,
    })
    assert result['opt1'] == {'deducible': 30000000.0, 'prima': 5011056.0}
    assert result['opt2'] == {'deducible': 50000000.0, 'prima': 8381433.3013125}


def test_calc_cc_combinacion_inexistente_prima_none():
    # Banda de empleados que no existe en la tabla → sin match de prima,
    # aunque el deducible sí resuelve (solo depende del evento).
    result = calc_cc({
        'facturacion': 15000000000,
        'empleados': '9999-99999',
        'limite1_evento': 500000000, 'limite1_agregado': 500000000,
    })
    assert result['opt1']['prima'] is None
    assert result['opt1']['deducible'] == 30000000.0


# ── calc_pdysi ───────────────────────────────────────────────────────────────

def test_calc_pdysi_encuentra_prima_y_deducible():
    result = calc_pdysi({
        'facturacion': 15000000000,
        'limite1': 500000000,
        'limite2': 1000000000,
        'limite3': 2000000000,
    })
    assert result['opt1'] == {'deducible': 35000000.0, 'prima': 3499784.64}
    assert result['opt2'] == {'deducible': 50000000.0, 'prima': 6131367.55}
    assert result['opt3'] == {'deducible': 55000000.0, 'prima': 11313767.64375}


# ── calc_pi ──────────────────────────────────────────────────────────────────

def test_calc_pi_deriva_deducible_del_mapeo_cuando_no_viene():
    result = calc_pi({
        'facturacion': 3000000000,
        'actividad': 'Abogado penalista',
        'limite1': 500000000,
    })
    assert result['opt1'] == {'limite': 500000000, 'deducible': 30000000, 'prima': 5100000.0}


def test_calc_pi_limite_cero_devuelve_opcion_vacia():
    result = calc_pi({'facturacion': 3000000000, 'actividad': 'Abogado', 'limite2': 0})
    assert result['opt2'] == {'limite': None, 'deducible': None, 'prima': None}


def test_calc_pi_sector_sin_datos_devuelve_prima_none():
    # CONTADORES está vacío en tables.json — el lookup nunca puede resolver.
    result = calc_pi({
        'facturacion': 3000000000,
        'actividad': 'Contador público',
        'limite1': 500000000,
    })
    assert result['opt1']['prima'] is None
